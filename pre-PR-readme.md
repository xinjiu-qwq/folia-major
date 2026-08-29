# PR 描述：歌词页曲目卡片（Now Playing Card）与显示设置

> 分支：`song-ui-block`（基于上游 main `7800c808`，3 commits，10 文件 +413 行，纯新增能力，无删除性改动）

## 概述

在歌词页（player 视图）左下角新增“正在播放”信息卡片：左侧圆角封面 + 右侧歌名/歌手。卡片支持完整的显示行为设置——显示模式（限时自动隐藏 / 常驻 / 不显示）、限时模式的显示时长，以及是否在主页（Home）同时显示。点击卡片可打开右侧播放面板。全部改动为新增可选能力，默认配置不改变任何现有行为。

## 功能细节

### 1. 卡片本体（新增 `src/components/floating-player/StageTrackPill.tsx`）

- 布局：左侧 48px 圆角封面（`rounded-2xl`，与右侧面板内专辑封面同形状；无封面时显示音符占位图标），右侧两行文字——歌名（粗体、主文字色）与歌手（小字、次级色 60% 透明度）。
- 外形：72px 高全圆角（`rounded-full`）玻璃拟态条（`backdrop-blur-xl`），与底部中央控制条完全展开态同高；宽度随内容自适应（`w-fit`，上限 `calc(100vw-120px)` 防窄窗溢出）；位置 `bottom-8`，与中央控制条、右侧圆形开关水平对齐。
- 主题：亮/暗双分支（`isDaylight`），复用项目现有 glass 样式约定与 `var(--text-primary)` / `var(--text-secondary)` 主题变量。
- 封面：走 `getSizedCoverUrl(coverUrl, 256)` 复用现有封面尺寸工具。
- automix 兼容：歌手名使用上游 `displaySongArtist` 派生值，智能过渡期间显示过渡曲的正确信息。
- 点击行为：歌词页点击卡片 → 打开右侧播放面板（`PlayerPanel`，定位到 cover 页，即大封面视图）；Home 页点击卡片 → 导航到歌词页。
- 不带任何播放控制按钮：切歌 / 队列 / 歌词时间轴保留在底部中央控制条，职责不重叠。

### 2. 显示行为（三态 + 计时）

- `auto`（默认）：进入歌词页显示 **10 秒**后 0.4s 淡出；**换歌时重新计时**（计时器以歌名变化为键重置，automix 过渡换曲同样生效）。
- `always`：常驻显示。
- `never`：完全不渲染（不挂载，零开销）。
- 计时器在 effect cleanup 中清理，无泄漏。

### 3. 设置界面（设置 → 外观 → 播放器界面，位于“自动隐藏控制栏”开关之后）

- **歌曲信息卡片**：三选一模式按钮（限时显示 / 常驻显示 / 不显示），复用现有 accent 选中样式（`getAccentOptionStyle`）。
- **显示时长**：3–60 秒滑条，仅在“限时显示”模式下出现；样式与「整体透明度」滑条同款——标签居左、等宽字体数值居右（如 `10s`）、全宽细轨道 + 圆形滑块（hover 放大）、亮暗自适应。
- **在主页显示**：开关（默认关）。开启后 Home 页左下角也显示该卡片，显示模式/时长同样生效。
- 所有设置写入 localStorage 实时持久化，修改即时生效。

### 4. i18n

`zh-CN` / `en` / `in` 三份 locale 同步新增 8 个 key：`stageTrackPill`、`stageTrackPillDesc`、`stageTrackPillMode_auto|always|never`、`stageTrackPillTimeout`、`stageTrackPillShowOnHome`、`stageTrackPillShowOnHomeDesc`。

## 实现清单

| 文件 | 改动 |
| --- | --- |
| `src/components/floating-player/StageTrackPill.tsx` | 新增（155 行）：卡片组件，视觉 + 三态计时 + 点击回调 + Home 支持 |
| `src/stores/useSettingsUiStore.ts` | +65：`stageTrackPillMode`（`auto/always/never`）、`stageTrackPillTimeoutSec`（3–60，clamp）、`stageTrackPillShowOnHome`（bool）三个设置项与对应 handler；localStorage key `stage_track_pill_mode` / `stage_track_pill_timeout_sec` / `stage_track_pill_show_on_home`；进 `selectSettingsUiSnapshot` |
| `src/components/modal/settings/AppearanceSettingsSubview.tsx` | +51：模式三选一按钮、P1 同款时长滑条、主页显示开关 |
| `src/components/modal/SettingsModal.tsx` | +8：从 store 解构新设置项并透传给 Appearance 子视图 |
| `src/components/app/overlays/buildAppOverlaysModel.ts` | +19：新参数 `displaySongArtist` / `stageCoverUrl` / `stageTrackPillMode` / `stageTrackPillTimeoutSec` / `stageTrackPillShowOnHome` / `onOpenPlayerPanel`；构造可选 `floatingControls.stageTrackPill`（`player` 视图，或 `showOnHome` 开启时含 Home） |
| `src/components/FloatingPlayerControls.tsx` | +25：新增可选 prop `stageTrackPill`，条件渲染 `<StageTrackPill>`（不传即完全不渲染） |
| `src/App.tsx` | +19：传入上述参数（含 useMemo 依赖）；实现 `onOpenPlayerPanel`——player 视图 `setPanelTab('cover')` + `setIsPanelOpen(true)`，Home 视图 `navigateToPlayer()` |
| `src/i18n/locales/{zh-CN,en,in}.ts` | 各 +8：见上 |

## 提交

- `fa4b8f07` feat: 歌词页左下角曲目信息卡
- `4f8327ac` feat: 歌曲卡片显示设置（限时隐藏/常驻/不显示+时长可调）
- `c0416673` feat: 卡片点击打开右侧面板与主页显示增强

## 兼容性与设计约束

- 所有新能力为**可选 prop / 新增字段**，默认值与现有行为完全兼容，对上游代码零破坏，合并冲突面最小。
- 不新增播放控制入口，与中央控制条职责不重叠（评审明确要求避免重复按钮）。
- 遵循项目既有约定：颜色走主题 CSS 变量、样式跟随 `isDaylight`、i18n 三份同步、设置统一走 `useSettingsUiStore` + `selectSettingsUiSnapshot`。
- 面板打开复用现有 `PlayerPanel` / `UnifiedPanel` 展开机制，无新增状态机。

## 验证

- `tsc --noEmit` 通过（基点为上游 `7800c808`，含 mod 加载器 #308、automix #304、sleep timer #307）。
- `vite build` + `electron-builder --win dir` Windows 打包通过；asar 内容校验确认新代码已打包。
- 实机运行验证：卡片显示 / 10s 自动隐藏 / 换歌重计时；设置三模式与时长滑条实时生效；主页开关行为；点击卡片打开右侧面板（cover 页）与 Home 跳转；亮暗双主题。
