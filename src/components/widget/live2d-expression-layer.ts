/**
 * 多表情「参数层」
 * ===============================================================
 * 为什么不用库自带的 `model.expression()`？
 *
 * 库的 `ExpressionManager` 底层是一个 `MotionQueueManager` 队列，
 * `_setExpression()` 是**往队列里追加**而不是替换。于是连点几下，
 * 多个表情会同时生效、且在 `Blend: "Add"` 的加持下**数值累加** ——
 * 这就是最初"蚊香眼和 >< 糊在一起"的成因。
 *
 * 但模型本身**完全支持多表情叠加**：44 个 `.exp3.json` 全部是 Add 混合，
 * 配饰类（猫爪/眼镜/贴纸…）各自占一个**独占参数**，彼此零冲突。
 * 真正互斥的只有"情绪表情"——它们共用眼睛/眉毛/嘴那 20 个参数。
 *
 * 所以这里自己当"参数层"：
 *
 *   beforeMotionUpdate → 把所有受控参数**归位到中性值**（清除残留）
 *   动作更新
 *   afterMotionUpdate  → 把当前选中集合的增量**求和后叠加**上去
 *                        （库原本也是在这个位置应用表情）
 *
 * 于是「表情单选 + 配饰多选 + 工具单选 + 道具多选」可以干净地共存，
 * 语义由"参数是否重叠"决定，而不是靠观感猜。
 */

/** 只用得到这几个方法，避免依赖库的内部类型 */
interface CoreModelLike {
	getParameterCount?: () => number;
	getParameterId?: (index: number) => unknown;
	getParameterValueByIndex?: (index: number) => number;
	setParameterValueByIndex?: (index: number, value: number) => void;
}

/** `getParameterId(i)` 返回的是 CubismId 包装对象，`getString()` 可能再包一层 */
function parameterIdToString(value: unknown): string | null {
	let cur = value;
	for (let depth = 0; depth < 4 && cur != null; depth++) {
		if (typeof cur === "string") return cur;
		const wrapper = cur as { getString?: () => unknown; s?: unknown };
		if (typeof wrapper.s === "string") return wrapper.s;
		if (typeof wrapper.getString === "function") {
			cur = wrapper.getString();
			continue;
		}
		return null;
	}
	return null;
}

export interface Live2DSelection {
	emotion: string | null;
	tool: string | null;
	accessories: string[];
	props: string[];
}

interface Delta {
	index: number;
	value: number;
}

export interface ExpressionLayer {
	readonly ready: boolean;
	/** 合并式更新选择；省略的字段保持不变 */
	setSelection(next: Partial<Live2DSelection>): void;
	getSelection(): Live2DSelection;
	/** 挂到 `beforeMotionUpdate`：归位，消除残留 */
	reset(): void;
	/** 把所有动作参数（含长期状态）清回中性 —— 面板里的"默认"用这个 */
	resetMotion(): void;
	/** 挂到 `afterMotionUpdate`：叠加当前选中的表情 */
	apply(): void;
	/** 任意表情驱动了哪些参数（面板用来判断冲突） */
	paramsOf(name: string): readonly string[];
	destroy(): void;
}

export interface ExpressionLayerOptions {
	coreModel: CoreModelLike;
	/** 模型根目录 URL（末尾带 /），用于取 `.exp3.json` */
	modelBaseUrl: string;
	/** 表情定义的 Name → File 映射，来自 model3.json */
	definitions: Array<{ Name: string; File: string }>;
	/** 交叉淡入淡出时长（毫秒） */
	fadeMs?: number;
	/**
	 * 额外需要"每帧归位"的参数（动作驱动的那些）。
	 *
	 * ⚠️ 为什么动作参数也要归位：
	 * `.exp3.json` 与 `.motion3.json` 都是 `Blend: "Add"`，官方框架靠每帧
	 * `LoadParameters() → 动作/表情 → SaveParameters()` 保证"干净基准"。
	 * 但 pixi-live2d-display **从不调用 loadParameters()** —— 于是**动作播完后，
	 * 它最后写进去的值会永久留下**：吹泡泡糖之后泡泡一直挂在脸上、开盖之后
	 * 手机一直拿在手里、番茄酱之后蛋包饭和爱心不消失。
	 *
	 * 实测残留（播完 2.5s 后仍未归位）：
	 *   bubblegum 8/8（泡泡大小 0 → 28.18）· phone-open 3/5（手机手 0 → 0.998）
	 *   sauce 5/18（爱心 0 → 14）· hammer 10/36（包出现 0 → 1）
	 *
	 * 归位是安全的：正在播放的动作每帧都会重写自己的参数，
	 * 所以"当前动作"依旧正常显示，只有**已经播完**的那些才会被清掉。
	 */
	motionParams?: readonly string[];
	/**
	 * 上面那些动作参数里，**播完不归位**的一部分 —— 它们表示"长期状态"。
	 *
	 * 例：手机类动作驱动的 `phone` / `phone2`(开盖) / `phone4` / `phone6`。
	 * 用户的心智模型是「开盖 = 长期拿着手机」，然后自拍是叠在上面的一次性动作。
	 * 所以这几个不能每帧归位，否则手机一播完就消失。
	 *
	 * 想清掉这类状态（回到"默认"）时调 {@link ExpressionLayer.resetMotion}。
	 */
	persistentMotionParams?: readonly string[];
}

export async function createExpressionLayer(options: ExpressionLayerOptions): Promise<ExpressionLayer | null> {
	const { coreModel, modelBaseUrl, definitions, fadeMs = 220, motionParams = [], persistentMotionParams = [] } = options;

	if (typeof coreModel.getParameterValueByIndex !== "function" || typeof coreModel.setParameterValueByIndex !== "function") {
		console.warn("[live2d] 参数层未启用：coreModel 缺少参数读写 API");
		return null;
	}

	// 自己建 id → index 映射。
	// 不能直接用 coreModel.getParameterIndex(name)：实测传字符串会返回越界值（247）。
	const idToIndex = new Map<string, number>();
	const count = coreModel.getParameterCount?.() ?? 0;
	for (let i = 0; i < count; i++) {
		const id = parameterIdToString(coreModel.getParameterId?.(i));
		if (id) idToIndex.set(id, i);
	}
	if (!idToIndex.size) {
		console.warn("[live2d] 参数层未启用：无法解析参数 id 列表");
		return null;
	}

	// 载入所有表情的参数增量
	const deltas = new Map<string, Delta[]>();
	const paramsOfName = new Map<string, string[]>();
	const fileBase = new URL(modelBaseUrl, window.location.href);
	await Promise.all(
		definitions.map(async (def) => {
			if (!def?.File) return;
			try {
				const res = await fetch(new URL(def.File, fileBase).href);
				const json = (await res.json()) as { Parameters?: Array<{ Id: string; Value: number }> };
				const list: Delta[] = [];
				const names: string[] = [];
				for (const p of json.Parameters ?? []) {
					const index = idToIndex.get(p.Id);
					if (typeof index !== "number") continue;
					list.push({ index, value: p.Value });
					names.push(p.Id);
				}
				deltas.set(def.Name, list);
				paramsOfName.set(def.Name, names);
			} catch {
				/* 单个表情取不到不影响其它 */
			}
		}),
	);
	if (!deltas.size) {
		console.warn("[live2d] 参数层未启用：没能载入任何表情参数");
		return null;
	}

	// 受控参数 = 所有表情参数 ∪ 所有动作参数；此刻还没应用过任何东西，读到的就是中性值
	const neutral = new Map<number, number>();
	/** 只由表情驱动的参数 —— `apply()` 只能碰这些 */
	const exprIndices = new Set<number>();
	for (const list of deltas.values()) {
		for (const d of list) {
			exprIndices.add(d.index);
			if (!neutral.has(d.index)) neutral.set(d.index, coreModel.getParameterValueByIndex?.(d.index) ?? 0);
		}
	}
	/** 每帧要归位的动作参数（= 全部动作参数 − 长期状态） */
	const perFrameMotion = new Set<number>();
	/** 全部动作参数（含长期状态），供 resetMotion() 用 */
	const allMotion = new Set<number>();
	const persistent = new Set(persistentMotionParams);
	let motionControlled = 0;
	let persistentCount = 0;
	for (const name of motionParams) {
		const index = idToIndex.get(name);
		if (typeof index !== "number") continue;
		if (!neutral.has(index)) {
			neutral.set(index, coreModel.getParameterValueByIndex?.(index) ?? 0);
			motionControlled++;
		}
		allMotion.add(index);
		if (persistent.has(name)) persistentCount++;
		else perFrameMotion.add(index);
	}

	// 当前权重（0..1）与目标集合，用于交叉淡入淡出
	const weight = new Map<string, number>();
	const target = new Set<string>();
	let selection: Live2DSelection = { emotion: null, tool: null, accessories: [], props: [] };
	let lastNow = 0;

	const syncTarget = () => {
		target.clear();
		if (selection.emotion) target.add(selection.emotion);
		if (selection.tool) target.add(selection.tool);
		for (const n of selection.accessories) target.add(n);
		for (const n of selection.props) target.add(n);
		// 目标里有、但还没登记权重的补 0
		for (const n of target) if (!weight.has(n)) weight.set(n, 0);
	};

	const layer: ExpressionLayer = {
		ready: true,

		setSelection(next) {
			selection = {
				emotion: next.emotion !== undefined ? next.emotion : selection.emotion,
				tool: next.tool !== undefined ? next.tool : selection.tool,
				accessories: next.accessories ?? selection.accessories,
				props: next.props ?? selection.props,
			};
			syncTarget();
		},

		getSelection() {
			return { ...selection, accessories: [...selection.accessories], props: [...selection.props] };
		},

		reset() {
			for (const [index, value] of neutral) {
				// 长期状态（手机手持等）不每帧归位，否则一播完就消失
				if (allMotion.has(index) && !perFrameMotion.has(index)) continue;
				coreModel.setParameterValueByIndex?.(index, value);
			}
		},

		resetMotion() {
			for (const index of allMotion) {
				coreModel.setParameterValueByIndex?.(index, neutral.get(index) ?? 0);
			}
		},

		apply() {
			const now = performance.now();
			const dt = lastNow ? Math.min(now - lastNow, 100) : 16;
			lastNow = now;
			const step = fadeMs > 0 ? dt / fadeMs : 1;

			// 先推进所有已知权重的淡入淡出
			for (const [name, w] of weight) {
				const want = target.has(name) ? 1 : 0;
				if (w === want) continue;
				const nextW = w + Math.sign(want - w) * step;
				weight.set(name, want > w ? Math.min(nextW, want) : Math.max(nextW, want));
			}

			// 只写"表情驱动"的参数。
			// ⚠️ 动作参数虽然也在 reset() 的归位列表里，但**绝不能在这里写** ——
			// 没有表情驱动它们时，这里会把中性值写回去，等于每帧把正在播放的
			// 动作擦掉（实测：泡泡糖动作播放中所有参数恒为 0，道具根本不出现）。
			for (const index of exprIndices) {
				const base = neutral.get(index) ?? 0;
				let value = base;
				for (const [name, w] of weight) {
					if (w <= 0) continue;
					const list = deltas.get(name);
					if (!list) continue;
					for (const d of list) if (d.index === index) value += w * d.value;
				}
				coreModel.setParameterValueByIndex?.(index, value);
			}
		},

		paramsOf(name) {
			return paramsOfName.get(name) ?? [];
		},

		destroy() {
			weight.clear();
			target.clear();
		},
	};

	syncTarget();
	console.log(
		`[live2d] 多表情参数层已启用：${deltas.size} 个表情 · 受控 ${neutral.size} 个参数` +
			`（表情 ${neutral.size - motionControlled} + 动作 ${motionControlled}，其中长期状态 ${persistentCount}；共 ${idToIndex.size} 个）· 淡入淡出 ${fadeMs}ms`,
	);
	return layer;
}
