<script lang="ts">
/**
 * Pio 看板娘装载器
 *
 * 职责很简单：按顺序准备好「渲染运行时」和「Pio 插件」，然后把 DOM 交给 `Paul_Pio`。
 *
 *   运行时（二选一）：
 *     - cubism5：src/components/widget/live2d-runtime.ts（支持 .moc3）
 *     - legacy ：/pio/static/l2d.js（Cubism 2.1，只支持 .moc）
 *   插件：/pio/static/pio.js（第三方 GPL 插件，本仓库未做修改）
 *
 * 两边都通过全局 `loadlive2d(canvasId, modelUrl)` 衔接，所以插件无需关心用的是哪套运行时。
 */

import { onDestroy, onMount, tick } from "svelte";
import { pioConfig } from "@/config";
import { installLive2DRuntime, type Live2DRuntime } from "./live2d-runtime";
import PioPanel from "./PioPanel.svelte";

// 转换为 Pio 插件需要的格式
const pioOptions = {
	mode: pioConfig.mode,
	hidden: pioConfig.hiddenOnMobile,
	content: pioConfig.dialog || {},
	model: pioConfig.models || ["/pio/models/pio/model.json"],
};

const runtimeKind = pioConfig.runtime ?? "cubism5";

/**
 * 「关闭桌宠」后那个圆形恢复按钮的头像。
 *
 * 取模型同目录下的 `icon.png`（`scripts/prepare-live2d-model.mjs` 会把它一起拷过来），
 * 所以换模型时头像自动跟着换，不用再改一份配置。
 * 推导不出来时退回插件自带的 `/pio/static/avatar.jpg`。
 */
const avatarUrl = (pioConfig.models?.[0] ?? "").replace(/[^/]+$/, "icon.png") || "/pio/static/avatar.jpg";

/** 容器是否挂载。先渲染空的、再在 onMount 里置 true，避免服务端/客户端不一致 */
let visible = $state(false);
let pioContainer: HTMLDivElement | undefined = $state();
let pioCanvas: HTMLCanvasElement | undefined = $state();

// 用 $state：面板需要在运行时实例装好之后拿到它
let runtimeHandle = $state<Live2DRuntime | null>(null);
let pioInitialized = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** 注入脚本（幂等，同一 id 只加载一次） */
function loadScript(src: string, id: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.getElementById(id)) {
			resolve();
			return;
		}
		const el = document.createElement("script");
		el.id = id;
		el.src = src;
		el.async = false; // 保持注入顺序
		el.onload = () => resolve();
		el.onerror = () => reject(new Error(`脚本加载失败：${src}`));
		document.head.appendChild(el);
	});
}

function initPio() {
	if (!pioContainer || !pioCanvas) {
		retryTimer = setTimeout(initPio, 100);
		return;
	}
	const PaulPio = (window as unknown as { Paul_Pio?: new (o: unknown) => unknown }).Paul_Pio;
	if (typeof PaulPio === "undefined") {
		retryTimer = setTimeout(initPio, 100);
		return;
	}
	if (pioInitialized) return;
	try {
		new PaulPio(pioOptions);
		pioInitialized = true;
		console.log("[pio] 看板娘已初始化");
	} catch (e) {
		console.error("[pio] 初始化失败：", e);
	}
}

async function bootstrap() {
	try {
		if (runtimeKind === "cubism5") {
			// 装好全局 loadlive2d，pio.js 会直接调用它
			runtimeHandle = installLive2DRuntime({
				framing: pioConfig.framing,
				expressions: pioConfig.expressions,
				expressionHoldMs: pioConfig.expressionHoldMs,
				selection: pioConfig.selection,
				locked: pioConfig.locked,
			});
		} else {
			await loadScript("/pio/static/l2d.js", "pio-l2d-script");
		}
		await loadScript("/pio/static/pio.js", "pio-main-script");
		initPio();
	} catch (e) {
		console.error("[pio] 资源加载失败：", e);
	}
}

onMount(() => {
	if (!pioConfig.enable) return;
	// 小屏直接不挂载容器：既省资源，也避免一个透明 canvas 挡住页面点击
	if (pioConfig.hiddenOnMobile && window.matchMedia("(max-width: 1280px)").matches) {
		return;
	}
	visible = true;
	// 等 DOM 真正渲染出来，pio.js 构造时才能找到 #pio 和 .pio-action
	void tick().then(bootstrap);
});

onDestroy(() => {
	if (retryTimer) clearTimeout(retryTimer);
	runtimeHandle?.destroy();
	runtimeHandle = null;
});
</script>

{#if pioConfig.enable && visible}
  <div
    class={`pio-container ${pioConfig.position || "right"}`}
    bind:this={pioContainer}
    style={`--pio-avatar: url("${avatarUrl}")`}
  >
    <div class="pio-action"></div>
    <canvas
      id="pio"
      bind:this={pioCanvas}
      width={pioConfig.width || 280}
      height={pioConfig.height || 250}
    ></canvas>
    {#if pioConfig.panel !== false && runtimeHandle}
      <!-- 只有 cubism5 运行时才有"多表情参数层"，legacy（老猫娘）下不显示，
           否则面板会出现但点了没有任何反应 -->
      <PioPanel runtime={runtimeHandle} />
    {/if}
  </div>
{/if}

<style>
  /* 样式由 /pio/static/pio.css 提供；这里只补两条： */
  .pio-container canvas {
    /* 画布尺寸由 JS 按视口钳制（见 live2d-runtime.ts），CSS 不再插手 width/height，
       免得 Pixi 的 autoDensity 内联样式和样式表打架。 */
    display: block;
  }

  /*
   * 对话框居中到桌宠头顶。
   *
   * 起因：pio.css 里 `.pio-dialog` 只设了 `bottom`，靠 `.pio-container.left`
   * 系列规则给它 `left: 1em` / `right: 1em` —— 于是对话框紧贴屏幕边，看起来很"飘"。
   *
   * 注意优先级：必须匹配 `.pio-container.left`（3 个类），
   * 否则 `.pio-container .pio-dialog`（2 个类）会被第三方规则压掉，
   * 表现就是"transform 生效了、left 没生效"。
   * （用 :global 是因为 .pio-dialog 是 pio.js 动态创建的，不在本组件作用域内。）
   */
  :global(.pio-container.left .pio-dialog),
  :global(.pio-container.right .pio-dialog) {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    text-align: center;
  }

  /*
   * 「关闭桌宠」后那个圆形恢复按钮的头像。
   *
   * pio.css 里写的是 `background: url(avatar.jpg) center / contain` —— 相对 CSS
   * 所在目录解析，也就是插件自带的紫发角色，和现在的模型对不上。
   *
   * 这里只覆盖 background-image（位置/缩放/重复都保留原样）。图标用的是模型作者
   * 自带的 `icon.png`，随 prepare 脚本一起拷进 public/live2d/models/…；
   * 路径由 `pioConfig.models[0]` 推导，换模型时头像会自动跟着换。
   *
   * 特异性用 (0,3,0)（多加一个 .pio-hidden）压过 pio.css 的 `.pio-container .pio-show`。
   */
  :global(.pio-container.pio-hidden .pio-show) {
    background-image: var(--pio-avatar);
  }
</style>
