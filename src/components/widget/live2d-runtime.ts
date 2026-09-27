/**
 * 现代 Live2D 运行时（Cubism 3/4/5，`.moc3`）
 *
 * 背景：`public/pio/static/l2d.js` 是 Cubism 2.1 时代的运行时，只认 `.moc`
 * 老格式，加载不了 VTube Studio 导出的 `.moc3` 模型。本模块用
 * PixiJS 8 + pixi-live2d-display(Cubism 5) + 官方 Cubism Core 5 顶替它。
 *
 * 设计要点：
 *  1. **对外只暴露 `window.loadlive2d(id, url)`**，与老运行时同签名 ——
 *     这样 `public/pio/static/pio.js`（第三方 GPL 插件）一行都不用改。
 *  2. **全部依赖都是动态 `import()`**，模块顶层不碰浏览器 API，SSR 安全。
 *  3. Cubism Core 是全局脚本，需要在创建模型前注入并等待加载。
 *  4. 老运行时文件 `l2d.js` 保留在磁盘上，配置切回 `runtime: "legacy"` 即可回滚。
 */

import type { Application } from "pixi.js";
import type { Live2DModel } from "@naari3/pixi-live2d-display/cubism5";
import { createExpressionLayer, type ExpressionLayer, type Live2DSelection } from "./live2d-expression-layer";
import { LIVE2D_MOTIONS } from "./live2d-catalog";

export type { Live2DSelection } from "./live2d-expression-layer";

/** 取景参数：`zoom` 是相对"整幅画布刚好装下"的倍数 */
export type Live2DFraming = {
	zoom?: number;
	offsetX?: number;
	offsetY?: number;
};

export type Live2DRuntimeOptions = {
	/** Cubism Core 脚本路径 */
	corePath?: string;
	/** 取景 */
	framing?: Live2DFraming;
	/**
	 * 点击时随机切换的情绪表情名（洗牌袋随机，一轮内不重复）。
	 * 这些是"互斥"的表情：它们共用眼睛/眉毛/嘴参数。
	 */
	expressions?: string[];
	/** 表情保持多久后自动恢复，0 = 一直保持到下次点击 */
	expressionHoldMs?: number;
	/** 是否响应点击 */
	interactive?: boolean;
	/** 初始选择（面板会覆盖它） */
	selection?: Partial<Live2DSelection>;
	/** 初始是否锁定（锁定后点击不再随机换表情） */
	locked?: boolean;
};

type Libs = {
	PIXI: typeof import("pixi.js");
	Live2DModel: typeof import("@naari3/pixi-live2d-display/cubism5").Live2DModel;
};

const DEFAULT_CORE_PATH = "/live2d/core/live2dcubismcore.min.js";

/* ------------------------------------------------------------------ *
 * 单例加载：Core 脚本 & 运行库
 * ------------------------------------------------------------------ */

let corePromise: Promise<void> | null = null;

/** 注入并等待官方 Cubism Core（全局脚本，注册 `window.Live2DCubismCore`） */
function loadCubismCore(src: string): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if ((window as unknown as { Live2DCubismCore?: unknown }).Live2DCubismCore) {
		return Promise.resolve();
	}
	if (corePromise) return corePromise;

	corePromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>("script[data-live2d-core]");
		if (existing) {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", () => reject(new Error("Cubism Core 加载失败")));
			return;
		}
		const el = document.createElement("script");
		el.src = src;
		el.async = true;
		el.dataset.live2dCore = "1";
		el.onload = () => resolve();
		el.onerror = () => {
			corePromise = null;
			reject(new Error(`Cubism Core 加载失败：${src}`));
		};
		document.head.appendChild(el);
	});

	return corePromise;
}

let libsPromise: Promise<Libs> | null = null;

/** 动态加载 PixiJS 与 live2d 运行库（只在浏览器里执行） */
function loadLibs(): Promise<Libs> {
	if (!libsPromise) {
		libsPromise = Promise.all([
			import("pixi.js"),
			import("@naari3/pixi-live2d-display/cubism5"),
		]).then(([PIXI, l2d]) => ({ PIXI, Live2DModel: l2d.Live2DModel }));
	}
	return libsPromise;
}

/* ------------------------------------------------------------------ *
 * 运行时
 * ------------------------------------------------------------------ */

export type Live2DRuntime = {
	/** 与老运行时同名的渲染入口 */
	loadlive2d: (canvasId: string, modelUrl: string) => Promise<void>;
	/** 手动销毁 */
	destroy: () => void;
	/** 选择面板用：局部更新选择（表情单选 / 配饰多选 / 工具单选 / 道具多选） */
	setSelection: (next: Partial<Live2DSelection>) => void;
	/** 当前选择 */
	getSelection: () => Live2DSelection;
	/** 锁定后点击不再随机换表情 */
	setLocked: (locked: boolean) => void;
	isLocked: () => boolean;
	/**
	 * 把"点击宠物时随机换表情"这件事交给面板处理。
	 * 面板是表情的唯一真相源，这样两边状态不会打架；传 null 恢复内置行为。
	 */
	setEmotionRoller: (fn: (() => void) | null) => void;
	/**
	 * 播放指定动作；省略 index 则组内随机。
	 *
	 * ⚠️ `priority` 很关键。库的 `MotionState.reserve()` 里有这么一条：
	 * ```js
	 * if (priority < 3) { if (priority <= this.currentPriority) return false; }
	 * ```
	 * 也就是**正在播任何 NORMAL(2) 动作时，新的 NORMAL 动作会被静默拒绝**。
	 * 实测：锤子播放中点击「吹泡泡糖」，`Argument` 完全没反应。
	 *
	 * 所以**用户主动点按钮**时要传 `3`（FORCE）才能真正打断；
	 * 自动的随机小动作保持默认的 NORMAL，避免把用户点的动作顶掉。
	 */
	playMotion: (group: string, index?: number, priority?: number) => void;
	/** 把所有动作状态清回中性（含手机手持这类长期状态）——面板里的"默认"用这个 */
	resetMotions: () => void;
	/** 模型 + 参数层是否都已就绪 */
	isReady: () => boolean;
	/** 某个表情驱动了哪些参数（面板据此判断冲突） */
	paramsOf: (name: string) => readonly string[];
};

export function createLive2DRuntime(options: Live2DRuntimeOptions = {}): Live2DRuntime {
	const {
		corePath = DEFAULT_CORE_PATH,
		framing = {},
		expressions = [],
		expressionHoldMs = 0,
		interactive = true,
		selection: initialSelection = {},
		locked: initialLocked = false,
	} = options;

	let app: Application | null = null;
	let model: Live2DModel | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let resizeHandler: (() => void) | null = null;
	let resizeTimer: ReturnType<typeof setTimeout> | null = null;
	let expressionTimer: ReturnType<typeof setTimeout> | null = null;
	let clickHandler: (() => void) | null = null;
	let loadToken = 0;

	/** 多表情参数层（替代库的 ExpressionManager） */
	let exprLayer: ExpressionLayer | null = null;
	let detachBounds: Array<() => void> = [];
	/** 洗牌袋：保证情绪表情不重复，直到一轮用完 */
	let shuffleBag: string[] = [];
	/** 手动锁定：锁定后点击不再随机换表情 */
	let locked = initialLocked;
	let selection: Live2DSelection = {
		emotion: initialSelection.emotion ?? null,
		tool: initialSelection.tool ?? null,
		accessories: [...(initialSelection.accessories ?? [])],
		props: [...(initialSelection.props ?? [])],
	};

	/** 洗牌袋取一个：一轮内不重复；跨轮时避免与上一个相同 */
	function pickFromBag(pool: readonly string[], lastKey: string): string | undefined {
		if (!pool.length) return undefined;
		if (shuffleBag.length === 0) {
			shuffleBag = [...pool];
			for (let i = shuffleBag.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffleBag[i], shuffleBag[j]] = [shuffleBag[j], shuffleBag[i]];
			}
			// 新一轮的第一个别和上一轮最后一个撞车
			if (shuffleBag.length > 1 && shuffleBag[0] === lastKey) {
				[shuffleBag[0], shuffleBag[shuffleBag.length - 1]] = [shuffleBag[shuffleBag.length - 1], shuffleBag[0]];
			}
		}
		return shuffleBag.pop();
	}
	let lastEmotion: string = "";


	/**
	 * 期望的画布尺寸（HTML 属性原值）。
	 *
	 * ⚠️ 只在第一次加载时读一次就固定下来。
	 * Pixi 的 `autoDensity` 会把 canvas 的 `width`/`height` **属性**改成设备像素值
	 * （420 → 420×DPR）。如果每次都回读属性，尺寸会被 DPR 一轮轮放大 ——
	 * 桌宠每"关闭再恢复"一次就长大一圈。
	 */
	let baseW: number | null = null;
	let baseH: number | null = null;

	/**
	 * 模型的**未缩放**尺寸（局部坐标下的原始大小）。
	 *
	 * ⚠️ 和上面 baseW/baseH 是同一类坑，必须缓存，不能每次回读：
	 * Pixi 的 `model.width` 返回的是 `局部宽度 × 当前 scale`。而 `applyFraming()`
	 * 会被 `syncSize()` 在**每次改变窗口大小时**再调用一次 —— 那时 `model.scale`
	 * 早已不是 1，回读到的就是"缩放过一次"的宽度。拿它再算一遍 scale 等于把缩放
	 * 又乘了一次，于是**每 resize 一次模型就错乱一次**（越缩越小 / 大小乱跳）。
	 *
	 * 首次调用时 scale 还是 1，所以 `width / scale.x` 就是原始尺寸；即使首次调用
	 * 时 scale 已被设过，除法也能还原回去。换模型时重置（见 loadlive2d）。
	 */
	let baseModelW: number | null = null;
	let baseModelH: number | null = null;

	/** 是否已经成功初始化过一次。决定重载时要不要换一块新 canvas（见 loadlive2d） */
	let bootedOnce = false;

	/**
	 * 画布的显示尺寸。
	 *
	 * 为什么不用 CSS 限制：Pixi 的 `autoDensity` 会往 canvas 上写内联
	 * `style.width/height`（内联样式优先于样式表），所以尺寸必须由 JS 统一决定。
	 * 这里以"首次加载时记下的 `width`/`height` 属性"为期望尺寸（见 baseW/baseH），
	 * 再按视口钳制，避免在小窗口里占掉太多地方。
	 */
	function computeCssSize(): { w: number; h: number } {
		const wantW = baseW ?? 400;
		const wantH = baseH ?? 400;
		const maxW = Math.round(window.innerWidth * 0.42);
		const maxH = Math.round(window.innerHeight * 0.55);
		const k = Math.min(1, maxW / wantW, maxH / wantH);
		return {
			w: Math.max(1, Math.round(wantW * k)),
			h: Math.max(1, Math.round(wantH * k)),
		};
	}

	/**
	 * 选择发生变化时，推给参数层。
	 *
	 * 参数层内部用「权重 + 交叉淡入淡出」处理，所以切换是平滑的，
	 * 而且多个不冲突的表情（比如 星星眼 + 猫爪）可以同时生效。
	 */
	function applySelection() {
		exprLayer?.setSelection(selection);
	}

	/** 点击时随机换一个情绪表情（洗牌袋，一轮内不重复） */
	function rollEmotion() {
		const name = pickFromBag(expressions, lastEmotion);
		if (!name) return;
		lastEmotion = name;
		selection = { ...selection, emotion: name };
		applySelection();
	}

	/**
	 * 面板注册进来的"掷骰子"回调。
	 *
	 * 面板是表情的唯一真相源（它把表情放在 `props` 里），所以点击宠物时
	 * 交给面板去摇、面板自己更新 `props` —— 这样两边的状态永远一致。
	 * 没挂面板（`pioConfig.panel === false`）时才退回内置的 {@link rollEmotion}。
	 */
	let emotionRoller: (() => void) | null = null;

	/*
	 * 注：`playRandomPropMotion()` 已移除。
	 * 之前"点击宠物顺带随机播一个道具动作"会让点击行为不可预测
	 * （有时吹泡泡、有时没反应），而所有动作现在都能从面板精确触发。
	 */

	function setSelection(next: Partial<Live2DSelection>) {
		selection = {
			emotion: next.emotion !== undefined ? next.emotion : selection.emotion,
			tool: next.tool !== undefined ? next.tool : selection.tool,
			accessories: next.accessories ? [...next.accessories] : selection.accessories,
			props: next.props ? [...next.props] : selection.props,
		};
		applySelection();
	}

	function playMotion(group: string, index?: number, priority?: number) {
		if (!model) return;
		const p = typeof priority === "number" ? priority : undefined;
		try {
			if (typeof index === "number") {
				if (p === undefined) model.motion(group, index);
				else model.motion(group, index, p);
			} else if (p === undefined) model.motion(group);
			else model.motion(group, undefined, p);
		} catch (err) {
			console.warn("[live2d] 动作播放失败：", group, index, err);
		}
	}

	/** 用户主动点按钮时用的优先级 —— 必须 > 正在播放动作的优先级才不会被静默拒绝 */
	const MOTION_PRIORITY_FORCE = 3;

	/* ---------------------------------------------------------------- *
	 * 表情全部交给 live2d-expression-layer.ts 的「多表情参数层」处理。
	 *
	 * 历史背景（为什么不再是这里自己写守卫）：
	 * 库的顺序是「动作 → 表情 → saveParameters()」，而且**从不调用 loadParameters()**，
	 * 于是表情每帧在上一帧结果上累加、停止后参数永久残留（蚊香眼 + >< 同时出现）。
	 * 最初的修法是记一份中性值快照每帧恢复；现在参数层直接接管了
	 * 「归位 + 按权重叠加」，同一套思路，但顺带支持了多个表情共存。
	 * ---------------------------------------------------------------- */

	/** coreModel 上我们实际会用到的方法（避免依赖库的内部类型） */
	type CoreModelLike = {
		getParameterCount?: () => number;
		getParameterId?: (index: number) => unknown;
		getParameterValueByIndex?: (index: number) => number;
		setParameterValueByIndex?: (index: number, value: number) => void;
	};

	/**
	 * 需要"播完归位"的动作参数 —— 也就是**道具类**动作独有的那些。
	 *
	 * 刻意排除 Idle 驱动的参数：那些是氛围层（14 颗星星、7 个旋转光环、泡泡、
	 * 猫爪…），归位会让它们在动作播放期间整片消失。保持原样最多是"动作期间
	 * 冻住"，动作结束 idle 一恢复就继续动，观感上更稳。
	 *
	 * 被排除的典型是 `Param73~77`（星/锤子，Idle 与 hammer 共用）；
	 * 而 `Param70~72`（锤子出现 / 包出现 / 包长大）、`chuipaopao*`（泡泡糖）、
	 * `phone*`（手机）、`danbao*`+`aixing`（蛋包饭/爱心）等只有动作会碰，
	 * 归位后道具就会在动作播完时干净消失。
	 */
	function propsMotionParams(): string[] {
		const idle = new Set(LIVE2D_MOTIONS.filter((m) => m.kind === "ambient").flatMap((m) => m.params));
		const nonIdle = new Set(LIVE2D_MOTIONS.filter((m) => m.kind !== "ambient").flatMap((m) => m.params));
		return [...nonIdle].filter((p) => !idle.has(p));
	}

	/**
	 * 表示"长期状态"的动作参数 —— 播完后**不归位**。
	 *
	 * 用户的心智模型是「手机开盖 = 长期拿在手里」，自拍只是叠在上面的一次性动作。
	 * 这几个参数如果每帧归位，手机会在动作播完的瞬间消失。
	 * 要清掉它们（回到"默认"）时调 {@link resetMotions}。
	 *
	 * 注意 `phone3`(闪光) 和 `phone5`(耶斯) **不在这里** —— 那是一次性特效，该消失。
	 */
	const PERSISTENT_MOTION_PARAMS = ["phone", "phone2", "phone4", "phone6"];

	/** 拆掉参数层与它的两个帧钩子 */
	function teardownExpressionLayer() {
		for (const off of detachBounds) {
			try {
				off();
			} catch {
				/* 忽略 */
			}
		}
		detachBounds = [];
		exprLayer?.destroy();
		exprLayer = null;
	}

	/**
	 * 装配「多表情参数层」，替代库自带的 ExpressionManager。
	 *
	 * 钩两个点（库的内部模型每帧都会发，中间夹着动作更新）：
	 *
	 *   beforeMotionUpdate → reset()   把受控参数归位，消除上一帧的残留
	 *     动作更新
	 *   afterMotionUpdate  → apply()   把当前选中的表情增量叠加回去
	 *
	 * 库原本也是在这个位置应用表情（`emit("afterMotionUpdate")` 之后紧接着
	 * `expressionManager.update()`），所以顺序与官方行为完全一致。
	 */
	async function setupExpressionLayer(internalModel: unknown, modelUrl: string): Promise<void> {
		const im = internalModel as {
			coreModel?: CoreModelLike;
			motionManager?: { expressionManager?: { definitions?: Array<{ Name: string; File: string }> } };
			on?: (event: string, fn: () => void) => void;
			off?: (event: string, fn: () => void) => void;
		} | null;

		const coreModel = im?.coreModel;
		const definitions = im?.motionManager?.expressionManager?.definitions ?? [];
		if (!coreModel || !definitions.length) {
			console.warn("[live2d] 多表情参数层未启用：模型或表情定义缺失", {
				hasCoreModel: !!coreModel,
				definitions: definitions.length,
			});
			return;
		}

		const layer = await createExpressionLayer({
			coreModel,
			modelBaseUrl: modelUrl,
			definitions,
			motionParams: propsMotionParams(),
			persistentMotionParams: PERSISTENT_MOTION_PARAMS,
		});
		if (!layer) return;

		exprLayer = layer;
		layer.setSelection(selection);

		const reset = () => exprLayer?.reset();
		const apply = () => exprLayer?.apply();
		im?.on?.("beforeMotionUpdate", reset);
		im?.on?.("afterMotionUpdate", apply);
		detachBounds = [() => im?.off?.("beforeMotionUpdate", reset), () => im?.off?.("afterMotionUpdate", apply)];
	}

	/** 把模型按"整幅画布刚好装下"缩放并居中，再套用取景参数 */
	function applyFraming() {
		if (!app || !model) return;
		const w = app.screen.width;
		const h = app.screen.height;

		// Live2D 模型的尺寸在内部模型就绪前可能是 0，除下去会得到 Infinity，
		// 结果就是"加载成功但什么都看不见"。这里兜一层。
		//
		// ⚠️ 只能取**未缩放**的原始尺寸，否则 resize 时会把缩放重复乘一遍 ——
		// 详见 baseModelW/baseModelH 的注释。
		if (baseModelW === null || baseModelH === null) {
			const s = model.scale.x || 1;
			const rawW0 = model.width / s;
			const rawH0 = model.height / s;
			if (Number.isFinite(rawW0) && rawW0 > 0 && Number.isFinite(rawH0) && rawH0 > 0) {
				baseModelW = rawW0;
				baseModelH = rawH0;
			}
		}
		const rawW = baseModelW ?? model.width;
		const rawH = baseModelH ?? model.height;
		const modelW = Number.isFinite(rawW) && rawW > 0 ? rawW : 2;
		const modelH = Number.isFinite(rawH) && rawH > 0 ? rawH : 2;
		if (!Number.isFinite(rawW) || rawW <= 0 || !Number.isFinite(rawH) || rawH <= 0) {
			console.warn("[live2d] 模型尺寸异常，使用兜底值：", rawW, rawH);
		}

		const zoom = framing.zoom ?? 1;
		const scale = Math.min(w / modelW, h / modelH) * zoom;

		model.scale.set(scale);
		model.anchor.set(0.5, 0.5);
		model.position.set(
			w / 2 + (framing.offsetX ?? 0) * w,
			h / 2 + (framing.offsetY ?? 0) * h,
		);

		console.log(
			`[live2d] 取景：模型 ${rawW}×${rawH} → 画布 ${w}×${h}，scale=${scale.toFixed(4)}，` +
				`位置 (${model.position.x.toFixed(1)}, ${model.position.y.toFixed(1)})`,
		);
	}

	/**
	 * 视口变化时重新计算尺寸并重新取景。
	 *
	 * 注意单位：`computeCssSize()` 给的是 **CSS 像素**，而 Pixi 的 screen 用的是
	 * **设备像素**（见 Pixi 初始化处的注释）。所以这里要乘 DPR，
	 * 并把 CSS 尺寸单独写回 `style`。
	 */
	function syncSize() {
		if (!app || !canvas) return;
		const { w, h } = computeCssSize();
		const dpr = Math.max(window.devicePixelRatio || 1, 1);
		const bw = Math.round(w * dpr);
		const bh = Math.round(h * dpr);
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		if (bw === app.screen.width && bh === app.screen.height) return;
		app.renderer.resize(bw, bh);
		applyFraming();
	}

	function bindResize() {
		resizeHandler = () => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(syncSize, 120);
		};
		window.addEventListener("resize", resizeHandler);
	}

	function unbindResize() {
		if (resizeHandler) window.removeEventListener("resize", resizeHandler);
		resizeHandler = null;
		if (resizeTimer) {
			clearTimeout(resizeTimer);
			resizeTimer = null;
		}
	}

	function bindInteractions() {
		if (!canvas || !interactive || !model) return;

		// 注意：pio.js 用的是 canvas.onclick（属性），这里用 addEventListener，
		// 两者互不覆盖，因此「弹对话」和「换表情」可以同时生效。
		clickHandler = () => {
			// 点一下 = 随机换一个表情，**仅此而已**。
			//
			// 这里以前还会顺带 `playRandomPropMotion()` 随机播个道具动作
			// （吹泡泡糖 / 快速自拍…），但那样"点一下有时候会吹泡泡"很不一致；
			// 所有动作现在都能从面板精确触发，所以点击不再附带任何动作。
			//
			// 锁定 = 整个外观冻住（台词不受影响，那是 pio.js 自己挂在
			// canvas.onclick 上的，与这里无关）。
			if (locked) return;

			// 优先交给"面板注册的掷骰子函数"。原因：面板把表情写在 `selection.props`
			// 里，而这里的 `rollEmotion()` 写在 `selection.emotion` 里 ——
			// 两套并存时会**同时生效**（比如面板选了星星眼、点击又摇出爱心眼，
			// 两者共用眉毛参数 → 直接冲突）。所以只要面板在，就由面板统一决定。
			if (emotionRoller) emotionRoller();
			else rollEmotion();

			// 可选：N 毫秒后自动恢复中性（默认 0 = 保持到下次点击）
			if (expressionHoldMs > 0) {
				if (expressionTimer) clearTimeout(expressionTimer);
				expressionTimer = setTimeout(() => {
					selection = { ...selection, emotion: null };
					applySelection();
				}, expressionHoldMs);
			}
		};
		canvas.addEventListener("click", clickHandler);
	}

	function unbindInteractions() {
		if (canvas && clickHandler) canvas.removeEventListener("click", clickHandler);
		clickHandler = null;
	}

	function destroy() {
		loadToken += 1;
		unbindInteractions();
		unbindResize();
		teardownExpressionLayer();
		if (expressionTimer) {
			clearTimeout(expressionTimer);
			expressionTimer = null;
		}
		if (model) {
			try {
				model.destroy();
			} catch {
				/* 忽略销毁异常 */
			}
			model = null;
		}
		if (app) {
			try {
				// removeView: false —— canvas 由 Svelte 持有，不能让它被摘掉
				app.destroy({ removeView: false }, { children: true });
			} catch {
				/* 忽略销毁异常 */
			}
			app = null;
		}
		// 同时清掉调试句柄，避免它继续持有已销毁的对象
		if (typeof window !== "undefined") {
			(window as unknown as { __live2d?: unknown }).__live2d = undefined;
		}
	}

	async function loadlive2d(canvasId: string, modelUrl: string): Promise<void> {
		if (typeof window === "undefined") return;

		const token = ++loadToken;
		const el = document.getElementById(canvasId);
		if (!(el instanceof HTMLCanvasElement)) {
			console.warn(`[live2d] 找不到 canvas：#${canvasId}`);
			return;
		}

		// 期望尺寸只在第一次读：Pixi 之后会把 width/height 属性改成设备像素值
		if (baseW === null || baseH === null) {
			baseW = Number(el.getAttribute("width")) || 400;
			baseH = Number(el.getAttribute("height")) || 400;
		}

		// 换模型时先拆掉上一个
		unbindInteractions();
		teardownExpressionLayer();
		if (model) {
			try {
				model.destroy();
			} catch {
				/* 忽略 */
			}
			model = null;
		}
		if (app) {
			try {
				app.destroy({ removeView: false }, { children: true });
			} catch {
				/* 忽略 */
			}
			app = null;
		}

		canvas = el;

		try {
			await loadCubismCore(corePath);
			const { PIXI, Live2DModel: Model } = await loadLibs();
			const { UPDATE_PRIORITY } = PIXI;
			if (token !== loadToken) return; // 期间又被重新加载过

			/**
			 * ★ 重新加载时必须换一块全新的 <canvas>，绝不能复用旧的。
			 *
			 * 起因（实测调用栈）：点 ✖️ 关掉桌宠、再点小图标恢复时，pio.js 会**第二次**
			 * 调用 `loadlive2d("pio", ...)`。如果在同一块 canvas 上重新
			 * `new PIXI.Application().init({ canvas })`，旧 WebGL 上下文已被上面的
			 * `app.destroy()` 销毁，`getContext` 交回的是一个**损坏的上下文**，
			 * Pixi 的着色器系统随即在 `checkMaxIfStatementsInShader` 里**死循环**：
			 *
			 *     #0 checkMaxIfStatementsInShader
			 *     #1 contextChange → #2 emit → #3 initFromContext
			 *     #4 createContext → #5 init → #6 init
			 *
			 * 表现就是用户看到的：一块白底 + 整页卡死（主线程占满一个核，
			 * 除了滚轮什么都点不了，因为滚轮走合成器线程）。
			 *
			 * 换一块干净的 canvas 即可彻底避开 —— 它会拿到一个全新的上下文。
			 */
			if (bootedOnce) {
				const stale = canvas;
				const fresh = document.createElement("canvas");
				fresh.id = stale.id;
				fresh.className = stale.className;
				// 用固定下来的期望尺寸，而不是被 Pixi 改写过的属性值
				fresh.width = baseW ?? 400;
				fresh.height = baseH ?? 400;
				// pio.js 把"点击说话"的回调挂在 canvas 元素的 onclick 属性上
				// （它自己缓存了最初那个元素），换元素时必须把回调带过去，
				// 否则恢复之后点击不再弹台词。
				fresh.onclick = stale.onclick;
				stale.replaceWith(fresh);
				canvas = fresh;
			}
			bootedOnce = true;

			// 尺寸由 JS 统一决定。**渲染用设备像素，CSS 尺寸自己钉住** ——
			// 细节见下方 `autoDensity: false` 处的注释。
			const { w: cssW, h: cssH } = computeCssSize();
			const dpr = Math.max(window.devicePixelRatio || 1, 1);

			const instance = new PIXI.Application();
			await instance.init({
				canvas,
				width: Math.round(cssW * dpr),
				height: Math.round(cssH * dpr),
				backgroundAlpha: 0,
				antialias: true,
				/*
				 * ⚠️ 这里**故意关掉 `autoDensity`、并把 `resolution` 固定为 1**，
				 * 由我们自己把"渲染尺寸"和"CSS 尺寸"分开管。
				 *
				 * 背景：`pixi-live2d-display` 的 `Live2DModel._render()` 自己设 GL viewport，
				 * **不跟着 renderer 的 `resolution` 走**。所以如果按常规写法
				 * （`autoDensity: true` + `resolution: devicePixelRatio`）：
				 *
				 *     画布 CSS = 420×398，后备缓冲 = 630×597（DPR 1.5）
				 *     但模型变换按 420×398 算 → 只占缓冲区的 2/3
				 *     → 显示出来小了 1.5 倍（有用户在 Windows 150% 缩放下踩到）
				 *
				 * 于是改成：让 **Pixi 的 screen 就是设备像素**（630×597），
				 * 模型照着它铺满；再用 `style.width/height` 把画布显示成 420×398。
				 * 浏览器自己做的这次降采样是正常的，**既清晰又不会错位**。
				 *
				 * （中间试过简单粗暴地把 `resolution` 钉成 1 —— 位置对了，但在
				 *   HiDPI 屏上会糊，因为等于只渲染了一半分辨率再被放大。）
				 */
				autoDensity: false,
				resolution: 1,
			});
			canvas.style.width = `${cssW}px`;
			canvas.style.height = `${cssH}px`;
			if (token !== loadToken) {
				instance.destroy({ removeView: false }, { children: true });
				return;
			}
			app = instance;

			/**
			 * 每帧渲染前把清屏色压回透明。
			 *
			 * 起因：pixi-live2d-display 会用裸 `gl.clearColor(1, 1, 1, 1)` 去清它自己的
			 * 遮罩帧缓冲（这是它内部正确的做法），但这个调用绕过了 Pixi 的状态缓存；
			 * 而 Pixi 自己的透明清屏只发 `gl.clear()`、不再重设颜色 ——
			 * 结果就是画布每一帧都被上一帧泄漏的白色刷成不透明白底。
			 *
			 * 这里以 HIGH 优先级挂到 ticker 上，保证排在 Pixi 渲染（LOW）之前执行。
			 */
			const keepClearTransparent = () => {
				const renderer = instance.renderer;
				if ("gl" in renderer) renderer.gl.clearColor(0, 0, 0, 0);
			};
			instance.ticker.add(keepClearTransparent, undefined, UPDATE_PRIORITY.HIGH);

			// 必须显式传 ticker：库默认去找全局 PIXI.Ticker，拿不到就只报警告，
			// 结果是模型加载成功但内部网格永不更新 —— 画面上什么都看不到。
			const loaded = await Model.from(modelUrl, {
				ticker: instance.ticker,
				autoHitTest: false, // 不用它自带的命中区域，交互统一走 canvas 事件
				autoFocus: true, // 头部跟随鼠标，桌宠观感更好
			});
			if (token !== loadToken) {
				loaded.destroy();
				return;
			}

			// 同样必须显式绑定渲染器。
			// Pixi v8 的 onRender 回调拿不到 renderer 参数，库里的兜底是
			// `globalThis.app || window.app`；两者都没有就**直接 return** ——
			// 贴图不绑定、模型不绘制，表现为"加载成功但画面空白"。
			// setRenderer() 是库为此留的公开 API（全库没有任何地方调用它）。
			loaded.setRenderer(instance.renderer);

			model = loaded;
			// 换模型了，之前缓存的原始尺寸作废（不同模型的画布尺寸不一样）
			baseModelW = null;
			baseModelH = null;

			app.stage.addChild(model);
			applyFraming();

			// 先装好"多表情参数层"，再允许交互 —— 保证中性值快照是在没应用过表情时取的
			await setupExpressionLayer(loaded.internalModel, modelUrl);
			if (token !== loadToken) return;

			bindResize();
			bindInteractions();

			// 调试句柄：控制台里可以直接摸模型（window.__live2d.model.expression("blush")）
			(window as unknown as { __live2d?: unknown }).__live2d = { app, model };

			console.log(
				`[live2d] 模型就绪：${modelUrl}\n` +
					`  画布 ${app.screen.width}×${app.screen.height}  DPR ${window.devicePixelRatio}\n` +
					`  WebGL: ${instance.renderer.name}\n` +
					`  表情池 ${expressions.length} 个`,
			);
		} catch (err) {
			console.error("[live2d] 模型加载失败：", err);
		}
	}

	return {
		loadlive2d,
		destroy,
		setSelection,
		getSelection: () => ({
			...selection,
			accessories: [...selection.accessories],
			props: [...selection.props],
		}),
		setLocked: (next: boolean) => {
			locked = next;
		},
		isLocked: () => locked,
		setEmotionRoller: (fn: (() => void) | null) => {
			emotionRoller = fn;
		},
		playMotion,
		resetMotions: () => exprLayer?.resetMotion(),
		isReady: () => !!(model && exprLayer),
		paramsOf: (name: string) => exprLayer?.paramsOf(name) ?? [],
	};
}

/**
 * 安装全局 `window.loadlive2d`，让 pio.js 无感知地切到现代运行时。
 * 返回运行时实例，便于调用方在卸载时 destroy。
 */
export function installLive2DRuntime(options: Live2DRuntimeOptions = {}): Live2DRuntime {
	const runtime = createLive2DRuntime(options);
	if (typeof window !== "undefined") {
		(window as unknown as { loadlive2d?: Live2DRuntime["loadlive2d"] }).loadlive2d =
			runtime.loadlive2d;
		// 调试句柄：控制台里可以直接玩选择
		//   __pio.setSelection({ emotion: "star-eyes", accessories: ["cat-paws"] })
		//   __pio.getSelection()
		(window as unknown as { __pio?: Live2DRuntime }).__pio = runtime;
	}
	return runtime;
}
