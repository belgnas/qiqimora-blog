# 桌宠支持现代 Live2D 模型（`.moc3` / VTube Studio 模型）

> 状态：**已实施（路线 A）并通过端到端验证** —— 实现记录见第 13 节
> 编写日期：2026-09-26
> 目标读者：Mizuki 仓库维护者
>
> **修订记录**
> - 2026-09-26 初版：基于 `other/miku`（Cubism 5）调研
> - 2026-09-26 修订：维护者补充了 `other/DS鲸鱼娘`（Cubism 4，授权允许分享）。新增 §1.1 候选对比、§3.4 完整档案、§4.2 双模型实测、§5.2 路线 C（免打包）、§7.1/7.2/7.4 双模型尺寸与表情交互、§9.2 授权合规清单，并把推荐落地目标改为 **DS鲸鱼娘**
> - 2026-09-26 实施：按路线 A 落地（PixiJS 8 + `@naari3/pixi-live2d-display` Cubism 5 + 官方 Cubism Core 5.1.0）。**新增第 13 节**，记录实际改动、踩到的 3 个库级坑与无头 Chrome 验证结果；§5.6 关于 Core 分发的说法据实测更正
> - 2026-09-26 修复：维护者实测反馈"表情叠加 + 参数残留"，排查出**两个新的库级缺陷**并修复，记录在 **§13.8**；同时澄清反馈里那个"页面崩溃"是 dev server 状态问题、与插件无关

---

## 1. 背景与目标

### 1.1 目标

让博客右下角的桌宠（Pio 看板娘）能够加载**现代 Live2D 模型**，即 Cubism 3 / 4 / 5 导出的 `.moc3` 资源包 —— 包括 VTube Studio（VTS）里正在用的模型。

本机目前有两个候选模型，都已实测（见第 3、4 节）：

| 候选 | 位置 | moc3 版本 | 结论 |
|---|---|---|---|
| A. 初音未来 | `other/miku/` | 5（Cubism 5.0） | 技术可行，但**版权不允许上线**，只做本地验证 |
| **B. DS鲸鱼娘** | `other/DS鲸鱼娘/` | **4（Cubism 4.2）** | ✅ **无偿分享、允许商用直播，可直接上线** —— 推荐作为首个落地模型 |

### 1.2 本次明确不做的事

| 项目 | 决定 |
|---|---|
| 修改 `src/`、`public/` 里的运行代码 | ❌ 本次不做 |
| **miku** 放进 `public/` 并上线 | ❌ 不做（授权为"不可二传"，见 9.1） |
| **DS鲸鱼娘** 上线 | ✅ **授权允许**（"无偿分享"，见 9.2）—— 但本节仅作方案，实际动作另起 |
| 模型文件进 Git | ⏸ 暂缓（`other/` 已在 `.gitignore` 中） |
| 本地验证可行性 | ✅ 做（见第 8 节，全程不进构建产物） |

### 1.3 结论速览（TL;DR）

1. **当前桌宠用的是 Cubism 2.1 时代的运行时**，物理上无法加载 `.moc3`。
2. **`other/miku` 是一个完好、完整的 Cubism 5 模型**（moc3 格式版本号 = 5），不缺文件。
3. 已用官方 Cubism Core **实测**：Core 4.2.2 加载 miku → **失败（返回 null）**；Core 5.1.0 → **成功**。
4. **`other/DS鲸鱼娘` 是 Cubism 4 模型**（moc3 版本号 = 4），**Core 4.2.2 和 Core 5.1.0 都能加载** —— 可选路线因此变宽。
5. 所以答案不是"把模型路径改一改"，而是**换渲染运行时 + 整理模型资产**两件事一起做。
6. 改造可以做到**只替换运行时、几乎不动 Pio 的交互代码**（保留对话气泡、按钮、拖拽、`localStorage` 记忆）。
7. DS鲸鱼娘**开箱即用度远高于 miku**：贴图已经是 2048、总资产仅 4.25 MB、三角面只有 miku 的 1/4.5 —— **推荐用它做首个上线模型**。

---

## 2. 现状走查：现在这套桌宠是怎么跑的

### 2.1 调用链

```
src/config.ts  pioConfig
      │  enable / models[] / position / width / height / mode / dialog
      ▼
src/layouts/Layout.astro          ← 在 <body> 里、<slot> 之外
      │  ① <link rel="stylesheet" href="/pio/static/pio.css">
      │  ② {pioConfig.enable && <Pio client:idle />}
      ▼
src/components/widget/Pio.svelte  ← 只有 114 行，是个"装载器"
      │  ③ 注入 /pio/static/l2d.js
      │  ④ 注入 /pio/static/pio.js
      │  ⑤ new Paul_Pio({ mode, hidden, content, model })
      ▼
public/pio/static/pio.js          ← 插件逻辑（359 行，GPL 2.0，Dreamer-Paul 原作）
      │  对话气泡 / 按钮 / 拖拽 / localStorage
      │  ⑥ 调用全局 loadlive2d("pio", modelPath)  ← 唯一的渲染入口
      ▼
public/pio/static/l2d.js          ← 真正的渲染核心（151 KB，压缩后的单文件）
```

### 2.2 关键实现细节

| # | 事实 | 出处 |
|---|---|---|
| 1 | 配置集中在 `pioConfig`，含 `models` 数组（支持多模型轮换） | [src/config.ts:659](../src/config.ts#L659-L681) |
| 2 | CSS 与组件是**静态引入**，不走动态加载 | [src/layouts/Layout.astro:368](../src/layouts/Layout.astro#L368-L373)、[:407](../src/layouts/Layout.astro#L407-L408) |
| 3 | 组件 `onDestroy` 故意什么都不做，靠 swup 保持实例 | [Pio.svelte:93](../src/components/widget/Pio.svelte#L93-L97) |
| 4 | **swup 只替换 `main` 容器**，桌宠在 `<main>` 之外 → 切页不重载、不重新请求模型 | [astro.config.mjs:47](../astro.config.mjs#L47) |
| 5 | 移动端（`max-width: 1280px`）**连脚本都不加载**，直接 return | [Pio.svelte:85](../src/components/widget/Pio.svelte#L85-L87) |
| 6 | canvas 尺寸**硬编码自 config**：`280 × 250` | [Pio.svelte:103](../src/components/widget/Pio.svelte#L103-L108) |
| 7 | canvas 没有任何 DPR 处理（`devicePixelRatio` 在 `l2d.js` 中出现 **0** 次，`pio.css` 里也没有） | [public/pio/static/pio.css:135](../public/pio/static/pio.css#L135-L137) |
| 8 | 容器定位 `position: fixed; bottom: 0`，左右由 `left`/`right` class 决定 | [pio.css:13](../public/pio/static/pio.css#L13-L19) |
| 9 | 桌宠状态记在 `localStorage.posterGirl`（`"0"` = 已被用户关闭） | [pio.js:349](../public/pio/static/pio.js#L349) |
| 10 | **"换装"按钮只在 `models.length > 1` 时才创建** → 当前配置只有 1 个模型，该按钮实际上不存在 | [pio.js:180](../public/pio/static/pio.js#L180-L192) |
| 11 | 渲染入口只有一个全局函数：`loadlive2d(canvasId, modelPath)` | [pio.js:182](../public/pio/static/pio.js#L182)、[:310](../public/pio/static/pio.js#L310) |

> **第 11 条是整个改造的关键杠杆**：只要提供一个同名同签名的 `window.loadlive2d`，`pio.js` 可以一行不改。

### 2.3 结论：运行时是 Cubism 2.1，不是 Cubism 4/5

`public/pio/static/l2d.js` 的证据（全部实测统计）：

| 检查项 | 结果 | 含义 |
|---|---|---|
| 文件体积 | 151,375 字节 | 与 `live2d-widget@3.1.4` 的 `L2Dwidget.0.min.js`（151,421 字节）几乎相同 → 同源同代 |
| 出现 `Live2DFramework` | 4 次 | Cubism **2.1** 官方框架层的名字 |
| 出现 `PARAM_EYE_L_OPEN` | 有 | Cubism **2.1** 的旧参数命名（Cubism 3+ 是 `ParamEyeLOpen`） |
| 出现 `moc3` | **0 次** | 完全不认识 `.moc3` |
| 出现 `Cubism` / `pixi` / `PIXI` | **0 次** | 不是现代 pixi-live2d-display 那一套 |
| 出现 `devicePixelRatio` | **0 次** | 无高清屏适配 |

对应的现役模型 [public/pio/models/pio/model.json](../public/pio/models/pio/model.json) 也是 Cubism 2 格式（`.moc` + `motions/*.mtn` + `textures/*.png`，全部资源合计约 1.9 MB）。

**Cubism 2.1 与 Cubism 3+ 是两套完全不兼容的文件格式：**

| | Cubism 2.1（现状） | Cubism 3 / 4 / 5（VTS 模型） |
|---|---|---|
| 模型文件 | `.moc` | `.moc3` |
| 设置文件 | `model.json` | `model3.json` |
| 动作 | `.mtn` | `.motion3.json` |
| 表情 | 无独立文件 | `.exp3.json` |
| 物理 | `physics.json` | `.physics3.json` |
| 参数命名 | `PARAM_ANGLE_X` | `ParamAngleX` |

---

## 3. 候选模型 A：`other/miku`（Cubism 5，仅本地验证）

### 3.1 资产清单

| 文件 | 大小 | 说明 |
|---|---|---|
| `miku.moc3` | **9.07 MB** | 主模型，头部 `MOC3` + **版本号 5** → Cubism 5.0 格式 |
| `miku.4096/texture_00..05.png` | 25.40 MB | 6 张 **4096 × 4096** RGBA PNG |
| `miku.physics3.json` | 61 KB | 物理 |
| `miku.cdi3.json` | 15 KB | 参数/部件显示名（供 Cubism Editor 用，运行时可选） |
| `Scene1.motion3.json` | 2.1 KB | 待机动作（`Duration: 2.667s`, `Loop: true`） |
| `*.exp3.json` × 8 | 很小 | 圈圈 / 脸红 / 前倾 / 葱 / 唱歌 / 比心 / QQ人 / 水印 |
| `miku.vtube.json` | 50 KB | **VTS 专属配置**，网页端用不上（但里面有我们需要的信息） |
| `Untitled Animation.can3` | 28 KB | Cubism 动画工程文件，网页端用不上 |
| `模型使用说明.txt` | — | 授权说明，**务必先读**（见第 9 节） |

### 3.2 模型规模（用官方 Core 读出来的真实数据）

| 指标 | 值 |
|---|---|
| 画布尺寸 | **3500 × 8888**（竖长全身像，宽高比 ≈ 0.394） |
| 画布原点 | 1750, 4444（居中） |
| PixelsPerUnit | 4720 |
| 参数数 | 141 |
| 部件数 | 77 |
| Drawable 数 | **440** |
| 顶点数 | 43,246 |
| 三角面数 | **68,978** |
| MOC3 一致性检查 | ✅ 通过（`hasMocConsistency` = 1） |

> 对比：Live2D 官方样例 Haru 约 1 万面、moc3 仅 384 KB。**这是一个重度模型**，性能预算必须认真对待。

### 3.3 两个必须处理的"坑"

**坑 1：`miku.model3.json` 里没有 `Motions` 和 `Expressions`。**

[miku.model3.json](../other/miku/miku.model3.json) 的 `FileReferences` 只有 `Moc` / `Textures` / `Physics` / `DisplayInfo` 四项。VTS 把动作和表情登记在 `miku.vtube.json` 的 `Hotkeys` 数组里，**网页运行时不会去读那个文件** —— 所以直接加载的话：动不了、也没有表情。

VTS 里的 9 个热键（原文摘录）：

| 热键名 | Action | File |
|---|---|---|
| 圈圈 | ToggleExpression | `圈圈.exp3.json` |
| 脸红 | ToggleExpression | `脸红.exp3.json` |
| 前倾 | ToggleExpression | `前倾.exp3.json` |
| 葱 | ToggleExpression | `葱.exp3.json` |
| 唱歌 | ToggleExpression | `唱歌.exp3.json` |
| 比心 | ToggleExpression | `比心.exp3.json` |
| QQ人 | ToggleExpression | `QQ人.exp3.json` |
| 水印 | ToggleExpression | `水印.exp3.json` |
| （空） | RemoveAllExpressions | — |

这正好对应模型说明里写的"5 个动作按键 + 3 个表情按键"。

**坑 2：全是中文文件名。**

`模型使用说明.txt` 之外的资源名（`圈圈.exp3.json`、`Untitled Animation.can3`）在 Windows → Linux（Vercel 构建环境）路径上是要出事的 —— 仓库里已经踩过一次同类问题，见 [整改清单第 17 条](../src/content/posts/博客整改清单/index.md#L721-L764)。

### 3.4 候选模型 B：`other/DS鲸鱼娘`（Cubism 4，**推荐首个上线**）

维护者补充的模型，作者是 B 站 @氵六青（11272072）。

#### 授权：可以上线 ✅

[使用须知.txt](../other/DS鲸鱼娘/使用须知.txt) 全文只有 7 行，条款很宽松：

```
商用直播√
自印物料√

禁止任何形式的盗用以及出售，此模型为无偿分享
```

**这与 miku 的"不可二传二改"是完全不同的授权级别**：作者明确写了「无偿分享」，禁止的只是「盗用」和「出售」。把它放在免费博客上作为桌宠展示，符合授权意图。

> 稳妥起见仍建议：随资源附上作者署名与出处，方便他人追溯（作者也提供了 QQ 交流群 645169617 做使用答疑）。

#### 两个版本：`DS面捕版` 与 `DS鼠控版`

**对网页而言这两个版本没有区别** —— 实测两版 61 个文件里 **57 个完全相同**：

| 文件 | 状态 |
|---|---|
| `c_0120.moc3` | ✅ **sha256 完全一致**（`37d62cc7ebe2…`） |
| `c_0120.2048/*`（贴图） | ✅ 完全一致 |
| `motions/*`、其余 40 个 `.exp3.json` | ✅ 完全一致 |
| `c_0120.vtube.json` | ⚠️ 不同（相差 8 字节，只是 VTS 热键配置） |
| `icon.png` | ⚠️ 不同 |
| `items_pinned_to_model.json` | ⚠️ 不同 |
| `吐舌.exp3.json` | ⚠️ 不同（鼠控版多叠了 `ParamMouthForm` / `ParamMouthOpenY` 两个嘴型参数） |

差异纯粹来自 VTS 的「面捕」与「鼠控」操作方式；网页端自己读 `motions3.json` / `exp3.json`，**建议统一取 `DS面捕版`**（表情更"干净"，且 `按键表` 也是按它写的）。

#### 模型档案（官方 Core 实读）

| 指标 | 值 | 与 miku 对比 |
|---|---|---|
| **moc3 格式版本** | **4（Cubism 4.2）** | miku 是 5 |
| `c_0120.moc3` | **2.02 MB** | miku 9.07 MB（↓ 4.5×） |
| 贴图 | `texture_00.png` 2048×2048 (1.69 MB)<br>`texture_01.png` 1024×1024 (0.09 MB) | miku 是 6 × 4096（25.4 MB） |
| **总资产** | **4.25 MB** | miku 34.62 MB（↓ 8×） |
| 画布 | **4068 × 4068**（正方形，原点居中，ppu 4068） | miku 3500 × 8888（竖长） |
| 参数 / 部件 / drawable | 247 / 92 / **269** | miku 141 / 77 / 440 |
| 顶点 / 三角面 | 10,405 / **15,166** | miku 43,246 / 68,978（↓ 4.5×） |
| MOC3 一致性 | ✅ 通过 | ✅ 通过 |

#### 关键差异：Core 4 就能加载

| Core | `latestMocVersion` | 加载 `c_0120.moc3` |
|---|---|---|
| **4.2.2** | 4 | ✅ **成功**（`mocVersion` = 4） |
| **5.1.0** | 5 | ✅ 成功 |

> 这意味着 **DS鲸鱼娘既能跑在现代栈（Cubism 5）上，也能跑在 2021 年的老栈（Cubism 4 + Pixi 6）上** —— 路线选择因此多了一条"零构建 drop-in"（见 5.2 的路线 C）。这个自由度是 miku 没有的。

#### 体积：几乎不用做任何优化

| 项目 | 原始 | brotli | 说明 |
|---|---|---|---|
| `c_0120.moc3` | 2.02 MB | **1.01 MB** | 二进制，brotli 后减半 |
| `texture_00.png` | 1.69 MB | 1.69 MB | PNG 已压缩，brotli 无收益 |
| `texture_01.png` | 0.09 MB | 0.08 MB | |
| `physics3` + `cdi3` | 0.07 MB | ~0 | |

**线上实际传输 ≈ 2.8 MB**，而且**贴图不需要降采样**（已经是 2048 / 1024）—— 对比 miku 要先把 25 MB 贴图压到 0.85 MB 才能用。

> 有意思的是：**优化之后两者传输体积接近**（miku ≈ 2.9 MB vs DS ≈ 2.8 MB），但 **DS 的运行时开销只有 miku 的 1/4.5**（15k vs 69k 三角面），而且**零准备成本**。

#### 内容：44 个表情 + 7 个动作 + 1 个待机

从 `c_0120.vtube.json` 解析（网页端需要把它们抄进 `model3.json`）：

- **`ToggleExpression` × 44** —— 情绪类：脸红 / 星星眼 / 爱心眼 / 生气 / 悲伤 / 哭 / 开心兴奋 / 调皮 / 问号 / 感叹号 / 流汗 / 晕晕 / 阴暗 / 呆呆眼 / 闭眼口水 / 吐魂 / 吐舌 / 心跳 / 情绪花花；配饰/场景类：圆眼镜 / 方眼镜 / 椭圆眼镜 / 墨镜 / 头箍 / 单边马尾 / 猫猫贴纸 / 兔兔贴纸 / 蝴蝶结贴纸 / 魔爪 / 魔爪换色 / 深色桌布 / 鲸鱼 / 鲸鱼放桌上 / 手机换色 / 巴菲 / 蛋包饭 / 点菜按下 / 撤回 / 橡皮 / 画笔 / 双手比耶 / 喵喵手~喵~动画 / 冒爱心动画 / MoeMoeQ~
- **`TriggerAnimation` × 7** —— `番茄酱.motion3.json`（挤番茄酱）/ `开盖.motion3.json`（拿手机）/ `自拍.motion3.json` / `自拍简单.motion3.json` / `aidale.motion3.json`（重锤出击）/ `chuipaopao.motion3.json`（吹泡泡糖）/ `喷水.motion3.json`（鲸鱼喷水，仅 1 条曲线、0.467s）
- **`RemoveAllExpressions` × 1** —— "按键归位"，实现成"清空所有表情"很方便
- **待机动作**：`motions/idle.motion3.json`，`Duration: 4.0s / Fps: 30 / Loop: true / CurveCount: 89`（驱动马尾、`maoshou*`、大量 `j*` 次级参数）

#### 仍然需要做的事（比 miku 少很多）

| # | 事项 | 说明 |
|---|---|---|
| 1 | **`c_0120.model3.json` 补 `Motions` / `Expressions`** | 现状同样只有 `Moc` / `Textures` / `Physics` / `DisplayInfo`，VTS 配置在 `.vtube.json` 里，网页读不到 |
| 2 | **`LipSync` 组补参数** | 现在 `"Ids": []`，补 `ParamMouthOpenY` 才能做口型 |
| 3 | **中文文件名改 ASCII** | `motions/番茄酱.motion3.json`、`鲸鱼放桌上.exp3.json` 等约 50 个文件（同 §6.1 的做法） |
| 4 | **表情需要筛选，不能全塞** | 44 个表情全注册会让 `ExpressionManager` 冗余；且配饰类是"开关型"，需要 UI 交互设计（见 §7.4） |
| 5 | ~~贴图降采样~~ | ✅ **不需要**，已经是 2048 / 1024 |
| 6 | ~~moc3 压缩~~ | ✅ 不需要，交给 Vercel 的 brotli 即可 |

#### DS鲸鱼娘的 `model3.json` 补丁（建议稿）

```jsonc
{
  "Version": 3,
  "FileReferences": {
    "Moc": "c_0120.moc3",
    "Textures": ["textures/texture_00.png", "textures/texture_01.png"],
    "Physics": "c_0120.physics3.json",
    "DisplayInfo": "c_0120.cdi3.json",

    "Motions": {
      "Idle": [{ "File": "motions/idle.motion3.json", "FadeInTime": 1.0, "FadeOutTime": 1.0 }],
      // 7 个 TriggerAnimation，按用途命名
      "Tap": [
        { "File": "motions/chuipaopao.motion3.json" },
        { "File": "motions/aidale.motion3.json" },
        { "File": "motions/pengshui.motion3.json" }
      ],
      "Selfie": [
        { "File": "motions/kaigai.motion3.json" },
        { "File": "motions/zikai.motion3.json" },
        { "File": "motions/zikaijiandan.motion3.json" }
      ],
      "Sauce": [{ "File": "motions/fanqiejiang.motion3.json" }]
    },

    // 建议先接"情绪类"，配饰类留给后续的开关 UI
    "Expressions": [
      { "Name": "blush",    "File": "expressions/lianhong.exp3.json" },
      { "Name": "star",     "File": "expressions/xingxingyan.exp3.json" },
      { "Name": "heart",    "File": "expressions/aixinyan.exp3.json" },
      { "Name": "angry",    "File": "expressions/shengqi.exp3.json" },
      { "Name": "sad",      "File": "expressions/beishang.exp3.json" },
      { "Name": "cry",      "File": "expressions/ku.exp3.json" },
      { "Name": "excited",  "File": "expressions/kaixinxingfen.exp3.json" },
      { "Name": "naughty",  "File": "expressions/tiaopi.exp3.json" },
      { "Name": "question", "File": "expressions/wenhao.exp3.json" },
      { "Name": "exclaim",  "File": "expressions/gantanhao.exp3.json" },
      { "Name": "sweat",    "File": "expressions/liuhan.exp3.json" },
      { "Name": "dizzy",    "File": "expressions/yunyun.exp3.json" },
      { "Name": "gloomy",   "File": "expressions/yinan.exp3.json" },
      { "Name": "blank",    "File": "expressions/daidaiyan.exp3.json" },
      { "Name": "tongue",   "File": "expressions/tushe.exp3.json" },
      { "Name": "heartbeat","File": "expressions/xintiao.exp3.json" }
    ]
  },
  "Groups": [
    { "Target": "Parameter", "Name": "EyeBlink", "Ids": ["ParamEyeLOpen", "ParamEyeROpen"] },
    { "Target": "Parameter", "Name": "LipSync",  "Ids": ["ParamMouthOpenY"] }
  ],
  "HitAreas": [
    { "Id": "HitArea", "Name": "Head" }
  ]
}
```

> 上面 16 个表情是"情绪类"里最实用的一批。完整 44 个的映射见 `c_0120.vtube.json` 的 `Hotkeys`，按需增补即可。
> 文件名只给了英文示意，实际重命名时以 `按键表.txt` 的中文名为准做一一对应。

---

## 4. 实测验证记录（可复现）

为了不靠猜，我下载了官方 Cubism Core，在 Node 里真正跑了一遍加载。

### 4.1 测试方法

Cubism Core for Web 是 Emscripten 打包的单文件（WASM 以 base64 内联），可以在 Node 里用 `node:vm` 加几个 DOM stub 跑起来，然后直接调用 C API：

```js
const moc  = Live2DCubismCore.Moc.fromArrayBuffer(arrayBuffer);
const model = Live2DCubismCore.Model.fromMoc(moc);   // null 就是加载失败
console.log(Live2DCubismCore.Version.csmGetLatestMocVersion());
```

### 4.2 结果

**miku（moc3 版本 5）**：

| Core | `csmGetVersion()` | `latestMocVersion` | `Moc.fromArrayBuffer(miku.moc3)` |
|---|---|---|---|
| 4.2.2（`live2dcubismcore@1.0.2`，即老 pixi-live2d-display 配套的那份） | 4.2.0 | **4** | ❌ **null（加载失败）** |
| 5.1.0（官方 CDN 最新） | 5.1.0 | **5** | ✅ **成功**，一致性检查 = 1 |

**DS鲸鱼娘（moc3 版本 4）**：

| Core | `csmGetVersion()` | `latestMocVersion` | `Moc.fromArrayBuffer(c_0120.moc3)` |
|---|---|---|---|
| 4.2.2 | 4.2.0 | 4 | ✅ **成功**（`mocVersion` = 4；该 Core 无一致性检查 API） |
| 5.1.0 | 5.1.0 | **5** | ✅ **成功**，一致性检查 = 1 |

Core 内部导出的版本枚举常量也印证了编号体系：

```
MocVersion_Unknown, MocVersion_30, MocVersion_33, MocVersion_40, MocVersion_42, MocVersion_50
```

moc3 头部第 5 个字节即版本号：miku = `0x05` → `MocVersion_50`；DS鲸鱼娘 = `0x04` → `MocVersion_42`。

> **这就是"能不能用上"的确切答案**：
> - miku 是 Cubism 5 模型，**任何基于 Cubism 4 Core 的老运行库（包括 `pixi-live2d-display` 原版 v0.4.0 及其自带的 Core）都加载不了它** —— 必须换 Core 5。
> - DS鲸鱼娘是 Cubism 4 模型，**Core 4 / Core 5 都能加载** —— 因此多了一条"免打包的老栈路线"（见 5.2 路线 C）。

### 4.3 附带测出的体积数据

| 项目 | 原始 | gzip | brotli |
|---|---|---|---|
| `miku.moc3` | 9.07 MB | 3.14 MB | **1.97 MB** |
| 6 张贴图（合计） | 25.40 MB | — | PNG 已压缩，收益≈0 |

`moc3` 内部 43.9% 是零字节，所以 brotli 效果很好 —— Vercel 对静态资源默认上 brotli，**实际传输约 2 MB**。

贴图降采样实测（用项目已有的 `sharp`）：

| 方案 | 6 张合计 | 显存占用（RGBA） |
|---|---|---|
| 原始 4096 PNG | 25.40 MB | **6 × 64 MB = 384 MB** ⚠️ |
| 2048 WebP q80 | **1.98 MB** | 96 MB |
| 2048 WebP q92 | 2.46 MB | 96 MB |
| 2048 PNG（调色板） | 1.71 MB | 96 MB |
| 1024 WebP q80 | **0.85 MB** | 24 MB |

逐张明细：

| 文件 | 原始 | 2048 webp80 | 1024 webp80 |
|---|---|---|---|
| texture_00 | 4.27 MB | 267 KB | 121 KB |
| texture_01 | 2.97 MB | 277 KB | 123 KB |
| texture_02 | 3.45 MB | 251 KB | 108 KB |
| texture_03 | 6.25 MB | 497 KB | 197 KB |
| texture_04 | 5.89 MB | 410 KB | 177 KB |
| texture_05 | 2.56 MB | 321 KB | 145 KB |

> 桌宠的显示宽度只有 280 px。**1024 已经绰绰有余**，而 4096 会让集显/移动端直接爆显存。这不是"优化项"，是"必做项"。

---

## 5. 目标架构

### 5.1 现状 vs 目标

```
【现状】
pio.js ──loadlive2d()──▶ l2d.js (Cubism 2.1 核心 + 框架)
                              └── 只能吃 model.json + .moc + .mtn

【目标】
pio.js ──loadlive2d()──▶ 适配层 (~30 行)  ← 保持同名同签名，pio.js 不改
                              │
                              ├─ pixi.js 8              （WebGL 渲染器）
                              ├─ pixi-live2d-display    （Cubism 5 分支）
                              └─ live2dcubismcore.js    （Cubism 5 官方 Core）
                                     └── 能吃 model3.json + .moc3 + .motion3.json + .exp3.json
```

### 5.2 候选路线对比

因为两个候选模型的 moc3 版本不同（miku = 5，DS鲸鱼娘 = 4），可选的路线也不同：

| | **A. naari3 fork + Pixi 8**（推荐） | **B. easy-live2d 1.0** | **C. 老栈免打包 drop-in** |
|---|---|---|---|
| Cubism 支持 | **5**（向下兼容 3/4） | **5**（SDK R5） | 2.1 / 3 / **4** —— 不支持 5 |
| 能否加载 **miku**（v5） | ✅ | ✅ | ❌ **实测失败（null）** |
| 能否加载 **DS鲸鱼娘**（v4） | ✅ | ✅ | ✅ **实测成功** |
| Pixi 版本 | 8.x | 8.x | 6.x |
| **是否必须打包** | ✅ 必须（Pixi 8 无 UMD 全局，见 5.3） | ✅ 必须 | ❌ **不需要，纯 `<script>`** |
| 与 Pio 的契合度 | **高**：API 与原作者版本同源（`Live2DModel.from` / `.motion()` / `.expression()`） | 中：`Live2DSprite` 新 API，交互逻辑要重写 | **高**：`pio.js` 原作者用的就是这一代 API |
| 对仓库的侵入度 | 中：改 `Pio.svelte`、加 npm 依赖 | 高：重写桌宠组件 | **最低：加 3 个静态 js + 一个 `loadlive2d` 适配文件** |
| 维护状态 | 活跃（naari3 维护的 guansss 分支） | 活跃（2026 年） | ⚠️ 原作者已停更（Cubism 5 issue 至今未合），依赖 2021 年的老库 |
| 具体依赖 | `pixi.js@^8`<br>`@naari3/pixi-live2d-display@1.2.5` | `pixi.js@^8`<br>`easy-live2d@1.0.0` | `pixi.js@6.5.10/dist/browser/pixi.min.js`<br>`live2dcubismcore@1.0.2/live2dcubismcore.min.js`（Core 4.2.2）<br>`pixi-live2d-display@0.4.0/dist/cubism4.min.js` |

**结论：**

- 如果目标是**长期只维护一套运行时**，或将来还想上 Cubism 5 的模型 → **走路线 A**。
- 如果**只想尽快让 DS鲸鱼娘上线、改动尽量小** → **路线 C 完全可行**（因为它是 moc3 v4，Core 4 就吃），三个文件都是 UMD、加载顺序为 `pixi.min.js` → `live2dcubismcore.min.js` → `cubism4.min.js`，然后提供 `window.loadlive2d` 即可，**`pio.js` 连一行都不用改，也不用碰构建配置**。
- 路线 B 仅在 A 出问题时作为备选。

> 折中选项 D：`pixi-live2d-display-lipsyncpatch`（peer 依赖 `pixi.js ^7`，带唇形同步，UMD 实测也是挂到 `PIXI.live2d`）。Pixi 7 的 `dist/pixi.min.js` **是有全局 `PIXI` 的**（实测 `var PIXI=function(_){…}`），所以它同样能做到"免打包"。只是多一个第三方分支需要信任。

### 5.3 一个必须先知道的技术约束：Pixi 8 没有 UMD 全局

**实测**：`pixi.js@8.6.6/dist/pixi.min.js`（665,775 字节）里**唯一的 `PIXI` 字符串是一句 WebGPU 调试标签**，没有任何 `globalThis.PIXI = ...` 赋值；`package.json` 的 `exports` 也只提供 `import` / `require` 两种入口。

作为对照，老版本都**有**全局：

| 版本 | 分发路径 | 全局 `PIXI` |
|---|---|---|
| Pixi 6.5.10 | `dist/browser/pixi.min.js`（460,321 字节） | ✅ `var PIXI=…` |
| Pixi 7.4.3 | `dist/pixi.min.js`（456,150 字节） | ✅ `var PIXI=…` |
| **Pixi 8.6.6** | `dist/pixi.min.js` | ❌ **无** |

这对本项目有两层含义：

1. **路线 A（Pixi 8）**：❌ 纯 `<script>` 挂 CDN 走不通（`@naari3/pixi-live2d-display` 的 UMD 构建依赖全局 `PIXI`，而 Pixi 8 不再提供）；但有 ✅ 本项目是 Astro + Vite，`import` 打包是原生能力，走 npm 依赖反而是最自然的路径，还能顺带做 tree-shaking 和 hash 缓存。
2. **路线 C（Pixi 6）**：✅ 纯 `<script>` 可行 —— 这正是它"免打包"的基础。

所以路线 A 的方案是：**在 Svelte 组件里 `import`，然后把 `loadlive2d` 挂到 `window` 上给 `pio.js` 用。**

### 5.4 适配层设计（骨架，待实测调整）

```js
// 目标：替换掉全局 loadlive2d，签名保持一致，pio.js 零改动
import * as PIXI from "pixi.js";
import { Live2DModel, MotionPreloadStrategy } from "@naari3/pixi-live2d-display/cubism5";

let current = { app: null, model: null };

window.loadlive2d = async (canvasId, modelPath) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // 就地销毁上一个模型（换装时会再次调用）
  current.model?.destroy();
  current.app?.destroy(true, { children: true });
  current.model = null; current.app = null;

  const app = new PIXI.Application();
  await app.init({
    canvas,
    backgroundAlpha: 0,                                   // 透明背景，Pio 的 CSS 依赖这一点
    resolution: Math.max(window.devicePixelRatio || 1, 1), // ← 现状缺的就是这个
    autoDensity: true,
  });
  current.app = app;

  const model = await Live2DModel.from(modelPath, {
    motionPreload: MotionPreloadStrategy.IDLE,
  });
  current.model = model;

  // 模型原生画布 3500×8888：等比缩放到宿主 canvas
  const scale = Math.min(canvas.clientWidth / model.width, canvas.clientHeight / model.height);
  model.scale.set(scale * (window.devicePixelRatio || 1));
  model.anchor.set(0.5, 0.5);
  model.position.set(app.renderer.width / 2, app.renderer.height / 2);

  app.stage.addChild(model);
};
```

配套要点：

- **点击命中**：`pio.js` 现在用 `canvas.onclick` 弹对话（[pio.js:144](../public/pio/static/pio.js#L144-L153)），改成 Pixi 渲染后 canvas 上的 `onclick` 依然有效，但更精细的做法是监听 `model.on('hit', ...)`（需在 `model3.json` 里加 `HitAreas`）。
- **多模型轮换**：`pioConfig.models` 是数组，适配层要能反复调用不泄漏 —— 上面骨架里的 `destroy()` 就是为此。
- **清理时机**：Svelte 组件 `onDestroy` 目前是空实现（刻意为了 swup 保活）。如果改造后要支持真正的销毁，需要补 `destroy` 逻辑。

### 5.5 依赖清单

| 包 | 版本 | 说明 |
|---|---|---|
| `pixi.js` | `^8` | WebGL 渲染器 |
| `@naari3/pixi-live2d-display` | `1.2.5` | Cubism 5 分支，peer 依赖 `pixi.js ^8.0.0` |
| `live2dcubismcore.js` | Cubism 5 SDK for Web | **不进 npm**，由站点自行托管（见 5.6） |

### 5.6 Cubism Core 的获取与托管

- 来源：**Live2D Cubism SDK for Web**（[官方下载页](https://www.live2d.com/en/sdk/download/web/)），取其中的 `Core/live2dcubismcore.js`。
- 官方也提供了一个[直链](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)，但 `pixi-live2d-display` 官方文档明确写着 *"the direct link is quite unreliable, **don't use it in production**"* —— 只适合本地实验。
- 托管位置建议：`public/live2d/core/live2dcubismcore.min.js`，用普通 `<script>` 在桌宠组件挂载前加载（或 `import` 后手动注入）。
- **合规**：这份文件受 Live2D 自有许可约束（个人 / 小规模免费，有营收门槛），下载与分发前请阅读并同意其条款。

---

## 6. 模型资产处理细则

模型资源**尚未**放进仓库。以下步骤在"本地验证"阶段对 `other/miku/` 的副本操作即可。

### 6.1 重命名（中文 → ASCII）

| 原文件 | 建议名 |
|---|---|
| `圈圈.exp3.json` | `circle.exp3.json` |
| `脸红.exp3.json` | `blush.exp3.json` |
| `前倾.exp3.json` | `leanforward.exp3.json` |
| `葱.exp3.json` | `leek.exp3.json` |
| `唱歌.exp3.json` | `sing.exp3.json` |
| `比心.exp3.json` | `heart.exp3.json` |
| `QQ人.exp3.json` | `chibi.exp3.json` |
| `水印.exp3.json` | `watermark.exp3.json` |
| `Scene1.motion3.json` | `idle.motion3.json` |
| `miku.4096/` | `textures/`（同时改名成 `texture_00.webp` 等） |

### 6.2 贴图降采样

用项目现有的 `sharp` 即可（`sharp` 已是依赖）：

```bash
node -e "
const sharp=require('sharp');const fs=require('fs');
const src='other/miku/miku.4096', dst='<输出目录>';
fs.mkdirSync(dst,{recursive:true});
for (const f of fs.readdirSync(src).filter(f=>f.endsWith('.png')))
  sharp(src+'/'+f).resize(1024,1024,{fit:'fill'})
    .webp({quality:80}).toFile(dst+'/'+f.replace('.png','.webp'))
    .then(i=>console.log(f,'->',(i.size/1024).toFixed(0)+'KB'));
"
```

> 注意：`pixi-live2d-display` 对 WebP 贴图的支持需要实测确认。若遇到问题，退回到 **2048 PNG（调色板压缩，1.71 MB）** 也是可接受的方案。

### 6.3 `model3.json` 补丁

参照 Live2D 官方样例模型（Haru）的 schema，需要补两处：

```jsonc
{
  "Version": 3,
  "FileReferences": {
    "Moc": "miku.moc3",
    "Textures": [
      "textures/texture_00.webp",
      "textures/texture_01.webp",
      "textures/texture_02.webp",
      "textures/texture_03.webp",
      "textures/texture_04.webp",
      "textures/texture_05.webp"
    ],
    "Physics": "miku.physics3.json",
    "DisplayInfo": "miku.cdi3.json",

    // ① 新增：待机动作
    "Motions": {
      "Idle": [
        { "File": "motions/idle.motion3.json", "FadeInTime": 1.0, "FadeOutTime": 1.0 }
      ]
    },

    // ② 新增：表情（取自 miku.vtube.json 的 Hotkeys）
    //    ⚠️ 故意不包含 watermark：模型说明写明水印默认打开、需手动关闭
    "Expressions": [
      { "Name": "circle",  "File": "expressions/circle.exp3.json" },
      { "Name": "blush",   "File": "expressions/blush.exp3.json" },
      { "Name": "sing",    "File": "expressions/sing.exp3.json" },
      { "Name": "leek",    "File": "expressions/leek.exp3.json" },
      { "Name": "heart",   "File": "expressions/heart.exp3.json" },
      { "Name": "chibi",   "File": "expressions/chibi.exp3.json" },
      { "Name": "lean",    "File": "expressions/leanforward.exp3.json" }
    ]
  },

  // ③ 保留原有的 Groups（顶层的，不在 FileReferences 里）
  "Groups": [
    {
      "Target": "Parameter",
      "Name": "EyeBlink",
      "Ids": ["ParamEyeROpen", "ParamEyeLOpen"]
    },
    {
      // ④ 现有配置这里 Ids 是空的 → 补上，才能做口型同步
      "Target": "Parameter",
      "Name": "LipSync",
      "Ids": ["ParamMouthOpenY"]
    }
  ],

  // ⑤ 可选：加命中区域，让"戳头/戳身体"有不同反应
  "HitAreas": [
    { "Id": "HitArea",  "Name": "Head" },
    { "Id": "HitArea2", "Name": "Body" }
  ]
}
```

参数名 `ParamEyeROpen` / `ParamEyeLOpen` / `ParamMouthOpenY` 已从 [miku.cdi3.json](../other/miku/miku.cdi3.json) 中核对存在。

### 6.4 最终资产结构建议

```
miku/
├── miku.model3.json
├── miku.moc3                    (9.07 MB，brotli 后约 2 MB)
├── miku.physics3.json
├── miku.cdi3.json               (可选，运行时可省，省 ~15 KB)
├── textures/texture_00..05.webp (1024 → 0.85 MB / 2048 → 1.98 MB)
├── motions/idle.motion3.json
└── expressions/*.exp3.json      (7 个，不含水印)
```

---

## 7. 显示尺寸与性能预算

### 7.1 尺寸必须重调

现在是 `pioConfig.width = 280 / height = 250`，而两个候选模型的画布**都是正方形的放大版**：

| 模型 | 原生画布 | 宽高比 | 280 px 宽时的等比高度 |
|---|---|---|---|
| miku | 3500 × 8888 | 0.394（竖长全身） | ≈ 711 px |
| DS鲸鱼娘 | **4068 × 4068** | **1.0（正方形）** | **280 px** |

问题在于：

- miku：280 px 宽 → 约 711 px 高，`250` 的容器高度完全不够，`position: fixed; bottom: 0` 会把上半身裁掉；
- DS鲸鱼娘：正方形画布里有大量"桌面/背景/配件"元素，若整幅塞进 280×250，**角色本体只会占中间一小块**，看起来很小 —— 需要**放大并裁掉多余留白**（调整 `scale` 与 `anchor`，或做一个只框住角色的相机区域）；
- 两者共同的问题：canvas 后备缓冲固定 280×250，且无 DPR → 桌面高清屏上必然发虚。

**建议**：

- 不要再用 `width/height` 硬编码，改为 **CSS 驱动 + `ResizeObserver` 同步后备缓冲**，例如 `height: clamp(420px, 62vh, 820px); width: auto`；
- DS鲸鱼娘额外需要一个"取景框"配置（`scale` / `anchor` / 偏移），建议做成 `pioConfig` 里的新字段，一个模型一套参数。

### 7.2 体积与性能对比

| | 现役 pio 模型 | miku（原样） | miku（整理后） | **DS鲸鱼娘** |
|---|---|---|---|---|
| 传输体积 | ~1.9 MB | **34.5 MB** | 约 2.9 MB（moc3 brotli 2.0 + 贴图 0.85） | **约 2.8 MB**（moc3 brotli 1.01 + 贴图 1.78） |
| 显存（贴图） | ~10 MB | **384 MB** ⚠️ | 24 MB | **21 MB** |
| 三角面 | 低 | 68,978 | 68,978（不变） | **15,166** |
| 参数 / Drawable | 少 | 141 / 440 | 141 / 440 | 247 / **269** |
| 需要做的资产优化 | — | 贴图降采样 + 重命名 | — | **仅重命名** |
| 授权可上线 | — | ❌ | ❌ | ✅ |

**注意**：三角面和 drawable 数量是**改不掉**的 —— miku 的 `moc3` 即使 brotli 后也有约 2 MB，这是加载时的硬成本。

**关键对比结论**：优化之后**两者传输体积几乎一样**（2.9 vs 2.8 MB），但 **DS鲸鱼娘的渲染开销只有 miku 的 1/4.5**，且**零资产准备成本**。这就是推荐先上 DS鲸鱼娘的核心原因。

### 7.3 性能建议

1. **懒加载**：不要和首屏抢带宽。现有实现用 `client:idle`（[Layout.astro:408](../src/layouts/Layout.astro#L408)），建议改为「首屏渲染完成后 + 请求空闲」再拉模型。
2. **降级策略**：低端设备（`navigator.hardwareConcurrency` 低 / `deviceMemory` 小）或移动端直接不加载 —— 现有代码已有移动端直接 return 的先例，可复用该思路。
3. **`motionPreload`**：用 `IDLE`，不要用 `ALL`（会并发拉一堆动作文件，撞浏览器并发连接上限）。
4. **帧率上限**：模型越重越明显（miku 440 drawable 在弱机上跑 60 fps 会烫）。可考虑把 Pixi ticker 限制到 30 fps；DS鲸鱼娘（269 drawable）压力小得多。
5. **`DisplayInfo`（cdi3.json）可以省掉**，运行时用不到（DS鲸鱼娘可省 28 KB，miku 可省 15 KB）。

### 7.4 表情与动作的交互设计（新问题）

一旦支持 `.exp3.json`，就出现一个**现有 Pio 完全没有的交互维度**：

- 现在只有 1 个"换装"按钮，且只在 `models.length > 1` 时出现；
- DS鲸鱼娘有 **44 个表情 + 7 个动作**，全塞进一个按钮轮询体验很差。

**建议的最小可用设计**（不需要改 `pio.js`，只在适配层和配置里做）：

| 触发方式 | 行为 | 实现位置 |
|---|---|---|
| 点击模型 | 随机播一个"情绪类"表情 + 气泡对话 | `pio.js` 已有的 `canvas.onclick` → 适配层挂 hook |
| 悬停模型 | 随机播一个轻量动作（如 `喷水`） | `model.on('hit')` 或 CSS hover |
| 新增按钮 | 在 `.pio-action` 里加一个"表情"按钮，循环切换表情 | 需少量扩展 `pio.js`（或复制一份改名，避免直接改上游文件） |
| 时段联动 | 早上 `star`、深夜 `gloomy`、久坐 `sweat` | 适配层自己定时器 |

**配置化建议**：在 `pioConfig` 增加 `expressions?: string[]` 与 `expressionBindings?: Record<string, string>`，把"哪些表情参与轮换"交给配置，避免代码里写死。

---

## 8. 本地验证方案（不触网、不进仓库、不上线）

两条路，**推荐 Lab 路线**，因为它连 Astro 构建都不碰。

### 8.1 路线 1（推荐）：独立实验目录 `other/live2d-lab/`

`other/` 已在 [.gitignore](../.gitignore) 里，所以在里面折腾**绝对不会进 Git、不会被 Vercel 部署**。

```
other/live2d-lab/
├── index.html          ← 一个最小预览页（纯 ESM + import map，无需打包器）
├── model-a/            ← miku 模型副本（Cubism 5，已按第 6 节整理）
├── model-b/            ← DS鲸鱼娘 副本（Cubism 4，只要重命名 + 补 model3.json）
└── core/
    └── live2dcubismcore.js   ← Cubism Core（**建议用 Core 5**，两个模型都能吃）
```

> **Core 选哪个**：miku 必须 Core 5；DS鲸鱼娘 Core 4 / Core 5 都行。为了只维护一份，**统一用 Core 5**（实测两个模型都加载成功）。

`index.html` 关键部分（用 `?m=b` 在两个模型间切换，方便对比）：

```html
<!-- Cubism Core 必须以普通 script 先加载 -->
<script src="./core/live2dcubismcore.js"></script>

<!-- 用 import map 直接吃 jsDelivr 的 ESM 构建，免打包 -->
<script type="importmap">
{
  "imports": {
    "pixi.js": "https://cdn.jsdelivr.net/npm/pixi.js@8/+esm",
    "@naari3/pixi-live2d-display/cubism5": "https://cdn.jsdelivr.net/npm/@naari3/pixi-live2d-display@1.2.5/+esm"
  }
}
</script>

<canvas id="pio" width="480" height="720"></canvas>
<script type="module">
  import * as PIXI from "pixi.js";
  import { Live2DModel } from "@naari3/pixi-live2d-display/cubism5";
  window.PIXI = PIXI;   // 若库内部仍引用全局 PIXI.Ticker，需要这一行

  const useB = new URLSearchParams(location.search).get("m") === "b";
  const MODEL = useB ? "./model-b/c_0120.model3.json" : "./model-a/miku.model3.json";

  const canvas = document.getElementById("pio");
  const app = new PIXI.Application();
  await app.init({ canvas, backgroundAlpha: 0, resolution: devicePixelRatio, autoDensity: true });

  const model = await Live2DModel.from(MODEL);
  app.stage.addChild(model);

  // 调尺寸：miku 是 3500x8888 竖长，DS鲸鱼娘是 4068x4068 正方形 —— 取景参数要分开调
  const s = Math.min(canvas.clientWidth / model.width, canvas.clientHeight / model.height);
  model.scale.set(s); model.anchor.set(0.5, 0.5);
  model.position.set(app.renderer.width / 2, app.renderer.height / 2);

  // 验证动作 + 表情
  model.motion("Idle");                 // 待机
  window.m = model;                     // 控制台里手动测 model.expression("blush")
</script>
```

跑起来：

```bash
npx --yes serve other/live2d-lab
# 或者：python -m http.server 8080 --directory other/live2d-lab
```

### 8.2 路线 2：`public/live2d-dev/` + `.gitignore`

如果想直接在看板娘里见效果，把模型放到 `public/live2d-dev/` 并**立刻**加进 `.gitignore`：

```bash
echo "public/live2d-dev/" >> .gitignore
git status --short          # 必须为空，确认没被跟踪
```

优点：`pnpm dev` 直接能跑，路径就是 `/live2d-dev/miku.model3.json`。
缺点：本地 `pnpm build` 会把它们复制进 `dist/`；且依赖开发者自觉，容易误提交。

**这个"验证完请删除"的约束只针对 miku。** DS鲸鱼娘授权允许分享，将来正式上线时的目标是 `public/live2d/ds-whale/`（进 Git、进构建产物）—— 所以它走这条路线时**不需要刻意回避提交**，只要注意别把 miku 一起带进去。

### 8.3 本地验证检查清单

通用：

- [ ] Core 版本确认：控制台打印 `Live2DCubismCore.Version.csmGetLatestMocVersion()` === `5`
- [ ] 模型加载成功（`Live2DModel.from` resolve）
- [ ] 待机动作自动循环播放
- [ ] 眨眼正常（`Groups.EyeBlink` 生效）
- [ ] 模型不被容器裁切
- [ ] 高清屏下不发虚（`resolution` 生效）
- [ ] 面板里确认显存与帧率可接受
- [ ] `git status --short` 干净 —— **miku 没有被提交**

**miku 专项**：

- [ ] 贴图 6 张全部 200，无 404（重点看改名后的中文路径是否还有残留引用）
- [ ] 7 个表情逐个 `model.expression("名字")` 生效
- [ ] **水印不可见**（确认没接 `watermark.exp3.json`）

**DS鲸鱼娘 专项**：

- [ ] 2 张贴图 200
- [ ] 60 个中文文件名全部改名后引用无 404
- [ ] 16 个"情绪类"表情逐个生效
- [ ] 7 个动作（`Idle` / `Tap` / `Selfie` / `Sauce` 组）能触发
- [ ] "按键归位"（清空全部表情）能生效
- [ ] **取景框参数调到角色不糊、不变形、留白合适**
- [ ] 同时开多个"配饰类"表情时没有明显穿模
- [ ] 路线 C（Pixi 6 老栈）也跑一遍 —— 若走的是路线 C，这是最重要的验证

---

## 9. 许可与合规（重要）

### 9.1 候选 A（miku）：**不可上线**

[模型使用说明.txt](../other/miku/模型使用说明.txt) 原文要点：

> 1. 模型可免费使用作为桌宠或 VTS 面捕使用，但**不可二传二改**！！！
> 2. 严禁将该模型文件使用于任何商用用途，严禁直播牟利……
> 5. 如有非商用需求，使用此模型发表视频，请表明出处

**含义**：把它放进 `public/` 就等于在公网公开提供下载，实质上是**二次分发**。虽然"自己博客上展示"和"打包给别人下载"在意图上不同，但技术上无法区分 —— 任何人 `curl` 就能拿到 `miku.moc3`。

**决定（已与维护者确认）**：miku 只做**本地验证**，不进 `public/`、不进 Git、不上线。用途是验证"对 Cubism 5 模型的通用支持能力"。

### 9.2 候选 B（DS鲸鱼娘）：**可以上线** ✅

[使用须知.txt](../other/DS鲸鱼娘/使用须知.txt) 全文：

```
商用直播√
自印物料√

禁止任何形式的盗用以及出售，此模型为无偿分享
```

作者明确「**无偿分享**」，禁止的只有「盗用」和「出售」。放进博客 `public/` 作为桌宠展示**符合授权意图**（这也是本方案推荐它作为首个落地模型的原因之一）。

**上线时的合规清单**：

- [ ] 在页面或 `README` 中**标注作者**：模型制作 B 站 @氵六青（11272072）
- [ ] 保留 `使用须知.txt` 原文，随资源一起留在目录里
- [ ] 不修改模型本体（本方案只做**重命名 + `model3.json` 补充元数据**，不改 `.moc3` / 贴图内容 —— 这一点是有意为之）
- [ ] 若将来要"二创改模"，需先联系作者确认（禁止项里没有明说，但保守为佳）
- [ ] 商用/直播相关用途另见作者说明，超出博客展示范围时建议在群里问一次

> 如果将来还想上别的模型，判定标准很简单：**看授权文件里有没有类似「无偿分享 / 允许转载 / 允许再分发」的表述**。Live2D 官方样例模型（Hiyori / Haru / Rice / Ren 等）走 [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)，同样可用。

### 9.3 Cubism Core 的许可

`live2dcubismcore.js` 属于 Live2D 专有软件，受 [Live2D Proprietary Software License Agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html) 约束（个人 / 小规模免费，有营收门槛）。使用前请确认符合条件。

> **更正**：本文早期版本写的是"不要把它再分发给第三方"。实际下载到的文件头部明确写着
> *"This file corresponds to the **Redistributable Code** in the agreement."* ——
> 也就是说，在符合该许可（含营收门槛）的前提下，**随应用一起分发是允许的**。
> 本项目因此把它放在 `public/live2d/core/` 随站点一起部署（这也是社区通行做法）。

**两个模型都绕不开这一条** —— Core 是渲染 `.moc3` 的必需品，与模型授权是两回事。

---

## 10. 实施路线图（真正动手时）

分五步，每步都可独立验证、独立回滚。**建议以 DS鲸鱼娘为首个落地目标**（授权允许、零资产优化、渲染开销小）。

| 阶段 | 内容 | 涉及文件 | 验证方式 | 回滚 |
|---|---|---|---|---|
| **P0** | 本地验证：按第 8.1 节搭 `other/live2d-lab/`，先跑通 **DS鲸鱼娘（moc3 v4，Core 4/5 都可）**，再跑 miku（必须 Core 5） | `other/live2d-lab/**`（gitignored） | 第 8.3 检查清单 | 删目录即可 |
| **P1** | 模型资产整理：重命名成 ASCII + 补齐 `model3.json` 的 `Motions`/`Expressions`/`LipSync`（见 3.4 与 6.3） | 模型目录副本 | 本地 Lab 里动作/表情都能触发 | 用原始副本覆盖 |
| **P2** | 接入运行时（二选一）：<br>**路线 A** `pnpm add pixi.js @naari3/pixi-live2d-display`<br>**路线 C** 三个 UMD 静态文件 | `package.json` + `public/live2d/` 或 `public/pio/static/` | `pnpm check` 通过；页面能看到模型 | 删依赖/删文件 |
| **P3** | 写适配层并接管渲染：提供 `window.loadlive2d`；**`l2d.js` 先保留不删** | 新增 `live2d-runtime.ts`，改 `Pio.svelte` | 桌面端能看到模型、能戳、能拖 | 恢复 `Pio.svelte` 里 `l2d.js` 的加载 |
| **P4** | 尺寸 / DPR / 取景 / 表情交互：`pioConfig` 增字段、canvas 分辨率、懒加载、低端降级、§7.4 的交互设计 | `src/config.ts`、`Pio.svelte`、`pio.css` | 移动端不加载、高清屏清晰、帧率可接受、表情可触发 | 改回原 config |

> **路线 C 的 P2/P3 特别短**：三个 `<script>` + 一个约 30 行的 `loadlive2d` 适配文件即可，**完全不用碰 npm 依赖、`package.json` 和构建配置**。如果只想先把 DS鲸鱼娘跑起来看效果，这是最快的路径。

**关键回滚设计**：P3 里**不要删 `public/pio/static/l2d.js`**。保留它意味着可以随时把 `Pio.svelte` 里的脚本加载路径切回去，一键恢复 Cubism 2.1 的老猫娘。

---

## 11. 未验证项与风险（诚实清单）

本方案中的**事实性结论**都经过实测（第 3.4、4 节），但以下几条**尚未验证**，动手前需要确认：

| # | 未验证项 | 影响 | 建议验证方式 |
|---|---|---|---|
| 1 | 浏览器里实际渲染效果 | 中 | 沙箱内无浏览器，需在本地按 P0 跑通 |
| 2 | `@naari3` 分支是否仍需手动 `Live2DModel.registerTicker(Ticker)` | 低 | 若模型不动，先加这行 |
| 3 | WebP 贴图是否被正常加载 | 低 | **只影响 miku**（DS鲸鱼娘用原生 PNG，不涉及） |
| 4 | VTS 的 `physics3.json` 在不同 Core 下是否表现一致 | 低 | 观察头发/马尾摆动是否正常 |
| 5 | miku 的 68,978 面在目标设备上的实际帧率 | 中 | Chrome Performance 面板实测 |
| 6 | 大 `moc3` 在弱网/移动端的加载体验 | 中 | 节流到 Slow 4G 测一次（DS 反而只有 1 MB brotli，风险低） |
| 7 | `easy-live2d`（路线 B）的交互 API 完整度 | 低 | 仅在路线 A 出问题时才需要评估 |
| 8 | **路线 C 的老栈（Pixi 6 + pld 0.4.0）与 DS鲸鱼娘的实际兼容性** | 中 | Core 层已实测可加载，但**渲染/表情/动作调度是否全部正常未验证** —— P0 里务必试一遍 |
| 9 | DS鲸鱼娘正方形画布在桌宠位置的**取景参数** | 中 | 需肉眼调 `scale` / `anchor`，没有现成公式 |
| 10 | 44 个表情里哪些**互相冲突**（同时开多个配饰） | 低 | 配饰类建议做成互斥开关 |

---

## 12. 附录

### A. 复现第 4 节实测的最小脚本

```js
// verify-core.mjs —— Node 24+，无需 npm 依赖
// 用法: node verify-core.mjs <core.js 路径> <xxx.moc3 路径>
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const [corePath, mocPath] = process.argv.slice(2);
const src = readFileSync(corePath, "utf8");

// Cubism Core 是 Emscripten 构建，需要一点 DOM stub
const ctx = {
  console, TextDecoder, TextEncoder, fetch, WebAssembly, performance,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Promise, URL, URLSearchParams, Blob, Buffer, process,
  require: req, __dirname: process.cwd(), __filename: corePath,
  location: { href: "file:///core.js", protocol: "file:" },
  navigator: { userAgent: "node" },
  document: {
    currentScript: { src: "file:///core.js" },
    createElement: () => ({ setAttribute() {}, style: {}, addEventListener() {} }),
    getElementsByTagName: () => [], addEventListener() {}, removeEventListener() {},
    body: { appendChild() {} }, head: { appendChild() {} },
  },
};
ctx.globalThis = ctx; ctx.self = ctx; ctx.window = ctx;
ctx.addEventListener = () => {}; ctx.removeEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: corePath });

const C = ctx.Live2DCubismCore;
await new Promise((r) => setTimeout(r, 200));   // 等 WASM 初始化

const v = C.Version.csmGetVersion();
console.log("Core 版本          :", `${v >>> 24}.${(v >> 16) & 255}.${(v >> 8) & 255}`);
console.log("latestMocVersion   :", C.Version.csmGetLatestMocVersion());

const buf = readFileSync(mocPath);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const moc = C.Moc.fromArrayBuffer(ab);
console.log("Moc.fromArrayBuffer:", moc ? "✅ 成功" : "❌ 失败（null）");

if (moc) {
  console.log("一致性检查         :", moc.hasMocConsistency(ab));
  const model = C.Model.fromMoc(moc);
  const ci = model.canvasinfo;
  console.log("画布               :", ci.CanvasWidth, "x", ci.CanvasHeight);
  console.log("参数/部件/drawable :", model.parameters.count, "/", model.parts.count, "/", model.drawables.count);
}
```

实测输出对照：

```
# Core 4.2.2（核心自身也会打印一行版本日志）
Core 版本          : 4.2.0
Live2D Cubism SDK Core Version 4.2.2
latestMocVersion   : 4
Moc.fromArrayBuffer: ❌ 失败（null）

# Core 5.1.0
Core 版本          : 5.1.0
Live2D Cubism SDK Core Version 5.1.0
latestMocVersion   : 5
Moc.fromArrayBuffer: ✅ 成功
一致性检查         : 1
画布               : 3500 x 8888
参数/部件/drawable : 141 / 77 / 440
```

> 上面的输出是本机真实跑出来的，脚本与文档同步维护 —— 改动脚本文本后请重跑一次确认输出一致。

### B. 参考链接

- [pixi-live2d-display 官方文档](https://guansss.github.io/pixi-live2d-display/) — 原版（Cubism 2/3/4）
- [@naari3/pixi-live2d-display](https://github.com/naari3/pixi-live2d-display) — Cubism 5 维护分支
- [pixi-live2d-display issue #118 "Cubism 5 support"](https://github.com/guansss/pixi-live2d-display/issues/118) — 原版至今未支持 Cubism 5
- [easy-live2d](https://panzer-jack.github.io/easy-live2d/en/guide/installation.html) — 路线 B 候选
- [Live2D Cubism SDK for Web 下载](https://www.live2d.com/en/sdk/download/web/) — Cubism Core 来源
- [PixiJS v8 迁移指南](https://pixijs.com/8.x/guides/migrations/v8) — 异步 init 等破坏性变更
- [Live2D 选择目标版本（含各 SDK 版本能力对照）](https://docs.live2d.com/zh-CHS/cubism-editor-manual/target-version-selection/)
- 仓库内相关：[整改清单第 17 条](../src/content/posts/博客整改清单/index.md#L721-L764)（上一套被闲置的 Live2D 资源）

### C. 术语表

| 术语 | 含义 |
|---|---|
| **moc / moc3** | Cubism 模型二进制。`moc` = Cubism 2.1；`moc3` = Cubism 3/4/5 |
| **moc3 版本号** | moc3 头部第 5 字节。1→3.0，2→3.3，3→4.0，4→4.2，**5→5.0** |
| **Cubism Core** | Live2D 官方闭源运行时（`live2dcubismcore.js`），渲染 `moc3` 必需 |
| **Framework** | Live2D 官方开源上层框架（动作/表情/物理调度），`pixi-live2d-display` 是社区重写版 |
| **VTS** | VTube Studio，面捕软件，其模型导出即标准 Cubism 资源包 + 一个 `*.vtube.json` |

---

## 13. 实施记录（2026-09-26，已落地并验证）

### 13.1 最终方案

按 **§5.2 路线 A** 落地。

| 组件 | 选型 | 版本 |
|---|---|---|
| 渲染器 | `pixi.js` | `^8.21.0` |
| Live2D 集成 | `@naari3/pixi-live2d-display`（`/cubism5` 入口） | `1.2.5` |
| Cubism Core | 官方 `live2dcubismcore.min.js` | **5.1.0**（`latestMocVersion` = 5） |
| 模型 | DS鲸鱼娘（`DS面捕版`） | moc3 v4，4.25 MB |

### 13.2 改动清单

**新增**

| 文件 | 作用 |
|---|---|
| [`src/components/widget/live2d-runtime.ts`](../src/components/widget/live2d-runtime.ts) | 运行时适配层。对外只暴露 `window.loadlive2d(id, url)`，与老的 `l2d.js` **同签名**，因此 `pio.js` 一行未改 |
| [`scripts/prepare-live2d-model.mjs`](../scripts/prepare-live2d-model.mjs) | 模型资产流水线：中文名 → ASCII、生成补好 `Motions`/`Expressions`/`Groups` 的 `model3.json`、写 `NOTICE.txt`。可重复执行 |
| `public/live2d/models/ds-whale/**` | 整理后的模型（3.95 MB：1 个 moc3 + 2 张贴图 + 8 个动作 + 44 个表情 + 空 pose + `NOTICE.txt`） |
| `public/live2d/core/live2dcubismcore.min.js` | 官方 Cubism Core 5.1.0（207 KB） |

**修改**

| 文件 | 改动 |
|---|---|
| [`src/components/widget/Pio.svelte`](../src/components/widget/Pio.svelte) | 重写装载流程：先装运行时（`cubism5` 走适配层 / `legacy` 走老 `l2d.js`）再装 `pio.js`；容器改为 `onMount` 后按视口条件挂载；`onDestroy` 真正销毁运行时 |
| [`src/config.ts`](../src/config.ts) | `pioConfig` 换模型、加 `runtime`/`framing`/`expressions`/`motionGroups`/`expressionHoldMs` |
| [`src/types/config.ts`](../src/types/config.ts) | 新增 `PioRuntime` 类型与上述字段 |
| `package.json` / `pnpm-lock.yaml` | 两个新依赖 |

**未改动**：`public/pio/static/pio.js`、`pio.css`、`l2d.js`（`l2d.js` 特意保留，用于 `runtime: "legacy"` 回滚）。

### 13.3 踩到的 3 个库级坑（都很隐蔽）

这三个问题都表现为"**模型加载成功、控制台几乎无报错、但画面上什么都没有**"，排查成本很高，记下来避免重蹈。

#### 坑 1：不传 `ticker` → 模型永不更新

```js
// 症状：控制台只有一条 warning
[Live2DModel(uninitialized)] No Ticker to be used for automatic updates.
```

库默认去找全局 `PIXI.Ticker`，Pixi 8 不提供全局，于是 `autoUpdate` 永远不打开，内部网格不更新。

**解法**：`Live2DModel.from(url, { ticker: app.ticker })`

#### 坑 2：不调 `setRenderer()` → 贴图永不绑定（最隐蔽）

Pixi v8 的 `onRender` 回调拿不到 renderer 参数，库里的兜底是：

```js
let webglRenderer = this.renderer;
if (!webglRenderer) {
  const app = globalThis.app || window.app;   // ← 需要宿主自己挂全局
  if (!app?.renderer) return;                 // ← 直接返回，什么都不做
  ...
}
```

而 `setRenderer()` 这个公开 API **在全库 15000 行里没有任何地方调用过** —— 它是留给宿主应用的。

**实测证据**：调用前 `model.renderer` 未设置、`internalModel.renderer._textures` 数量为 0、MVP 矩阵是单位阵；调用后贴图数 = 2、MVP 正常。

**解法**：`loaded.setRenderer(app.renderer)`

#### 坑 3：库泄漏 `gl.clearColor(1,1,1,1)` → 每帧把画布刷成不透明白底

`pixi-live2d-display` 用裸 `gl.clearColor(1,1,1,1)` 去清它自己的**遮罩帧缓冲**（内部逻辑本身是对的），但绕过了 Pixi 的状态缓存；Pixi 自己的透明清屏只发 `gl.clear()`、不再重设颜色，于是拿泄漏的白色去清画布。

**实测证据**（给 `gl.clearColor`/`gl.clear` 打桩，每帧序列）：

```
clear fb=FBO  clearColorNow=[1,1,1,1]  @ Oe.setupClippingContext   ← 库清遮罩，正常
clear fb=null clearColorNow=[1,1,1,1]  @ k1.clear (Pixi)           ← Pixi 拿白色清了画布 ✗
```

**解法**：以 `UPDATE_PRIORITY.HIGH` 挂到 ticker 上，在每帧 Pixi 渲染前把清屏色压回透明：

```js
instance.ticker.add(() => instance.renderer.gl.clearColor(0, 0, 0, 0), undefined, UPDATE_PRIORITY.HIGH);
```

### 13.4 取景参数怎么来的

不是靠肉眼猜的 —— 用官方 Core 在 Node 里读 `drawables.vertexPositions`，把顶点从"模型单位"换算到画布占比：

```
画布占比 = (模型坐标 × PixelsPerUnit + CanvasOrigin) / CanvasSize
```

公式先用 miku（已知竖长全身）交叉验证通过。DS鲸鱼娘的实测结果：

| 指标 | 值 |
|---|---|
| 画布 | 4068 × 4068，PixelsPerUnit = 4068 → 画布在模型单位下是 1×1 |
| 实际绘制的 drawable | **93 / 269**（其余 176 个默认不透明度为 0） |
| 内容包围盒 | x 12.8% – 97.6%（宽 84.8%），y 12.9% – 91.4%（高 78.5%） |
| 内容中心 | (55.2%, 52.2%)，相对画布中心偏移 (5.2%, 2.2%) |

因此默认取 `zoom: 1`（整幅画布刚好装下，不裁切）；想更"贴脸"可改成 `{ zoom: 1.12, offsetX: -0.05, offsetY: 0.02 }` —— 已写进 `config.ts` 注释。

### 13.5 端到端验证（无头 Chrome + CDP）

不是靠"构建通过"就收工 —— 用 Chrome DevTools Protocol 真跑了一遍：

| 验证项 | 结果 |
|---|---|
| Core 版本 | ✅ 5.1.0，`latestMocVersion` = 5 |
| 模型加载 | ✅ `Live2DModel.from` resolve，贴图 2 张全部 200 |
| 实际渲染 | ✅ 截图确认模型可见、背景透明（能透出侧边栏卡片） |
| 待机动作 | ✅ `idle` 动作组自动播放 |
| 点击换表情 | ✅ 点击后触发 `expression("heart-eyes")`，同时气泡显示"摸摸我!" |
| 窄视口（1100px） | ✅ 容器与 canvas **完全不挂载**，`pio.js` 不加载 —— 顺带修掉了旧版"透明 canvas 挡住页面点击"的问题 |
| 控制台 | ✅ 无 warning、无 error（仅剩 pagefind 相关的既有 404） |
| `astro check` | ✅ 106 个文件，0 error |
| `astro build` | ✅ 27 页构建成功 |

### 13.6 体积与性能实测

| 项目 | 数值 |
|---|---|
| `dist/live2d/` 总产物 | **4.15 MB** |
| 新增 JS chunk | `index.*.js` 889 KB（Pixi 8）+ `cubism5.es.*.js` 217 KB |
| 是否影响首屏 | ❌ 两者都是**动态 import 的独立 chunk**，且组件是 `client:idle`，不阻塞首屏 |
| moc3 传输 | 2.02 MB → Vercel brotli 后约 1.01 MB |
| 贴图 | 1.78 MB（PNG 已压缩，brotli 无收益） |
| 渲染开销 | 269 drawable / 15,166 三角面（约为 miku 的 1/4.5） |

### 13.7 遗留事项

- **`dist/` 已随本次改动更新**（该目录在本仓库是纳入版本控制的）。跑的是完整链路 `astro build → pagefind → compress-fonts`，不是裸 build。
- **`window.__live2d`** 是刻意保留的调试句柄（`destroy()` 时会清掉），控制台里可直接 `__live2d.model.expression("blush")` 手动试表情。
- **`runtime: "legacy"` 回滚路径**只做了类型检查，未做浏览器实跑；切回时需要同时把 `models` 换成 `/pio/models/pio/model.json`（老运行时只认 Cubism 2 的 `.moc`）。
- **miku 未接入**：授权不允许上线，其档案保留在 §3 供将来参考。

### 13.8 表情叠加与参数残留（上线后反馈，已修复）

维护者实测后反馈两个现象：**① 连点几次会同时出现"蚊香眼 + ><"；② 点多了页面会挂。**

排查下来是**两个独立的库级缺陷**，都会让 `.exp3.json` 的表现失控。

#### 缺陷 A：`setExpression()` 是"追加"而非"替换"

库内部 `ExpressionManager._setExpression()` 的实现是：

```js
_setExpression(motion) {
  return this.queueManager.startMotion(motion, false, performance.now());  // ← 追加
}
```

`startMotion` 往队列里**增加**一条表情运动，多个表情可以同时生效。

> 顺带一提：我第一版的清理代码写的是 `expressionManager.stopAllMotions()` —— 这个方法在
> `ExpressionManager` 上**根本不存在**（那是 `MotionManager` 的方法）。因为用了可选链
> `?.()`，写错了**不报错也不生效**，属于典型的静默失败。

**实测**（连点 3 次后统计队列里的表情运动数）：

| 操作 | 活动表情数 |
|---|---|
| 初始 | 0 |
| 不清空，直接连设 3 个 | **3**（叠加，就是"蚊香眼 + ><"） |
| 调用 `stopAllExpressions()` | 0 ✅ |
| **先清再设，连点 3 次** | **1** ✅ |

**修法**：每次设表情前先 `stopAllExpressions()`，保证是"干净切换"。

#### 缺陷 B（更根本）：参数写入后**永久残留**

只修 A 还不够。`.exp3.json` 用的是 `"Blend": "Add"`（加法混合），而官方框架的正确顺序是：

```
LoadParameters() → 动作 → SaveParameters() → 眨眼 → 表情 → 物理
```

**表情必须每帧在"干净基准"上做加法。**

但 pixi-live2d-display 的顺序是：

```js
update(dt, now) {
  const motionUpdated = this.motionManager.update(this.coreModel, now);
  this.motionManager.expressionManager?.update(model, now);   // 表情：在上一帧结果上继续累加
  if (!motionUpdated) this.eyeBlink?.updateParameters(model, dt);
  model.saveParameters();                                     // 存的是"表情污染后"的值
  ...
}
```

而且 **`loadParameters()` 在全库 15000 行里只出现一次 —— 就是它自己的定义，没有任何调用点**。

**后果**：表情写的参数不回滚，加法每帧继续累加并最终饱和，表情停止后**永久留在脸上**。连点几次自然就把多个表情糊在一起。

**实测证明**（冻结画面后比较像素哈希，排除动画干扰）：

| 状态 | 像素哈希 |
|---|---|
| 中性（`frozen: true`，读数稳定） | `8ef665df` |
| 仅"阴暗" | `21d3db9c` |
| **清空表情后** | **`21d3db9c`** ← 和"仅阴暗"完全一致，**没恢复** |

**修法**：自己补上缺失的 `LoadParameters()`。

1. 从 `model3.json` 的 `Expressions` 里拿到配置中每个表情的文件，抓取它们驱动的参数 id，取并集；
2. 在模型刚加载、**还没应用过任何表情**时，记录这些参数的"中性值"快照（实测 13 个表情 → 25 个参数）；
3. 每帧恢复快照。

**钩子位置很关键**：必须挂在 `beforeMotionUpdate`（动作**之前**），而不是 `afterMotionUpdate`。因为实测表情参数与动作参数有 **20 个交集**（眉毛、脸颊、眼睛、嘴巴等）：

- 挂在动作**之后** → 每帧把动作刚写的值覆盖掉，会**压制待机动作的眉毛/脸颊动画**；
- 挂在动作**之前** → 先归位、再让动作叠加、最后表情做加法 —— 与官方 `LoadParameters()` 的位置完全一致。

```js
// 只恢复"表情驱动的参数"，不碰物理/呼吸/待机动作负责的部分
im.on("beforeMotionUpdate", restoreNeutralParams);
```

> **踩坑记录**：`coreModel.getParameterIndex("ParamEyeLOpen")` 传字符串**不可靠**（实测返回 247 = 越界值）；
> `getParameterValueById(str)` 读也返回 null。最终用 `getParameterId(i)` 逐个取 id 建映射，
> 而它返回的包装对象要**剥两层**才拿到字符串（`getString()` 又返回一层 `{ s: "…" }`）。

**验收结果**（冻结画面像素哈希，逐个表情验证）：

| 表情 | 生效时画面变化 | 清空后回到中性 |
|---|---|---|
| blush / dizzy / star-eyes / question / sweat / naughty / mood-flower | ✅ | ✅ |

#### 关于"页面崩溃"

> ⚠️ **本小节的结论已被第 14 节推翻，保留在此作为排查过程记录。**
> 当时以为是"dev server 状态问题、重启即可"，实际根因是 **esbuild 临时文件删除失败 + Astro 静默吞异常**，
> 详见第 14 节。重启和删 `.astro/` 都治不了它。

反馈里的崩溃页是 Astro 的 **dev server 渲染错误**（`pages/about.astro` 的 `getEntry("spec", "about")` 返回空），**与本插件无关**：

- `src/content/spec/about.md` 文件一直存在；
- **生产构建产物 `dist/about/index.html` 渲染完全正常**（标题"关于我们"）。

---

## 14. 关于页 500 / 首页统计全 0：真正的根因（已定位并解决）

维护者随后反馈：**打开 `/about/` 立刻报 `About page content not found`，`/friends/` 同样，首页统计变成「文章 0 / 分类 0 / 标签 0」**，且**稳定复现、反复重启无效**。

排查中我先走了几条弯路（缓存、Node 版本、依赖重装…），全部被证伪。最终定位到一条**被 Astro 静默吞掉的异常**。

### 14.1 根因链条

**① esbuild 无法删除它在系统临时目录里的文件**

```
Error: remove C:\Users\<用户>\AppData\Local\Temp\esbuild-<hash>  Access is denied
```

**② 于是 `astro:data-layer-content` 虚拟模块导入失败**

Astro 的 dev 模式会把内容层数据（`.astro/data-store.json`，本项目约 2.4 MB）通过一个虚拟模块交给运行时。

**③ Astro 把这个异常静默吞掉，返回空存储**

`node_modules/astro/dist/content/data-store.js`：

```js
static async fromModule() {
  try {
    const data = await import("astro:data-layer-content");
    ...
  } catch {
    // ← 异常被完全吞掉，不留任何日志
  }
  return new ImmutableDataStore();   // ← 返回空存储
}
```

**④ 空存储被永久缓存**

```js
function dataStoreSingleton() {
  let instance;
  return {
    get: async () => { if (!instance) instance = ImmutableDataStore.fromModule(); return instance; },
    set: (store) => { instance = store; },
  };
}
```

单例一旦被赋成空存储就再也不会刷新，而 Vite 插件的 `invalidateDataStore()` **只失效模块图、不会重置这个单例** —— 所以**一旦变空，整个 dev server 生命周期内都无法恢复，必须重启**；重启后若又踩中同一个竞态，依旧失败。

**⑤ 所有集合因此"不存在"**

| 调用 | 命中分支 | 表现 |
|---|---|---|
| `getEntry("spec", "about")` | `!collectionNames.has(...)` | 返回 `undefined` → `about.astro` 抛错 → **500** |
| `getCollection("posts")` | 存储兜底分支 | 返回 `[]` → 首页统计全 0 |

终端只留一行 `The collection "posts" does not exist or is empty.`

### 14.2 怎么确认的

由于异常被吞，正常日志里什么都没有。我**临时给 `node_modules` 里 Astro 的 `data-store.js` 打了一行日志补丁**（把 `catch {}` 改成打印并重新抛出），真正的错误立刻现形：

```
[DSH-DEBUG] astro:data-layer-content 导入失败 →
  Error: remove C:\Users\belgnas\AppData\Local\Temp\esbuild-8985e1be... Access is denied
```

补丁在确认后**已完整还原**（`catch {}` 原样，无 `DSH-DEBUG` 残留）。

### 14.3 解决方案

把 `TEMP` / `TMP` 指向一个 esbuild **能写也能删**的目录即可。

**现已固化进 `pnpm dev` 本身**，直接照常使用即可：

```bash
pnpm dev          # ← 已经自动使用项目内的 .tmp-dev/ 作为临时目录
pnpm dev:tmp      # 等价别名，保留兼容
pnpm verify:dev   # 自检：内容层 + 桌伴资源（见 14.5）
```

实现见 [scripts/dev-local-tmp.mjs](../scripts/dev-local-tmp.mjs)（内含完整成因注释），它会：
1. 把 `TEMP` / `TMP` 指向项目内 `.tmp-dev/`；
2. 启动前清掉上一次残留的 `esbuild-*` 中间文件（单个约 2 MB，长期累积很可观）；
3. 再拉起 `astro dev`。

> 为什么中间文件那么大：被写进 `%TEMP%\esbuild-<hash>` 的不是可执行文件，
> 而是编译后的 `astro:data-layer-content` 虚拟模块本身 —— 文件头是
> `export default[[`，也就是那份约 2 MB 的 devalue 内容层数据。

**验证结果**：`pnpm dev` 启动后 `/`、`/about/`、`/friends/`、`/archive/`、`/diary/`
**五个页面全部 200，集合报错 0 条**。

### 14.5 自检工具

```bash
pnpm verify:dev
```

会检查 **桌宠资源完整性**（Core、模型、姿势文件、`model3.json` 引用的 48 个文件是否都在）
与 **内容层健康度**（5 个页面是否 200、首页文章数是否 >0、关于页正文是否渲染、
服务端日志有无 `does not exist` 告警）。

设计上刻意避免重复踩坑：**检测到 4321 已在跑就直接探测它，绝不起第二个 dev server**；
两个都试 `localhost` 与 `127.0.0.1`（Astro 默认绑 IPv6 的 `::1`）。退出码 0=通过 / 1=失败，可挂 CI。

### 14.4 排查中被证伪的方向（供后人少走弯路）

| 猜测 | 结论 |
|---|---|
| 桌宠代码改坏了 | ❌ 把全部改动 `git stash` 掉，原版代码同样报错 |
| 内容文件缺失 | ❌ `content.config.ts` 与全部内容都在，且与干净备份**字节级一致** |
| `.astro/` 缓存损坏 | ❌ 「正常」与「报错」两种状态的 `.astro/` 目录**文件清单与大小完全相同** |
| `node_modules` 损坏 | ❌ `pnpm install --force` 完整重装后依旧 |
| astro 多实例 | ❌ `node_modules/.pnpm` 里只有 1 份 |
| Node 版本（24 vs 20） | ❌ 切到 Node 22.18.0 依旧 |
| `.env` 配置 | ❌ 移开 `.env` 依旧 |
| pixi 被 Vite 预打包 | ❌ 加 `optimizeDeps.exclude` 依旧 |
| `friends.md` 是 0 字节 | ❌ 补内容后依旧 |

> **最大的教训**：`catch {}` 这种静默吞异常是排查灾难。Astro 5.18.0 的 `data-store.js`
> 在导入失败时不打任何日志就退化成空存储，把一个"环境问题"伪装成了"内容配置问题"。
> 如果日后再遇到「集合突然不存在」，**第一时间就去给那个 `catch` 加日志**。

---

## 15. 桌宠「关掉再恢复 → 白屏 + 整页卡死」

### 15.1 现象

点 ✖️ 关掉桌宠后，点左下角的小图标想把它叫回来：

- 出现**一块白色区域**，模型不显示；
- **整页卡死** —— 鼠标点任何地方都没反应，**只有滚轮还能滚**；
- 刷新页面才恢复。

### 15.2 定位

用 CDP 驱动无头 Chrome 复现，`Runtime.evaluate` 与 `Page.captureScreenshot` **全部超时**，
渲染进程 CPU 烧到 **498 秒** —— 典型的**主线程死循环**。

（顺带解释了"为什么滚轮还能用"：滚轮走合成器线程，不经过被卡死的主线程。）

死循环的位置靠 `Debugger.pause` 抓调用栈拿到：

```
#0  checkMaxIfStatementsInShader     ← Pixi 的着色器系统
#1  contextChange
#2  emit
#3  initFromContext
#4  createContext
#5  init                            ← new PIXI.Application().init()
#6  init
```

### 15.3 根因

恢复桌宠时，`pio.js` 会**第二次**调用 `loadlive2d("pio", ...)`。

而运行时在**同一块 `<canvas>`** 上重新 `new PIXI.Application().init({ canvas })`。
此时旧 WebGL 上下文已被 `app.destroy()` 销毁，`getContext` 交回的是一个**损坏的上下文**，
Pixi 的着色器系统随即在 `checkMaxIfStatementsInShader` 里永远退不出来。

> **一块 `<canvas>` 只能有一个 WebGL 上下文。**
> 销毁之后不能指望在同一块元素上重建 —— 必须换元素。

### 15.4 顺带发现的第二个 bug：画布尺寸被 DPR 逐轮放大

`computeCssSize()` 原本回读 canvas 的 `width`/`height` **属性**当期望尺寸。
但 Pixi 的 `autoDensity` 会把这些属性改成**设备像素值**（420 → 420×DPR）。
于是每"关闭再恢复"一次，尺寸就被 DPR 再乘一遍：

```
DPR=2 时：420 → 840 → 1680 → 3360 …（直到撞上视口钳制上限）
```

表现就是"桌宠每恢复一次就长大一圈"。修法：期望尺寸只在**第一次加载时读一次**并固定下来。

### 15.5 修复

`src/components/widget/live2d-runtime.ts`：

1. 新增 `baseW` / `baseH`，**只在首次加载时**从 DOM 读一次期望尺寸；
   `computeCssSize()` 不再接收 canvas 参数、不再回读属性。
2. 新增 `bootedOnce`；**重新加载时把旧 canvas 整个换掉**：

   ```ts
   const fresh = document.createElement("canvas");
   fresh.id = stale.id;
   fresh.className = stale.className;
   fresh.width = baseW ?? 400;
   fresh.height = baseH ?? 400;
   fresh.onclick = stale.onclick;  // ← 关键，见下
   stale.replaceWith(fresh);
   ```

   换元素这一步**必须放在 `await` 之后**：`pio.js` 在调用 `loadlive2d` 之后、同步地
   执行 `action.touch()`，把"点击说话"的回调挂在 canvas 元素的 `onclick` 属性上。
   等到异步部分跑起来时该属性已经就位，这时把它**迁移**到新元素即可。
   `pio.js` 内部缓存的是最初那个 canvas 元素，所以之后每一轮都要继续把回调往下传。

### 15.6 验证结果

**压力测试**（强制 `deviceScaleFactor = 2`，连续「关闭 → 恢复」5 次）：

| 轮次 | canvas 属性 | CSS 尺寸 | 上下文丢失 | `#pio` 数量 | 模型 |
|---|---|---|---|---|---|
| 初始 | 840×840 | 420×420 | false | 1 | ✅ |
| 1–5 | 840×840 | 420×420 | false | 1 | ✅ |

- 全程**无卡死**（修复前第 1 轮就死循环）；
- 尺寸**稳定不增长**（修复前 DPR=2 下每轮翻倍）；
- WebGL 上下文**从未丢失**，`#pio` 始终只有 1 个（旧元素被正确替换，无泄漏）；
- 截图确认模型正常渲染，且弹出「你好啊！」欢迎气泡。

**回归检查**（恢复后点击角色）：

| 场景 | 结果 |
|---|---|
| 正常状态点击 | ✅ 弹出「看不懂qwq」 |
| 关闭 → 恢复后点击 | ✅ 弹出「不要戳我啦!」，`canvas.onclick` 已迁移 |

---

## 16. 选择面板：分类表与交互编排（定稿）

### 16.1 职责分离：事实 vs 编排

之前把「这个模型有哪些表情」和「这个表情该归哪一栏」混在一个文件里，导致想调分类就得改生成脚本。现在拆开：

| 文件 | 性质 | 内容 | 谁改 |
|---|---|---|---|
| `scripts/prepare-live2d-model.mjs` | 脚本 | 搬运资源、提取事实（模型路径 / 中文名 / 动作文件映射） | 换模型时 |
| `src/components/widget/live2d-catalog.ts` | **自动生成** | 44 个表情的中文名 + 参数表；8 个动作的时长 + 参数表 | 不要手改 |
| `src/components/widget/live2d-taxonomy.ts` | **手工维护** | 面板分几栏、每栏单选/多选、谁是谁的前提、哪些一次性/长期 | **改这个** |
| `PioPanel.svelte` / `live2d-expression-layer.ts` / `live2d-runtime.ts` | 通用代码 | 渲染 + 参数层 + 冲突判定 | 换模型不用改 |

引擎完全不知道「蛋包饭」是什么 —— 它只读 `model3.json` 的 `Expressions[].Name/File` 和 Cubism 的参数 API。

**换模型的影响**：换回 legacy 猫娘 → 不受影响（面板只在 cubism5 下渲染）；换另一个 cubism5 模型 → 需重跑脚本改路径/中文名，并重编一份 taxonomy（可从新模型的 `model3.json` + `cdi3.json` 自动生成初稿）。

### 16.2 最终分栏（`PANELS` 数组，`mode` 决定交互）

| 栏 | mode | 内容 |
|---|---|---|
| 表情 | `radio` | 脸红 爱心眼 星星眼 开心兴奋 调皮 生气 悲伤 哭 晕晕 阴暗 呆呆眼 闭眼口水 吐舌 吐魂 |
| 氛围 | `radio` | 流汗 问号 感叹号 心跳 情绪花花 love |
| 配饰·眼部 | `radio` | 圆眼镜 方眼镜 椭圆眼镜 墨镜 |
| 配饰·头饰 | `radio` | 猫猫贴纸 兔兔贴纸 蝴蝶结贴纸 |
| 配饰·其他 | `multi` | 头箍 单边马尾 |
| 环境 | `multi` | 深色桌布 鲸鱼 鲸鱼放桌上 魔爪 魔爪换色 芭菲 |
| 工具 | `radio` | 撤回 橡皮 画笔 |
| 长期动作 | `multi` | 点菜 蛋包饭 点菜按下 喵喵手 比耶 手机开盖 换色手机开盖 |
| 一次性动作 | `action` | 吹泡泡糖 锤子 给蛋包饭挤番茄酱 自拍 快速自拍 |

面板右上角的 **「恢复默认」** 会清掉全部选择，然后自动选中「点菜」这个基准状态
（`DEFAULT_ITEM_ID = "default"`）。

**「表情」和「氛围」是两栏独立的单选** —— 实测两者零参数冲突，所以一个情绪表情配一个氛围特效（星星眼 + 问号）可以同时显示。

**「长期动作」为什么是多选**：它不是"整栏单选"那么简单，而是有张互斥图（详见 16.3）——
蛋包饭是**桌面状态**、比耶是**手部姿势**，两者该能叠加；但蛋包饭和点菜按下抢同一块点菜板，不能叠加。
所以用 `excludes` 表达**逐对的**互斥关系，而不是整栏一刀切。

**「手机开盖」和「换色手机开盖」是并列选项**：同一个动作（`Selfie#0`），区别只在额外写一个 `shouji`。
做成并列而不是"开盖后再勾一个换色"，是因为后者会依赖前者 —— 切换时被连锁关掉，还会误清手机状态（见 16.5 的 #8）。

### 16.3 前提与互斥（全部在界面上可见）

**前提**（未满足时置灰）：

```
点菜                → 点菜按下        要先回到基准姿势（点菜板空着）才按得下去
魔爪                → 魔爪换色        参数是两个独立开关，但换色以"魔爪已在"为前提
手机开盖 / 换色开盖 → 自拍 / 快速自拍  任意一个在都算"手机已经拿出来了"（requiresAny）
蛋包饭              → 给蛋包饭挤番茄酱 sauce 动作驱动的正是 danbaofan / ji
```

**互斥**（`excludes`，**对称生效**，写一遍即可；互斥项**后点的赢**）：

```
喵喵手    ⊥ 其他全部长期动作     两只手都占了
蛋包饭    ⊥ 点菜 / 点菜按下 / 手机开盖 / 换色手机开盖 / 喵喵手
点菜按下  ⊥ 蛋包饭 / 手机开盖 / 换色手机开盖 / 喵喵手    按下去了手就占住，拿不了手机
比耶      ⊥ 手机开盖 / 换色手机开盖   但和 蛋包饭 / 点菜 / 点菜按下 **不互斥**
手机开盖  ⊥ 换色手机开盖 / 点菜 / 蛋包饭 / 点菜按下 / 比耶 / 喵喵手
```

**长期动作栏有两条额外机制**（`resetOnChange: true`）：

1. **只在真的顶掉东西时才清动作状态**。手机手持属于"长期状态"、不每帧归位；
   从「手机开盖」切到「双手比耶」必须清（否则手机还在手上，看着像没反应），
   但「手机开盖 → 换色手机开盖」是纯叠加、没顶掉任何东西，**不能清**（清了手机会消失）。
2. **连锁关闭**（`pruneDependencies`）：顶掉某个条目时，前提已不满足的条目一起摘掉，
   反复扫到稳定。避免出现"亮着但点不动"的孤儿。

### 16.4 冲突判定的两层

| 类型 | 判据 | 处理 |
|---|---|---|
| **硬冲突** | 两者驱动**同一个参数**（`.exp3.json` 全是 `Blend:"Add"`，会数值累加出错） | **全自动**，运行时按 catalog 的参数表拦 |
| **软冲突** | 参数不重叠但占同一视觉区域（四副眼镜、三个贴纸） | 靠 `mode: "radio"` 同栏互斥 |

例：选「墨镜」会自动顶掉「开心兴奋」（墨镜额外驱动 `ParamEyeLOpen/ROpen`）。

### 16.5 这一轮挖出的 5 个 bug（都已修 + 实测验证）

| # | 现象 | 根因 |
|---|---|---|
| 1 | **动作播完道具留在画面上**：吹泡泡糖后泡泡一直挂着、开盖后手机一直在手里、番茄酱后蛋包饭和爱心不消失 | 库**从不调用 `loadParameters()`**，动作最后写进去的值永久留下。实测残留：bubblegum 8/8（泡泡大小 `0 → 28.18`）、sauce 5/18（爱心 `0 → 14`）、hammer 10/36。修法：参数层把动作参数也纳入每帧归位 |
| 2 | **手机开盖不保持** | 修 #1 时把所有非 idle 动作参数都归位了，包括 `phone/phone2/phone4/phone6`。改为「长期状态」不归位，另加 `resetMotions()` 供「默认」清除 |
| 3 | **`apply()` 把正在播放的动作擦掉** | 参数层的 `apply()` 遍历所有受控参数，对动作参数写回中性值 = 每帧擦掉动作。修法：`apply()` 只写表情参数 |
| 4 | **锤子播放中点任何动作都没反应** | 库的 `MotionState.reserve()` 有 `if (priority <= currentPriority) return false;` —— **同级动作会静默拒绝**。修法：用户点按钮时传 `priority = 3`（FORCE） |
| 5 | **锁定后点击宠物仍会吹泡泡糖** | `playRandomPropMotion()` 写在 `if (!locked)` 外面。修法：锁定 = 整个外观冻住（台词不受影响，那是 pio.js 自己挂的） |
| 6 | **点击宠物时随机附带道具动作** | `playRandomPropMotion()` 让点击行为不可预测（有时吹泡泡、有时没反应）。**已整段移除** —— 所有动作都能从面板精确触发 |
| 7 | **切长期动作时"没反应"** | 手机手持是不归位的长期状态，从「手机开盖」切到「双手比耶」时手机还在手上。修法：长期动作栏加 `resetOnChange`，切换前先清干净 |
| 8 | **「手机开盖 → 手机换色」后手机消失** | 修 #7 时下手太重：只要该栏发生**任何**变化就 `resetMotions()`，于是纯叠加的"换色"也把手机清掉了。修法：只有**真的顶掉了东西**（`removed.length > 0`）才清。同时把「手机换色」改成并列的「换色手机开盖」，逻辑不再依赖另一个条目 |

**另外还修了一处架构隐患**：面板把表情写在 `selection.props`，而运行时的点击随机写在 `selection.emotion` —— 两套并存时会**同时生效**（面板选星星眼 + 点击摇出爱心眼 → 共用眉毛参数直接冲突）。修法：运行时加 `setEmotionRoller()`，点击宠物时交给面板摇，**面板成为表情的唯一真相源**。

### 16.6 「喷水 / 甩尾」为什么下架

`Tap/spray` 只驱动 `pengshui(碰水)` 一个参数，曲线声明 `1 → 1.023 → 1 → 1`，但**实测峰值只有 0.015**（参数范围 0..1），逐帧采样：

```
18ms:0  130ms:0.007  247ms:0.015(峰)  458ms:0  569ms:0
```

对照锤子的 `Param70` 正常爬到 0.926。也就是说这个动作在参数层面基本没生效；尾巴确实会动，但 idle 本身尾巴就在摆，无法归因。加上它在「一次性动作」里被同组动作静默拒绝（bug #4），观感上就像"接在锤子后面"。**已从面板移除**（`Tap/spray` 文件仍在模型里）。

### 16.7 覆盖度

```
表情：模型 44 个 → 面板可达 44 个    未覆盖：无
动作：模型  8 个 → 面板可达  7 个     （spray 按上节理由不暴露）
  Idle#0     自动常驻（氛围）
  Tap#0/1    吹泡泡糖 / 锤子
  Tap#2      甩尾拍水 —— 不暴露
  Selfie#0   手机开盖        Selfie#1 自拍        Selfie#2 快速自拍
  Sauce#0    番茄酱（在"给蛋包饭挤番茄酱"里）
```

### 16.8 面板按钮怎么和原生三个按钮统一

原生的「回到首页 / 了解更多 / 关闭桌宠」由 pio.js append 进 `.pio-action`，样式来自 `/pio/static/pio.css`：

```css
.pio-action span { width:1.5em; height:1.5em; border-radius:66%; border:1px solid #666;
                   background:#fff center/70% no-repeat; margin-bottom:.5em; display:block }
.pio-container:hover .pio-action { opacity:1 }   /* 悬停桌宠才淡入 */
```

第一版面板按钮是「2.2em 正圆 + 阴影 + emoji + 常驻显示」，和它完全对不上，观感很割裂。

**改法：不抄样式，直接并进同一个容器。** `.pio-action` 其实是 `Pio.svelte` 渲染的空 div，
pio.js 随后往里塞按钮 —— 所以用 Svelte action（`use:intoActionColumn`）把自己的两个按钮
`appendChild` 进去即可，**尺寸 / 圆角 / 描边 / 白底 / 悬停淡入全部自动继承**，插件若改样式我们也跟着变。

配套改动：
- 图标从 emoji 换成**单色内联 SVG**（和原生三个同一风格）；
- 弹层留在 `.pio-container` 下（不能放进 `.pio-action`，否则会被 `opacity:0` 一起淡掉）；
- 按钮的额外样式用 `:global(.pio-action) .pio-panel-toggle`（特异性 0,2,0）压过 `.pio-action span`（0,1,1）。

实测：`width/height = 20.39px`、`border-radius = 66%`、`border = 1px solid rgb(102,102,102)`、
`background = #fff` 与原生**逐项相同**，`:hover` 淡入也跟随（`opacity 0 → 1`）。

### 16.9 「关闭桌宠」后的恢复图标

pio.css 里那张图标是**写死的插件默认头像**：

```css
.pio-container .pio-show { background: url(avatar.jpg) center / contain }   /* 相对 /pio/static/ 解析 */
.pio-container.pio-hidden .pio-show { display: block }
```

`avatar.jpg` 是作者的紫发角色，和现在的模型对不上。

**改法**：模型作者自带了 `icon.png`（268×268 头像），
1. `scripts/prepare-live2d-model.mjs` 的 `COPY_AS_IS` 里加上 `icon.png`，随流水线拷进 `public/live2d/models/ds-whale/`；
2. `Pio.svelte` 在容器上挂一个 CSS 变量，路径**从 `pioConfig.models[0]` 推导**：

```svelte
<div class="pio-container" style={`--pio-avatar: url("${avatarUrl}")`}>
```

```css
/* 特异性 (0,3,0)，压过 pio.css 的 `.pio-container .pio-show` (0,2,0) */
:global(.pio-container.pio-hidden .pio-show) { background-image: var(--pio-avatar) }
```

只覆盖 `background-image`，`center / contain` 和圆形裁剪都保留原样。**换模型时头像自动跟着换**，不用再改一份配置。

### 16.10 已知限制与遗留

| 项 | 说明 |
|---|---|
| 「头箍」的实际效果 | 它写 `ParamCheek38=3` 切换 `Part102(发箍切换调整)`，**观感上是让女仆头饰消失**（基线戴着白色女仆头饰）。已与作者确认这是预期行为 |
| 「蛋包饭」与其他长期动作互斥 | 「长期动作」是单选栏，所以蛋包饭 × 手机开盖/喵喵手/双手比耶 互斥。作者确认这符合预期 |
| 手机只有一套配色参数 | 全模型只有 `shouji` 一个换色开关（`shouji=0` 粉色手机 / `shouji=1` 白色手机），**无法给「自拍」和「快速自拍」分别设色** |
| 面板定位 | 靠 `left: 100%` 挂在桌宠右侧；`hiddenOnMobile: true` 时移动端不显示，所以暂未处理窄屏溢出 |
| `pioConfig.expressions` | 只在 `panel === false` 时作为回退池使用；挂了面板时由面板摇 |
