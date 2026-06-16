# Mizuki 博客项目指南

## 项目概述

基于 **Astro 5.18** 构建的个人博客，使用 **Svelte 5** 编写交互组件，**Tailwind CSS v4** 负责样式，**TypeScript** 为主要语言。托管于 Vercel。

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建（更新番剧 → astro build → pagefind索引 → 字体压缩）
pnpm preview      # 预览生产构建
pnpm new-post     # 生成新文章模板
pnpm format       # Prettier 格式化代码
pnpm lint         # ESLint 检查
pnpm check        # Astro 类型检查
pnpm update-anime # 更新番剧数据
pnpm sync-content # 从内容仓库同步（需配置）
```

## 项目结构

```
src/
├── components/     # Astro + Svelte 组件
│   ├── comment/    # 评论组件（Twikoo）
│   ├── control/    # 控制组件（TOC、分页、回到顶部等）
│   ├── layout/     # 布局组件（侧边栏）
│   ├── misc/       # 杂项（图标、图片包装、许可证等）
│   ├── skills/     # 技能图表
│   └── widget/     # 小部件（公告、日历、分类、标签、音乐播放器等）
├── content/        # 博客文章（Markdown）
│   ├── posts/      # 文章目录
│   └── spec/       # 特殊页面（about、friends）
├── data/           # 数据文件（anime、devices、diary、friends、projects等）
├── i18n/           # 国际化（zh_CN、zh_TW、ja、en）
├── layouts/        # 页面布局
├── pages/          # 路由页面
├── plugins/        # Remark/Rehype 插件
├── scripts/        # 客户端 JS 脚本
├── styles/         # CSS/Stylus 样式
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
├── constants/      # 常量
├── config.ts       # 主配置文件
└── content.config.ts # 内容集合定义
public/             # 静态资源
scripts/            # Node.js 构建脚本
docs/               # 项目文档
```

## 文章 Frontmatter 规范

```yaml
---
title: 文章标题
published: 2024-01-01
updated: 2024-01-02       # 可选，最后更新日期
draft: false              # 可选，草稿模式
description: 文章描述     # 可选
image: /path/to/image    # 可选，封面图
tags: [标签1, 标签2]     # 可选
category: 分类名          # 可选
lang: zh_CN               # 可选，语言代码
pinned: false             # 可选，是否置顶
encrypted: false          # 可选，是否加密
password: ""              # 可选，加密密码
permalink: custom-path    # 可选，自定义固定链接
alias: 别名               # 可选，文章别名
---
```

## 主要配置

所有站点配置集中在 `src/config.ts`，包括：
- `siteConfig` - 站点标题、URL、主题色、横幅、导航栏等
- `navBarConfig` - 导航栏链接配置
- `profileConfig` - 个人资料
- `sidebarLayoutConfig` - 侧边栏组件布局
- `commentConfig` - 评论（Twikoo）
- `musicPlayerConfig` - 音乐播放器（网易云/Meting）
- `fullscreenWallpaperConfig` - 全屏壁纸
- `announcementConfig` - 公告栏
- `sakuraConfig` - 樱花特效
- `pioConfig` - 看板娘

## 构建流水线

构建时按以下顺序执行：
1. `scripts/update-anime.mjs` - 更新番剧数据
2. `astro build` - Astro 静态构建
3. `pagefind --site dist` - 生成搜索索引
4. `scripts/compress-fonts.js` - 字体子集优化

## 关键约定

- 使用 `pnpm` 作为包管理器（preinstall 脚本强制限制）
- 使用路径别名：`@components/*`、`@utils/*`、`@i18n/*`、`@layouts/*`、`@assets/*`、`@constants/*`、`@/*`
- 静态资源放在 `public/` 目录下
- 内容分离（可选）：通过 `.env` 配置 `ENABLE_CONTENT_SYNC` 从独立 Git 仓库同步内容
- TypeScript 严格模式 + `strictNullChecks`
- Svelte 文件使用 `vitePreprocess` 预处理
- 部署平台为 Vercel，配置了安全响应头

## 关键依赖

- **Astro 5.18** + **Svelte 5** + **Tailwind CSS v4**
- **swup** - SPA 页面导航
- **pagefind** - 静态搜索
- **Expressive Code** - 代码块渲染
- **KaTeX** - 数学公式
- **Mermaid** - 图表
- **rehype/remark** - Markdown 处理管线和自定义插件
- **Photoswipe** - 图片灯箱
- **Fancybox** - 相册展示
