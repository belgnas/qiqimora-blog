---
title: Claude Code 使用教程
published: 2026-04-14
pinned: false
description: Claude Code 官方文档整理，用来给自己查阅喵
tags: [Claude Code]
category: 工具
licenseName: "Unlicensed"
author: qiqimora
draft: false
date: 2026-04-14
pubDate: 2026-04-14
---


# Claude Code 完整使用教程

> 本教程基于 Claude Code 官方文档全面整理，涵盖所有常用和高级操作命令。

---

## 目录

1. [CLI 命令与参数](#1-cli-命令与参数)
2. [斜杠命令](#2-斜杠命令)
3. [键盘快捷键](#3-键盘快捷键)
4. [权限模式](#4-权限模式)
5. [设置与配置](#5-设置与配置)
6. [环境变量](#6-环境变量)
7. [MCP 服务器](#7-mcp-服务器)
8. [钩子系统](#8-钩子系统)
9. [技能系统](#9-技能系统)
10. [记忆系统](#10-记忆系统)
11. [Git Worktree](#11-git-worktree)
12. [子代理](#12-子代理)
13. [工具参考](#13-工具参考)
14. [交互模式](#14-交互模式)
15. [检查点与回溯](#15-检查点与回溯)
16. [沙箱安全](#16-沙箱安全)

---

## 1. CLI 命令与参数

### 基本 CLI 命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `claude` | 启动交互式会话 | `claude` |
| `claude "任务"` | 启动会话并附带初始提示 | `claude "解释这个项目"` |
| `claude -p "查询"` | 执行一次性查询后退出 | `claude -p "解释这个函数"` |
| `claude -c` | 继续最近的对话 | `claude -c` |
| `claude -r <会话>` | 按名称或ID恢复会话 | `claude -r "auth-refactor"` |
| `claude --worktree <名称>` | 在隔离的 git worktree 中启动 | `claude -w feature-auth` |
| `claude --permission-mode plan` | 以计划模式启动（只读） | `claude --permission-mode plan` |
| `claude --verbose` | 启用详细日志 | `claude --verbose` |
| `claude update` | 更新到最新版本 | `claude update` |
| `claude auth login` | 登录账户 | `claude auth login --console` |
| `claude auth logout` | 登出账户 | `claude auth logout` |
| `claude auth status` | 显示认证状态 | `claude auth status --text` |
| `claude agents` | 列出所有配置的子代理 | `claude agents` |
| `claude mcp` | 配置 MCP 服务器 | `claude mcp add <name> <command>` |
| `claude sandbox` | 启用/配置沙箱 | `claude sandbox` |
| `claude --help` | 显示帮助信息 | `claude --help` |

### 会话管理参数

| 参数 | 说明 |
|------|------|
| `--continue`, `-c` | 加载最近的对话 |
| `--resume`, `-r <id/name>` | 恢复指定会话 |
| `--fork-session` | 创建新会话 ID |
| `--session-id <uuid>` | 使用特定会话 ID |
| `--name`, `-n <name>` | 设置会话显示名称 |
| `--from-pr <number>` | 恢复链接到 PR 的会话 |
| `--no-session-persistence` | 禁用会话保存 |

### 输出模式参数

| 参数 | 说明 |
|------|------|
| `--print`, `-p` | 非交互模式打印响应 |
| `--output-format` | 输出格式：`text`, `json`, `stream-json` |
| `--input-format` | 输入格式：`text`, `stream-json` |
| `--json-schema <schema>` | 获取匹配 schema 的验证 JSON 输出 |
| `--max-budget-usd <amount>` | 停止前的最大花费 |
| `--max-turns <n>` | 限制代理轮次 |

### 模型配置参数

| 参数 | 说明 |
|------|------|
| `--model <model>` | 设置会话模型 |
| `--effort <level>` | 努力级别：`low`, `medium`, `high`, `max` |
| `--fallback-model <model>` | 默认模型过载时的备用 |
| `--betas <headers>` | API 请求的 beta 头 |

### 权限参数

| 参数 | 说明 |
|------|------|
| `--permission-mode <mode>` | 权限模式 |
| `--allow-dangerously-skip-permissions` | 将 bypassPermissions 添加到 Shift+Tab 循环 |
| `--dangerously-skip-permissions` | 跳过权限提示 |
| `--allowedTools <tools>` | 无需提示即可执行的工具 |
| `--disallowedTools <tools>` | 从上下文中移除的工具 |

### 系统提示参数

| 参数 | 说明 |
|------|------|
| `--system-prompt <text>` | 替换整个系统提示 |
| `--system-prompt-file <path>` | 从文件加载系统提示 |
| `--append-system-prompt <text>` | 追加到默认提示 |
| `--append-system-prompt-file <path>` | 追加文件内容 |
| `--exclude-dynamic-system-prompt-sections` | 将per-machine部分移至首条用户消息 |

### 文件与目录参数

| 参数 | 说明 |
|------|------|
| `--add-dir <path>` | 添加文件访问的工作目录 |
| `--worktree`, `-w [name]` | 在 git worktree 中启动 |
| `--tmux` | 为 worktree 创建 tmux 会话 |
| `--plugin-dir <path>` | 从目录加载插件 |

### 工具与扩展参数

| 参数 | 说明 |
|------|------|
| `--mcp-config <file>` | 从 JSON 加载 MCP 服务器 |
| `--strict-mcp-config` | 仅使用 --mcp-config 服务器 |
| `--chrome` | 启用 Chrome 浏览器集成 |
| `--no-chrome` | 禁用 Chrome 集成 |
| `--agent <name>` | 指定会话的代理 |
| `--agents <json>` | 动态定义自定义子代理 |
| `--tools <tools>` | 限制内置工具（用 `""` 禁用全部） |

### 交互功能参数

| 参数 | 说明 |
|------|------|
| `--ide` | 启动时自动连接到 IDE |
| `--init` | 运行 init 钩子并启动交互 |
| `--init-only` | 运行 init 钩子并退出 |
| `--maintenance` | 运行维护钩子并启动 |
| `--disable-slash-commands` | 禁用所有技能和命令 |

### 调试与开发参数

| 参数 | 说明 |
|------|------|
| `--debug [category]` | 启用调试模式，可选过滤器 |
| `--debug-file <path>` | 将调试日志写入文件 |
| `--verbose` | 启用详细日志 |
| `--include-hook-events` | 在输出中包含钩子生命周期 |
| `--include-partial-messages` | 包含部分流式事件 |

### 远程与 Web 参数

| 参数 | 说明 |
|------|------|
| `--remote <task>` | 在 claude.ai 上创建新 web 会话 |
| `--remote-control`, `--rc` | 启用远程控制 |
| `--teleport` | 在终端中恢复 web 会话 |

### 其他参数

| 参数 | 说明 |
|------|------|
| `--bare` | 最小模式，跳过自动发现 |
| `--setting-sources <list>` | 逗号分隔：`user`, `project`, `local` |
| `--settings <path/json>` | 从文件或 JSON 字符串加载设置 |
| `--version`, `-v` | 输出版本号 |

---

## 2. 斜杠命令

输入 `/` 可查看所有可用命令。

### 内置命令

| 命令 | 说明 |
|------|------|
| `/agents` | 列出和管理子代理 |
| `/auto-mode` | 配置自动模式设置 |
| `/btw` | 快速提问（不增加历史） |
| `/clear` | 清除对话（重新开始） |
| `/compact` | 压缩对话历史 |
| `/config` | 打开设置界面 |
| `/doctor` | 检查配置问题 |
| `/env` | 显示环境信息 |
| `/feedback` | 提交关于 Claude Code 的反馈 |
| `/hooks` | 浏览钩子配置 |
| `/init` | 初始化 CLAUDE.md 和项目设置 |
| `/keybindings` | 创建/编辑键盘快捷键 |
| `/memory` | 查看和管理记忆文件 |
| `/mcp` | 管理 MCP 服务器配置 |
| `/model` | 切换模型 |
| `/permissions` | 管理权限规则 |
| `/plan` | 进入计划模式 |
| `/plugin` | 管理插件 |
| `/powerup` | 交互式课程演示 |
| `/pr-comments` | 获取 GitHub PR 评论 |
| `/remote` | 启动 web 会话 |
| `/rename <name>` | 重命名当前会话 |
| `/resume <session>` | 恢复之前的会话 |
| `/review` | 审查 pull request |
| `/security-review` | 完成安全审查 |
| `/sandbox` | 配置沙箱 |
| `/simplify` | 审查代码重用/质量/效率 |
| `/statusline` | 设置状态栏 UI |
| `/theme` | 选择输出主题 |
| `/throttle` | 限制 token 使用 |
| `/upgrade` | 升级 Claude Code（Pro/Max） |
| `/web-setup` | 配置 web 会话设置 |

### 捆绑技能（斜杠命令）

| 技能 | 说明 |
|------|------|
| `/batch` | 跨并行 worktree 代理研究和执行大规模更改 |
| `/claude-api` | 使用 Claude API 构建应用 |
| `/debug` | 诊断和修复问题 |
| `/insights` | 生成 Claude Code 会话分析报告 |
| `/loop` | 按 recurring 间隔运行提示/命令 |
| `/update-config` | 通过 settings.json 配置 Claude Code |

### 创建自定义命令/技能

技能文件放置位置：
- `~/.claude/skills/<name>/SKILL.md`（个人）
- `.claude/skills/<name>/SKILL.md`（项目）
- `.claude/commands/<name>.md`（旧版，仍可用）

---

## 3. 键盘快捷键

### 通用控制

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+C` | 取消当前输入或生成 |
| `Ctrl+D` | 退出 Claude Code 会话 |
| `Ctrl+G` 或 `Ctrl+X Ctrl+E` | 在外部编辑器中打开 |
| `Ctrl+L` | 清除提示输入 |
| `Ctrl+O` | 切换转录查看器 |
| `Ctrl+R` | 反向搜索命令历史 |
| `Ctrl+B` | 后台运行任务（tmux 中按两次） |
| `Ctrl+T` | 切换任务列表 |
| `Ctrl+X Ctrl+K` | 终止所有后台代理 |
| `Shift+Tab` 或 `Alt+M` | 循环切换权限模式 |
| `Option+P` (macOS) / `Alt+P` (Win/Linux) | 切换模型 |
| `Option+T` (macOS) / `Alt+T` (Win/Linux) | 切换扩展思考 |
| `Option+O` (macOS) / `Alt+O` (Win/Linux) | 切换快速模式 |
| `Esc+Esc` | 回溯或总结对话（双按） |
| `Ctrl+V` 或 `Alt+V` (Win) | 从剪贴板粘贴图片 |
| `?` | 查看所有可用快捷键 |

### 文本编辑 (Readline)

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+K` | 删除到行尾 |
| `Ctrl+U` | 从光标处删除到行首 |
| `Ctrl+Y` | 粘贴已删除的文本 |
| `Alt+Y`（Ctrl+Y 后） | 循环粘贴历史 |
| `Alt+B` | 光标后退一个单词 |
| `Alt+F` | 光标前进一个单词 |

### 多行输入

| 方法 | 快捷键 |
|------|--------|
| `\` + `Enter` | 快速转义（所有终端） |
| `Option+Enter` | macOS 默认 |
| `Shift+Enter` | 适用于 iTerm2, WezTerm, Ghostty, Kitty |
| `Ctrl+J` | 控制序列（换行） |

### Vim 模式（NORMAL）

| 命令 | 操作 |
|------|------|
| `Esc` | 进入 NORMAL 模式 |
| `i` | 在光标前插入 |
| `I` | 在行首插入 |
| `a` | 在光标后插入 |
| `A` | 在行尾插入 |
| `o` | 在下方打开行 |
| `O` | 在上方打开行 |
| `h/j/k/l` | 左/下/上/右移动 |
| `w/e/b` | 下一个词/词尾/上一个词 |
| `0/$` | 行首/行尾 |
| `gg/G` | 开头/结尾 |
| `f{字符}` | 跳转到指定字符 |
| `dd` | 删除行 |
| `yy` | 复制（yank）行 |
| `p/P` | 在光标后/前粘贴 |
| `>>/<<` | 缩进/取消缩进 |

### 会话选择器（/resume）

| 快捷键 | 操作 |
|--------|------|
| `Up/Down` | 导航会话 |
| `Left/Right` | 展开/折叠分组 |
| `Enter` | 选择并恢复 |
| `P` | 预览会话 |
| `R` | 重命名会话 |
| `/` | 搜索/过滤 |
| `A` | 切换所有项目 |
| `B` | 按当前分支过滤 |

### 交互模式特殊输入

| 输入 | 动作 |
|------|------|
| `/` 在开头 | 命令或技能 |
| `!` 在开头 | Bash 模式（直接执行） |
| `@` | 文件路径提及自动完成 |
| `Up/Down` | 导航命令历史 |
| `Ctrl+Shift+Up/Down` | 循环切换对话框标签页 |

---

## 4. 权限模式

### 可用模式

| 模式 | 无需询问即可运行 | 适用于 |
|------|------------------|--------|
| `default` | 仅读取 | 入门、敏感工作 |
| `acceptEdits` | 读取、文件编辑、常见文件系统命令 | 迭代正在审查的代码 |
| `plan` | 仅读取 | 更改前的探索 |
| `auto` | 通过后台安全检查的所有操作 | 长任务、减少提示疲劳 |
| `dontAsk` | 仅预先批准的工具 | 锁定 CI 和脚本 |
| `bypassPermissions` | 除受保护路径外的所有操作 | 隔离容器/VM |

### 切换模式

**CLI：**
- `Shift+Tab` 循环：`default` -> `acceptEdits` -> `plan`（启用后添加 auto/bypass）
- 启动时 `--permission-mode <mode>`
- 在设置中设置 `defaultMode`

**VS Code：** 点击提示框底部的模式指示器

**桌面应用：** 发送按钮旁边的模式选择器

### AcceptEdits 模式自动批准

- 文件编辑
- 文件系统命令：`mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, `sed`
- 带安全前缀的命令（LANG, NO_COLOR, timeout, nice, nohup）

### Auto 模式（研究预览）

**要求：**
- Team、Enterprise 或 API 计划
- Claude Code 管理设置中由管理员启用
- Claude Sonnet 4.6 或 Opus 4.6
- Anthropic API（非 Bedrock/Vertex/Foundry）

**分类器默认阻止：**
- 下载/执行代码（`curl | bash`）
- 向外部发送敏感数据
- 生产部署和迁移
- 云存储批量删除
- 授予 IAM/repo 权限
- 强制推送或推送到 main

### 受保护路径

任何模式下都不会自动批准：
- 目录：`.git`, `.vscode`, `.idea`, `.husky`, `.claude`（命令、代理、技能、worktree 除外）
- 文件：`.gitconfig`, `.gitmodules`, `.bashrc`, `.bash_profile`, `.zshrc`, `.profile`, `.ripgreprc`, `.mcp.json`, `.claude.json`

### 权限规则语法

```json
{
  "permissions": {
    "allow": ["Bash(npm test)", "Bash(git commit *)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Bash(rm -rf *)"]
  }
}
```

**模式类型：**
- `Tool` - 匹配所有使用
- `Tool(specifier)` - 精确匹配
- `Tool(*wildcard*)` - glob 模式
- `Bash(ls *)` - 词边界匹配

### 路径匹配

| 模式 | 含义 |
|------|------|
| `//path` | 从文件系统根目录的绝对路径 |
| `~/path` | 从主目录 |
| `/path` | 相对于项目根目录 |
| `path` 或 `./path` | 相对于当前目录 |

---

## 5. 设置与配置

### 配置范围

| 范围 | 位置 | 共享？ |
|------|------|--------|
| **托管** | Server/plist/registry/system-level | 是（IT 控制） |
| **本地** | `.claude/settings.local.json` | 否（gitignored） |
| **项目** | `.claude/settings.json` | 是（在 repo 中） |
| **用户** | `~/.claude/settings.json` | 否 |

### 优先级

1. 托管设置（无法覆盖）
2. 命令行参数
3. 本地设置（`.claude/settings.local.json`）
4. 项目设置（`.claude/settings.json`）
5. 用户设置（`~/.claude/settings.json`）

### 关键设置示例

```json
{
  "model": "claude-sonnet-4-6",
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash(git *)"],
    "deny": ["Bash(rm -rf *)"]
  },
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["~/.kube"]
    },
    "network": {
      "allowedDomains": ["github.com", "api.example.com"]
    }
  },
  "env": {
    "CLAUDE_CODE_USE_POWERSHELL_TOOL": "1"
  },
  "autoMemoryEnabled": true,
  "hooks": { ... }
}
```

### 沙箱设置

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": false,
    "autoAllowBashIfSandboxed": true,
    "filesystem": {
      "allowWrite": ["path"],
      "denyWrite": ["path"],
      "allowRead": ["path"],
      "denyRead": ["path"],
      "allowManagedReadPathsOnly": false
    },
    "network": {
      "allowedDomains": ["domain.com"],
      "allowManagedDomainsOnly": false,
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    },
    "excludedCommands": ["docker"],
    "allowUnsandboxedCommands": true,
    "enableWeakerNestedSandbox": false
  }
}
```

### 自动记忆设置

```json
{
  "autoMemoryEnabled": true,
  "autoMemoryDirectory": "~/my-memory"
}
```

---

## 6. 环境变量

### 认证与 API

| 变量 | 用途 |
|------|------|
| `ANTHROPIC_API_KEY` | X-Api-Key 头的 API 密钥 |
| `ANTHROPIC_AUTH_TOKEN` | 自定义 Authorization 头 |
| `ANTHROPIC_BASE_URL` | 覆盖 API 端点 |
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock 端点覆盖 |
| `ANTHROPIC_VERTEX_BASE_URL` | Vertex AI 端点覆盖 |
| `ANTHROPIC_VERTEX_PROJECT_ID` | Vertex 的 GCP 项目 |
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock API 密钥 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API 密钥 |
| `ANTHROPIC_FOUNDRY_BASE_URL` | Foundry 基础 URL |
| `ANTHROPIC_FOUNDRY_RESOURCE` | Foundry 资源名称 |

### 模型配置

| 变量 | 用途 |
|------|------|
| `ANTHROPIC_MODEL` | 要使用的模型设置名称 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | 默认 Opus 模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | 默认 Sonnet 模型 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | 默认 Haiku 模型 |
| `ANTHROPIC_CUSTOM_MODEL_OPTION` | 添加自定义模型选项 |
| `CLAUDE_CODE_SUBAGENT_MODEL` | 子代理使用的模型 |

### 超时与性能

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `API_TIMEOUT_MS` | 600000 | API 请求超时 |
| `BASH_DEFAULT_TIMEOUT_MS` | 120000 | 默认 bash 超时 |
| `BASH_MAX_TIMEOUT_MS` | 600000 | 最大 bash 超时 |
| `BASH_MAX_OUTPUT_LENGTH` | - | 最大 bash 输出字符数 |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | varies | 每次请求的最大输出 |
| `CLAUDE_CODE_MAX_RETRIES` | 10 | 重试次数 |
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | 10 | 并行工具限制 |

### 功能开关

| 变量 | 用途 |
|------|------|
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | 禁用 1M 上下文窗口 |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | 禁用自适应推理 |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用自动记忆 |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | 禁用后台任务 |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS` | 阻止加载 CLAUDE.md |
| `CLAUDE_CODE_DISABLE_CRON` | 禁用计划任务 |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | 禁用快速模式 |
| `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING` | 禁用回溯 |
| `CLAUDE_CODE_DISABLE_THINKING` | 强制禁用扩展思考 |
| `CLAUDE_CODE_SIMPLE` | 最小模式（仅核心工具） |
| `CLAUDE_CODE_DISABLE_ATTACHMENTS` | 禁用 @ 文件展开 |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` | 移除 git 说明 |
| `DISABLE_AUTO_COMPACT` | 禁用自动压缩 |
| `DISABLE_COMPACT` | 禁用所有压缩 |

### IDE 与终端

| 变量 | 用途 |
|------|------|
| `CLAUDE_CODE_IDE_HOST_OVERRIDE` | IDE 连接主机 |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL` | 跳过 IDE 扩展自动安装 |
| `CLAUDE_CODE_IDE_SKIP_VALID_CHECK` | 跳过 IDE lockfile 验证 |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE` | 禁用终端标题更新 |
| `CLAUDE_CODE_ACCESSIBILITY` | 保持原生光标可见 |
| `CLAUDE_CODE_DISABLE_MOUSE` | 在全屏中禁用鼠标 |
| `CLAUDE_CODE_SHELL` | 覆盖 shell（bash, zsh） |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | 在 Windows 上启用 PowerShell |

### 调试与日志

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `CLAUDE_CODE_DEBUG_LOGS_DIR` | `~/.claude/debug/` | 调试日志路径 |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL` | `debug` | 日志级别 |
| `DISABLE_ERROR_REPORTING` | - | 选择退出 Sentry |
| `DISABLE_TELEMETRY` | - | 选择退出遥测 |

### 上下文与压缩

| 变量 | 用途 |
|------|------|
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 覆盖自动压缩阈值 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | 压缩的上下文窗口 |
| `MAX_THINKING_TOKENS` | 限制思考 token 预算 |

### mTLS 与安全

| 变量 | 用途 |
|------|------|
| `CLAUDE_CODE_CLIENT_CERT` | 客户端证书路径 |
| `CLAUDE_CODE_CLIENT_KEY` | 客户端密钥路径 |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` | 密钥密码 |
| `CLAUDE_CODE_CERT_STORE` | CA 证书来源（bundled, system） |

### Shell 配置

| 变量 | 用途 |
|------|------|
| `CLAUDE_CODE_SHELL_PREFIX` | 包装所有 bash 命令 |
| `CLAUDE_CODE_GIT_BASH_PATH` | Windows 上的 Git Bash 路径 |
| `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR` | 命令后返回原始目录 |
| `CLAUDE_ENV_FILE` | 用于持久化 env var 的 shell 脚本 |

### Glob 与文件发现

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `CLAUDE_CODE_GLOB_HIDDEN` | `true` | 包含隐藏文件 |
| `CLAUDE_CODE_GLOB_NO_IGNORE` | `true` | 遵守 .gitignore |
| `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS` | 20/60 | Glob 超时 |

---

## 7. MCP 服务器

### 添加 MCP 服务器

**在 settings.json 中：**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

**使用 claude mcp 命令：**

```bash
claude mcp add <name> <command> [args...]
claude mcp remove <name>
claude mcp list
```

### 传输类型

| 类型 | 配置 |
|------|------|
| **stdio** | `command` + `args` |
| **HTTP/SSE** | `url` + 可选 `headers` |
| **SDK** | 在代码中使用 `createSdkMcpServer()` |

### 认证

```json
{
  "mcpServers": {
    "remote": {
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer $MY_TOKEN"
      },
      "allowedEnvVars": ["MY_TOKEN"]
    }
  }
}
```

### 工具命名约定

- 格式：`mcp__<server>__<tool>`
- 示例：`mcp__github__search_repositories`, `mcp__filesystem__read_file`

### 关键设置

```json
{
  "mcpServers": { ... },
  "allowedTools": ["mcp__github__*"],
  "strictMcpConfig": true,
  "extraKnownMarketplaces": [...]
}
```

---

## 8. 钩子系统

### 钩子事件

| 事件 | 触发时机 | 可阻止？ |
|------|----------|----------|
| `SessionStart` | 会话开始/恢复 | 否 |
| `UserPromptSubmit` | 用户提交提示 | 是 |
| `PreToolUse` | 工具执行前 | 是 |
| `PermissionRequest` | 权限对话框出现 | 是 |
| `PermissionDenied` | 自动模式拒绝工具 | 否 |
| `PostToolUse` | 工具成功后 | 否 |
| `PostToolUseFailure` | 工具失败后 | 否 |
| `Notification` | 通知发送 | 否 |
| `SubagentStart` | 子代理产生 | 否 |
| `SubagentStop` | 子代理结束 | 是 |
| `TaskCreated` | 任务创建中 | 是 |
| `TaskCompleted` | 任务标记完成 | 是 |
| `Stop` | Claude 完成响应 | 是 |
| `StopFailure` | API 错误发生 | 否 |
| `TeammateIdle` | 队友空闲 | 是 |
| `InstructionsLoaded` | CLAUDE.md/rules 加载 | 否 |
| `ConfigChange` | 配置文件更改 | 是 |
| `CwdChanged` | 工作目录更改 | 否 |
| `FileChanged` | 监视文件更改 | 否 |
| `WorktreeCreate` | Worktree 创建中 | 是 |
| `WorktreeRemove` | Worktree 移除中 | 否 |
| `PreCompact` | 压缩前 | 否 |
| `PostCompact` | 压缩后 | 否 |
| `Elicitation` | MCP 请求用户输入 | 是 |
| `ElicitationResult` | 用户响应 elicitation | 是 |
| `SessionEnd` | 会话终止 | 否 |

### 钩子类型

| 类型 | 说明 |
|------|------|
| `command` | Shell 脚本执行 |
| `http` | POST 到 HTTP 端点 |
| `prompt` | LLM 评估（单轮） |
| `agent` | 子代理验证（多轮） |

### 配置示例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm'"
          }
        ]
      }
    ]
  }
}
```

### 匹配器模式

| 模式 | 评估为 | 示例 |
|------|--------|------|
| `""` 或省略 | 匹配所有 | 每个事件 |
| 字母、数字、`_`、`\|` | 精确或管道分隔 | `"Bash"`, `"Edit\|Write"` |
| 包含特殊字符 | JavaScript 正则 | `"^Notebook"`, `"mcp__.*__.*"` |

### 退出码

| 代码 | 含义 |
|------|------|
| 0 | 成功 - 继续 |
| 2 | 阻止操作 |
| 其他 | 非阻塞错误 |

### 特殊变量

| 变量 | 说明 |
|------|------|
| `$CLAUDE_PROJECT_DIR` | 项目根目录 |
| `$CLAUDE_ENV_FILE` | 用于持久化 env var 的文件 |
| `${CLAUDE_PLUGIN_ROOT}` | 插件安装目录 |
| `${CLAUDE_PLUGIN_DATA}` | 插件数据目录 |

### If 字段（仅工具事件）

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "check-git-policy.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 9. 技能系统

### 技能位置

| 范围 | 路径 | 适用于 |
|------|------|--------|
| 企业 | 托管设置 | 所有用户 |
| 个人 | `~/.claude/skills/<name>/SKILL.md` | 所有项目 |
| 项目 | `.claude/skills/<name>/SKILL.md` | 本项目 |
| 插件 | `<plugin>/skills/<name>/SKILL.md` | 插件启用处 |

### SKILL.md 格式

```yaml
---
name: my-skill
description: 这个技能做什么，何时使用
argument-hint: [filename] [format]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read Grep Bash(git *)
model: sonnet
effort: high
context: fork
agent: Explore
paths: "src/**/*.ts"
shell: bash
---

你的技能说明在这里。使用 $ARGUMENTS 获取传递的参数。
```

### 前置matter字段

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 否 | 显示名称（默认为目录名） |
| `description` | 推荐 | 它做什么，何时使用 |
| `argument-hint` | 否 | 期望参数的提示 |
| `disable-model-invocation` | 否 | 设为 `true` 可防止自动加载 |
| `user-invocable` | 否 | 设为 `false` 可从 / 菜单隐藏 |
| `allowed-tools` | 否 | 无需提示即可使用的工具 |
| `model` | 否 | 要使用的模型 |
| `effort` | 否 | `low`, `medium`, `high`, `max` |
| `context` | 否 | 设为 `fork` 以子代理执行 |
| `agent` | 否 | `context: fork` 时使用哪个子代理类型 |
| `paths` | 否 | 自动激活的 glob 模式 |
| `shell` | 否 | `bash` 或 `powershell` |

### 字符串替换

| 变量 | 说明 |
|------|------|
| `$ARGUMENTS` | 传递的所有参数 |
| `$ARGUMENTS[N]` | 按索引获取特定参数 |
| `$N` | `$ARGUMENTS[N]` 的简写 |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | 技能 SKILL.md 目录 |

### Shell 命令执行

```yaml
---
name: pr-summary
description: 总结 pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## PR context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`

## Task
Summarize this PR...
```

### 捆绑技能

| 技能 | 说明 |
|------|------|
| `/batch` | 用于大规模更改的并行 worktree 代理 |
| `/claude-api` | 使用 Claude API 构建应用 |
| `/debug` | 诊断和修复问题 |
| `/insights` | 分析 Claude Code 会话 |
| `/loop` | 按 recurring 间隔运行 |
| `/simplify` | 审查代码质量 |
| `/update-config` | 配置 settings.json |
| `/statusline` | 设置状态栏 |

### 调用技能

- 直接：`/skill-name` 或 `/skill-name arg1 arg2`
- 自动：Claude 加载描述匹配时
- 子代理：带 `context: fork` 前置matter

---

## 10. 记忆系统

### CLAUDE.md 文件

| 范围 | 位置 | 共享 |
|------|------|------|
| 托管策略 | 取决于 OS | 所有用户 |
| 项目 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 通过版本控制与团队共享 |
| 用户 | `~/.claude/CLAUDE.md` | 仅你自己 |
| 本地 | `./CLAUDE.local.md` | 仅你自己（gitignored） |

### 规则（.claude/rules/）

在 `.claude/rules/` 目录中组织说明：

```
.claude/
├── CLAUDE.md
└── rules/
    ├── code-style.md
    ├── testing.md
    └── security.md
```

路径特定规则：
```yaml
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Rules
- All endpoints must include input validation
```

### 自动记忆

**存储位置：** `~/.claude/projects/<project>/memory/`

**文件：**
- `MEMORY.md` - 索引（会话开始时加载前 200 行/25KB）
- `debugging.md`, `api-conventions.md` 等 - 主题文件（按需加载）

**设置：**
```json
{
  "autoMemoryEnabled": true,
  "autoMemoryDirectory": "~/my-memory"
}
```

**命令：**
- `/memory` - 浏览和管理记忆文件

### 导入

用 `@` 引用外部文件：
```markdown
详见 @README 概览，@package.json 命令。

# Additional Instructions
- git workflow @docs/git-instructions.md
```

### 排除 CLAUDE.md 文件

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

---

## 11. Git Worktree

### 创建 Worktree

```bash
claude --worktree feature-auth
claude --worktree bugfix-123
claude --worktree  # 自动生成名称如 "bright-running-fox"
```

### Worktree 位置

- 创建于 `<repo>/.claude/worktrees/<name>`
- 分支名为 `worktree-<name>`

### 使用 tmux

```bash
claude --worktree feature-auth --tmux
claude --worktree feature-auth --tmux=classic  # 传统 tmux
```

### 子代理 Worktree

在子代理前置matter中配置：
```yaml
---
name: research-agent
isolation: worktree
---
```

### 清理

**自动：**
- 无更改：移除 worktree 和分支
- 有更改：提示保留/移除

**手动：**
```bash
git worktree list
git worktree remove ../project-feature-a
```

### 复制 Gitignored 文件

在项目根目录添加 `.worktreeinclude`：
```
.env
.env.local
config/secrets.json
```

---

## 12. 子代理

### 内置子代理

| 代理 | 说明 |
|------|------|
| `Explore` | 只读代码库探索 |
| `Plan` | 规划和分析 |
| `general-purpose` | 默认，拥有全部工具 |

### 创建子代理

**文件：** `.claude/agents/<name>.md`

```yaml
---
name: code-reviewer
description: 审查代码的 bug 和质量问题。当被要求审查代码或修复问题时使用。
model: sonnet
tools:
  allowed:
    - Read
    - Grep
    - Glob
    - Bash(git diff *)
    - Bash(git log *)
permission-mode: plan
effort: high
skills:
  - name: security-rules
    auto-invoke: true
memory:
  enabled: true
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: prompt
          prompt: "Check if safe: $ARGUMENTS"
---

You are an expert code reviewer...
```

### 前置matter字段

| 字段 | 说明 |
|------|------|
| `name` | 唯一标识符 |
| `description` | 何时使用此代理 |
| `model` | 要使用的模型 |
| `tools` | `allowed` 或 `denied` 工具列表 |
| `permission-mode` | 此代理的模式 |
| `effort` | 努力级别 |
| `skills` | 预加载的技能 |
| `memory` | 启用持久记忆 |
| `hooks` | 作用域到此代理的钩子 |
| `isolation` | `worktree` 隔离 |
| `paths` | 自动委托的文件模式 |
| `preloadSkills` | 启动时加载的技能 |

### 工具模式

```yaml
tools:
  allowed:
    - Read
    - Grep
    - Glob
    - Bash(git diff --name-only *)
    - Bash(git log --oneline -20 *)
  denied:
    - Write
    - Edit
```

### 调用子代理

**自动：** Claude 在描述匹配时委托

**显式：**
```
使用 code-reviewer 子代理检查 auth 模块
```

### 管理子代理

```bash
claude agents  # 列出所有配置的子代理
/agents        # 交互式管理
```

---

## 13. 工具参考

### 内置工具

| 工具 | 说明 | 需要权限 |
|------|------|----------|
| `Agent` | 产生子代理 | 否 |
| `AskUserQuestion` | 多选问题 | 否 |
| `Bash` | 执行 shell 命令 | 是 |
| `CronCreate` | 创建定期提示 | 否 |
| `CronDelete` | 取消计划任务 | 否 |
| `CronList` | 列出计划任务 | 否 |
| `Edit` | 定向文件编辑 | 是 |
| `EnterPlanMode` | 切换到计划模式 | 否 |
| `EnterWorktree` | 创建 git worktree | 否 |
| `ExitPlanMode` | 提交计划待批准 | 是 |
| `ExitWorktree` | 退出 worktree 会话 | 否 |
| `Glob` | 按模式查找文件 | 否 |
| `Grep` | 搜索文件内容 | 否 |
| `ListMcpResourcesTool` | 列出 MCP 资源 | 否 |
| `LSP` | 通过语言服务器的代码智能 | 否 |
| `Monitor` | 监视后台输出 | 是 |
| `NotebookEdit` | 修改 Jupyter 单元格 | 是 |
| `PowerShell` | PowerShell 命令（Windows） | 是 |
| `Read` | 读取文件内容 | 否 |
| `ReadMcpResourceTool` | 读取 MCP 资源 | 否 |
| `SendMessage` | 发送给队友/子代理 | 否 |
| `Skill` | 执行技能 | 是 |
| `TaskCreate` | 创建任务 | 否 |
| `TaskGet` | 获取任务详情 | 否 |
| `TaskList` | 列出任务 | 否 |
| `TaskStop` | 终止后台任务 | 否 |
| `TaskUpdate` | 更新/删除任务 | 否 |
| `TeamCreate` | 创建代理团队 | 否 |
| `TeamDelete` | 解散代理团队 | 否 |
| `TodoWrite` | 管理任务清单 | 否 |
| `ToolSearch` | 搜索 MCP 工具 | 否 |
| `WebFetch` | 获取 URL 内容 | 是 |
| `WebSearch` | 网络搜索 | 是 |
| `Write` | 创建/覆盖文件 | 是 |

### Bash 工具行为

- `cd` 在项目目录内持久化
- 环境变量不在命令间持久化
- 使用 `CLAUDE_ENV_FILE` 实现持久化 env var

### PowerShell 工具（Windows）

启用：`CLAUDE_CODE_USE_POWERSHELL_TOOL=1`

---

## 14. 交互模式

### 快速命令

| 输入 | 动作 |
|------|------|
| `/` 在开头 | 命令或技能 |
| `!` 在开头 | Bash 模式（直接执行） |
| `@` | 文件路径提及 |
| `Ctrl+V` | 粘贴图片 |

### Bash 模式 (!)

```bash
! npm test
! git status
! ls -la
```

特性：
- 实时输出
- `Ctrl+B` 后台运行
- 历史自动完成
- Escape/Backspace/Ctrl+U 退出

### 后台命令

- Claude 将输出写入文件
- 用 Read 工具检索
- 退出时自动清理
- 最多 5GB 输出

### 快速提问 (/btw)

```
/btw what was the name of that config file?
```

特点：
- 可见完整对话
- 无工具访问
- 单次响应
- 临时的（不在历史中）

### 任务列表

- 按 `Ctrl+T` 切换
- 显示 pending/in-progress/complete
- 压缩后保持
- 通过 `CLAUDE_CODE_TASK_LIST_ID` 共享

### PR 审查状态

页脚显示带颜色下划线的 PR 链接：
- 绿色：已批准
- 黄色：待定
- 红色：要求更改
- 灰色：草稿
- 紫色：已合并

---

## 15. 检查点与回溯

### 工作原理

- 每个用户提示创建检查点
- 跟踪 Claude 进行的文件编辑
- 跨会话持久化
- 30 天后自动清理

### 回溯操作

按 `Esc+Esc` 或使用 `/rewind`：
- **恢复代码和对话**：同时还原
- **恢复对话**：保留当前代码
- **恢复代码**：保留对话
- **从这里总结**：压缩到摘要

### 限制

- 不跟踪 Bash 命令更改
- 不跟踪外部更改
- 不能替代版本控制

---

## 16. 沙箱安全

### 入门

**macOS：** 开箱即用（Seatbelt）

**Linux/WSL2：**
```bash
sudo apt-get install bubblewrap socat  # Ubuntu/Debian
sudo dnf install bubblewrap socat      # Fedora
```

**启用：** `/sandbox` 命令或设置

### 模式

| 模式 | 行为 |
|------|------|
| **Auto-allow** | 沙箱命令无需提示运行 |
| **Regular permissions** | 沙箱命令经过权限流程 |

### 文件系统隔离

- 默认写入：仅当前工作目录
- 默认读取：除拒绝路径外的整个计算机
- 通过 `sandbox.filesystem.allowWrite` 配置

### 网络隔离

- 通过代理控制
- 域名白名单
- 新域名确认
- 所有子进程综合覆盖

### 安全优势

- 防止提示注入
- 减少攻击面
- OS 级强制执行
- 所有子进程继承限制

### 限制

- 性能开销（很小）
- 某些工具需要配置
- 平台：macOS, Linux, WSL2（非 WSL1）
- 不适用于：内置文件工具、计算机使用

---

## 常用工作流程

### 获取代码库概览

```
给我一个这个代码库的概述
解释主要架构模式
这个项目使用了哪些技术？
```

### 修复 Bug

```
运行 npm test 时出现错误
修复登录bug，用户输入错误凭据后看到空白屏幕
修复 user.ts 中的 @ts-ignore
```

### 重构代码

```
在代码库中找到已弃用的 API 用法
将 utils.js 重构为使用 ES2024 特性
运行重构后的代码测试
```

### 编写测试

```
为计算器函数编写单元测试
添加边界条件的测试用例
运行新测试并修复任何失败
```

### Git 操作

```
查看我改动了哪些文件？
用描述性消息提交我的更改
创建一个名为 feature/quickstart 的新分支
显示最近5次提交
帮助我解决合并冲突
```

### 创建 Pull Request

```
总结我做的更改
创建一个 PR
用更多上下文增强 PR 描述
```

### 使用计划模式

```bash
# 以计划模式启动
claude --permission-mode plan

# 或在会话中切换
Shift+Tab（循环切换到计划模式）
```

### 处理图片

- 将图片拖放到 CLI 中
- 使用 `Ctrl+V` 粘贴
- 通过路径引用：`分析这张图片：/path/to/image.png`

### 使用 @ 引用文件

```
解释 @src/utils/auth.js
@src/components 的结构是什么？
```

### 并行开发

```bash
claude --worktree feature-auth   # 创建 worktree + 分支
claude --worktree bugfix-123    # 另一个并行会话
```

### 管道和脚本用法

```bash
cat error.log | claude -p "解释根本原因"
claude -p --output-format json "分析代码" > output.json
git diff main | claude -p "审查安全问题"
```

---

## 官方文档资源

- [Claude Code 概览](https://code.claude.com/docs/en/overview)
- [快速入门](https://code.claude.com/docs/en/quickstart)
- [CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [命令参考](https://code.claude.com/docs/en/commands)
- [键盘快捷键](https://code.claude.com/docs/en/keybindings)
- [交互模式](https://code.claude.com/docs/en/interactive-mode)
- [设置](https://code.claude.com/docs/en/settings)
- [最佳实践](https://code.claude.com/docs/en/best-practices)
- [常用工作流程](https://code.claude.com/docs/en/common-workflows)
- [记忆 (CLAUDE.md)](https://code.claude.com/docs/en/memory)
- [技能](https://code.claude.com/docs/en/skills)
- [钩子参考](https://code.claude.com/docs/en/hooks)
- [环境变量](https://code.claude.com/docs/en/env-vars)
- [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
