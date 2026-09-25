---
title: 服务器架构说明（端口、子域名与三个应用）
published: 2026-09-26
pinned: false
description: 把这台阿里云 ECS 上跑的三个应用、端口分配、nginx 分发逻辑、以及「安全组 vs 回环」这个容易搞混的概念整理清楚，方便日后排查。
tags: [服务器, 运维, 维护]
category: 其他
licenseName: "Unlicensed"
author: qiqimora
draft: false
---

# 服务器架构说明

> [!NOTE]
> 本文是给自己回看的运维笔记。记录这台阿里云 ECS 上到底跑着什么、请求是怎么流转的、以及哪些操作必须在阿里云控制台做。

## 一句话概括

**所有服务都收在 `443` 后面，按子域名分发。nginx 是唯一的对外入口。**

```
https://qiqimora.com        → 博客
https://plan.qiqimora.com   → plan 应用（计划表）
```

---

## 服务器上跑着什么

**阿里云 ECS · Ubuntu 22.04.5 · 2 核 2G · 40G 磁盘**

| # | 应用 | 类型 | 有没有常驻进程 | 监听端口 |
| --- | --- | --- | --- | --- |
| 1 | **博客** | Astro 静态站 | ❌ **没有** | 无（借用 nginx 的 80/443） |
| 2 | **plan 应用** | Next.js 16 standalone | ✅ Node（PM2 守护） | 3000 |
| 3 | **Syncthing** | Docker 容器 | ✅ 容器进程 | 8384 / 22000 / 21027 |

### 关键区别：静态 vs 动态

这是最容易搞混的一点：

- **博客是「静态文件」，没有进程。** 它就是 `/var/www/mizuki/qiqimora-blog/dist/` 下的一堆 HTML/CSS/JS/图片。nginx 收到请求，**直接从磁盘读文件返回**。你在 `ps` 里搜不到任何「博客进程」。
- **plan 应用是「动态程序」，必须有进程。** 它是个 Node 服务，得一直跑着才能响应请求。由 PM2 守护（进程名 `app-plan-next16-live`）。
- **Syncthing 也是动态程序**，跑在 Docker 容器里。

所以：**博客不需要端口，plan 和 Syncthing 需要。**

---

## 端口 = 服务器上的「房门号」

服务器对外只有这几个门：

| 端口 | 谁在守 | 用途 |
| --- | --- | --- |
| **443** | nginx | HTTPS 标准入口（**主入口**） |
| **80** | nginx | HTTP 标准入口（**被阿里云备案拦截**） |
| **22** | sshd | SSH 登录（仅密钥） |
| **3000** | next-server | plan 应用直连（绕过 nginx） |
| **8384** | docker-proxy | Syncthing Web UI（绕过 nginx） |
| **22000** | docker-proxy | Syncthing 同步协议 |
| 53 | systemd-resolve | 本机 DNS（只监听 127.0.0.1） |

---

## 完整结构图

```
                    互联网 / 各种设备
                            │
      ┌──────────┬──────────┼──────────┬───────────┐
      │          │          │          │           │
   :443       :80        :3000      :8384       :22
  (HTTPS)    (HTTP)    (自定义)   (自定义)     (SSH)
      │          │          │          │           │
      └────┬─────┘          │          │           ↓
           ↓                │          │        SSH 登录
    ┌─────────────┐         │          │
    │   nginx     │         │          │
    │ （统一入口） │         │          │
    └──────┬──────┘         │          │
           │                │          │
   按域名分发 │              │          │   ← 侧门：绕过 nginx
     ┌─────┴─────┐          │          │
     ↓           ↓          ↓          ↓
qiqimora.com  plan.qiqimora.com      plan 应用   Syncthing
     │           │        （同一个）    （Docker）
     ↓           ↓
 读 dist/     转发到 :3000
 （博客）      （plan 应用）
```

---

## 四个访问场景的实际链路

| 浏览器输入 | 实际链路 |
| --- | --- |
| `https://qiqimora.com/posts/xxx` | 连 443 → nginx 识别域名 → **自己读磁盘** `dist/posts/xxx` → 返回文件 |
| `https://plan.qiqimora.com/xxx` | 连 443 → nginx 识别域名 → **转发给 `127.0.0.1:3000`** → Node 处理 |
| `http://8.135.52.120:3000/xxx` | **直连 3000** → Node 处理（nginx 完全不知情） |
| `http://8.135.52.120:8384/xxx` | **直连 8384** → Syncthing 处理（nginx 完全不知情） |

---

## 重要概念：安全组 vs 回环

这两个概念混起来会造成严重误判，单独讲。

### 阿里云安全组是什么

**安全组是位于服务器之外的网络层过滤器，只管「从互联网进来」的流量。**

### 回环（127.0.0.1）是什么

**回环是服务器内部进程之间的通信，数据包根本不出网卡，所以不经过安全组。**

### 类比

```
阿里云安全组  =  大楼门口的保安（只管外来人员）
nginx        =  443 房间的前台
plan 应用     =  3000 房间的人
```

前台要去 3000 房间找人，走的是**楼内走廊**——保安管不着。

### 所以：关闭 3000 的外部访问，**不会**影响 nginx 转发

nginx 配置里写的是：

```nginx
proxy_pass http://127.0.0.1:3000;   # 走回环，不出网卡
```

**三种「关 3000」的区别：**

| 做法 | nginx 还能转发吗 | 外部设备 |
| --- | --- | --- |
| 关闭安全组的 3000 规则 | ✅ **能**（走回环） | ❌ 连不上，需改用域名 |
| 让应用改监听 `127.0.0.1:3000` | ✅ **能**（走回环） | ❌ 连不上（更强） |
| 让应用停止监听 3000 | ❌ **不能**，网站直接挂 | ❌ 连不上 |

---

## 当前状态 vs 理想状态

| 项目 | 当前 | 理想 |
| --- | --- | --- |
| 博客走 443 | ✅ 已完成 | ✅ |
| plan 走 443 子域名 | ✅ 已完成 | ✅ |
| plan 的侧门 3000 | ⚠️ 仍对外开放 | 关掉（迁完设备后） |
| Syncthing 走 443 | ❌ 缺 DNS 记录 | 加 `sync` 子域名 |
| Syncthing 的侧门 8384 | ⚠️ 仍对外开放 | 关掉 |

**现在是「半整理」状态**：正门建好了，侧门还开着。这是有意保留的——为了保证现有设备不中断。

### 逐步收口的顺序

```
① 现在：什么都不动
        ↓
② 各设备书签改成 https://plan.qiqimora.com，观察几天
        ↓
③ 确认没有设备还在用 IP:3000
        ↓
④ 阿里云控制台 → 安全组 → 删掉 3000 入方向规则
        ↓
⑤ 验证：127.0.0.1:3000 仍 200（nginx 正常），外网 IP:3000 超时（侧门已封）
```

**顺序不能颠倒**——先改书签再关端口。

---

## ⚠️ 需要在阿里云控制台操作的事项

### 目前**没有**「必须立刻去做」的事

所有服务都正常工作。以下 4 项都是可选或正在进行中的：

| # | 事项 | 控制台位置 | 是否必须 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | **ICP 备案** | 备案控制台 | ✅ **法律要求必须做** | 进行中 |
| 2 | 加 `sync` A 记录 → `8.135.52.120` | 云解析 DNS | 可选（想给 Syncthing 配 HTTPS 才需要） | 未做 |
| 3 | 删安全组的 `3000` 入方向规则 | ECS → 安全组 | 可选（设备迁完后才做） | 未做 |
| 4 | 删安全组的 `8384` 入方向规则 | ECS → 安全组 | 可选（Syncthing 迁完后才做） | 未做 |

> [!IMPORTANT]
> **第 3、4 项千万不要提前做**——做了之后，还在用 `IP:3000` / `IP:8384` 的设备会立刻连不上。必须先把所有设备书签改完再动。

---

## 常用排查命令

### 在服务器上（SSH 进去后）

```bash
# 看谁在监听哪些端口
ss -tlnp

# 博客（走内部，模拟 nginx 路径）
curl -I http://127.0.0.1/ -H 'Host: qiqimora.com'

# plan 应用（走内部回环）
curl -I http://127.0.0.1:3000/
curl -I https://127.0.0.1/ -H 'Host: plan.qiqimora.com' -k

# nginx 配置检查 + 重载
nginx -t && systemctl reload nginx

# plan 应用状态
pm2 list
pm2 logs app-plan-next16-live --lines 50

# 证书
openssl x509 -in /etc/ssl/qiqimora/fullchain.pem -noout -dates -ext subjectAltName

# 部署日志
tail -f /var/log/deploy.log
```

### 从自己的电脑

```bash
curl -I https://qiqimora.com/             # 博客
curl -I https://plan.qiqimora.com/        # plan 应用
curl -I http://8.135.52.120:3000/         # 直连（若已封侧门则应超时）
```

---

## 关键文件位置速查

| 内容 | 路径 |
| --- | --- |
| 博客源码 + 构建产物 | `/var/www/mizuki/qiqimora-blog/`（`dist/` 是 nginx 的根目录） |
| 博客 nginx 配置 | `/etc/nginx/sites-available/mizuki` |
| plan 的 nginx 配置 | `/etc/nginx/sites-available/plan.qiqimora.com` |
| plan 应用代码 | `/root/app-plan-release-20260814-next16-candidate/` |
| plan 的环境变量 | 存在 **PM2** 里，不在 `.env` 文件（`pm2 delete` 前先备份） |
| 证书 | `/etc/ssl/qiqimora/fullchain.pem` + `privkey.pem` |
| 证书续期 | `~/.acme.sh/`（cron 每天 4 次检查，下次 2026-11-24） |
| 部署脚本 | `/var/www/deploy.sh`（cron 每天 04:00） |
| Syncthing 数据 | `/root/syncthing/{config,data}`（挂载进容器） |

---

## 一条纪律

**永远不要在这台 2 核 2G 服务器上跑 `pnpm build` / `npm install` / `apt upgrade`。**

构建一律在本地完成再提交 `dist/`。服务器只负责 `git reset --hard` + `chown` + `reload nginx`。
