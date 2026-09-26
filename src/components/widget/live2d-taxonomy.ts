/**
 * 看板娘 · 分类表（**手工维护**）
 * ===============================================================
 * ⚠️ 这个文件和 `live2d-catalog.ts` 是两回事：
 *
 *   live2d-catalog.ts   —— **自动生成**的「模型事实」：表情的中文名与参数表、
 *                          动作的时长与参数表。由 scripts/prepare-live2d-model.mjs 产出，**不要手改**。
 *   live2d-taxonomy.ts  —— **本文件**，人工编排：面板分几栏、每栏单选还是多选、
 *                          谁是谁的前提、哪些是一次性哪些是长期。
 *
 * 改这里 → 刷新页面即生效（dev 有 HMR）。
 *
 * ---------------------------------------------------------------
 * 面板 = 一栏一个 `TaxonomyPanel`，`mode` 决定交互：
 *
 *   radio   单选（互斥）—— 点另一个自动取消当前
 *   multi   多选 —— 可自由叠加，支持 `requires` 前提
 *   action  点一下播一次，不保留选中态
 *
 * 另外还有一层**自动保护**：只要两个表情驱动了同一个参数，运行时就会拦下来
 * （`.exp3.json` 全是 Add 混合，共用参数会数值累加出错）。
 * 例如「墨镜」额外驱动眼睛开合，所以选了它就会自动取消「开心兴奋」。
 */

/** 一个可选条目 */
export type TaxonomyItem = {
	/** 唯一 id，供 `requires` 引用 */
	id: string;
	label: string;
	/** 要选中的表情（可以多个，表示一整套状态） */
	expr?: string[];
	/** 要播放的动作 [动作组, 组内序号] */
	motion?: [string, number];
	/** 「默认」用：把所有动作状态清回中性（含手机手持这类长期状态） */
	clearMotions?: boolean;
	/** 前提：这些 id 对应条目**全部**要被选中，否则本条置灰 */
	requires?: string[];
	/**
	 * 前提（或）：这些 id 里**至少一个**被选中即可。
	 * 用于"两个并列选项都能作为前提"的情况，例如自拍——
	 * 「手机开盖」和「换色手机开盖」任意一个在，都算手机已经拿出来了。
	 */
	requiresAny?: string[];
	/**
	 * 互斥：这些 id 对应条目不能与本条同时选中（**对称生效**，写一遍就够）。
	 *
	 * 用在 `mode: "multi"` 的栏里表达那些"不是整栏单选、但彼此打架"的关系。
	 * 例：长期动作栏里 蛋包饭 能和 双手比耶 共存（一个是桌面状态、一个是手部姿势），
	 * 但 蛋包饭 和 点菜按下 不行（都占点菜板）。
	 */
	excludes?: string[];
};

export type TaxonomyPanel = {
	id: string;
	title: string;
	hint?: string;
	mode: "radio" | "multi" | "action";
	/**
	 * 切换本栏条目时，先把所有动作状态清回中性。
	 *
	 * 「长期动作」这类栏必须开 —— 因为手机手持（`phone` 系）被标成"长期状态"、
	 * **不每帧归位**，从「手机开盖」切到「双手比耶」时手机会一直拿在手上，
	 * 看起来就像新动作没生效。先清干净再应用，切换才看得见。
	 */
	resetOnChange?: boolean;
	items: TaxonomyItem[];
};

/**
 * 面板分栏 —— 顺序即显示顺序。
 *
 * 注意「表情」和「氛围」是**两栏独立的单选**：实测两者零参数冲突，
 * 所以一个情绪表情配一个氛围特效（例如 星星眼 + 问号）是可以同时显示的。
 */
export const PANELS: TaxonomyPanel[] = [
	{
		id: "expression",
		title: "表情",
		hint: "单选 · 互斥",
		mode: "radio",
		items: [
			{ id: "blush", label: "脸红", expr: ["blush"] },
			{ id: "heart-eyes", label: "爱心眼", expr: ["heart-eyes"] },
			{ id: "star-eyes", label: "星星眼", expr: ["star-eyes"] },
			{ id: "excited", label: "开心兴奋", expr: ["excited"] },
			{ id: "naughty", label: "调皮", expr: ["naughty"] },
			{ id: "angry", label: "生气", expr: ["angry"] },
			{ id: "sad", label: "悲伤", expr: ["sad"] },
			{ id: "cry", label: "哭", expr: ["cry"] },
			{ id: "dizzy", label: "晕晕", expr: ["dizzy"] },
			{ id: "gloomy", label: "阴暗", expr: ["gloomy"] },
			{ id: "blank-eyes", label: "呆呆眼", expr: ["blank-eyes"] },
			{ id: "drool", label: "闭眼口水", expr: ["drool"] },
			{ id: "tongue", label: "吐舌", expr: ["tongue"] },
			{ id: "soul-out", label: "吐魂", expr: ["soul-out"] },
		],
	},
	{
		id: "ambient",
		title: "氛围",
		hint: "单选 · 与表情不冲突",
		mode: "radio",
		items: [
			{ id: "sweat", label: "流汗", expr: ["sweat"] },
			{ id: "question", label: "问号", expr: ["question"] },
			{ id: "exclaim", label: "感叹号", expr: ["exclaim"] },
			{ id: "heartbeat", label: "心跳", expr: ["heartbeat"] },
			{ id: "mood-flower", label: "情绪花花", expr: ["mood-flower"] },
			{ id: "love", label: "love", expr: ["love"] },
		],
	},
	{
		id: "glasses",
		title: "配饰 · 眼部",
		hint: "单选 · 互斥",
		mode: "radio",
		items: [
			{ id: "glasses-round", label: "圆眼镜", expr: ["glasses-round"] },
			{ id: "glasses-square", label: "方眼镜", expr: ["glasses-square"] },
			{ id: "glasses-oval", label: "椭圆眼镜", expr: ["glasses-oval"] },
			{ id: "glasses-sun", label: "墨镜", expr: ["glasses-sun"] },
		],
	},
	{
		id: "headwear",
		title: "配饰 · 头饰",
		hint: "单选 · 互斥",
		mode: "radio",
		items: [
			{ id: "sticker-cat", label: "猫猫贴纸", expr: ["sticker-cat"] },
			{ id: "sticker-rabbit", label: "兔兔贴纸", expr: ["sticker-rabbit"] },
			{ id: "sticker-bow", label: "蝴蝶结贴纸", expr: ["sticker-bow"] },
		],
	},
	{
		id: "misc-accessory",
		title: "配饰 · 其他",
		hint: "多选",
		mode: "multi",
		items: [
			{ id: "headband", label: "头箍", expr: ["headband"] },
			{ id: "ponytail", label: "单边马尾", expr: ["ponytail"] },
		],
	},
	{
		id: "environment",
		title: "环境",
		hint: "多选 · 可自由组合",
		mode: "multi",
		items: [
			{ id: "tablecloth-dark", label: "深色桌布", expr: ["tablecloth-dark"] },
			{ id: "whale", label: "鲸鱼", expr: ["whale"] },
			{ id: "whale-on-desk", label: "鲸鱼放桌上", expr: ["whale-on-desk"] },
			{ id: "claw", label: "魔爪", expr: ["claw"] },
			// 参数上是两个不同的开关，但换色显然以"魔爪已经在"为前提
			{ id: "claw-recolor", label: "魔爪换色", expr: ["claw-recolor"], requires: ["claw"] },
			{ id: "parfait-off", label: "芭菲", expr: ["parfait-off"] },
		],
	},
	{
		id: "tool",
		title: "工具",
		hint: "单选 · 桌布上那三个图标",
		mode: "radio",
		items: [
			{ id: "undo", label: "撤回", expr: ["undo"] },
			{ id: "eraser", label: "橡皮", expr: ["eraser"] },
			{ id: "brush", label: "画笔", expr: ["brush"] },
		],
	},
	{
		id: "longterm",
		title: "长期动作",
		hint: "多选 · 保持住的状态",
		mode: "multi",
		// 手机手持是不归位的"长期状态"，切换时必须先清干净，否则从开盖切到
		// 喵喵手/双手比耶时手机还在手上，看着像没反应
		resetOnChange: true,
		items: [
			// ── 基准状态 ──
			// 「点菜」是其他状态的地基：选它就等于把桌面/手部都收回初始姿势。
			// 也是「恢复默认」按钮会选中的那一个。
			{ id: "default", label: "点菜", clearMotions: true, excludes: ["omurice", "cat-paws", "phone-open", "phone-recolor"] },

			// ── 桌面 ──
			// 蛋包饭摆出来后会一直在点菜板上 → 和"点菜按下"抢同一块板子，互斥
			{ id: "omurice", label: "蛋包饭", expr: ["omurice"], excludes: ["order-press", "phone-open", "phone-recolor", "cat-paws"] },
			// 点菜按下要先回到「点菜」这个基准姿势（点菜板空着）才按得下去；
			// 按下去手就占住了，拿不了手机
			{ id: "order-press", label: "点菜按下", expr: ["order-press"], requires: ["default"], excludes: ["omurice", "phone-open", "phone-recolor", "cat-paws"] },

			// ── 手部 ──
			// 喵喵手把两只手都占了 → 和所有其他长期状态互斥
			{ id: "cat-paws", label: "喵喵手~喵~动画", expr: ["cat-paws"], excludes: ["default", "omurice", "order-press", "phone-open", "phone-recolor", "double-peace"] },
			// 比耶只用一只手 → 可以和桌面状态叠加；但和"拿着手机"冲突
			{ id: "double-peace", label: "比耶", expr: ["double-peace"], excludes: ["phone-open", "phone-recolor"] },

			// ── 手机（两个并列选项，同一个动作，区别只在手机配色）──
			// 开盖会驱动 phone / phone2 / phone4 / phone6 —— 这几个被标为"长期状态"、
			// 播完不归位，所以手机会一直拿着
			{ id: "phone-open", label: "手机开盖", motion: ["Selfie", 0], excludes: ["default", "omurice", "order-press", "double-peace", "phone-recolor"] },
			// 和上面同一个动作，额外把 `shouji` 打开换成另一套配色。
			// 做成并列选项（而不是"开盖后再勾一个换色"）是为了让两者逻辑一致 ——
			// 以前"换色"依赖"开盖"，切换时会被连锁关掉，还会误清手机状态。
			{ id: "phone-recolor", label: "换色手机开盖", motion: ["Selfie", 0], expr: ["phone-recolor"], excludes: ["default", "omurice", "order-press", "double-peace", "phone-open"] },
		],
	},
	{
		id: "oneshot",
		title: "一次性动作",
		hint: "点一下播一次",
		mode: "action",
		items: [
			{ id: "bubblegum", label: "吹泡泡糖", motion: ["Tap", 0] },
			{ id: "hammer", label: "锤子", motion: ["Tap", 1] },
			// 挤番茄酱要先有蛋包饭：sauce 动作驱动的正是 danbaofan / ji
			{ id: "sauce", label: "给蛋包饭挤番茄酱", expr: ["moemoeq"], motion: ["Sauce", 0], requires: ["omurice"] },
			// 自拍要先开盖 —— 得先有手机拿在手上，才有得拍。
			// 「手机开盖」和「换色手机开盖」任意一个在都算。
			{ id: "selfie", label: "自拍", motion: ["Selfie", 1], requiresAny: ["phone-open", "phone-recolor"] },
			{ id: "selfie-quick", label: "快速自拍", motion: ["Selfie", 2], requiresAny: ["phone-open", "phone-recolor"] },
		],
	},
];

/** 哪个动作组保留循环（氛围必须常驻）——其余动作会被改成一次性 */
export const LOOPING_MOTION_GROUPS = ["Idle"];

/** 动作的中文名与性质；`kind` 决定它会不会进"点击随机池" */
export const MOTION_INFO: Record<string, { label: string; kind: "ambient" | "perform" | "prop" }> = {
	"Idle/idle": { label: "待机氛围", kind: "ambient" },
	"Tap/bubblegum": { label: "吹泡泡糖", kind: "prop" },
	"Tap/hammer": { label: "锤子", kind: "perform" },
	"Tap/spray": { label: "甩尾拍水", kind: "prop" },
	"Selfie/phone-open": { label: "手机开盖", kind: "prop" },
	"Selfie/selfie": { label: "自拍", kind: "perform" },
	"Selfie/selfie-quick": { label: "快速自拍", kind: "prop" },
	"Sauce/sauce": { label: "番茄酱", kind: "perform" },
};
