## 目标
在保持现有"温馨治愈、慢生活"像素风格的前提下，补齐 UI 与动画的短板：模态框/Toast/提示目前都是"瞬间出现/消失"，Canvas 装饰动效未适配 `prefers-reduced-motion`。改动集中在 `style.css`、`ui.ts`、`scene-renderer.ts` 三个文件，外加删除已废弃的 `renderer.ts`。所有动效均为短促、柔和的微交互（≤0.2s），并统一纳入 reduced-motion 降级。

---

## 一、DOM / 界面打磨（`src/style.css` + `src/ui.ts`）

### 1. 模态框进出场动画（核心）
现状：`open()` 设 `modalBackdrop.hidden=false`，`close()` 设 `hidden=true`，进出均为瞬间。全局 `[hidden]{display:none!important}` 使出场动画无法播放。

方案：进场用 CSS 动画（un-hide 时自动播放），出场用 `.closing` 类 + `animationend` 收尾。
- **CSS**：新增
  - `@keyframes modal-in`（backdrop 透明度 0→1）
  - `@keyframes modal-pop`（modal 透明度 0→1 + translateY(8px)→0 + scale .97→1）
  - `@keyframes modal-out` / `@keyframes modal-unpop`（反向，`forwards`）
  - `.modal-backdrop{animation:modal-in .16s ease-out}`、`.modal-backdrop .modal{animation:modal-pop .2s cubic-bezier(.2,.8,.3,1)}`
  - `.modal-backdrop.closing{animation:modal-out .14s ease-in forwards;pointer-events:none}`、`.closing .modal{animation:modal-unpop .14s ease-in forwards}`
- **ui.ts**：
  - `close()`：不再直接 `hidden=true`。改为 `panel=null;draft=null` → 给 backdrop 加 `.closing` → 立即恢复焦点。新增构造函数内 `animationend` 监听：当 `animationName==='modal-out'` 时移除 `.closing` 并置 `hidden=true`。
  - `forceClose()`：保持瞬间（`hidden=true` + 移除 `.closing`），用于昼夜切换/睡眠/捕获/导入/重置。
  - `open()`：开头移除 `.closing`（防止 open 命中正在收尾的边界情况）。
  - 由于 `close()` 立即把 `panel` 置空，游戏循环立即解除暂停；backdrop 在 0.14s 淡出期间 `pointer-events:none`，不阻挡操作。

### 2. Toast 淡出
现状：`toast-in` 淡入，但 3.2s 后直接 `hidden=true` 瞬间消失。
- **CSS**：新增 `@keyframes toast-out`（透明度→0 + 下移 8px，`forwards`）、`.toast.leaving{animation:toast-out .2s forwards}`。
- **ui.ts `showToast`**：到时后先加 `.leaving`，监听 `animationend`（`once`）再 `hidden=true` 并移除 `.leaving`；重新显示时先移除 `.leaving`。

### 3. "按 E" 提示淡入淡出
现状：`worldPrompt.hidden=!near` 瞬间切换。
- 改为类驱动（避开 `[hidden]` 的 display:none 冲突，因该元素本就是 `position:absolute;pointer-events:none`）。
- **模板**：`<div id="worldPrompt" class="world-prompt" aria-hidden="true">`（去掉 `hidden`）。
- **CSS**：`.world-prompt{opacity:0;transform:translateX(-50%) translateY(4px);transition:opacity .15s,transform .15s}` + `.world-prompt.visible{opacity:1;transform:translateX(-50%)}`。
- **ui.ts `hud()`**：`$('worldPrompt').classList.toggle('visible',!!near)` 并同步 `aria-hidden`。

### 4. 农场手记展开/收起平滑过渡
现状：`journalBody.hidden` 切换，瞬间。
- 改用 `.collapsed` 类 + max-height/opacity 过渡（小面板，max-height 方案足够稳）。
- **CSS**：`#journalBody{max-height:420px;overflow:hidden;transition:max-height .22s ease,opacity .18s}`、`#journalBody.collapsed{max-height:0;opacity:0}`。
- **ui.ts**：`toggleJournal` 改为 `$('journalBody').classList.toggle('collapsed')`，`aria-expanded` 照旧。

### 5. 物品格 / 按钮悬停微交互
现状：悬停仅 `filter:brightness(1.07)`。
- **CSS**：`.item-slot{transition:transform .12s,box-shadow .12s,border-color .12s}` + `.item-slot:hover:not(.selected){transform:translateY(-2px);box-shadow:0 3px 0 #102b2433}`。工具栏激活按钮加 `translateY(-2px)` 轻微抬起反馈。

### 6. 钓鱼面板淡入
现状：`fishingPanel.hidden` 瞬间。
- **CSS**：`.fishing-panel{animation:panel-in .2s ease-out}` + `@keyframes panel-in`（opacity 0→1 + translateX(8px)→0）。un-hide 时自动播放一次；出场保持瞬间（游戏进行中，瞬间消失更不打扰）。仅做进场淡入，低风险。

### 7. 生命/饱食低值脉冲（点缀）
- **CSS**：`.vital.low i{animation:vital-pulse 1.4s ease-in-out infinite}` + `@keyframes vital-pulse{50%{filter:brightness(1.35)}}`。
- **ui.ts `hud()`**：值 <20 时给 `.vital` 加 `.low`，否则移除。

### 8. reduced-motion 统一覆盖
扩展现有 `@media(prefers-reduced-motion:reduce)` 规则，把新增的 transition/animation 全部纳入禁用：`button,.vital i,.item-slot,#journalBody,.world-prompt{transition:none}` 以及 `.toast,.transition,.modal-backdrop,.modal,.toast.leaving,.modal-backdrop.closing,.fishing-panel,.vital.low i{animation:none}`。

---

## 二、Canvas 动画打磨（`src/scene-renderer.ts`）

### 1. 适配 `prefers-reduced-motion`（无障碍补齐，最重要）
- 构造函数读取 `this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches`，并 `addEventListener('change', e => this.reduced = e.matches)` 支持实时切换。
- 装饰性动效在 `reduced` 时降级（移动/操作等必要动效保留）：
  - `weather()`：reduced 时画一层极淡静态色调代替雨雪条纹，直接 return。
  - `water()` 水面波光：reduced 时去掉 `Math.floor(this.time*4)` 时移，画静态波光。
  - 烟囱烟雾（`object()` house 分支）：reduced 时跳过烟雾 puffs。
  - `burst()`：reduced 时粒子数减为 3 个（保留一点反馈但不繁杂）。
  - 玩家动作 bob（draw 中 `Math.sin(this.actionAge*35)*...`）：reduced 时传 0。

### 2. 目标格角标脉冲
现状（line 67）：静态 `#f7e5ad` 角标。
- 用 `Math.sin(this.time*4)` 调制 alpha（0.55±0.3），reduced 时用固定 0.8。柔和呼吸感，引导视线。

### 3. 成熟作物微光
现状（`plots()` line 116）：成熟作物有一个固定 `#ffffff55` 高光像素。
- 改为随 `Math.sin(this.time*3)` 脉动的白色 alpha（0.25±0.2），reduced 时回退固定值。让"可收获"状态更易察觉。

---

## 三、清理（可选，低风险）
- 删除 `src/renderer.ts`：已确认无任何文件 import 它（`main.ts` 用 `./scene-renderer`，测试用 `./game`）。删除不影响构建与测试。

---

## 验证步骤
1. `npm run build`（`tsc && vite build`）确认类型与构建通过。
2. `npm test` 确认引擎单测不受影响。
3. `npm run dev` 手动核查：开/关背包模态框有淡入弹出与淡出收起；Toast 淡出；走近期示牌看"按 E"提示淡入淡出；收起农场手记平滑折叠；悬停物品格有轻微抬起；夜间/雨天画面正常；在系统设置"减少动态效果"下，Canvas 装饰动效与 CSS 动画均降级。

## 不在本次范围
- 不改动游戏逻辑（engine/fishing/world/content）、存档结构、键位。
- 不引入运行时依赖（保持零依赖）。
- 不重构颜色 token 化（属另一议题）。
