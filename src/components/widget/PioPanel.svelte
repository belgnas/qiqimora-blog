<script lang="ts">
/**
 * 看板娘选择面板
 * ===============================================================
 * 面板结构、单选/多选、前提关系**全部**来自 `live2d-taxonomy.ts`，
 * 这个文件只负责渲染和状态维护。改分类请改那个文件。
 *
 * 另外这里还兜一层**自动保护**：两个表情只要驱动同一个参数就互相冲突
 * （`.exp3.json` 全是 Add 混合，共用参数会数值累加出错）。
 * 例：选了「墨镜」会自动取消「开心兴奋」——因为墨镜额外驱动眼睛开合。
 */

import { LIVE2D_EXPRESSIONS, type Live2DExpressionEntry } from "./live2d-catalog";
import { PANELS, type TaxonomyItem } from "./live2d-taxonomy";
import type { Live2DRuntime, Live2DSelection } from "./live2d-runtime";

let { runtime }: { runtime: Live2DRuntime | null } = $props();

const ALL = LIVE2D_EXPRESSIONS;
const byName = (n: string) => ALL.find((e) => e.name === n);

/**
 * 用户主动点按钮时用的动作优先级。
 *
 * 库的 `MotionState.reserve()` 里写着 `if (priority <= currentPriority) return false;`，
 * 所以正在播一个 NORMAL(2) 动作时，新点的动作会被**静默拒绝**（实测：锤子播放中
 * 点「吹泡泡糖」完全没反应）。传 3（FORCE）才能真的打断。
 */
const FORCE = 3;

let open = $state(false);
let locked = $state(false);
/**
 * 已选中的持久条目 id —— **面板是表情的唯一真相源**。
 * 所有表情都通过 `props` 交给参数层，不再用运行时那个 `emotion` 字段，
 * 否则"点击宠物随机换表情"和"面板选表情"会两套并存、互相打架。
 */
let active = $state<string[]>([]);

const activeSet = $derived(new Set(active));

/** 当前所有生效的表情名（来自所有选中条目） */
const activeExprs = $derived([...new Set(PANELS.flatMap((p) => p.items).filter((it) => activeSet.has(it.id)).flatMap((it) => it.expr ?? []))]);

const activeCount = $derived(active.length);

const isOn = (it: TaxonomyItem) => activeSet.has(it.id);

const itemById = (id: string) => PANELS.flatMap((p) => p.items).find((i) => i.id === id);

/** id → 它的中文名（用于"（需先 xxx）"提示） */
const labelOf = (id: string) => itemById(id)?.label ?? id;

function canUse(it: TaxonomyItem): boolean {
	if (it.requires?.length && !it.requires.every((r) => activeSet.has(r))) return false;
	if (it.requiresAny?.length && !it.requiresAny.some((r) => activeSet.has(r))) return false;
	return true;
}

/**
 * 依赖清理：把前提已经不被满足的条目一起摘掉，**支持连锁**。
 *
 * 例：选了「手机开盖 + 自拍」后切到「双手比耶」→ 手机开盖被顶掉，
 * 那依赖手机的自拍状态也该跟着关，而不是留在那儿变成一个"亮着但点不动"的孤儿。
 * 反复扫到稳定为止（最多 8 轮，防意外死循环）。
 */
function pruneDependencies(list: string[]): string[] {
	let cur = list.slice();
	for (let pass = 0; pass < 8; pass++) {
		const set = new Set(cur);
		const next = cur.filter((id) => {
			const it = itemById(id);
			if (!it) return false;
			if (it.requires?.length && !it.requires.every((r) => set.has(r))) return false;
			if (it.requiresAny?.length && !it.requiresAny.some((r) => set.has(r))) return false;
			return true;
		});
		if (next.length === cur.length) break;
		cur = next;
	}
	return cur;
}

/** 未满足的前提，拼成"（需先 xxx）"里的文字 */
function missingHint(it: TaxonomyItem): string {
	const parts: string[] = [];
	if (it.requires?.length) parts.push(it.requires.map(labelOf).join("、"));
	if (it.requiresAny?.length) parts.push(it.requiresAny.map(labelOf).join(" 或 "));
	return parts.join("、");
}

/* ── 冲突保护：参数重叠 ── */
function overlaps(aName: string, bName: string): boolean {
	const a = byName(aName);
	const b = byName(bName);
	if (!a || !b) return false;
	return a.params.some((p) => b.params.includes(p));
}

/**
 * 选中 it 之后，哪些已选条目必须被顶掉。两类：
 *
 * ① **参数重叠**（自动）—— `.exp3.json` 全是 Add 混合，共用参数会数值累加出错。
 * ② **显式互斥**（`excludes`）—— 参数不冲突但语义/画面打架，
 *    比如「蛋包饭」和「点菜按下」抢同一块点菜板。写成**对称**的，写一遍即可。
 */
function conflictingIds(it: TaxonomyItem): string[] {
	const all = PANELS.flatMap((p) => p.items);
	const out = new Set<string>();

	const mine = it.expr ?? [];
	for (const other of all) {
		if (other.id === it.id || !activeSet.has(other.id)) continue;
		const theirs = other.expr ?? [];
		if (mine.length && theirs.length && mine.some((a) => theirs.some((b) => overlaps(a, b)))) out.add(other.id);
	}

	for (const other of all) {
		if (other.id === it.id || !activeSet.has(other.id)) continue;
		if (it.excludes?.includes(other.id) || other.excludes?.includes(it.id)) out.add(other.id);
	}

	return [...out];
}

/* ── 同步到运行时 ── */
function sync() {
	if (!runtime) return;
	runtime.setSelection({ emotion: null, tool: null, accessories: [], props: activeExprs });
}

function panelOf(itemId: string) {
	return PANELS.find((p) => p.items.some((i) => i.id === itemId));
}

function applyItem(it: TaxonomyItem) {
	if (!canUse(it)) return;
	const panel = panelOf(it.id);
	let next = active.filter((id) => !conflictingIds(it).includes(id));

	if (panel?.mode === "radio") {
		// 同栏内互斥
		const siblings = panel.items.map((i) => i.id);
		next = next.filter((id) => !siblings.includes(id) || id === it.id);
	}
	if (!next.includes(it.id)) next = [...next, it.id];
	next = pruneDependencies(next);

	// 只有**真的顶掉了东西**才需要清动作状态。
	//
	// 以前只要这一栏发生任何变化就 resetMotions()，结果"开盖 → 换色"这种
	// 纯叠加操作也会把手机（长期状态、不每帧归位）一起清掉，手机就消失了。
	// 现在改成：没顶掉任何东西 = 状态是叠加的 = 不该清。
	const removed = active.filter((id) => !next.includes(id));
	active = next;
	if (it.clearMotions || (panel?.resetOnChange && removed.length > 0)) runtime?.resetMotions();

	if (it.motion && panel?.mode !== "action") runtime?.playMotion(it.motion[0], it.motion[1], FORCE);
	sync();
}

function onClick(it: TaxonomyItem) {
	if (!runtime) return;
	const panel = panelOf(it.id);
	if (panel?.mode === "action") {
		// 动作栏：不取消，只是重播 + 顺带把它的 expr 打开
		if (it.expr?.length && !activeSet.has(it.id)) active = [...active.filter((id) => !conflictingIds(it).includes(id)), it.id];
		if (it.motion) runtime.playMotion(it.motion[0], it.motion[1], FORCE);
		sync();
		return;
	}
	// 其它栏：再点一次取消
	if (isOn(it) && !it.clearMotions) {
		const next = pruneDependencies(active.filter((id) => id !== it.id));
		const removed = active.filter((id) => !next.includes(id));
		active = next;
		// 取消掉的若是"长期状态"，同样要清动作，否则手机还留在手上
		if (panel?.resetOnChange && removed.length > 0) runtime.resetMotions();
		sync();
		return;
	}
	applyItem(it);
}

/* ── 点击宠物时随机换表情（注册给运行时调用）── */

/** 表情栏的所有条目 */
const emotionItems = $derived(PANELS.find((p) => p.id === "expression")?.items ?? []);
/** 洗牌袋：一轮内不重复，用完再装满 */
let bag = $state<string[]>([]);

/**
 * 随机换一个表情。
 *
 * 运行时点宠物时会调这个（通过 `setEmotionRoller`），而不是它自己那套
 * `selection.emotion` —— 这样面板和画面永远一致，也不会出现两个表情同时生效。
 */
function rollEmotion() {
	const ids = emotionItems.map((i) => i.id);
	if (!ids.length) return;
	let pool = bag.filter((id) => ids.includes(id));
	if (!pool.length) {
		bag = ids.slice();
		pool = bag;
	}
	const pickId = pool[Math.floor(Math.random() * pool.length)];
	bag = bag.filter((id) => id !== pickId);
	const item = emotionItems.find((i) => i.id === pickId);
	if (item) applyItem(item);
}

$effect(() => {
	if (!runtime) return;
	runtime.setEmotionRoller(rollEmotion);
	return () => runtime.setEmotionRoller(null);
});

function toggleLock() {
	if (!runtime) return;
	locked = !locked;
	runtime.setLocked(locked);
}

/** 「恢复默认」要落到哪个条目上 */
const DEFAULT_ITEM_ID = "default";

/**
 * 把这两个按钮塞进 pio.js 的 `.pio-action` 按钮列。
 *
 * 那三个原生按钮（回到首页 / 了解更多 / 关闭桌宠）是 pio.js 自己 append 到
 * `.pio-action` 里的，样式由 `/pio/static/pio.css` 的 `.pio-action span` 提供：
 * 1.5em 见方、`border-radius: 66%`、`1px solid #666`、白底 + 单色 SVG，
 * 而且整列要**悬停桌宠才淡入**。
 *
 * 与其照着抄一遍（迟早会飘），不如直接放进同一个容器 —— 尺寸、描边、圆角、
 * 悬停淡入全部自动跟原生按钮一致，插件换样式我们也跟着变。
 *
 * `.pio-action` 由 Pio.svelte 渲染，pio.js 随后往里塞按钮，所以这里要等一下；
 * 最多重试 6 秒，拿不到就退回独立摆放（不影响使用）。
 */
function intoActionColumn(node: HTMLElement) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let tries = 0;
	const place = () => {
		const column = document.querySelector(".pio-container .pio-action");
		if (column) {
			column.appendChild(node);
			return;
		}
		if (++tries < 60) timer = setTimeout(place, 100);
	};
	place();
	return {
		destroy() {
			if (timer) clearTimeout(timer);
			node.remove();
		},
	};
}

/** 设置面板的图标（单色，和原生三个按钮同一风格） */
const ICON_SETTINGS = "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z";
const ICON_LOCK = "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z";
const ICON_UNLOCK = "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z";

/**
 * 恢复默认：清掉全部选择，然后自动选中「点菜」这个基准状态。
 *
 * 「点菜」是其他长期状态的地基（`clearMotions`），所以选中它就等于
 * 桌面空着、手也放回初始姿势 —— 这才是用户心里的"重置"。
 */
function clearAll() {
	if (!runtime) return;
	active = [];
	bag = [];
	runtime.resetMotions();
	runtime.setSelection({ emotion: null, tool: null, accessories: [], props: [] });
	const base = itemById(DEFAULT_ITEM_ID);
	if (base) applyItem(base);
}
</script>

<div class="pio-panel-root">
  <!-- 这两个按钮会被移动到 pio.js 的 .pio-action 列里，和原生三个按钮并排 -->
  <div class="pio-action-extra" use:intoActionColumn>
    <span
      class="pio-panel-toggle"
      class:active={open}
      role="button"
      tabindex="0"
      title={activeCount > 0 ? `桌宠设置（已选 ${activeCount} 项）` : "桌宠设置"}
      aria-label="打开设置面板"
      onclick={() => (open = !open)}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open = !open;
        }
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICON_SETTINGS} /></svg>
      {#if activeCount > 0}<i class="pio-panel-badge">{activeCount}</i>{/if}
    </span>
    <span
      class="pio-panel-toggle"
      class:locked
      role="button"
      tabindex="0"
      title={locked ? "已锁定：点击宠物不会换表情、也不会播动作（台词正常）" : "未锁定：点击宠物会随机换表情"}
      aria-label="锁定随机"
      onclick={toggleLock}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleLock();
        }
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={locked ? ICON_LOCK : ICON_UNLOCK} /></svg>
    </span>
  </div>

  {#if open}
    <div class="pio-panel">
      <header class="pio-panel-head">
        <strong>桌宠设置</strong>
        <button type="button" class="pio-panel-clear" onclick={clearAll} title="清掉全部选择，回到「点菜」这个基准状态">恢复默认</button>
      </header>

      {#each PANELS as panel (panel.id)}
        <section class="pio-panel-slot">
          <div class="pio-panel-slot-title">
            <span>{panel.title}</span>
            {#if panel.hint}<em>{panel.hint}</em>{/if}
          </div>
          <div class="pio-panel-grid">
            {#each panel.items as it (it.id)}
              {@const ok = canUse(it)}
              <button
                type="button"
                class="pio-panel-item"
                class:on={isOn(it)}
                class:action={panel.mode === "action"}
                disabled={!ok}
                title={ok ? it.id : `需要先选「${missingHint(it)}」`}
                onclick={() => onClick(it)}
              >
                {it.label}{#if !ok}<em>（需先{missingHint(it)}）</em>{/if}
              </button>
            {/each}
          </div>
        </section>
      {/each}

      <section class="pio-panel-slot">
        <div class="pio-panel-slot-title"><span>调试</span><em>和"点击宠物"用的是同一套逻辑</em></div>
        <div class="pio-panel-grid">
          <button type="button" class="pio-panel-item" onclick={rollEmotion}>随机换一个表情</button>
        </div>
      </section>

      <p class="pio-panel-tip">锁定后，点击宠物只弹台词，不会换表情也不会播动作。</p>
    </div>
  {/if}
</div>

<style>
  /*
   * 按钮本体已经搬进 .pio-action，尺寸/描边/圆角/白底/悬停淡入
   * 全部由 pio.css 的 `.pio-action span` 提供。这里只补它没有的两件事：
   * 图标居中，以及"已选中/已锁定"的状态底色。
   *
   * 用 `:global(.pio-action) .pio-panel-toggle`（0,2,0）压过
   * `.pio-action span`（0,1,1）的 `display: block`。
   */
  :global(.pio-action) .pio-action-extra {
    display: contents;
  }
  :global(.pio-action) .pio-panel-toggle {
    position: relative;
    display: grid;
    place-items: center;
    padding: 0;
    color: #555;
    transition: background-color 0.15s ease;
  }
  :global(.pio-action) .pio-panel-toggle svg {
    width: 72%;
    height: 72%;
    display: block;
    fill: currentColor;
  }
  :global(.pio-action) .pio-panel-toggle:hover {
    background-color: #eef2f6;
  }
  :global(.pio-action) .pio-panel-toggle.active {
    background-color: #e4eefb;
    color: #2b6cb0;
  }
  :global(.pio-action) .pio-panel-toggle.locked {
    background-color: #fdecec;
    color: #c53030;
  }
  :global(.pio-action) .pio-panel-toggle:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
  }
  /* 已选项数：做成一个小角标，不喧宾夺主 */
  :global(.pio-action) .pio-panel-badge {
    position: absolute;
    top: -0.35em;
    right: -0.35em;
    min-width: 1.05em;
    height: 1.05em;
    padding: 0 0.2em;
    border-radius: 0.55em;
    background: #3b82f6;
    color: #fff;
    font-size: 0.5rem;
    font-style: normal;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  /* 弹层：独立于按钮列，挂在容器右侧 */
  .pio-panel-root {
    position: absolute;
    top: 3em;
    left: 100%;
    pointer-events: none;
    z-index: 2;
  }
  .pio-panel-root > * {
    pointer-events: auto;
  }
  .pio-panel {
    width: 21em;
    max-height: 26em;
    overflow-y: auto;
    padding: 0.7em 0.8em;
    border: 1px solid rgb(0 0 0 / 0.08);
    border-radius: 0.8em;
    background: rgb(255 255 255 / 0.97);
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.16);
    font-size: 0.8rem;
    color: #333;
  }
  .pio-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5em;
  }
  .pio-panel-clear {
    border: 0;
    background: transparent;
    color: #3b82f6;
    font-size: 0.72rem;
    cursor: pointer;
  }
  .pio-panel-slot {
    margin-bottom: 0.6em;
  }
  .pio-panel-slot-title {
    display: flex;
    align-items: baseline;
    gap: 0.4em;
    margin-bottom: 0.28em;
    font-weight: 600;
    color: #111;
  }
  .pio-panel-slot-title em {
    font-style: normal;
    font-weight: 400;
    font-size: 0.65rem;
    color: #999;
  }
  .pio-panel-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em;
    align-items: center;
  }
  .pio-panel-item {
    padding: 0.22em 0.55em;
    border: 1px solid rgb(0 0 0 / 0.1);
    border-radius: 0.45em;
    background: #f7f7f8;
    color: #444;
    font-size: 0.72rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;
  }
  .pio-panel-item:hover:not(:disabled) {
    background: #eef4fb;
    border-color: #9cc4e8;
  }
  .pio-panel-item.on {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
  .pio-panel-item.action {
    border-style: dashed;
  }
  .pio-panel-item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pio-panel-item em {
    font-style: normal;
    font-size: 0.62rem;
    opacity: 0.8;
  }
  .pio-panel-tip {
    margin: 0.2em 0 0;
    font-size: 0.65rem;
    color: #999;
  }

  :global(.pio-container.pio-hidden) .pio-panel-root {
    display: none;
  }
  :global(.pio-container.active) .pio-panel-root {
    pointer-events: none;
  }
</style>
