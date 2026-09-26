/**
 * 内容层 / 桌宠资源 自检脚本
 * ---------------------------------------------------------------
 * 用来验证「关于页 500、首页统计全 0」这个 bug 有没有复发。
 *
 * 背景（详见 docs/LIVE2D_MODERN_MODEL_PLAN.md 第 14 节）：
 *   esbuild 删不掉 %TEMP% 里的临时文件 → `astro:data-layer-content`
 *   虚拟模块导入失败 → Astro 用 `catch {}` 静默吞掉异常并返回**空数据存储**
 *   → 所有内容集合都变成"不存在"。
 *
 * 故障特征：
 *   - /about/、/friends/  → HTTP 500
 *   - 首页                → 文章/分类/标签 全部 0
 *   - 终端                → 只有一行 "The collection ... does not exist"
 *
 * 用法：
 *   pnpm verify:dev          # 若 4321 已在跑就直接探测它，否则自己起一个
 *   pnpm verify:dev --port 4399
 *   pnpm verify:dev --url http://127.0.0.1:4321
 *
 * 不会影响已经在跑的 dev server —— 检测到 4321 有响应就只做探测，
 * 绝不会另起第二个实例。
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, closeSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const argVal = (name) => {
	const i = argv.indexOf(name);
	return i >= 0 ? argv[i + 1] : undefined;
};
const urlArg = argVal("--url");
const portArg = Number(argVal("--port")) || null;

// ---------- 输出工具 ----------
const OK = "✅";
const NG = "❌";
const WA = "⚠️ ";
const results = [];
const record = (pass, label, detail) => {
	results.push({ pass, label, detail });
	console.log(`  ${pass ? OK : NG} ${label}${detail ? `  — ${detail}` : ""}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(base, path, timeoutMs = 15000) {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const res = await fetch(base + path, { signal: ctrl.signal });
		const body = await res.text();
		return { status: res.status, body };
	} catch (e) {
		return { status: 0, body: "", error: e.message };
	} finally {
		clearTimeout(t);
	}
}

async function isUp(base) {
	try {
		const r = await probe(base, "/", 4000);
		return r.status > 0;
	} catch {
		return false;
	}
}

// Astro 默认把 dev server 绑在 `localhost` 上，Windows 下通常解析到 IPv6 的 ::1，
// 此时 `127.0.0.1` 是连不上的。所以两个都试一遍，取能通的。
async function resolveBase(port) {
	for (const host of [`http://localhost:${port}`, `http://127.0.0.1:${port}`]) {
		const r = await probe(host, "/", 4000);
		if (r.status > 0) return host;
	}
	return null;
}

// ---------- 1. 桌宠静态资源完整性（不需要浏览器）----------
console.log("\n【1/3】桌宠资源完整性");
{
	const mustExist = [
		["public/live2d/core/live2dcubismcore.min.js", "Cubism Core 5 运行库"],
		["public/live2d/models/ds-whale/c_0120.model3.json", "模型定义"],
		["public/live2d/models/ds-whale/c_0120.moc3", "模型本体"],
		["public/live2d/models/ds-whale/c_0120.pose3.json", "姿势文件（缺失会导致 /Pose 404）"],
		["public/pio/static/pio.js", "看板娘插件"],
		["src/components/widget/live2d-runtime.ts", "Live2D 运行时适配层"],
	];
	for (const [rel, desc] of mustExist) {
		const abs = join(root, rel);
		const ok = existsSync(abs);
		record(ok, desc, ok ? rel : `缺失 → ${rel}`);
	}

	// model3.json 引用的每个文件都要真的在磁盘上
	const modelJsonPath = join(root, "public/live2d/models/ds-whale/c_0120.model3.json");
	if (existsSync(modelJsonPath)) {
		try {
			const m = JSON.parse(readFileSync(modelJsonPath, "utf-8"));
			const baseDir = join(root, "public/live2d/models/ds-whale");
			// Cubism 的 Motions 是按组名分组的**对象**（{ Idle: [...], Tap: [...] }），
			// 而 Textures / Expressions 是数组 —— 两种形态都要兼容。
			const motionGroups = m.FileReferences?.Motions;
			const motionFiles = (Array.isArray(motionGroups) ? motionGroups : Object.values(motionGroups ?? {}))
				.flatMap((g) => (g?.Motions ?? []).map((x) => x.File));
			const refs = [
				...(m.FileReferences?.Textures ?? []),
				...motionFiles,
				...(m.FileReferences?.Expressions ?? []).map((x) => x.File),
				...(m.FileReferences?.Physics ? [m.FileReferences.Physics] : []),
				...(m.FileReferences?.Pose ? [m.FileReferences.Pose] : []),
			].filter(Boolean);
			const missing = refs.filter((r) => !existsSync(join(baseDir, r)));
			record(
				missing.length === 0,
				`模型引用的 ${refs.length} 个文件全部存在`,
				missing.length ? `缺失 ${missing.length} 个：${missing.slice(0, 3).join(", ")}` : undefined,
			);
		} catch (e) {
			record(false, "解析 c_0120.model3.json", e.message);
		}
	}
}

// ---------- 2. 起 / 找 dev server ----------
console.log("\n【2/3】准备 dev server");
let base = null;
let child = null;
let logPath = null;
let attached = false;
let port = null;

if (urlArg) {
	base = urlArg.replace(/\/$/, "");
	if (!(await isUp(base))) {
		console.log(`  ${NG} 指定的地址无响应：${base}`);
		process.exit(1);
	}
	attached = true;
	console.log(`  ${OK} 探测指定地址：${base}`);
} else if ((base = await resolveBase(portArg ?? 4321))) {
	port = portArg ?? 4321;
	attached = true;
	console.log(`  ${OK} 检测到 :${port} 已有 dev server 在跑（${base}）—— 直接探测它，不会再起第二个`);
} else {
	port = portArg ?? 4399;
	base = `http://127.0.0.1:${port}`;
	const tmpDir = join(root, ".tmp-dev");
	mkdirSync(tmpDir, { recursive: true });
	logPath = join(tmpDir, "verify-dev.log");

	// 用**文件重定向**而不是管道捕获输出：
	// 管道在受限环境里会 EPERM，文件重定向不会。
	const fd = openSync(logPath, "w");
	child = spawn(process.execPath, [join(root, "node_modules", "astro", "astro.js"), "dev", "--port", String(port), "--host", "127.0.0.1"], {
		cwd: root,
		env: { ...process.env, TEMP: tmpDir, TMP: tmpDir },
		stdio: ["ignore", fd, fd],
	});
	closeSync(fd);
	console.log(`  … 正在启动 dev server（:${port}，临时目录 .tmp-dev/）`);

	const deadline = Date.now() + 90000;
	let up = false;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) break;
		if (await isUp(base)) {
			up = true;
			break;
		}
		await sleep(1500);
	}
	if (!up) {
		console.log(`  ${NG} dev server 启动失败`);
		if (logPath && existsSync(logPath)) {
			console.log("\n----- 日志末尾 -----");
			console.log(readFileSync(logPath, "utf-8").split("\n").slice(-25).join("\n"));
		}
		child?.kill();
		process.exit(1);
	}
	console.log(`  ${OK} dev server 已就绪`);
}

const cleanup = () => {
	if (child && child.exitCode === null) {
		try {
			child.kill();
		} catch {}
	}
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
	cleanup();
	process.exit(130);
});

// ---------- 3. 探测页面 ----------
console.log("\n【3/3】页面探测");
const pages = [
	["/", "首页"],
	["/about/", "关于页"],
	["/friends/", "友链页"],
	["/archive/", "归档页"],
	["/diary/", "日记页"],
];

let homeBody = "";
let sawCollectionWarning = false;
for (const [p, name] of pages) {
	const r = await probe(base, p);
	if (r.status === 0) {
		record(false, `${name} ${p}`, `无法访问：${r.error ?? "超时"}`);
		continue;
	}
	if (r.status !== 200) {
		record(false, `${name} ${p}`, `HTTP ${r.status}`);
		if (r.body.includes("content not found")) sawCollectionWarning = true;
		continue;
	}
	if (r.body.includes("content not found")) {
		record(false, `${name} ${p}`, "页面内容为 Astro 报错页");
		sawCollectionWarning = true;
		continue;
	}
	record(true, `${name} ${p}`, `HTTP 200`);
	if (p === "/") homeBody = r.body;
}

// 首页真的渲染出文章了吗
if (homeBody) {
	const postLinks = (homeBody.match(/href="\/posts\//g) ?? []).length;
	const emptyMark = homeBody.includes("暂无文章");
	record(postLinks > 0 && !emptyMark, "首页渲染出文章列表", `发现 ${postLinks} 个文章链接${emptyMark ? "（且出现“暂无文章”）" : ""}`);
}

// 关于页真的有正文吗
{
	const r = await probe(base, "/about/");
	const hasText = /关于|Astro|Mizuki/.test(r.body);
	record(r.status === 200 && hasText, "关于页渲染出正文", hasText ? "命中正文关键词" : "正文为空");
}

// 服务端日志里有没有集合告警（仅自建实例可查）
if (!attached && logPath && existsSync(logPath)) {
	const log = readFileSync(logPath, "utf-8");
	const warns = (log.match(/does not exist/g) ?? []).length;
	record(warns === 0, "dev server 日志无集合告警", warns ? `出现 ${warns} 次 "does not exist"` : "0 次");
}

// ---------- 结论 ----------
const failed = results.filter((r) => !r.pass);
console.log("\n" + "─".repeat(60));
if (failed.length === 0) {
	console.log(`${OK} 全部通过（${results.length} 项）—— 内容层与桌宠资源均正常`);
	cleanup();
	process.exit(0);
} else {
	console.log(`${NG} ${failed.length}/${results.length} 项失败：`);
	for (const f of failed) console.log(`     · ${f.label}${f.detail ? ` — ${f.detail}` : ""}`);
	if (sawCollectionWarning || failed.some((f) => /关于页|友链页|首页/.test(f.label))) {
		console.log("\n这看起来就是「内容层空存储」那个老问题。请检查：");
		console.log("  1. 确认是用 pnpm dev:tmp 启动的（它会把 TEMP 指向项目内）");
		console.log('  2. 清理残留临时目录：Remove-Item "$env:TEMP\\esbuild-*" -Recurse -Force');
		console.log("  3. 排查杀毒软件是否在锁 %TEMP% 里的文件");
	}
	cleanup();
	process.exit(1);
}
