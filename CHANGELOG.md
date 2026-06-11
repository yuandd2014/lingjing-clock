# 更新日志

灵境时钟的版本演进。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/):
- **MAJOR** (X.0.0) — 不兼容的重大重构
- **MINOR** (0.X.0) — 新功能, 向后兼容
- **PATCH** (0.0.X) — 修复与小增强, 向后兼容

---

## v1.3.1 (2026-06-11)

**🎨 Apple 风 UI 大幅升级 + 🌧️ 天气数据健壮性 — 让桌面安静一点。**

### 新增

- **官网 5 页重构** — 新增 `design.html` 灵境UI 设计逻辑页 (8 主题色 + 4 视觉 token + 4 设计原则 + CSS 代码块)
- **官网 hero 改色块** — 删 demo-placeholder AI 味占位, 改 4 token 色块 (毛玻璃/粒子/发光/暗角) 2×2 网格
- **官网特性卡加底部色块** — 6 张卡各配主应用对应主题色色块
- **安装包 brand assets 重烧** — `installerHeader.bmp` / `installerSidebar.bmp` / `installerIcon.ico` / `installerHeaderIcon.ico` 全部走 Apple 风灵境色, 替换 v1.2.0 复用至今的旧图

### 改

- **官网 `changelog.html` 改体验风** — 6 段砍到 4 段, 删所有 `<code>` 技术名词, 删 emoji 前缀, 砍 "已砍功能/品牌资产复用" 内务信息
- **官网 `about.html` 删 timeline 段** — 跟 changelog 重复, 砍; 灵境UI 段加 token 描述 + "看完整设计语言" 链接
- **主仓 `firstrun.js` 引导卡 4→3** — 砍 "自动检查更新" 重复卡, 改 Apple 风 SVG 风格字符 (▣/◐/⌘)
- **主仓 `settings-ui.js` 字段 14→11** — 砍 `clock.size` / `clock.align` / `live2d.model` / `solar.opacity` 4 项
- **主仓 README 砍 8 段** — 删"这次更新" / "v1.x 历程" / "灵境UI 四象归一" / "主视觉" / "技术栈" / "目录结构" / "隐私说明" / "灵镜光感小论文"
- **主仓 README 修 5 处** — `v1.2.0` 链 → `releases/latest` / 95 MB → 89 MB / 93 MB → 89 MB / `dist_v10/` → `dist_v{N}/` / `wttr.in` → 和风
- **统一规则** — 通用内容不绑死版本号, 顶部下载 badge 链 `/releases/latest`

### 修复

- **🌧️ 天气系统数据健壮性 (T0)** — 双层防御, 杜绝 API icon/text 不一致导致的错位显示
  - **根因**: 和风天气 v7 API 在某些条件下返回 `icon=306(text=中雨)` 这种"icon 码与文字描述不一致"数据. 旧 `HEFENG_ICONS` 映射表 300+ 段 (`js/weather.js` L85-88) 把 306 错标为"小雪" ❄️, 导致 6 月重庆 22°C 实际中雨却显示"下雪" — 已被用户报为 T0 bug
  - **修复**:
    1. **以 API `text` 字段为权威** — 新增 `textToIcon(text)` 函数, 用关键词反推 emoji: 雪→❄️ / 雷阵雪→⛈️ / 雨→🌧️ / 转雨→🌦️ / 雾霾→🌫️ / 沙尘→🌬️ / 阴→☁️ / 多云→🌤️ / 晴→☀️. 三数据源 (和风 / wttr.in / open-meteo) × 六解析点 (current / hourly / daily) 全部走统一管线
    2. **温度合理性校验** — 新增 `sanitizeWeatherText(text, temp)`: `temp > 5°C` 但 desc 含"雪" → 降级为对应强度雨 (小雪→小雨 / 中雪→中雨 / 大雪→大雨 / 暴雪→暴雨 / 阵雪→阵雨 / 雷阵雪→雷阵雨 / 雨夹雪→阵雨). 防 API 数据异常时显示"22°C 下雪"这种诡异组合
  - **覆盖**: 3 数据源 × 6 解析点 = 18 个数据流点
  - **测试**: 30/30 单元测试 (含 user 实际场景 + 边界 5°C + 雷阵雪 + 雨夹雪) + 真实 API 端到端验证 (重庆渝中 23°C → "中雨 🌧️", 不再下雪)

### 不变

- 主题色 8 色 + 字体 4 套延续 v1.3.0
- Splash / 自动更新 / Live2D 加载 / 农历 等核心功能不动

---

## v1.3.0 (2026-06-10)

**🎨 主题色 — 让灵境也跟你的眼睛。**

### 新增

- **🎨 主题色切换 (8 色灵境品牌色)** — 设置面板新增 "主题" 卡片, 8 个灵境品牌色可选 (极光紫 / 薄荷绿 / 暗金 / 冰川蓝 / 哥特灰 / 蜜桃粉 / 电波青 / 甜橙); 切主题色 → 4 个 button 背景 + 1 spinner 边框 + 1 link hover 原子切换, 屏幕不闪
  - CSS 变量主题系统: `:root --primary-accent / --text-primary / --bg-base / --border-soft / --particle-tint / --hover-glow`
  - 启动时 + 任何设置变更后, 主题色自动应用 (`app.js` 启动调 + `settings.js` apply() 末尾调, 双保险)
  - localStorage 持久化, 关闭重启后记住
- **🔖 Splash 版本号动态化** — 之前 `splash.html` 硬编码 v1.2.0 + `js/splash.js` tagline 硬编码 v1.2.1, 启动模式 splash 上 2 处版本号不一致; 现在统一从 `package.json` → `app.getVersion()` → URL `?v=` → splash.js 动态填 `.splash-version` 元素, 唯一来源, 永远一致
  - Electron `loadFile` 用 `query: { v: app.getVersion() }` option 传 query (不能字符串拼接到 path, 会 `ERR_FILE_NOT_FOUND`)

### 内部

- 新增 `js/theme.js` (IIFE 闭包, 公开 `window.Theme = { THEME_PRESETS, applyTheme, hexOf }`)
- `js/settings.js` 加 `theme: { accent: 'aurora-purple' }` 字段
- `js/settings-ui.js` 加 "主题" section (select accent)
- `js/app.js` `DOMContentLoaded` 调 `Theme.applyTheme(Settings.get().theme)`
- `js/settings.js` `apply()` 末尾调 `Theme.applyTheme(current.theme)`
- `css/style.css` 加 `:root` 6 个 var + html/body 用 var + 5 处 button 背景 + 1 spinner border-top + 1 link hover 改用 `var(--primary-accent)` (8 处)
- `main.js` 改 splashWin loadFile 用 `query: { v: app.getVersion() }` option
- `splash.html` 删硬编码 `v1.2.0`, 留空 `<p id="splash-version"></p>`
- `js/splash.js` 加 `fillVersion()` 读 URL `?v=` 填 DOM, tagline 删硬编码 v1.2.1

### 修复 (源码层)

- **Splash 启动失败 (v1.3.0 第一次 main.js 改动用 `?v=` 字符串拼接到 path)** — `ERR_FILE_NOT_FOUND`, 应用打不开; 改用 `query: { v: app.getVersion() }` option 修

### 测试

- 静态测试 32/32 全过 (`build/tmp/test-theme.js`)
  - DEFAULTS.theme.accent / THEME_PRESETS 8 色 / applyTheme 写 `--primary-accent` / `:root` 6 var / settings-ui SECTIONS theme / theme.js 引入位置 / html/body 块改 var / app.js 启动调 applyTheme / settings.js apply() 末尾调 applyTheme / 5+3 处 css `var(--primary-accent)` 引用 / splash 版本号动态化 6 项 全覆盖

### 已知限制

- **字体大小功能砍掉** — v1.3.0 推 3 轮 bug, 主屏字体大小维持 160/24/72/42/48 px 不变, 仅保留主题色 (8 色切换)
- **品牌资产 (NSIS 头图 / 侧栏 / 图标) 复用 v1.2.0** — 计划 v1.3.1 PATCH 时重烧新一版

### 下载

- 安装版: `LingJing.Clock.Setup.1.3.0.exe`
- 便携版: `LingJingClock-Portable.exe`

---

## v1.2.1 (2026-06-10)

**🔔 自动更新 — 让升级也轻巧。**

### 新增

- **🔔 自动检查更新 (1 小时周期)** — 启动 6 秒后静默问一次 GitHub "有新版本吗?", 之后每 1 小时再问一次; 有更新后台下载, 装好弹非阻塞 toast (右上角毛玻璃卡片); **不强制重启**, 您点"立即重启"才生效
- **💡 首启一次性提示** — 首次启动 1.5 秒后弹蓝色 hint toast, 文案 "自动检查更新已开启 · 仅向 GitHub 问版本, 不上传任何数据", 配 "一键关闭" 按钮, 5 秒自动消失
- **🔒 隐私 — 三条明文** — ① 只向 GitHub API 发 OS / Electron / app 版本 (GitHub 自动丢弃 IP); ② 不上报任何使用数据 / 屏幕截图 / 文件内容; ③ 网络异常静默失败, 不弹任何错
- **🛠️ 设置面板 bug 修复** — "自动检查更新" 开关原本读不到值, 一直显示不勾选 (实际后台已开); 现 _system 顶层读取 + IPC 桥接 + 立即生效

### 内部

- `js/settings.js` 加 `DEFAULTS.autoUpdateCheckInterval: 3600000` (1h) + `DEFAULTS.autoUpdateFirstHintShown: false`
- `js/settings-ui.js` 修 `_system` 顶层读取 bug + 加 `showAutoUpdateHint()` (蓝色变体 toast) + 暴露 `window.LingJingSettingsUI.showAutoUpdateHint`
- `js/app.js` DOM ready 后 1.5s 触发 `showAutoUpdateHint()`
- `preload.js` 暴露 `electronAPI.autoUpdateSetEnabled`
- `main.js` 加 IPC `auto-update-set-enabled` + 1h `setInterval` 周期扫描
- `css/style.css` 新增 `.update-toast-hint` (蓝色变体) + `.update-toast-action-close` 样式
- `js/firstrun.js` 4 张引导卡 + 自动更新宽卡 (提示已开启)
- `README.md` 新增 "🔄 自动更新 — 隐私说明" 段落
- 官网 `lingjing-clock-website`: `changelog.html` v1.2.1 转正 + `about.html` 时间轴 5 个版本
- `js/splash.js` 仪式感统一 — 装包模式 / 启动模式 都走 stage 渐隐 280ms (跟启动模式一致)
- 新增顶层 `LICENSE` (MIT, year 2026, author yuandd2014, 25 行)

### 测试

- 静态测试 42/42 全过 (`build/tmp/test-autoupdate.js`)
  - 自动更新默认值 / 周期 / IPC 桥 / 提示逻辑 / 设置持久化 全覆盖

### 下载

- 安装版: `LingJing.Clock.Setup.1.2.1.exe`
- 便携版: `LingJingClock-Portable.exe`

---

## v1.2.0 (2026-06-09)

**灵境 安装仪式 + 自动更新 — 让升级也变得轻巧。**

### 新增

- **🎁 灵境 安装仪式 (Splash)** — 复制文件完成后, 灵境时钟自身弹一个 480×360 居中圆角毛玻璃 splash 仪式页: 1.4s 冷白月光光毯 + 灵字 Logo 浮呼吸 + 紫青极光进度条 + 4.5s 后自动退场
  - 装好立刻可见, 不再是干巴巴的"安装完成"
  - 复用 `firstrun.js` 的 `lightSweep` keyframe, 保持视觉一致
  - 减弱动效兜底 (`prefers-reduced-motion`)
- **🖼️ NSIS 安装器品牌化** — 头图 164×55 + 侧栏 164×314 + 安装器图标 256×256 + 头图图标 32×32 全部烧灵境品牌色 (紫青极光渐变 + 灵字 Logo)
  - 头图技术细节: BMP 32-bit BI_RGB 未压缩, 侧栏 164×314, NSIS MUI2 100% 接受
  - 安装器图标 256×256, 资源管理器 / 任务栏 / 卸载器统一使用
- **⚙️ 安装选项页 (nsDialogs 自绘)** — 路径选择后, 安装前弹一个"安装选项"页, 3 个勾选:
  - ☑ **启用自动检查更新 (推荐)** — 默认勾上, 旁注"需要联网获取新版本, 您随时可在 设置 中关闭"
  - ☑ 创建桌面快捷方式 (默认勾上)
  - ☑ 创建开始菜单快捷方式 (默认勾上)
  - 写注册表 `HKCU\Software\LingJing Clock\AutoUpdate` (DWORD) — 装好后 app 读这个值
- **🔔 自动检查更新 (electron-updater)** — 启动 6s 后, 静默 `checkForUpdates()`; 有更新后台下载; 装好弹非阻塞 toast (右上角毛玻璃卡片)
  - 默认开启, 用户随时可在 设置 → 系统更新 关闭
  - **显式告知网络需求**: 安装选项页旁注 + 设置页 "立即检查更新" 按钮
  - 通知文案: "发现新版本 vX.Y.Z — 正在后台下载, 装好会通知您" / "灵境时钟 vX.Y.Z 已下载 — 重启后生效"
  - **不强制重启** — `autoInstallOnAppQuit: false`, 用户点"立即重启"才生效
- **📜 精简用户协议 (LICENSE.txt)** — ~200 字, 4 条 (自由使用 / 不保证质量 / 数据归属 / 反馈与贡献), 不堆诱导分享、争议仲裁、冗长免责条款
- **🪟 自定义 Welcome / Finish / Unwelcome 页** — 灵境色头图 + 标题, 装完引导"立即体验灵境时钟" (默认勾上)

### 内部

- 新增 `LICENSE.txt` (UTF-8 BOM, 950 bytes, 4 段 ~200 字)
- 新增 `build/installer.nsh` (NSIS 钩子):
  - `customWelcomePage` / `licensePage` / `customFinishPage` / `customUnWelcomePage`
  - `customPageAfterChangeDir` — nsDialogs 自绘"安装选项"页 (3 checkbox + 2 label + 1 groupbox)
  - `customInstall` — `WriteRegDWORD` 写 3 个用户选项 + `ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --splash-mode'`
- 新增 `build/installerHeader.bmp` (164×55, 32-bit) / `build/installerSidebar.bmp` (164×314, 32-bit) / `build/installerIcon.ico` (256×256) / `build/installerHeaderIcon.ico` (32×32)
- 新增 `splash.html` / `css/splash.css` / `js/splash.js` — 独立 splash UI, 480×360 圆角 28px
- `main.js` 改:
  - 检测 `--splash-mode` argv, 启动 splash 窗口 (480×360 居中, transparent + frame:false)
  - 集成 `electron-updater`, 启动 6s 后静默 `checkForUpdates()`
  - 读 `HKCU\Software\LingJing Clock\AutoUpdate` 注册表 + `lingjing-settings-v1.json` 决定是否启用
  - IPC: `splash-dismiss` / `auto-update-check` / `auto-update-install` / `auto-update-get-enabled`
- `preload.js` 暴露 `lingjingSplash.dismiss` + `electronAPI.{autoUpdateCheck, autoUpdateInstall, getAutoUpdateEnabled, onUpdateEvent}`
- `js/settings.js` 加 `autoUpdateEnabled: true` 默认
- `js/settings-ui.js` 加"系统更新"section (开关 + "立即检查更新"按钮) + `showUpdateToast` (右上角非阻塞毛玻璃卡片)
- `css/style.css` 新增 ~103 行 (.update-toast + .settings-action-btn)
- `package.json` 改: `version 1.1.0 → 1.2.0`, `output dist_v9 → dist_v10`, `publish github`, `nsis.license/header/sidebar/icon`, `oneClick: false` (assisted), 加 `electron-updater` 依赖
- `dist_v10/` 产物:
  - `LingJing.Clock.Setup.1.2.0.exe` (NSIS 安装器, 灵境品牌色, 协议页, 安装选项页, splash 仪式)
  - `LingJingClock-Portable.exe` (便携版)

### 下载

- [LingJing.Clock.Setup.1.2.0.exe](https://github.com/yuandd2014/lingjing-clock/releases/download/v1.2.0/LingJing.Clock.Setup.1.2.0.exe)
- [LingJingClock-Portable.exe](https://github.com/yuandd2014/lingjing-clock/releases/download/v1.2.0/LingJingClock-Portable.exe)

---

## v1.1.0 (2026-06-09)

**灵境 Onboarding — 让首次启动也有仪式感。**

### 新增

- **🌅 首次启动毛玻璃欢迎页** — 应用启动时 (仅一次) 弹出全屏毛玻璃引导页, 1.4s 冷白月光光毯横扫, 3 张引导卡 (右下角热区 / 设置面板 / 快捷键) 错峰淡入, 主按钮呼吸动效
  - 设计语言: 与 `settings-overlay` 一致的毛玻璃 + 紫青极光渐变, 不是新起炉灶
  - 入场 1.6s 内完成, GPU 合成层, 0 layout thrashing
  - 键盘: `Esc` 关闭 (等同 "稍后再说") / `Enter` 触发 "开始使用"
  - 可访问性: `role="dialog" aria-modal="true" aria-labelledby`, 焦点自动跳到主按钮, 关闭时还原
  - 动效减少: `prefers-reduced-motion: reduce` → 光毯 0 动效直接显示
  - 异常兜底: localStorage 写失败不阻断应用
- **✨ "重新显示欢迎页" 入口** — 设置面板底部加链接, 一键重看 Onboarding (清 flag + 强制展示)
- **💫 主按钮点击 ripple** — CSS 伪元素, 不依赖 JS, 0 阻塞
- **🎴 卡片 hover 反馈** — 上移 4px + 极光色 glow
- **🫁 主按钮呼吸动效** — 1.8s 周期, CTA 突出

### 内部

- `js/firstrun.js` 新增 (IIFE, 190 行, 含动效 / 键盘 / 可访问性 / 兜底全套)
- `css/style.css` 新增 `firstrun-overlay / light-sweep / firstrun-stage / firstrun-card / firstrun-btn` 段落 (约 200 行)
- `index.html` 引入 `js/firstrun.js`, 设置面板加 `#settings-show-welcome` 链接
- `js/settings-ui.js` 加 "重新显示欢迎页" 事件 (延迟 240ms 关设置再开, 体验更顺)

### 下载

- 安装版: `LingJing.Clock.Setup.1.1.0.exe`
- 便携版: `LingJingClock-Portable.exe`

---

## v1.0.1 (2026-06-08)

**这次让桌面时钟终于"听你的话"。**

### 新增

- **GUI 设置面板** — ⚙ 按钮打开, 6 大类共 14 项配置
  - 天气 / 日历 / 节气 面板: 显示开关 + 透明度
  - Live2D 角色: 显示 + 透明度 + 模型选择 (志贵 v1 占位)
  - 背景粒子: 显示 + 数量 0-30
  - 时钟数字: 字号 / 透明度 / 左中右对齐
- **右下角 100×100 热区** — 鼠标移到屏幕右下角才显控制条, 平时干净
- **统一弹窗 (Modal)** — 自制毛玻璃风, 替代 `window.confirm`/`alert`
- **布局自适应** — 按可见面板数 (N0/N1/N2/N3) 切 4 套 grid 模板
  - N1: clock 居中放大 200px
  - N0: clock 居中放大 240px

### 移除

- 全屏按钮 + F11 快捷键 + 双击全屏 (启动默认全屏保留)
- 原生 `confirm()` 弹窗

### 内部

- 设置持久化: `localStorage['lingjing-settings-v1']`
- `.gitignore` 加 `website-site/` (官网源码独立仓库, 不入主项目)

### 修复 (源码层, 待下次打包生效)

- **每日一言模块加载失败** — `js/quotes.js` 文件末尾截断, 整个 module 抛 `SyntaxError: Unexpected end of input`, `QUOTES` 永远 undefined, 每日一言**实际只在显示 fallback** "学而不思则罔, 思而不学则殆。" (v1.0.0 release 起就一直如此)
- **名言数据大量重复** — 同一份《易经》卦爻辞 64 句被重复粘贴了 11 次左右, 1265 条总数里只有 477 条 unique. 30 天不重复算法从未真正生效, 每天实际显示同一条
- 修复: 补 `quotes.js` 末尾缺失的 `: "《易经》" },\n];` 4 项闭合 + 用 `Map` 去重保留 477 unique. 30 天不重复算法现已正常工作, 每日一言功能恢复

> 注: v1.0.1 installer 仍包含修复前的代码, **下载 v1.0.1 的用户需要等下次打包 (或临时手动覆盖 `js/quotes.js`)** 才能用上每日一言.

### 下载

- 安装版: `LingJing.Clock.Setup.1.0.1.exe`
- 便携版: `LingJingClock-Portable.exe`

---

## v1.0.0 (2026-06-08)

**初次见面, 请多关照。**

- 时分秒 + 农历 / 节气 / 干支纪年
- 逐时天气预报 — 今日剩余小时 + 明日关键时段
- Live2D 角色 — Hiyori 与志贵
- 每日一言
- 浏览器定位 + IP 城市定位双重兜底
- 灵境UI — 毛玻璃、模糊发光、暗角
- Windows 10 / 11 · NSIS 安装包 + 便携版
