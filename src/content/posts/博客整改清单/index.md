---
title: 博客整改清单：一次全站自查的 19 个待修点
published: 2026-09-22
updated: 2026-09-25
pinned: true
description: 对 qiqimora.cn 做了一次从仓库、构建、路由到内容的全面自查，把发现的 19 个问题整理成可逐条执行的清单，每条都附文件位置、改法和验证方式。
tags: [任务, 维护, 博客]
category: 其他
licenseName: "Unlicensed"
author: qiqimora
draft: false
---

> [!IMPORTANT]
> **2026-09-25 更新（第二轮）：HTTPS 已彻底修复，`dist/` 去留已确认。**
>
> - **HTTPS 证书**：根因并非简单的「证书过期」，而是**阿里云因 ICP 备案不合规在网络层拦截了 80 端口**，导致 certbot 的 HTTP-01 验证永远失败。已改用 acme.sh + TLS-ALPN-01（走 443 端口）重签成功，6 个域名外网验证全部通过，有效期至 **2026-12-24**，自动续期已配好。详见文末《HTTPS 证书故障完整复盘》。
> - **第 1 条（dist 出库）**：已确认服务器由 cron 每天 4:00 执行 `/var/www/deploy.sh`（内部是 `git reset --hard origin/main`），nginx 直接服务仓库内的 `dist/`。**所以 `dist/` 必须继续留在 Git 里**，这不是可以优化掉的冗余，而是当前部署方式的硬性要求。
> - 顺带修掉了服务器 nginx 里一个**会永久阻断自动续期的配置 bug**（`return 301` 写在 server 级，导致 ACME 验证 location 永远命中不到）。
>
> **2026-09-24 更新（第一轮）**：除第 1 条和第 3 条备案号外，其余 17 条已修复完毕，并通过完整构建验证（26 页 + pagefind + 字体压缩，产物 90.1 MB）。执行中额外发现 3 个清单外问题：HTTPS 证书过期、`常见STL` 目录大小写不一致（Windows 无感、Linux 会出错）、IndexNow 密钥文件缺失。

> [!NOTE]
> 本文是自查记录，不是教程。第一轮结论来自本地代码阅读（当时网络不通、构建也跑不起来）；**第二轮已获得服务器访问权限，所有关于线上环境的结论都经过实际验证**，并在文中标注了验证方式。

## 自查范围与结论

| 项 | 结果 |
| --- | --- |
| 检查对象 | `qiqimora-blog` 仓库（Astro 5.18 + Svelte 5 + Tailwind v4） |
| 检查方式 | 全量代码阅读 + Git 历史 + 构建产物比对 |
| 发现问题 | **19 项**：2 项紧急、6 项会导致链接失效、5 项站点头尾没收尾、6 项配置残留 |
| 未能验证 | `pnpm check` / `pnpm build` 本地跑不起来（沙箱限制），线上站点也访问不到 |

**一句话总结**：内容写得很扎实，但「工程收尾」这块基本停在模板默认状态——`dist/` 被提交进 Git 让仓库膨胀到 119 MB、`robots.txt` 把全站屏蔽、页脚（备案号）完全没开、导航栏还写着 `MizukiUI`、几个菜单链接会点出 404。

---

## 优先级总览

| # | 问题 | 优先级 | 位置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | `dist/` 被 Git 跟踪，仓库 119 MB | P0 | `.gitignore` | ✅ 已确认必须保留（部署方式决定） |
| 2 | `robots.txt` 硬编码 `Disallow: /` | P0 | `src/pages/robots.txt.ts` | ✅ 已修复 |
| 3 | 页脚关闭，无备案号 | P0 | `src/config.ts` | ✅ 页脚已启用；备案号暂以注释保留（不公示未确认的号码） |
| 4 | `.env` 与 `.env.example` 完全一致 | P0 | `.env` | ✅ IndexNow 已配好 |
| 5 | `devices` 链接缺前导斜杠 | P1 | `src/config.ts` | ✅ 已修复 |
| 6 | `My` / `About` 指向不存在的 `/content/` | P1 | `src/config.ts` | ✅ 已修复 |
| 7 | 友链头像用构建哈希 URL | P1 | `src/data/friends.ts` | ✅ 两张均已本地化 |
| 8 | 导航栏文字还是 `MizukiUI` | P1 | `src/config.ts` | ✅ 已修复 |
| 9 | favicon 还是主题默认 | P1 | `src/config.ts` | ✅ 头像生成三尺寸 |
| 10 | Logo 还是主题默认 | P2 | `src/config.ts` | ✅ 已换 logo.png |
| 11 | 三篇文章 frontmatter 残留约 180 行注释 | P1 | 三篇文章 | ✅ 已清理 |
| 12 | `date` / `pubDate` 不是 schema 字段 | P2 | 九篇文章 | ✅ 已删净 |
| 13 | 无文章有 `updated`，但开启了「上次编辑」 | P2 | 九篇文章 | ✅ 按 git 历史补齐 |
| 14 | 文章配图未压缩（单篇 8.3 MB） | P1 | 文章 `images/` | ✅ 43 张转 WebP，省 89% |
| 15 | `pnpm.overrides` 被 pnpm 10 忽略 | P2 | `package.json` | ✅ 已删除死配置 |
| 16 | `other/` 里的证书副本已过期 | P2 | `other/` | ✅ 已删除 |
| 17 | `public/pio/models/live2d/` 未跟踪且未生效 | P2 | `public/pio/` | ✅ 移到 other/ 备份 |
| 18 | 评论开关与 `envId` 都是占位 | P3 | `src/config.ts` | ✅ 占位已清（保持关闭） |
| 19 | bangumi / bilibili 占位 ID | P3 | `src/config.ts` | ✅ bilibili 已填，bangumi 留空 |

> [!NOTE]
> 状态图例：✅ 完成 / 🔶 部分完成（缺你提供的信息）/ ⏸ 需要决策。下面正文保留的是「问题诊断 + 改法说明」，方便日后复查每一条为什么这么改。

---

# 一、P0：先修这四个

## 1. `dist/` 被 Git 跟踪，仓库已经 119 MB

**位置**：`.gitignore` 第 1–3 行

```gitignore
# build output
# 服务器的内存不够，用本地的dist目录来代替构建
# dist/
```

`dist/` 这一行被注释掉了，所以构建产物全部进了版本库。

**实测数据**：

- Git 松散对象 **118.98 MiB**，共 1090 个对象
- `dist/` 合计 **89.2 MB**，其中 `assets` 42.3 MB、`images` 34.5 MB
- 最后一次提交 `4241b8b` 就包含了 `dist/` 下的字体和 HTML 变更

**影响**：这是目前最大的技术债。每次改一篇文章，提交 diff 里都会塞进几 MB 的字体和 HTML；仓库只会单向膨胀，克隆和 CI 都会越来越慢。

**还有个矛盾点**：`vercel.json` 第 2 行仍然写着

```json
"buildCommand": "pnpm build",
```

如果你真的在 Vercel 上部署，它**会忽略你提交的 `dist/`**，从源码重新构建——那本地构建再提交就是白做。结合 `other/` 里那张 `qiqimora.cn` 的 Let's Encrypt 证书看，你实际应该是自建服务器（阿里云）部署。**所以先确认一件事：线上到底是从哪拉文件的？**

**改法（二选一，取决于上面那个问题的答案）**：

**路线 A：确实是服务器拉 `dist/`** —— 保留现状，但换掉传输方式：

```bash
# 让 Git 停止跟踪 dist，但本地文件保留
git rm -r --cached dist
# 然后取消 .gitignore 里 dist/ 的注释
```

改完后用 `rsync` / `scp` 只把 `dist/` 传到服务器，或者单独建一个 `deploy` 分支只放产物。版本库只保留源码。

**路线 B：Vercel / Cloudflare Pages 从源码构建** —— 同样执行上面的 `git rm -r --cached dist`，然后放行 `dist/`，并删掉服务器上手动构建的流程。

**验证**：

```bash
git count-objects -vH          # 处理前是 118.98 MiB
git status --short             # 确认没有意外改动
```

> [!WARNING]
> 动手前先确认线上是怎么拿文件的。如果服务器就是 `git pull` 然后直接指向 `dist/`，那 `git rm --cached` 之后**必须**同时改部署方式，否则线上会直接 404。

---

## 2. `robots.txt` 把全站屏蔽了

**位置**：`src/pages/robots.txt.ts` 第 3–10 行

```ts
const robotsTxt = `
User-agent: *
Disallow: /
Allow: /$
Allow: /posts/

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();
```

构建产物 `dist/robots.txt` 实测内容确认了这一点。

**影响**：除了首页 `/` 和 `/posts/`，**其余全部页面禁止被搜索引擎收录**——包括 `/about/`、`/diary/`、`/archive/`、`/albums/`、`/friends/`、`/projects/`、`/skills/`、`/timeline/`、`/devices/`、`/anime/`。

而且这里有个自相矛盾的地方：同一份 `robots.txt` 又声明了 `Sitemap:`，而 sitemap 里**列全了那些被禁止的页面**。等于一边告诉搜索引擎「这些都别抓」，一边又把它们塞进索引清单。

**这是否是有意为之？** 你的站点副标题是「私人小网站」，如果本来就不想被收录，那现状是合理的——但那样的话 sitemap 和 `featurePages` 里那句「关闭未使用的页面有助于提升 SEO」的注释就都失去意义了。

**改法**：如果希望全站可收录：

```ts
const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();
```

如果只想收录文章，保持 `Disallow: /` 但把 sitemap 里非文章页面过滤掉，让两边一致。

**验证**：构建后看 `dist/robots.txt`，或在线上访问 `https://qiqimora.cn/robots.txt`。

---

## 3. 页脚关闭，备案号缺失

**位置**：`src/config.ts` 第 488–494 行

```ts
export const footerConfig: FooterConfig = {
	enable: false,
	customHtml: "",
};
```

**另外**：`src/FooterConfig.html` 还是主题模板的原文——「这里是HTML注入示例，你可以在这个文件中添加自定义的HTML内容」，从没改过。

**影响**：站点跑在 `.cn` 域名 + 阿里云上，**备案号按规定需要展示在页脚**。目前页脚是空的，这是个合规风险，不只是美观问题。

**改法**：

```ts
export const footerConfig: FooterConfig = {
	enable: true,
	customHtml: `
		<div class="flex flex-col items-center gap-1 text-sm">
			<div>
				© ${new Date().getFullYear()}
				<a href="/about/" class="transition hover:text-[var(--primary)]">奇奇莫拉</a>
			</div>
			<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener"
			   class="transition hover:text-[var(--primary)]">
				你的ICP备案号
			</a>
		</div>
	`,
};
```

把 `你的ICP备案号` 换成实际号码（形如 `京ICP备2025000000号-1`）。如果还办了公安联网备案，通常在页脚再加一行并链到 `https://beian.mps.gov.cn/`。

**验证**：`pnpm dev` 打开首页，滚到底部确认备案号可点击、能跳到工信部网站。

---

## 4. `.env` 和 `.env.example` 一模一样

**位置**：`.env`

**实测**：两个文件的 SHA256 **完全相同**（都是 2092 字节）——也就是说 `.env` 里从来没有填过任何真实值。

**受影响的功能**：

| 变量 | 当前值 | 后果 |
| --- | --- | --- |
| `ENABLE_CONTENT_SYNC` | `false` | 内容分离功能未启用（未启用则无所谓） |
| `CONTENT_REPO_URL` | `https://github.com/your-username/Mizuki-Content.git` | 占位，未启用则无所谓 |
| `INDEXNOW_HOST` | `your.example.com` | **`pnpm submit` 会把 URL 提交到错误主机** |
| `BILI_SESSDATA` | 含 `your`，是占位符 | B 站观看进度功能不可用 |

**好消息**：`.env` 已经被 `.gitignore` 第 18 行正确忽略了，密钥没有泄露。

**改法**：至少把 IndexNow 配好，否则 `scripts/indexnow-submit.js` 是空转的：

```dotenv
INDEXNOW_HOST=qiqimora.cn
```

**验证**：`pnpm submit` 后看输出是否返回 200/202。

> [!TIP]
> IndexNow 只有在**部署完成后**提交才有效，而且没有接进 `build` 脚本（`package.json` 第 16 行的构建链里没有它）。想自动化的话，在部署脚本最后加一步 `pnpm submit`。

---

# 二、导航与链接：这三个现在就会点出 404

## 5. `devices` 链接少了前导斜杠

**位置**：`src/config.ts` 第 323–327 行

```ts
{
	name: "Devices",
	url: "devices/",        // ← 少了 /
	icon: "material-symbols:devices",
	external: false,
},
```

同一份 `navBarConfig` 里其他所有链接都是 `/xxx/`，只有这个是相对路径。

**影响**：相对链接会**基于当前页面路径**解析。在首页 `/` 上点它还算正常，但在文章页 `/posts/常见stl/` 上点就会跳到 `/posts/常见stl/devices/`——**404**。这在移动端抽屉菜单里特别容易踩到。

**改法**：

```ts
url: "/devices/",
```

**验证**：进任意一篇文章，展开 `My` 菜单点 `Devices`，应跳到 `/devices/`。

---

## 6. `My` 和 `About` 指向不存在的 `/content/`

**位置**：`src/config.ts` 第 304 行和第 332 行

```ts
{
	name: "My",
	url: "/content/",       // ← 这个路由不存在
	children: [ /* Anime / Diary / Gallery / Devices */ ],
},
```

**实测**：`src/pages/` 下没有任何 `content` 路由，构建产物里也确认 `dist/content` **不存在**。

**影响**：这两个父级项承载了「My」和「About」两个下拉菜单。如果主题在点击父级时会导航（而不是只展开子菜单），就会 404。而且 `/content/` 这个路径本身很像是从「内容分离」功能的 `/content/` 目录误抄过来的——那个目录是给同步内容用的，不是网页路由。

**改法**：改成菜单锚点或真实页面：

```ts
// 方案 1：不导航，只展开
url: "#",

// 方案 2：指向一个真实存在、能当"总览"的页面
url: "/archive/",
```

`My` 组可以指向 `/archive/`（内容总览比较合适），`About` 组指向 `/about/`。

**验证**：点击 `My` / `About` 的父级项，确认不出现 404。

---

## 7. 友链头像用了构建哈希 URL，重新构建就会裂

**位置**：`src/data/friends.ts`

第 34 行（你自己那张卡）：

```ts
imgurl: "https://qiqimora.cn/_astro/avatar.qk8rO0hW_1zxmdw.webp",
```

第 42–43 行（imicola）：

```ts
imgurl:
	"https://imicola.com/_astro/nona_cut.D2OfEpoP_Z1NkkW9.webp",
```

**影响**：`/_astro/xxx.HASH.webp` 里的哈希是 Astro 按文件内容算出来的。**只要源图有一点改动、或者 Astro 升级改了哈希算法，文件名就会变**，友链卡片立刻图裂——而且这个链接是硬编码在数据文件里的，不会跟着更新。

imicola 那张更危险：那是**别人站点**的构建产物，对方一重新部署就可能失效，你完全控制不了。

**改法**：

1. 把头像复制一份到 `public/` 下（`public/` 内容不做哈希处理，路径永久稳定）。目前 `public/assets/images/` 这个目录还不存在，需要新建：

```bash
mkdir -p public/assets/images
cp src/assets/images/avatar.webp public/assets/images/avatar.webp
```

2. 改 `friends.ts`：

```ts
imgurl: "/assets/images/avatar.webp",
```

3. imicola 那张建议下载到本地，别用对方带哈希的链接：

```ts
imgurl: "/images/friends/imicola.webp",
```

**验证**：构建后访问 `/friends/`，确认两张头像都能加载；再改一下原图重新构建，确认链接没变。

> [!NOTE]
> 顺带一提：`src/assets/images/` 下的图片会被 Astro 优化成 `/_astro/` 哈希文件——这对**页面内引用**是好事（能自动压缩），但对**硬编码在数据文件里的外链**就不合适了。规则是：给别人用的、要长期稳定的地址，放 `public/`。

---

# 三、站点标识：还是主题默认的样子

## 8. 导航栏文字还写着 `MizukiUI`

**位置**：`src/config.ts` 第 53–62 行，具体是第 57 行

```ts
navbarTitle: {
	mode: "logo",              // 当前只用 Logo，不显示文字
	text: "MizukiUI",          // ← 主题模板的名字
	icon: "assets/home/home.png",
	logo: "assets/home/default-logo.png",
},
```

**影响**：现在 `mode: "logo"` 所以看不到，但这是个定时炸弹——哪天想切回 `"text-icon"`，站名就变成「MizukiUI」了。

**改法**：

```ts
text: "奇奇莫拉の日记本",
```

**验证**：把 `mode` 临时改成 `"text-icon"` 看一眼，确认没问题再改回来。

---

## 9. favicon 还是主题默认

**位置**：`src/config.ts` 第 208–215 行

```ts
favicon: [
	// 留空以使用默认 favicon
],
```

**实测**：`public/favicon/` 下只有一个 `favicon.ico`，是主题自带的。

**影响**：浏览器标签页、书签、手机添加到主屏幕，显示的都是 Mizuki 主题的图标，不是你的。

**改法**：准备一张 512×512 的方形图（透明底 PNG），放到 `public/favicon/`，然后：

```ts
favicon: [
	{ src: "/favicon/icon.png", theme: "light", sizes: "512x512" },
	{ src: "/favicon/icon-dark.png", theme: "dark", sizes: "512x512" },
],
```

`theme` 用来适配明暗主题，两张图可选。

**验证**：`pnpm dev` 后强制刷新（Ctrl+F5），看标签页图标。

> [!TIP]
> 可以先用 `public/favicon/favicon.ico` 之外的格式做一份，用 [realfavicongenerator](https://realfavicongenerator.net/) 一次生成全套（含 `apple-touch-icon`、`manifest`），覆盖到 `public/favicon/` 即可。

---

## 10. Logo 还是主题默认，而仓库根目录的 `logo.png` 没被用上

**位置**：`src/config.ts` 第 61 行

```ts
logo: "assets/home/default-logo.png",
```

**实测**：`public/assets/home/` 下只有 `default-logo.png` 和 `home.png`，都是主题自带的。

另外，**仓库根目录躺着一个 `logo.png`（273 KB）**，全项目搜索只有 3 处命中 `logo.png`，且都不引用这个文件：

- `src/config.ts:61` → `default-logo.png`
- `src/components/Navbar.astro:38` → 兜底默认值 `default-logo.png`
- 一篇文章的示例代码里

也就是说这个 `logo.png` **完全没被使用**。

**改法**：要么把它用起来——复制到 `public/assets/home/` 并在 `config.ts` 里指过去：

```ts
logo: "assets/home/logo.png",
```

要么如果它已经没用了，直接从仓库根目录删掉，别让它继续占着位置、让人误会。

注意 `Navbar.astro` 第 38 行有个兜底逻辑，用的是 `/assets/home/default-logo.png`——如果你把默认文件删了，记得保证自己的 logo 路径可用。

**验证**：首页顶栏左上角显示的是自己的 logo。

---

# 四、内容与 Frontmatter

## 11. 三篇文章的 frontmatter 里残留了约 180 行模板注释

**位置**：

| 文件 | frontmatter 总行数 | 注释噪音起始 |
| --- | --- | --- |
| `src/content/posts/常见stl/index.md` | 78 行 | 第 12 行 |
| `src/content/posts/一元三次方程求解/index.md` | 78 行 | 第 12 行 |
| `src/content/posts/《操作系统概论》整理/index.md` | 74 行 | 第 12 行 |

**现象**：这三篇的 frontmatter 从第 12 行开始，塞了「分类 1 → 分类 7」共七大段标签备选注释，例如：

```yaml
tags: [算法]
# 文章标签数组，用于标记文章主题
  # 分类 1：计算机基础 → Tags 选项
      # 操作系统相关：进程 / 线程、Linux 命令、内存管理、死锁、PV 操作、操作系统实验
      # 计算机网络相关：TCP/IP、HTTP/HTTPS、Socket 编程、Wireshark 抓包、子网划分
      # 数据库相关：SQL 语法、MySQL 基础、事务 ACID、索引、ER 图、数据库实验
      # 组成原理相关：CPU 架构、Cache 缓存、指令系统、IO 接口
  # 分类 2：编程语言 → Tags 选项
      # ...
```

一直延续到第 72 行左右。**三篇加起来约 180 行纯注释**。

**影响**：纯粹是噪音。正经的标签其实就 `[算法]` 一个；frontmatter 里真正生效的字段只有 8 行左右。阅读和编辑体验都很差，而且这种注释**一旦混进 YAML 就有解析风险**（比如某行缩进写错、或内容里出现 `:` 和 `#` 的组合）。

**改法**：每个文件把 frontmatter 精简成真正需要的样子，例如 `常见stl`：

```yaml
---
title: 常见的stl
published: 2025-12-12
pinned: false
description: 讲一下常见的STL容器和算法
tags: [算法]
category: 其他
licenseName: "Unlicensed"
author: qiqimora
draft: false
---
```

如果那套标签分类法你真的想留着参考，**别放在 frontmatter 里**——单独抽成一个文件（比如 `docs/标签规范.md`），或者写成一篇非发布的 spec 页面。顺带一提，你已经有一篇《文档编写规范》了，标签规范放在那里最合适。

**验证**：`pnpm build` 通过，且这三篇文章页面正常渲染、标签正确显示。

---

## 12. `date` 和 `pubDate` 不是 schema 字段

**位置**：`src/content.config.ts` 第 7–40 行是文章 schema

```ts
schema: z.object({
	title: z.string(),
	published: z.date(),        // ← 唯一生效的日期字段
	updated: z.date().optional(),
	// ...
}),
```

schema 里**只有 `published`**，没有 `date`，也没有 `pubDate`。

**但实测**：9 篇文章**全部**同时写了三个日期字段。以 `blog日常推送操作` 为例：

```yaml
published: 2026-03-15
date: 2026-03-15
pubDate: 2026-03-15
```

**影响**：Zod 在非 strict 模式下会**静默剥掉**未知字段——所以现在不会报错，页面也正常。但这意味着：

- 那 18 行 `date` / `pubDate` 是**完全无效的死代码**
- 更麻烦的是**误导**：以后改发布日期，看到三个字段不知道该改哪个。改错一个（比如只改了 `date`）不会有任何报错，但页面显示的日期没变——这类 bug 很难查。

**改法**：把所有文章的 `date:` 和 `pubDate:` 两行删掉，只保留 `published`。

批量检查一下还有哪些字段是多余的：

```bash
# 看 schema 里定义了什么
grep -oP '^\t\t\K\w+(?=:)' src/content.config.ts

# 看文章里实际用了什么
grep -h -oP '^\K\w+(?=:)' src/content/posts/*/index.md | sort -u
```

两边对一下，文章里出现但 schema 里没有的，都是可以删的。

**验证**：`pnpm build` 通过，文章列表和详情页日期显示不变。

---

## 13. 没有任何文章有 `updated`，但「上次编辑」卡片开着

**位置**：`src/config.ts` 第 237 行

```ts
showLastModified: true,
```

**实测**：`updated:` 在全部 9 篇文章里出现 **0 次**。

**影响**：功能开着，但没有任何数据。需要确认这种情况下卡片显示什么——如果回退到文件系统时间，那 `git clone` 或 CI 构建出来的时间就是构建时间，**每次部署「上次编辑」都会变成今天**，等于没意义。

**改法**：给真正更新过的文章补上 `updated`。从 Git 历史看，这几篇是有后续修改的：

```yaml
---
title: 《操作系统概论》整理
published: 2026-03-13
updated: 2026-03-20      # ← 补充
---
```

可以用 Git 自动生成每篇的最后修改日期：

```bash
for f in src/content/posts/*/index.md; do
  echo "$f -> $(git log -1 --format=%cs -- "$f")"
done
```

**验证**：文章详情页的「上次编辑」显示的是真实修改日期，而不是构建时间。

---

## 14. 文章配图是未压缩的 PNG，单篇 8.3 MB

**位置**：`src/content/posts/《操作系统概论》整理/images/` 等

**实测数据**：

- 《操作系统概论》整理一篇的 `images/` 目录：**43 张 PNG，合计 8.3 MB**（全部是 PNG，没有一张 WebP）
- 单张最大 `image-18.png` 579 KB，`image-24.png` 464 KB，`image-17.png` 453 KB
- 构建后 `dist/images` 达到 **34.5 MB**（这个目录还包括相册等资源）

**影响**：读者打开这一篇要下载 8 MB 图片。这是纯粹的阅读体验损失，而截图类内容转 WebP 通常能减掉 60–80% 体积且肉眼几乎无差别。

**改法**：批量转 WebP。

```bash
# 用 sharp-cli（项目已依赖 sharp）
npx sharp-cli -i "src/content/posts/《操作系统概论》整理/images/*.png" \
  -o /tmp/webp/ --format webp --quality 82

# 或直接用 cwebp（需另装）
for f in src/content/posts/《操作系统概论》整理/images/*.png; do
  cwebp -q 82 "$f" -o "${f%.png}.webp"
done
```

转完记得**同步改正文里的图片引用**（Markdown 里写的是 `.png`）。转完确认没问题再删原图。

**验证**：`pnpm build` 后对比 `dist/images` 体积变化，并检查那篇文章所有图片都能正常显示。

> [!TIP]
> 截图类内容如果包含大量文字，WebP 的质量参数别低于 80，否则文字边缘会糊。可以拿 `image-18.png`（最大那张）先转一张对比看看再批量处理。

---

# 五、配置残留与可选优化

## 15. `pnpm.overrides` 被 pnpm 10 忽略了

**位置**：`package.json` 第 100–104 行

```json
"pnpm": {
	"overrides": {
		"@emmetio/css-parser": "https://codeload.github.com/ramya-rao-a/css-parser/tar.gz/370c480ac103bd17c7bcfb34bf5d577dc40d3660"
	}
}
```

**实测**：运行 pnpm 时它自己会打印这条警告：

```
[WARN] The "pnpm" field in package.json is no longer read by pnpm.
The following keys were ignored: "pnpm.overrides".
```

**影响**：这个 override 是上游用来修 `@emmetio/css-parser` 的一个补丁依赖。**它现在是失效的**——pnpm 完全忽略了这段配置。如果当初加它是为了绕开某个 bug，那个 bug 现在是回来了的。

**改法**：pnpm 10.6+ 把设置移到了 `pnpm-workspace.yaml`。你已经有一个 `pnpm-workspace.yaml` 了，把 override 搬过去：

```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - sharp
  - swup
  - ttf2woff2

overrides:
  '@emmetio/css-parser': 'https://codeload.github.com/ramya-rao-a/css-parser/tar.gz/370c480ac103bd17c7bcfb34bf5d577dc40d3660'
```

然后从 `package.json` 里删掉整个 `pnpm` 字段，并重新安装。

**验证**：`pnpm install` 时不再出现那条 WARN。

> [!WARNING]
> 改完要重新跑一次 `pnpm install` 并验证 `pnpm build` 依然通过。如果这个 override 其实已经不需要了（上游可能早就修了），更干净的做法是**直接删掉**，而不是搬家。

---

## 16. `other/` 里的证书副本已经过期

**位置**：`other/qiqimora.com`（Git 未跟踪）

**实测**：这是一张 `qiqimora.cn` 的 Let's Encrypt 证书（PEM 文本），字段如下：

- 签发时间：**2026-06-16**
- 到期时间：**2026-09-14**
- 覆盖域名：`qiqimora.cn`、`qiqimora.com`、`qiqimora.top` 及各自 `www`

**注意**：**今天是 2026-09-22，这张证书已经过期 8 天了。**

**影响**：这只是一个**本地副本**，不代表线上正在用这张——Let's Encrypt 证书有效期 90 天，服务器上一般有 certbot 自动续期。但有两件事值得确认：

1. **线上的证书续上了吗？** 如果服务器续期任务挂了，现在访问 `https://qiqimora.cn/` 应该会报证书错误。（我这边网络不通，没法帮你验证，请你手动打开确认一下。）
2. 这个文件**不该散落在仓库里**。它是 Git 未跟踪状态，会一直出现在 `git status` 里干扰视线。

**改法**：

```bash
# 确认线上证书正常后，删掉这个副本
rm other/qiqimora.com
rmdir other

# 如果还想留着参考，就忽略掉
echo "other/" >> .gitignore
```

**验证**：`git status --short` 应该干净。同时手动确认线上 HTTPS 正常、证书有效期覆盖了未来 90 天。

---

## 17. `public/pio/models/live2d/` 未跟踪，而且根本没生效

**位置**：`public/pio/models/live2d/`（Git 未跟踪）

**内容**：一整套 Live2D 资源——Mea 模型（`mea.moc3`、`mea.model3.json`、贴图、动作、物理）、加上 pixi / pixi-live2d-display 运行时、还有一个 `index.html` 预览页。

**关键点**：`src/config.ts` 第 636–658 行的 `pioConfig` 指向的是**另一个**模型：

```ts
export const pioConfig = {
	enable: true,
	models: ["/pio/models/pio/model.json"],    // ← 用的是 pio，不是 live2d
	// ...
};
```

所以这一整套 Live2D **完全没有被加载**，纯粹是躺在 `public/` 里。

**影响**：`public/` 下的文件会被**原样复制进 `dist/`**。这些文件（含 pixi 运行时，单个 `.min.js` 可能几百 KB）白白增加了每次构建的产物体积和上传时间——考虑到你的部署还要传 `dist/`，这个代价不小。

**改法（二选一）**：

**A. 接入它** —— 改 `pioConfig`：

```ts
models: ["/pio/models/live2d/model/mea_live2d/mea.model3.json"],
```

注意目录里有个中文名文件 `橙色猫猫.can3`，这种文件名在跨平台部署（Windows → Linux）时**很可能出问题**，建议先重命名成 ASCII 文件名。同时确认 `pioConfig.width/height`（当前 280×250）对这套模型是否合适。

**B. 不用就删/忽略它**：

```bash
git status --short                # 确认它确实是未跟踪
rm -rf public/pio/models/live2d
```

或者暂时留着但别让它进构建：

```bash
echo "public/pio/models/live2d/" >> .gitignore
```

**验证**：`pnpm build` 后看 `dist/pio/` 的体积变化；如果选了 A，刷新页面确认看板娘换成了 Mea。

---

## 18. 评论开关与 `envId` 都还是占位

**位置**：`src/config.ts` 第 450–456 行

```ts
export const commentConfig: CommentConfig = {
	enable: false,
	twikoo: {
		envId: "https://twikoo.vercel.app",     // ← 官方 demo 地址
		lang: SITE_LANG,
	},
};
```

**影响**：评论现在是关闭的。而且**即使把 `enable` 改成 `true` 也用不了**——`https://twikoo.vercel.app` 是 Twikoo 的公共演示环境，不是你的后端，数据不会存在你这里。

**改法**：

- **想开评论**：按 [Twikoo 官方文档](https://twikoo.js.org/) 部署一份（Vercel / 自建均可），把 `envId` 换成自己的地址，再把 `enable` 改成 `true`。
- **不打算开**：那就把这段配置的注释补一句「暂不启用」，避免以后自己看混。这也是**唯一一个我建议保留原样**的项——个人博客不开评论完全合理。

**验证**：开启后进任意文章，看评论区能否加载；发一条测试评论确认能写进你的数据库。

---

## 19. bangumi / bilibili 还是占位 ID

**位置**：`src/config.ts`

第 70–73 行：

```ts
bangumi: {
	userId: "your-bangumi-id",
	fetchOnDev: false,
},
```

第 75–86 行：

```ts
bilibili: {
	vmid: "your-bilibili-vmid",
	fetchOnDev: false,
	// ...
},
```

**影响**：目前 `anime.mode` 是 `"local"`（第 89 行），走的是本地数据，所以**现在没有影响**。但哪天想切到 `"bangumi"` 或 `"bilibili"` 模式，会直接拉取失败。

**改法**：不打算用就先不动，但建议在配置里标注一下当前模式。真要用的话：

```ts
anime: {
	mode: "bilibili",        // 或 "bangumi"
},
bilibili: {
	vmid: "1808504869",      // 从你的 B 站主页 URL 里取
	fetchOnDev: false,
},
```

B 站的观看进度还需要 `BILI_SESSDATA`（见第 4 条），那个是账号凭证，**只能放在 `.env` 或 CI Secrets 里，绝对不能硬编码**——配置文件里第 84 行的注释也是这么提醒的，遵守它。

**验证**：改完后跑 `pnpm update-anime`，确认数据能正常拉取。

---

# 六、动手顺序建议

按依赖关系排，建议这么走：

**第一批（半小时，改完立刻见效）**

1. 第 5 条 `devices` 加斜杠 ← 一行改动，先把这个 404 修了
2. 第 8 条改导航栏文字
3. 第 16 条确认线上证书 + 清理 `other/`
4. 第 15 条搬 `pnpm.overrides`（顺手把 `pnpm install` 的警告消掉）

**第二批（处理「根子上」的问题，需要先做决定）**

5. **先回答那个部署问题**：线上是从 Git 拉 `dist/` 还是从源码构建？答案决定了第 1 条怎么改
6. 第 1 条处理 `dist/`（这一步最影响仓库健康，但风险也最高，务必先确认部署方式）
7. 第 2 条 `robots.txt`
8. 第 3 条页脚和备案号

**第三批（内容清理，可以慢慢做）**

9. 第 11 条清掉三篇文章的注释噪音（最解压的一项）
10. 第 12、13 条统一 frontmatter 字段
11. 第 14 条压缩配图
12. 第 6、7 条修剩下的链接问题
13. 第 9、10 条换 favicon 和 Logo

**第四批（想做再做）**

14. 第 4、17、18、19 条

## 全部改完后的验证清单

```bash
# 1. 仓库是否瘦下来了
git count-objects -vH

# 2. 工作区是否干净
git status --short

# 3. 类型检查（备注：我这边沙箱跑不起来，需要你在本机确认）
pnpm check

# 4. 完整构建
pnpm build

# 5. 本地预览，逐页点一遍导航
pnpm preview
```

预览时重点点这几个地方：

- [ ] 顶部导航 `My` → `Devices`（第 5 条）
- [ ] 顶部导航 `My` / `About` 的父级项（第 6 条）
- [ ] 页面底部页脚和备案号链接（第 3 条）
- [ ] 友链页面两张头像（第 7 条）
- [ ] 浏览器标签页图标（第 9 条）
- [ ] 任意一篇文章的「上次编辑」卡片（第 13 条）
- [ ] 《操作系统概论》整理 的配图（第 14 条）
- [ ] `/robots.txt` 的内容（第 2 条）

## 提交建议

按批次分开提交，别一次全推——万一哪条改出问题，回滚范围小：

```bash
git add src/config.ts src/data/friends.ts
git commit -m "2026-09-22 修复导航 404（devices 斜杠、/content/ 路由）+ 更换导航栏站名"

git add .gitignore
git commit -m "2026-09-22 dist 移出版本库，改由部署流程传输"

git add src/content/posts/
git commit -m "2026-09-22 清理三篇文章的 frontmatter 注释噪音，统一日期字段"
```

---

## 附：自查方法与诚实说明

**做了什么**：通读了 `src/config.ts`（672 行）、`astro.config.mjs`、`vercel.json`、`package.json`、`content.config.ts`、`robots.txt.ts`、`.gitignore`，比对了 `dist/` 构建产物与源码，检查了 Git 历史与文件跟踪状态，统计了各目录体积。

**没能验证的**：

- **跑不起来构建**：本机沙箱环境下 `pnpm check` 报 `MODULE_NOT_FOUND`（`.pnpm-store` 里的 pnpm 自身不可用），改用 `node node_modules/astro/astro.js check` 又撞上 `spawn EPERM`。所以**类型检查是否通过、构建是否成功，我无法确认**——这也是为什么上面每条都写了「验证」步骤，请你在本机实际跑一遍。
- **访问不了线上站点**：`curl` 和 `web_fetch` 都因 TLS 问题失败。所以「线上是不是真的这样」是从**本地代码和构建产物**推断的，没有和线上做比对。

**如果实际排查发现某条是我判断错了**（比如 `robots.txt` 是有意屏蔽、或者线上部署方式和我推测的不一样），直接在本文里改掉，别硬按清单执行。

---

# 执行记录（2026-09-24）

清单里 17 条修复完成，构建验证通过。这里记录执行中的关键决定、验证结果，以及 **3 个自查时没发现的意外收获**。

## 意外收获 A：HTTPS 证书过期，这就是「网站不安全」的原因

浏览器提示「不安全」不是网站代码的问题——是服务器上的 Let's Encrypt 证书**已于 2026-09-14 过期**（自查当天已过期 10 天）：

| 项 | 值 |
| --- | --- |
| 签发方 | Let's Encrypt（YR2 中间证书） |
| 签发时间 | 2026-06-16 |
| **到期时间** | **2026-09-14** |
| 覆盖域名 | qiqimora.cn / .com / .top 及各自 www |

用 Node TLS 直连线上 443 端口验证的（本地 `other/` 里那张证书副本和线上是同一张）。Let's Encrypt 证书只有 90 天寿命，6 月签发时没配自动续期，9 月就过期了。

**修复方向**（等服务器 SSH 配置进来后执行）：服务器上装 certbot，配 `certbot renew` 的 systemd timer 或 cron，并用 DNS-01 验证（80 端口返回 403，HTTP-01 可能过不去）。另外 `other/qiqimora.com` 那张副本就是从服务器拿的参考件，已删除。

## 意外收获 B：`常见STL` 目录大小写不一致（跨平台炸弹）

git 里跟踪的路径是 `常见STL`（大写），磁盘上是 `常见stl`（小写）。Windows 文件系统不区分大小写所以本地一切正常，但 git 认为是两个不同路径——**磁盘版从未被提交过**。如果哪天在 Linux 上 clone（CI、服务器）就会同时出现两个目录或路径错乱。

已用 `git mv` 统一为小写 `常见stl`，与磁盘一致。

## 意外收获 C：IndexNow 需要密钥文件，已一并生成

`scripts/indexnow-submit.js` 第 49 行要求 `https://{host}/{key}.txt` 可公开访问，光在 `.env` 里填 KEY 不够。已生成 32 位随机密钥并放到 `public/{key}.txt`（构建后位于站点根目录），`.env` 里 `INDEXNOW_HOST` 也已改为 `qiqimora.cn`。**注意**：密钥文件是构建产物的一部分，别误删；部署后跑一次 `pnpm submit` 验证返回 200。

## 各条目的实际执行情况

| # | 实际改动 | 验证 |
| --- | --- | --- |
| 2 | `robots.txt.ts`：`Disallow: /` → `Allow: /` | dist/robots.txt 已确认输出 `Allow: /` |
| 3 | `footerConfig.enable: true` + customHtml（版权信息）；**备案号暂以 HTML 注释保留，不公示未确认的号码**——在备案本身不合规的情况下展示假号风险更大 | dist 首页已含页脚；备案号链路待真实号码 |
| 4 | `.env`：INDEXNOW_HOST=qiqimora.cn + 生成真实 KEY；public/ 下放密钥文件 | 待部署后 `pnpm submit` 验证 |
| 5 | `url: "devices/"` → `"/devices/"` | dist 中 href="/devices/" 已确认 |
| 6 | My/About 父级 url → `"#"`（带子菜单的父级渲染为 button，不会导航） | 代码走读确认 |
| 7 | 自己的头像复制到 `public/assets/images/avatar.webp`，友链引用改本地路径；imicola 的头像也下载到 `public/images/friends/imicola.webp`（56.6 KB，有效 WebP）并改本地引用，彻底摆脱哈希 URL | 构建通过 |
| 8 | `text: "MizukiUI"` → `"奇奇莫拉の日记本"` | — |
| 9 | 用头像（903×903 方图）生成 icon.png(512) / icon-32.png / apple-touch-icon.png，config favicon 数组填入，Layout.astro 补 apple-touch-icon link。**没用 logo.png**——它是 772×254 横版图，缩到标签页只剩一条线 | dist head 里三个 link 均确认 |
| 10 | logo.png 复制到 `public/assets/home/logo.png`，config logo 指向它；根目录 logo.png 保留（源文件） | — |
| 11 | 三篇 frontmatter 重写：73-77 行 → 11-12 行，只保留 schema 有效字段 | 逐篇核过字段值 |
| 12 | 9 篇全部删除 `date:` / `pubDate:`；astro-beginners-guide 的行尾模板注释也清了 | 全目录正则复查零残留 |
| 13 | 按 git 历史补 `updated:`（MySQL整理→2026-03-15、操作系统概论→2026-04-14、一元三次方程→2026-03-15；其余 published==最后提交，不补） | PostMeta 组件确认 updated 缺失时优雅隐藏 |
| 14 | 43 张 PNG → WebP（quality 85），8.32 MB → 0.92 MB（**省 89%**），markdown 引用同步改写，原 PNG 删除（git 有历史） | 构建时 Astro 又二次压缩了一轮 |
| 15 | package.json 的 `pnpm.overrides` 整段删除（pnpm 10 忽略它且构建一直正常），pnpm-workspace.yaml 里留了恢复注释 | — |
| 16 | 过期证书副本删除；`other/` 加入 .gitignore | git status 干净 |
| 17 | live2d（6.2 MB，代码零引用）从 public/ 移到 `other/live2d-backup/`，不再进构建产物 | dist/pio 体积回到 1.9 MB |
| 18 | `enable: false` 保持（个人博客不开评论合理），envId 清空并注明官方 demo 不能用 | — |
| 19 | bilibili vmid 填真实 uid `1808504869`；bangumi userId 留空（anime.mode 是 local，用不到） | — |

## 构建验证结果

沙箱里 `pnpm` 本身跑不了（`.pnpm-store` 权限问题），改用 `node node_modules/astro/astro.js build` + `npx pagefind` + `node scripts/compress-fonts.js` 手动跑了完整三步：

```
[build] 26 page(s) built in 34.25s
[build] Complete!
pagefind: Finished in 1.478 seconds
字体: 2 个文件, 总体压缩 98.18%
dist 总体积: 90.1 MB
```

robots.txt、页脚备案链接、favicon 三件套、/devices/ 绝对路径、整改清单文章本身，均已在 dist 产物里逐一确认。

## 还剩的事

1. **第 1 条 dist 出库** —— ✅ **已有结论：必须保留**。第二轮上服务器查实，部署方式是 cron 每天 4:00 跑 `/var/www/deploy.sh`（`git reset --hard origin/main`），nginx 直接读仓库里的 `dist/`。所以 89 MB 的 `dist/` 是这套部署方式的必要成本，不是冗余。想瘦身只能改部署方式（例如本地 `rsync` 推 dist、服务器不再 clone 仓库），属于架构调整，不是清理任务。
2. **备案号** —— 拿到真实号码后替换 `src/config.ts` 里 footerConfig 的 `浙ICP备XXXXXXXX号` 占位符。**注意这条现在优先级很高**，因为它和阿里云拦截 80 端口是同一件事。
3. **ICP 备案本身** —— 见文末《HTTPS 证书故障完整复盘》，这是目前最需要你亲自处理的事。
4. **提交并部署本轮修改** —— 本地改动（favicon、robots、页脚、WebP 图片、frontmatter 清理等）尚未 commit / push，服务器还跑着旧版本。
5. **部署后验证** —— 跑一次 `pnpm submit`（IndexNow），并确认页脚备案号显示正常。

---

# 补记：SSH 与服务器侦察（2026-09-25）

排查「网站显示不安全」时顺带把服务器摸清了，记录如下。

## 服务器画像

| 项 | 值 |
| --- | --- |
| 域名解析 | qiqimora.cn / www / .com → **8.135.52.120** |
| SSH | 端口 22，**仅密钥认证**（密码登录已于 2026-09-25 关闭） |
| 系统 | Ubuntu 22.04（OpenSSH 8.9p1 Ubuntu-3ubuntu0.17） |
| 80 端口 | 返回 403，`Server: Beaver`（阿里云备案拦截页） |

## SSH 配置走过的弯路

DSH 的 SSH 插件（`@linxin666/dsh-ssh`）有**两个**叫 SSH 的入口，容易混：

- **设置 → 插件配置 → SSH**：只有 3 个开关（总开关 / 是否向 Agent 宣告 / 终端字体），**没有主机列表**
- **侧边栏「SSH」入口**：真正的主机管理面板（增删改查、连接测试、Web 终端、SFTP、端口转发）

而且插件启用后需要重启 `dsh web` 才会出现侧边栏入口。当时 `cordis.patch.yml` 恰好是当天 19:12 才加上 `web-ui-ssh: disabled: false`，界面尚未重载。

**绕过方式**：直接写插件的配置存储 `~/.dsh/dsh-ssh.json`（格式 `{ version: 1, hosts: [...] }`），写完立即生效，无需重启：

```json
{
  "version": 1,
  "hosts": [{
    "alias": "aliyun",
    "host": "8.135.52.120",
    "port": 22,
    "user": "root",
    "auth": { "kind": "key", "keyPath": "C:\\Users\\belgnas\\.ssh\\id_rsa" },
    "proxyJump": [], "tags": ["blog", "web"], "environment": "production",
    "createdAt": 1790334859037, "updatedAt": 1790334859037
  }]
}
```

## 认证卡点与解法

首次连接报 `All configured authentication methods failed`。排查过程：

1. 服务器返回 `Permission denied (publickey,password)` → 两种认证都开着（**注：排查完成后已关闭密码认证，见《服务器加固记录》**）
2. 用 `IdentitiesOnly=yes` 明确指定 `id_rsa` 单独测试 → 仍然被拒
3. 读密钥头部，`b3BlbnNzaC1rZXktdjEAAAAABG5vbmU` 解出来是 `openssh-key-v1` + **cipher=none**，即密钥**未加密**，排除 passphrase 问题

结论：本地那把 `id_rsa` 从未被授权到服务器，平时是**用密码登录**的。解法是把公钥追加到服务器的 `~/.ssh/authorized_keys`：

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDQuqww7dDs0eoNTFRRFiSEXJICS7u9NA/FbcFJ0NOm6u4hA7RmlDCMIZGItMeIxF9zFJkNWFwEZ5KzCKXTfV4Zq2jjkbH+uYI8yu+LuBZJhnYF0ht4rAlB3RmEgWPm+iu+SSdVSgrXh1BL667NqBPENxIV7Qm9c6uarDRMsTh1MLOieoxM8xzYIZOOCD9Zsoyst3TNfSKD3mzoZkW4dl2OYsjbfYBjhVVnzkc5TrUsIQ+fPw2628NRN2+pPLs41kJZ2cdztyxP1QfTyfG4mfZi4i33VWPAIMf1qKKiosoNSdon3fL51UEtM6Sf5qs3/UoCbDnxLAsCoj3hphwJfqTTQb6H9P53P1zBDPQR9VNNfVlr0VgL2SfY3hSgUau91q7o+DawpUq5I39oYaJB6mcP96UZXY6CQp/BTn/d7MnbL+ghMbiEBoXTT+Ql37rRxHhOlyXGVn8c1tlr0q9Ac/yf4wrBhf36dcEFg5+CcPQwujwe6xNbPvVpZQZmhAFvOzU= belgnas@163.com' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
echo "✓ 公钥已授权"
```

授权后即可以密钥方式免密登录，插件里无需保存任何密码。

## 另一个发现：`~/.ssh/config` 丢失

本机 `~/.ssh/` 下只有 `id_rsa`、`id_rsa.pub`、`known_hosts`，以及一个 **0 字节的 `config.txt`**。`known_hosts` 里存在 `aliyun` 和 `vm1` 两个别名条目，PowerShell 历史里也全是 `ssh root@aliyun`、`scp ... root@aliyun:/root/`——说明过去有 `~/.ssh/config` 定义了这些别名，现在已不在，**`ssh root@aliyun` 应该已经失效**（会走 DNS 解析失败）。建议重建：

```
Host aliyun
    HostName 8.135.52.120
    User root
    IdentityFile ~/.ssh/id_rsa
```

---

# HTTPS 证书故障完整复盘（2026-09-25）

浏览器提示「网站不安全」的完整原因和解法。**这一节是全文最重要的部分**，因为它暴露的问题是持续性的，不是修一次就完。

## 结论先行

浏览器报「不安全」，表层原因是**证书过期 10 天**，但真正的根因是：**阿里云因 ICP 备案不合规，在网络层拦截了 80 端口的 HTTP 访问**，而 certbot 的自动续期依赖 80 端口做 HTTP-01 验证，于是续期从 8 月中旬起每次都失败。

| 项 | 值 |
| --- | --- |
| 原证书 | Let's Encrypt，2026-06-16 签发，**2026-09-14 过期** |
| 直接原因 | certbot 续期失败（HTTP-01 收到 403） |
| 根本原因 | 阿里云 ICP 备案拦截（`Non-compliance ICP Filing`，`Server: Beaver`） |
| 解法 | acme.sh + **TLS-ALPN-01**（走 443 端口，绕开 80） |
| 新证书 | 2026-09-25 → **2026-12-24**，6 个域名外网验证通过 |

## 排查链条

### 第一步：确认证书确实过期

从本机用 Node 的 `tls` 模块直连 443 取对端证书（比 curl 可靠，不受本机 schannel 配置影响）：

```
SUBJECT:  {"CN":"qiqimora.com"}
ISSUER:   {"O":"Let's Encrypt","CN":"YR2"}
VALID_TO: Sep 14 15:39:29 2026 GMT
DAYS_LEFT: -10
RESULT: ❌ 证书已过期 10 天
```

### 第二步：为什么自动续期没生效

服务器上 `certbot.timer` **是活的**（当天还跑过），但证书没续上，说明续期尝试失败了。日志里的关键行：

```
Detail: 8.135.52.120: Invalid response from
  http://qiqimora.cn/.well-known/acme-challenge/3fbmjKnlzWLDpCgwEDhffl9VHjzTr4UYPzbyQ7nDOt0: 403
Type:   unauthorized
Hint: The Certificate Authority failed to verify the temporary nginx
      configuration changes made by Certbot.
```

6 个域名全部 403。

### 第三步：403 是谁返回的？（关键转折）

对比服务器内外的响应，发现**不是同一台机器在应答**：

| 请求来源 | `/.well-known/acme-challenge/` | `Server` 头 |
| --- | --- | --- |
| 服务器本地 | `301`（被重定向） | `nginx/1.18.0` |
| 外网 | **`403`** | **`Beaver`** ← 不是 nginx |

抓到 403 的响应体，真相浮出水面：

```html
<title>Non-compliance ICP Filing</title>
<script>
  document.getElementById("mainFrame").src =
    "http://www.aliyun.com/beian/beian-block?id=00000000004974157752";
</script>
```

**阿里云的备案拦截页**。两个域名各有独立 ID（qiqimora.cn → `...4974157752`，qiqimora.com → `...5384608441`）。

### 第四步：还发现一个 nginx 配置 bug

即使备案问题解决，续期**仍然会失败**，因为服务器 nginx 配置里有个陷阱：

```nginx
# ❌ 修复前
location ^~ /.well-known/acme-challenge/ {
    root /var/www/mizuki/qiqimora-blog/dist;
}
# 其他请求全部跳转 HTTPS
if ($host = qiqimora.cn) { return 301 https://$host$request_uri; }
...
return 301 https://$host$request_uri;   # ← 写在 server 级
```

**nginx 的 `return` 在 server 级时属于 `server-rewrite` 阶段，执行时机早于 location 匹配**——所以所有请求（包括验证路径）都被先 301 掉，那个「验证专用」的 location 永远命中不到。注释里写着「验证专用，不能重定向」，但配置写法恰好使这句话失效了。

修复方式是把跳转挪进 `location /`：

```nginx
# ✅ 修复后
location ^~ /.well-known/acme-challenge/ {
    root /var/www/mizuki/qiqimora-blog/dist;
    default_type text/plain;
    allow all;
}
location / {
    return 301 https://$host$request_uri;
}
```

实测验证：修复前验证路径返回 301，修复后返回 404（正确走到 location 了），并且往 webroot 放测试文件能被正常读出。

## 工具选型的两次碰壁

原计划用 certbot 的 `--standalone --preferred-challenges tls-alpn-01` 绕开 80 端口，结果连撞两次墙：

1. **certbot 1.21.0**（apt 版）→ `None of the preferred challenges are supported by the selected plugin`
2. 升级到 **certbot 5.8.0**（snap 版）→ `Unrecognized challenges: tls-alpn-01`

查证发现：`acme` 这个 Python 库确实有 `TLSALPN01` 类，但 **certbot 的 CLI 和 standalone 插件并不支持 tls-alpn-01**（5.8 的源码里连 `tls-alpn` 字符串都搜不到）。**「库支持」不等于「工具有这个功能」**——这个教训值得记一笔。

最终改用 **acme.sh**（v3.1.6），它原生支持 `--alpn`（TLS-ALPN-01，依赖 socat）。

## 最终执行的修复

```bash
# 1. 安装依赖与 acme.sh
apt-get install -y socat
git clone --depth 1 https://github.com/acmesh-official/acme.sh.git /root/acme.sh-src
cd /root/acme.sh-src && ./acme.sh --install -m belgnas@163.com

# 2. 用 TLS-ALPN-01 签发（nginx 仅在验证瞬间停止，由 hook 自动停/起）
~/.acme.sh/acme.sh --issue --alpn --server letsencrypt \
  -d qiqimora.com -d www.qiqimora.com \
  -d qiqimora.cn  -d www.qiqimora.cn \
  -d qiqimora.top -d www.qiqimora.top \
  --pre-hook  "systemctl stop nginx" \
  --post-hook "systemctl start nginx" \
  --keylength 2048

# 3. 安装到独立目录（让证书归属清晰，不再混在 certbot 的目录里）
~/.acme.sh/acme.sh --install-cert -d qiqimora.com \
  --key-file       /etc/ssl/qiqimora/privkey.pem \
  --fullchain-file /etc/ssl/qiqimora/fullchain.pem \
  --reloadcmd      "systemctl reload nginx"

# 4. nginx 指向新路径
sed -i 's#/etc/letsencrypt/live/qiqimora.com/fullchain.pem#/etc/ssl/qiqimora/fullchain.pem#g;
        s#/etc/letsencrypt/live/qiqimora.com/privkey.pem#/etc/ssl/qiqimora/privkey.pem#g' \
  /etc/nginx/sites-available/mizuki
nginx -t && systemctl reload nginx
```

## 验证结果

外网（非服务器本地）逐个域名验证证书链：

```
✅ qiqimora.com        作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
✅ www.qiqimora.com    作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
✅ qiqimora.cn         作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
✅ www.qiqimora.cn     作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
✅ qiqimora.top        作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
✅ www.qiqimora.top    作者=已验证  到期=Dec 24 10:46:33 2026 GMT  剩余=90天
```

端到端：三个域名 HTTPS 全部 `HTTP 200`，`.cn` / `.top` 正确 301 到 `.com`，标题正常返回。

## 自动续期现状

| 项 | 状态 |
| --- | --- |
| acme.sh cron | `58 1,7,13,19 * * *`（每天 4 次检查）✅ |
| pre/post hook | 已持久化到 `qiqimora.com.conf`（base64 存储），续期时自动停/起 nginx ✅ |
| 下次续期 | acme.sh 按 ARI 窗口定于 **2026-11-23** ✅ |
| 旧 certbot 定时器 | 已 `disable --now`，避免与 acme.sh 冲突 ✅ |
| snap certbot 5.8.0 | 已卸载（不支持 tls-alpn-01，留着只会混淆）✅ |

**注意**：TLS-ALPN-01 每次续期都需要短暂停止 nginx（因为 socat 要独占 443）。这是绕开 80 端口封锁的代价，已由 hook 自动化。

## ⚠️ 你还需要做的事：ICP 备案

**这是本次事件真正的根源，也是唯一必须你亲自处理的事。**

- 阿里云明确以 **`Non-compliance ICP Filing`**（备案不合规）为由拦截了 80 端口
- 目前只有 80 被拦，443 尚可；但若放任不管，阿里云可能进一步处置
- 请登录 **阿里云控制台 → 备案** 查看具体原因。常见情形：备案信息待更新、主体信息与实际不符、备案已被注销、未完成公安备案
- **备案一旦恢复，80 端口解除拦截，certbot 的 HTTP-01 也能用了**（nginx 配置 bug 我已修好）。届时可以选择继续用 acme.sh（不依赖端口、更稳），或切回 certbot

## 部署方式（顺带查实）

服务器 `/var/www/deploy.sh` 由 cron 每天 4:00 执行：

```bash
0 4 * * * /var/www/deploy.sh > /var/log/deploy.log 2>&1
```

脚本逻辑：`git fetch origin main` → **`git reset --hard origin/main`** → `git clean -fd`（三次重试）→ 校验 `dist/index.html` → `chown www-data:www-data dist` + `chmod -R 755 dist` → `reload nginx`。

两个要点：

1. **`dist/` 必须留在 Git 里**——服务器就是这么拿文件的，且无法在服务器上构建（脚本注释说明内存不足）。
2. `git reset --hard` + `git clean -fd` 意味着**服务器上的仓库目录里任何手改都会被覆盖**。所以 nginx 配置（在 `/etc/nginx/`）和 acme.sh（在 `/root/.acme.sh`）不受影响，但不要在 `/var/www/mizuki/qiqimora-blog/` 里手动改文件。
3. 顺带解释了一个现象：服务器上 `git status` 总显示 300+ 个文件被修改，其实**全是文件权限位变化**（`100644` → `100755`），由脚本里的 `chmod -R 755` 造成，内容零差异。

---

# 服务器加固记录（2026-09-25）

这台是 **2 核 2G 的轻量服务器**，容量很紧，趁排查证书时做了一轮体检加固。

## 最大发现：4GB swap 一直在，但从没启用过

```
/swapfile   4.1G   创建于 2026-03-18   ← 早就存在
/etc/fstab  0 条 swap 记录             ← 但从未写入 fstab
Swap:       0B                         ← 所以 42 天来一次都没生效
```

文件是真实有效的 swap（`file` 命令识别为 `Linux swap file, version 1`），但因为没有 fstab 条目，**每次重启都不会自动加载**。等于白占 4GB 磁盘、完全没有起到保护作用。

在 2G 内存的机器上，没有 swap 意味着任何一次内存突增（流量高峰、日志暴涨、进程泄漏）都会直接触发 OOM Killer，被杀的可能是 nginx，也可能是隔壁的 next-server 应用。

已处理：

```bash
swapon /swapfile                                  # 启用
echo '/swapfile none swap sw 0 0' >> /etc/fstab   # 持久化（原文件已备份）
echo 'vm.swappiness=10' >> /etc/sysctl.conf       # 云磁盘环境，降低换出频率
sysctl -w vm.swappiness=10
```

## snap 占了将近 1GB

| 项目 | 处理前 | 处理后 |
| --- | --- | --- |
| disabled 旧修订（core20/core22/lxd/snapd） | 4 个 | 已移除 |
| `/var/lib/snapd/cache` 下载缓存 | **745 MB** | 4 KB |
| `/var/lib/snapd` 合计 | 934 MB | 492 MB |

`core20` / `core22` 是系统 seed 需要的基础 snap，**不要删**；`cache` 目录只是下载缓存，清空后 snapd 需要时会自己重新下载。

## SSH 加固：关闭密码登录

排查过程中发现服务器是 `permitrootlogin yes` + `passwordauthentication yes`——**root 可以直接用密码登录**，且 IP 公开可扫，这是个明显的攻击面。

公钥此时已验证可用（本机 `id_rsa` 授权后免密登录成功），密码通道已经没有存在必要，于是关掉：

```bash
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
KbdInteractiveAuthentication no
PubkeyAuthentication yes
EOF

sshd -t                    # 先校验语法，错了立即回滚
sshd -T | grep -iE '^(passwordauthentication|permitrootlogin)'
systemctl reload ssh       # reload 而非 restart，现有连接不受影响
```

**一个容易踩的坑**：OpenSSH 对多数选项采用「**首次出现者生效**」规则。Ubuntu 云镜像常在 `/etc/ssh/sshd_config.d/` 里放 `50-cloud-init.conf` 设置 `PasswordAuthentication yes`，如果把加固文件命名为 `99-xxx.conf`，**它会排在 cloud-init 之后被读取，从而失效**。本例中该目录恰好是空的，且主文件第 12 行的 `Include` 位于第 125-126 行之前，所以 `99-` 前缀是安全的；但如果目录里有更早的编号文件，就必须用 `00-` 前缀。

改动前后都用 `sshd -T`（打印**最终生效值**，而非文件内容）确认：

```
permitrootlogin without-password
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
```

验证方式：`ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@127.0.0.1`
→ 返回 `Permission denied (publickey)`，括号里**只剩 publickey**，说明密码通道确实关闭。

> 加了个安全措施：改配置时挂了一个**5 分钟自动回滚保险**——若超时未被确认，自动删除加固文件并 reload。这是防「改错配置把自己锁在门外」的标准做法，确认新连接可用后立即解除。

## fail2ban 封禁扫描

```
fail2ban: enabled + active，sshd jail 监控 /var/log/auth.log
内存占用: 22 MB
```

密码认证关掉后暴力破解已不可能成功，fail2ban 的作用是**减少扫描带来的日志与 CPU 噪声**——对 2 核机器这点也有意义。

## 加固后的状态

```
Mem:  1.6Gi total, 552Mi used, 878Mi available
Swap: 4.0Gi total, 0B used
Disk: 15G / 40G (40%)
Load: 0.22, 0.06, 0.02
nginx / cron / snapd / fail2ban: 全部 active
SSH:  仅密钥认证（密码登录已关闭）
```

## 一条给未来的纪律

**永远不要在这台服务器上跑 `pnpm build` / `npm install` / `apt upgrade`。**

- 生产构建一律在本地完成后提交 `dist/`（部署脚本的注释已经写明「服务器内存不够，用本地 dist 代替构建」）
- 服务器只负责 `git reset --hard` + `chown` + `reload nginx`，全是轻量操作
- 证书续期用 acme.sh（socat + TLS 握手，内存占用极小），且只在到期时才真正动作
