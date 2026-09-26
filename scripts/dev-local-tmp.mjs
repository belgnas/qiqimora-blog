/**
 * 带「独立临时目录」的开发服务器启动器。
 *
 * 为什么需要它
 * ------------
 * Astro 的内容层（content layer）在 dev 模式下会用 esbuild 把一个虚拟模块
 * （`astro:data-layer-content`）编译出来，而这个虚拟模块的数据来自
 * `.astro/data-store.json`。
 *
 * 问题出在 esbuild 的临时文件上：esbuild 会把自己的可执行文件复制到
 * 系统临时目录（`%TEMP%`）下的一个哈希命名目录里，并在退出/校验时**删除**它。
 * 一旦这个删除被拒绝（杀毒软件锁文件、权限异常、残留目录被占用等），
 * esbuild 就会报：
 *
 *     Error: remove C:\Users\<你>\AppData\Local\Temp\esbuild-<hash>  Access is denied
 *
 * 于是那次 `import("astro:data-layer-content")` 抛错。而 Astro 在
 * `astro/dist/content/data-store.js` 的 `fromModule()` 里是这样写的：
 *
 *     try { ... } catch { }            // ← 异常被静默吞掉
 *     return new ImmutableDataStore(); // ← 返回一个空存储
 *
 * 空存储还会被模块级单例永久缓存，之后即使文件恢复正常也不会重新加载。
 * 结果就是所有内容集合都变成"不存在"：
 *
 *   - 关于页 / 友链页  → 500，报 "About page content not found"
 *   - 首页            → 文章数、分类数、标签数全部变成 0
 *   - 终端            → 只有一行 "The collection ... does not exist"
 *
 * 为什么这样能修
 * ------------
 * 把 `TEMP` / `TMP` 指向一个 esbuild 能完全掌控（能写、也能删）的目录，
 * 删除就不再失败，虚拟模块正常加载，集合恢复正常。
 *
 * 用法：pnpm dev:tmp   （等价于 pnpm dev，只是换了个临时目录）
 */

import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmpDir = join(root, ".tmp-dev");

mkdirSync(tmpDir, { recursive: true });

// 清掉上一次留下的 esbuild 中间文件。
// 单个约 2 MB，长期累积会悄悄吃掉几百 MB。
let cleaned = 0;
for (const name of readdirSync(tmpDir)) {
	try {
		if (name.startsWith("esbuild-")) {
			rmSync(join(tmpDir, name), { force: true, recursive: true });
			cleaned++;
		}
	} catch {
		// 删不掉就算了，不影响启动
	}
}
const sizeMb = (() => {
	try {
		return readdirSync(tmpDir).reduce((n, f) => n + (statSync(join(tmpDir, f)).size || 0), 0) / 1048576;
	} catch {
		return 0;
	}
})();

console.log(`\n[live2d-dev] 临时目录：${tmpDir}`);
if (cleaned) console.log(`[live2d-dev] 已清理上次残留的 ${cleaned} 个 esbuild 中间文件（当前 ${sizeMb.toFixed(1)} MB）`);
console.log("[live2d-dev] 说明：系统 %TEMP% 里 esbuild 会删不掉自己的临时文件，\n" +
	"             导致内容层拿到空数据存储（关于页 500 / 首页统计全 0）。\n" +
	"             把 TEMP 指到项目内即可绕开，详见 docs/LIVE2D_MODERN_MODEL_PLAN.md 第 14 节。\n");

const astroBin = join(root, "node_modules", "astro", "astro.js");
const child = spawn(process.execPath, [astroBin, "dev", ...process.argv.slice(2)], {
	stdio: "inherit",
	cwd: root,
	env: { ...process.env, TEMP: tmpDir, TMP: tmpDir },
});

child.on("exit", (code, signal) => {
	process.exit(signal ? 1 : (code ?? 0));
});
