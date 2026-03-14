---
title: blog日常推送操作
published: 2026-03-15
pinned: false
description: 记录一下blog日常推送操作
tags: [指令]
category: 其他
licenseName: "Unlicensed"
author: qiqimora
draft: false
date: 2026-03-15
pubDate: 2026-03-15
---

# 博客日常推送操作

## 步骤1：拉取远程最新（避免冲突）
```bash
git pull origin main
```

## 步骤2：暂存所有修改 + 提交（学了什么 + 做了什么 + 写了什么）
```bash
git add .
git commit -m "2026-03-07 第一件事简短描述 + 第二件事简短描述 + 第三件事简短描述"
```

## 步骤3：推送到 GitHub（完成同步）
```bash
git push origin main
```