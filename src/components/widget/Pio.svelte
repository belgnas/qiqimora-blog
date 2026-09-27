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
import { pioConfig, sidebarLayoutConfig } from "@/config";
import { installLive2DRuntime, type Live2DRuntime } from "./live2d-runtime";
import PioPanel from "./PioPanel.svelte";

/**
 * 「小屏」断点，**取自主题自己的配置**，不再写死。
 *
 * `src/config.ts` 的 `sidebarLayoutConfig.responsive.breakpoints` 是博客全站
 * 断点的权威来源（CSS 侧由 `src/styles/main.css` 的 `@theme` 提供同一组数值）：
 *
 *     mobile: 768    → 宽度 < 768  算移动端
 *     tablet: 1280   → 宽度 < 1280 算平板端
 *     desktop: 1280  → 宽度 >= 1280 算桌面端
 *
 * 原实现是硬编码的 `matchMedia("(max-width: 1280px)")`，有两处和主题对不齐：
 *
 *   ① 写死了数值 —— 改 `config.ts` 的断点时，主题的布局/字号缩放会跟着变，
 *      桌宠却不会，两边就分家了；
 *   ② `max-width: 1280px` 会把 **1280px 本身**也算成小屏，而主题的语义是
 *      `desktop: 1280` 即「>= 1280 是桌面」。差 1px，改为 `< 断点` 才一致。
 */
const MOBILE_BREAKPOINT = sidebarLayoutConfig.responsive?.breakpoints?.desktop ?? 1280;
const NARROW_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

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

/**
 * 阻止「气泡 / 设置面板 / 按钮列」上的按下触发拖动。
 *
 * 起因：拖拽是 pio.js 绑在 **`.pio-container`** 上的 `body.onmousedown`，
 * 而 `.pio-dialog`（对话气泡，挂在画布**上方**）、`.pio-panel-root`（设置面板，
 * 挂在画布**右侧**）、`.pio-action`（按钮列）都是容器的**子元素** —— 事件会冒泡上去，
 * 于是"按住气泡能拖、按住面板也能拖"。
 *
 * 观感上就是「能拖的范围比角色大一圈，上方和右侧尤其明显」。
 *
 * 修法用**捕获阶段**：捕获阶段在容器这一层先跑，`stopPropagation()` 之后事件
 * 既到不了目标、也不会冒泡回容器的 `onmousedown`，正好把它拦掉。
 * 注意用捕获（`onmousedowncapture`）而不是普通 `onmousedown` —— 后者和拖拽处理器
 * 同为冒泡阶段，顺序取决于绑定先后，不可靠。
 */
function blockDragFromOverlays(ev: MouseEvent) {
	const target = ev.target as HTMLElement | null;
	if (target?.closest?.(".pio-dialog, .pio-panel-root, .pio-action")) {
		ev.stopPropagation();
	}
}

/** 容器是否挂载。先渲染空的、再在 onMount 里置 true，避免服务端/客户端不一致 */
let visible = $state(false);
let pioContainer: HTMLDivElement | undefined = $state();
let pioCanvas: HTMLCanvasElement | undefined = $state();

/**
 * 视口是否属于「小屏」（≤1280px）。
 *
 * ⚠️ 必须做成**响应式**的，不能在 onMount 里只判断一次。
 *
 * 原来的写法是 `if (hiddenOnMobile && matchMedia("(max-width: 1280px)").matches) return;` ——
 * 只在页面加载时算一次。于是「宽屏加载 → 之后再缩窄/转成竖屏」时容器**仍然挂在页面上**，
 * 但 pio.css 里这条第三方样式已经把事件关掉了：
 *
 *     @media screen and (max-width: 768px) { .pio-container { pointer-events: none } }
 *
 * 结果就是「桌宠看得见、却怎么都拖不动」。旋转屏幕 / 拖窗口都会命中。
 */
let narrow = false;

/** 是否已经 bootstrap 过（防止重复装载） */
let booted = false;
/** 装载代号：快速来回缩放时用来丢弃过期的异步装载 */
let bootToken = 0;

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

/**
 * 卸载桌宠。
 *
 * `Paul_Pio` 是在构造时从 DOM 里抓 `.pio-container` / `#pio` 的，没有反初始化接口，
 * 所以「隐藏」只能把容器整个摘掉、并把运行时销毁；重新显示时全部重建一遍。
 * 必须把 `pioInitialized` 也复位，否则再次显示时 `initPio()` 会直接 return，
 * `onmousedown` 就永远不会重新绑上（症状同样是"看得见但拖不动"）。
 */
function teardown() {
	if (retryTimer) {
		clearTimeout(retryTimer);
		retryTimer = null;
	}
	runtimeHandle?.destroy();
	runtimeHandle = null;
	pioInitialized = false;
	booted = false;
	visible = false;
	pioContainer = undefined;
	pioCanvas = undefined;
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

/**
 * 按当前视口决定挂载 / 卸载。
 *
 * ⚠️ 这里**故意不用 `$effect`** —— 试过 `$effect` 读 `$derived(shouldShow)` 的写法，
 * 缩小时能正确卸载，但放大回去时 effect 不再重跑（`narrow` 变更没能触发它），
 * 表现为"缩窄隐藏后，再放宽桌宠就再也回不来了"。
 * 改成由 matchMedia 的 change 回调**直接调用**，行为完全确定。
 */
function applyVisibility() {
	if (!pioConfig.enable) return;
	const show = !(pioConfig.hiddenOnMobile && narrow);
	if (show && !booted) {
		booted = true;
		visible = true;
		const token = ++bootToken;
		// 等 DOM 真正渲染出来，pio.js 构造时才能找到 #pio 和 .pio-action
		void tick().then(() => {
			if (token === bootToken) void bootstrap();
		});
	} else if (!show && booted) {
		bootToken++;
		teardown();
	}
}

onMount(() => {
	if (!pioConfig.enable) return;
	const mql = window.matchMedia(NARROW_QUERY);
	const update = () => {
		narrow = mql.matches;
		applyVisibility();
	};
	update(); // 首次
	mql.addEventListener("change", update);
	return () => mql.removeEventListener("change", update);
});

onDestroy(() => {
	bootToken++;
	teardown();
});
</script>

{#if pioConfig.enable && visible}
  <div
    class={`pio-container ${pioConfig.position || "right"}`}
    bind:this={pioContainer}
    style={`--pio-avatar: url("${avatarUrl}")`}
    onmousedowncapture={blockDragFromOverlays}
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
  /* 样式由 /pio/static/pio.css 提供；这里只补几条： */
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
   *
   * `z-index` 是必须补的：pio.css 给它的是 **-1**，会被画布盖住。
   * 气泡底边在 `calc(100% - 2em)`，本来就压在画布上沿 ——
   * 以前角色没铺满画布，遮挡还看不出来；现在角色铺满了（见 §19），
   * 头顶正好把气泡糊住。容器自己是 `z-index: 52` 的层叠上下文，这里给个正值即可。
   */
  :global(.pio-container.left .pio-dialog),
  :global(.pio-container.right .pio-dialog) {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
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

  /*
   * 盖掉 pio.css 在窄屏关掉事件的那条规则。
   *
   * pio.css 里有：
   *     @media screen and (max-width: 768px) { .pio-container { pointer-events: none } }
   * 这是插件"手机上只当装饰"的设计。但我们的显示与否是由 `hiddenOnMobile`
   * 在 JS 里统一决定的（见上面 shouldShow）——既然渲染出来了，就该是能拖能点的。
   * 否则会落进"看得见却拖不动"的半死状态。
   *
   * 特异性用 (0,2,0)（重复写一次类名）压过第三方的 (0,1,0)。
   * 配置里 `hiddenOnMobile: true`（默认）时窄屏根本不会挂载容器，
   * 这条规则自然不会生效，不影响"手机上不显示桌宠"的原有行为。
   */
  :global(.pio-container.pio-container) {
    pointer-events: auto;
  }
</style>
