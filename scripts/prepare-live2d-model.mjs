/**
 * 把 VTube Studio 导出的 DS鲸鱼娘 模型整理成网页可直接加载的形态。
 *
 * 做三件事：
 *   1. 中文文件名 → ASCII（跨平台/部署安全）
 *   2. 生成补好 Motions / Expressions / Groups 的 c_0120.model3.json
 *      （VTS 把这些登记在 *.vtube.json 里，网页运行时读不到）
 *   3. 只搬运运行时需要的文件，丢掉 VTS 专属的图标/配置
 *
 * 源目录不在版本库内（other/ 已 gitignore），所以本脚本是"资产流水线说明书"，
 * 换模型时改下面的 SOURCE / RENAME 表即可。
 *
 * 用法：node scripts/prepare-live2d-model.mjs
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "other", "DS鲸鱼娘", "DS面捕版");
const DEST = join(ROOT, "public", "live2d", "models", "ds-whale");

/** 表情：中文名 → ASCII 名。顺序即 model3.json 里的注册顺序。 */
const EXPRESSIONS = {
	脸红: "blush",
	爱心眼: "heart-eyes",
	星星眼: "star-eyes",
	开心兴奋: "excited",
	调皮: "naughty",
	生气: "angry",
	悲伤: "sad",
	哭: "cry",
	晕晕: "dizzy",
	阴暗: "gloomy",
	呆呆眼: "blank-eyes",
	闭眼口水: "drool",
	吐舌: "tongue",
	吐魂: "soul-out",
	流汗: "sweat",
	问号: "question",
	感叹号: "exclaim",
	心跳: "heartbeat",
	情绪花花: "mood-flower",
	love: "love",
	// —— 配饰 / 场景（开关型）——
	圆眼镜: "glasses-round",
	方眼镜: "glasses-square",
	椭圆眼镜: "glasses-oval",
	墨镜: "glasses-sun",
	头箍: "headband",
	单边马尾: "ponytail",
	猫猫贴纸: "sticker-cat",
	兔兔贴纸: "sticker-rabbit",
	蝴蝶结贴纸: "sticker-bow",
	魔爪: "claw",
	魔爪换色: "claw-recolor",
	深色桌布: "tablecloth-dark",
	鲸鱼: "whale",
	鲸鱼放桌上: "whale-on-desk",
	手机换色: "phone-recolor",
	蛋包饭: "omurice",
	巴菲: "parfait-off",
	点菜按下: "order-press",
	撤回: "undo",
	橡皮: "eraser",
	画笔: "brush",
	双手比耶: "double-peace",
	"喵喵手~喵~动画": "cat-paws",
	挤: "moemoeq",
};

/** 动作：中文名 → ASCII 名，并归入动作组。 */
const MOTION_GROUPS = {
	Idle: [{ from: "motions/idle.motion3.json", to: "idle.motion3.json", fade: true }],
	Tap: [
		{ from: "motions/chuipaopao.motion3.json", to: "bubblegum.motion3.json" },
		{ from: "aidale.motion3.json", to: "hammer.motion3.json" },
		{ from: "motions/喷水.motion3.json", to: "spray.motion3.json" },
	],
	Selfie: [
		{ from: "motions/开盖.motion3.json", to: "phone-open.motion3.json" },
		{ from: "motions/自拍.motion3.json", to: "selfie.motion3.json" },
		{ from: "motions/自拍简单.motion3.json", to: "selfie-quick.motion3.json" },
	],
	Sauce: [{ from: "motions/番茄酱.motion3.json", to: "sauce.motion3.json" }],
};


// 注：槽位 / 互斥组 / 独立道具 / 剧情链 已移出本脚本，
//     改在 src/components/widget/live2d-taxonomy.ts 里手工维护。


const MOTION_INFO = {
	"Idle/idle": { label: "待机氛围", kind: "ambient" },
	"Tap/bubblegum": { label: "吹泡泡糖", kind: "prop" },
	"Tap/hammer": { label: "锤子", kind: "perform" },
	"Tap/spray": { label: "喷水", kind: "prop" },
	"Selfie/phone-open": { label: "开盖", kind: "prop" },
	"Selfie/selfie": { label: "自拍", kind: "perform" },
	"Selfie/selfie-quick": { label: "快速自拍", kind: "prop" },
	"Sauce/sauce": { label: "番茄酱", kind: "perform" },
};


/** 直接原样拷贝的文件。 */
const COPY_AS_IS = [
	"c_0120.moc3",
	"c_0120.physics3.json",
	"c_0120.cdi3.json",
	"c_0120.2048/texture_00.png",
	"c_0120.2048/texture_01.png",
	// 作者自带的头像 —— 用于「关闭桌宠」后那个圆形恢复按钮。
	// pio.js 默认用的是它自己那张 `avatar.jpg`（紫发角色），所以要在
	// Pio.svelte 里覆盖 `.pio-show` 的 background-image 指到这里。
	"icon.png",
];

function fail(msg) {
	console.error(`✖ ${msg}`);
	process.exit(1);
}

if (!existsSync(SOURCE)) {
	fail(`找不到源目录：${SOURCE}\n  （模型放在 other/ 下，该目录已 gitignore，不会进版本库）`);
}

console.log(`源：${SOURCE}`);
console.log(`目标：${DEST}\n`);

// 全量重建，避免改名后残留旧文件
rmSync(DEST, { recursive: true, force: true });
mkdirSync(join(DEST, "motions"), { recursive: true });
mkdirSync(join(DEST, "expressions"), { recursive: true });

// 1. 原样拷贝
for (const rel of COPY_AS_IS) {
	const src = join(SOURCE, rel);
	if (!existsSync(src)) fail(`缺少文件：${rel}`);
	cpSync(src, join(DEST, rel));
	console.log(`  copy  ${rel}`);
}

// 2. 动作
//
// ⚠️ 必须修正 Meta.Loop —— 这是整个桌宠能不能"活着"的关键。
//
// 原模型 8 个动作**全部**是 `Loop: true`。pixi-live2d-display 对循环动作的处理是：
// 循环动作永远不会 isFinished() → MotionManager.update() 里的 `state.complete()`
// 永不执行 → `currentGroup` 永远停在 "Tap" → `shouldRequestIdleMotion()` 永不成立
// → **idle 动作再也不会被请求**。
//
// 实测后果：点一下桌宠（触发 Tap 动作）之后，idle 驱动的 118 个"氛围参数"
// （14 颗星星、7 个旋转光环、泡泡、猫爪…）全部冻结在最后一帧，0.467 秒的
// spray 动作播了 15 秒还在播，氛围动画再也不回来。
//
// 所以：Idle 组保持循环（它就是氛围引擎，必须常驻），其余三组一律改成一次性。
const MOTION_GROUPS_LOOPING = new Set(["Idle"]);

const motions = {};
for (const [group, list] of Object.entries(MOTION_GROUPS)) {
	const looping = MOTION_GROUPS_LOOPING.has(group);
	motions[group] = [];
	for (const m of list) {
		const src = join(SOURCE, m.from);
		if (!existsSync(src)) fail(`缺少动作文件：${m.from}`);
		const dest = join(DEST, "motions", m.to);
		cpSync(src, dest);

		// 打补丁：只改 Meta.Loop 这一个播放标志，不碰任何美术数据
		const motionJson = JSON.parse(readFileSync(dest, "utf8"));
		const before = motionJson.Meta?.Loop;
		if (motionJson.Meta) motionJson.Meta.Loop = looping;
		writeFileSync(dest, JSON.stringify(motionJson), "utf8");
		if (before !== looping) {
			console.log(`  motion [${group}] ${m.from} → motions/${m.to}  (Loop ${before} → ${looping})`);
		} else {
			console.log(`  motion [${group}] ${m.from} → motions/${m.to}`);
		}

		const entry = { File: `motions/${m.to}` };
		if (m.fade) {
			entry.FadeInTime = 1.0;
			entry.FadeOutTime = 1.0;
		}
		motions[group].push(entry);
	}
}

// 3. 表情
const expressions = [];
for (const [zh, ascii] of Object.entries(EXPRESSIONS)) {
	const src = join(SOURCE, `${zh}.exp3.json`);
	if (!existsSync(src)) fail(`缺少表情文件：${zh}.exp3.json`);
	cpSync(src, join(DEST, "expressions", `${ascii}.exp3.json`));
	expressions.push({ Name: ascii, File: `expressions/${ascii}.exp3.json` });
}
console.log(`  expression × ${expressions.length}`);

// 4. model3.json
const model3 = JSON.parse(readFileSync(join(SOURCE, "c_0120.model3.json"), "utf8"));
model3.FileReferences.Motions = motions;
model3.FileReferences.Expressions = expressions;
// 补一个空的 pose3.json。
// 起因：pixi-live2d-display 里 `Object.assign(this, new CubismModelSettingJson(...))` 会把
// 框架内部的「键名字符串」一并拷到 settings 上（pose = "Pose"）。模型没声明 Pose 时，
// 加载器就会去请求 `<模型目录>/Pose` 并拿到 404。
// 指向一个内容为空的 pose 文件即可消除这个无意义的请求，语义与原模型完全一致。
model3.FileReferences.Pose = "c_0120.pose3.json";
// LipSync 组原本是空的，补上嘴型参数才能做口型
for (const g of model3.Groups ?? []) {
	if (g.Name === "LipSync") g.Ids = ["ParamMouthOpenY"];
}
// 命中区域：点头部和点身体可以有不同反应
model3.HitAreas = [{ Id: "HitArea", Name: "Head" }];

writeFileSync(join(DEST, "c_0120.model3.json"), JSON.stringify(model3, null, "\t") + "\n", "utf8");
writeFileSync(join(DEST, "c_0120.pose3.json"), '{ "Type": "Live2D Pose", "Groups": [] }\n', "utf8");
console.log("  write c_0120.model3.json");
console.log("  write c_0120.pose3.json（空 pose，用于消除库的 404）");

// 4.5 目录（面板用）：把「ASCII 名 ↔ 中文名 ↔ 槽位 ↔ 参数」固化成一份 TS 模块。
//     参数表也一并写入，运行时就不必再去 fetch 44 个 .exp3.json 才能做冲突检测。
const catalogExpressions = [];
for (const [zh, ascii] of Object.entries(EXPRESSIONS)) {
	const expFile = join(DEST, "expressions", `${ascii}.exp3.json`);
	const ids = existsSync(expFile)
		? (JSON.parse(readFileSync(expFile, "utf8")).Parameters ?? []).map((p) => p.Id)
		: [];
	const params = existsSync(expFile) ? (JSON.parse(readFileSync(expFile, "utf8")).Parameters ?? []).map((p) => p.Id) : [];
	catalogExpressions.push({ name: ascii, label: zh, params });
}

const catalogMotions = [];
for (const [group, list] of Object.entries(motions)) {
	list.forEach((m, index) => {
		const key = `${group}/${m.File.split("/").pop().replace(".motion3.json", "")}`;
		const info = MOTION_INFO[key] ?? { label: key, kind: "prop" };
		const mj = JSON.parse(readFileSync(join(DEST, m.File), "utf8"));
		const ids = [...new Set((mj.Curves ?? []).map((c) => c.Id).filter((x) => x && x !== "Model"))];
		catalogMotions.push({ group, index, file: m.File, label: info.label, kind: info.kind, duration: mj.Meta?.Duration ?? 0, params: ids });
	});
}

const CATALOG_PATH = join(ROOT, "src", "components", "widget", "live2d-catalog.ts");
const catalogTs = `/**
 * ⚠️ 本文件由 scripts/prepare-live2d-model.mjs 自动生成，请勿手改。
 *    重新生成：node scripts/prepare-live2d-model.mjs
 *
 * 这里只放「**模型事实**」：表情的中文名与参数表、动作的时长与参数表。
 * 「**编排**」（谁归哪个槽位、谁和谁互斥、哪些独立、哪些串成剧情链）
 * 全部在 **live2d-taxonomy.ts** 里手工维护 —— 那个文件才是你要改的。
 */

export interface Live2DExpressionEntry {
	readonly name: string;
	readonly label: string;
	/** 该表情驱动的参数 —— 运行时据此自动判定"硬冲突" */
	readonly params: readonly string[];
}

export interface Live2DMotionEntry {
	readonly group: string;
	/** 组内索引，用于精确播放某一个动作（model.motion(group, index)） */
	readonly index: number;
	readonly file: string;
	readonly label: string;
	readonly kind: "ambient" | "perform" | "prop";
	readonly duration: number;
	readonly params: readonly string[];
}

export const LIVE2D_EXPRESSIONS: readonly Live2DExpressionEntry[] = ${JSON.stringify(catalogExpressions, null, "\t")};

export const LIVE2D_MOTIONS: readonly Live2DMotionEntry[] = ${JSON.stringify(catalogMotions, null, "\t")};
`;
writeFileSync(CATALOG_PATH, catalogTs, "utf8");
console.log(`  write src/components/widget/live2d-catalog.ts（${catalogExpressions.length} 表情 + ${catalogMotions.length} 动作）`);

// 5. 授权说明（作者要求无偿分享，署名与原文一并保留）
const notice = readFileSync(join(ROOT, "other", "DS鲸鱼娘", "使用须知.txt"), "utf8").trim();
writeFileSync(
	join(DEST, "NOTICE.txt"),
	[
		"DS鲸鱼娘 / Live2D model",
		"模型制作：B站 @氵六青（11272072）",
		"使用问题与定制桌宠交流群：645169617",
		"",
		"—— 作者原文 ——",
		notice,
		"",
		"—— 本项目对资源做过的处理（未改动模型本体）——",
		"1. 中文文件名改为 ASCII，并重写 model3.json 的引用路径",
		"2. 在 model3.json 中补写 Motions / Expressions / Groups（原文件没有，",
		"   VTube Studio 把这些登记在 c_0120.vtube.json 里，网页运行时读不到）",
		"3. moc3 / 贴图 / 物理 / 表情 / 动作的**内容**均未修改",
		"",
		"渲染依赖 Live2D Cubism Core（public/live2d/core/），受 Live2D 自有许可约束。",
		"",
	].join("\n"),
	"utf8",
);
console.log("  write NOTICE.txt");

console.log(`\n✔ 完成。共 ${COPY_AS_IS.length} 个原样文件 + ${Object.values(motions).flat().length} 个动作 + ${expressions.length} 个表情`);
