---
title: blog日常推送操作
published: 2026-03-15
updated: 2026-09-25
pinned: false
description: 从本地写完文章到线上生效的完整流程。核心是「服务器不构建」，所以本地必须 pnpm build 并把 dist/ 一起提交，否则文章永远上不了线。
tags: [指令, 维护]
category: 其他
licenseName: "Unlicensed"
author: qiqimora
draft: false
---

# 博客日常推送操作

> [!IMPORTANT]
> **和普通 Astro 博客最大的区别：服务器不构建。**
>
> 服务器只有 2 核 2G，跑不动 `astro build`。所以必须**在本地构建好，并把生成的 `dist/` 一起提交**——服务器只负责 `git pull` 下来直接用。
>
> 漏掉 `pnpm build` 的后果：文章进了仓库，但网站上**看不到**，而且**不会有任何报错**。

## 完整流程

```
① 写文章 → ② pnpm build → ③ commit（含 dist/）→ ④ push
                                                    ↓
                    ┌───────────────────────────────┴──────────────┐
                    │                                              │
          ⑤ 等凌晨 4:00 自动部署                    手动跑 deploy.sh（立刻生效）
                    └───────────────────┬──────────────────────────┘
                                        ↓
                        ⑥ 服务器 git reset --hard origin/main
                                        ↓
                          ⑦ chown + chmod + nginx reload → 上线
```

## 直接复制的版本

```bash
# 1. 施工前先同步，避免冲突
git pull origin main

# 2. 写文章（二选一）
pnpm new-post 我的新文章        # 生成 src/content/posts/我的新文章.md
#   要配图就手动建目录：src/content/posts/我的新文章/index.md + images/

# 3. 本地预览
pnpm dev                        # http://localhost:4321

# 4. 构建 ← 这一步千万不能忘
pnpm build

# 5. 提交（必须包含 dist/）
git add -A
git commit -m "2026-09-25 写了《XXX》+ 更新了YYY"

# 6. 推送
git push origin main

# 7. 想立刻生效（不等凌晨 4 点）
ssh root@8.135.52.120 '/var/www/deploy.sh'

# 8.（可选）把新页面提交给搜索引擎
pnpm submit
```

## 各步骤在做什么

### `pnpm build` 实际执行 4 件事

| 顺序 | 命令 | 作用 |
| --- | --- | --- |
| 1 | `node scripts/update-anime.mjs` | 更新番剧数据 |
| 2 | `astro build` | 生成 `dist/`（当前 26 页） |
| 3 | `pagefind --site dist` | 生成站内搜索索引 |
| 4 | `node scripts/compress-fonts.js` | 中文字体子集压缩（省约 98%） |

### 服务器自动部署（`/var/www/deploy.sh`）

由 cron 每天**凌晨 4:00** 触发：

```bash
git fetch origin main && git reset --hard origin/main && git clean -fd   # 最多重试 3 次
[ -f dist/index.html ] || 报错退出                                        # 校验产物存在
chown -R www-data:www-data dist && chmod -R 755 dist                     # 修权限
systemctl reload nginx                                                    # 生效
```

想看部署日志：`tail -f /var/log/deploy.log`

## 必须知道的 5 个坑

### 1. 忘了 `pnpm build` → 线上静默不变

**最容易踩的一个。** 部署脚本只检查 `dist/index.html` **是否存在**——它在，所以不报警；但如果 `dist/` 是旧的，服务器照样发布旧页面，**没有任何提示**。

**自查方法**：`git status` 时，如果你刚写完文章却只有 `src/` 有变化、`dist/` 没动静 → 说明忘了构建。

### 2. 不要在服务器上构建

`astro build` 在这台 2G 机器上会吃掉大量内存，可能触发 OOM，把其他服务（比如 next-server）一起杀掉。

所以 `dist/` 进版本库是**有意设计**，不是失误，别去「优化」掉它。

### 3. 服务器上的仓库目录是只读镜像

部署脚本的 `git reset --hard` + `git clean -fd` 会抹掉任何手动改动：

- ✅ 可以改：`/etc/nginx/`、`/root/.acme.sh/`（这些在仓库之外）
- ❌ 不要改：`/var/www/mizuki/qiqimora-blog/` 里的文件（下次部署就没了）

### 4. frontmatter 只认 `published`

文章 schema 里日期的唯一有效字段是 `published`。写 `date` 或 `pubDate` 会被**静默丢弃**——不报错，但也永远不生效。

```yaml
---
title: 文章标题
published: 2026-09-25      # 发布/创建日期（唯一有效的日期字段）
updated: 2026-09-25        # 可选，改过文章才写，会显示在「上次编辑」卡片
description: 一句话摘要
tags: [标签1, 标签2]
category: 分类
---

# 其他可选字段：
# pinned: true            置顶
# draft: true             草稿（true 不发布）
# image: /path/to/img     封面图
# lang: zh_CN             语言
# encrypted: true         加密文章
# password: "xxx"         加密密码
# alias: 别名
# permalink: 自定义链接
```

### 5. 路径规范

| 事项 | 规则 |
| --- | --- |
| 文章目录名 | 大小写要稳定。曾出现 `常见STL` 与 `常见stl` 不一致——Windows 无感，但 Linux 服务器会出错，已统一为小写 |
| 文章配图 | 放在文章目录下的 `images/`，正文用 `./images/图片名` 引用 |
| 需要长期稳定的资源 | 放 `public/`（如友链头像）。`src/assets/` 下的图片会被 Astro 打上哈希（`/_astro/xxx.HASH.webp`），硬编码进数据文件后，重新构建就会失效 |

## 出问题了怎么查

| 现象 | 大概率原因 | 处理 |
| --- | --- | --- |
| 文章在仓库里但网站上没有 | 忘了 `pnpm build`，或忘了提交 `dist/` | 补跑 `pnpm build`，重新提交推送 |
| 推了但要等到明天才变 | 自动部署是凌晨 4:00 | 手动跑 `ssh root@8.135.52.120 '/var/www/deploy.sh'` |
| `git push` 报 TLS 或认证错误 | 本机 schannel 或凭据问题 | 换 OpenSSL 后端试：`git -c http.sslBackend=openssl push origin main` |
| 部署日志显示 dist/index.html 未找到 | 真的没构建 | 本地 `pnpm build` 后重新提交推送 |
| 浏览器提示「不安全」 | 证书问题 | 证书由 acme.sh 自动续期（下次 2026-11-23）。排查思路见《博客整改清单》里的 HTTPS 复盘 |

## 一页速查

```bash
git pull origin main                          # 同步
pnpm new-post 文章名                           # 建文章
pnpm dev                                      # 预览
pnpm build                                    # ★ 构建（产出 dist/）
git add -A && git commit -m "2026-09-25 描述"  # 提交（含 dist）
git push origin main                          # 推送
ssh root@8.135.52.120 '/var/www/deploy.sh'    # 立刻部署（可选）
pnpm submit                                   # 通知搜索引擎（可选）
```

**服务器信息**：`8.135.52.120`（Ubuntu 22.04，仅密钥登录）· 网站根目录 `/var/www/mizuki/qiqimora-blog/dist` · 自动部署：每天 04:00
