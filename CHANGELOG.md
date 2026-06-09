# 更新日志

灵境时钟的版本演进。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/):
- **MAJOR** (X.0.0) — 不兼容的重大重构
- **MINOR** (0.X.0) — 新功能, 向后兼容
- **PATCH** (0.0.X) — 修复与小增强, 向后兼容

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
