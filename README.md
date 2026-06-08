# 灵境时钟 · LingJing Clock

> 屏幕如镜, 光从内生。

**灵境时钟** 是一款为 Windows 桌面打造的待屏时钟, 搭载自研 **灵境UI** 设计语言与 **灵镜光感** 视觉效果。集成超大数字时钟、实时天气、农历日历、节气/每日一言、Live2D 虚拟形象和粒子背景。

![平台](https://img.shields.io/badge/platform-Windows%2010%2F11-blue) ![架构](https://img.shields.io/badge/arch-x64-green) ![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F) ![License](https://img.shields.io/badge/license-MIT-blue) ![UI](https://img.shields.io/badge/UI-灵境UI-ff6b9d) ![灵镜光感](https://img.shields.io/badge/光感-灵镜光感-7c3aed)

## ✨ 灵境UI · 设计语言

**灵境UI** 是本项目自研的桌面设计语言, 核心理念是"屏幕如镜, 光从内生"。

### 灵镜光感（视觉效果）
- **毛玻璃** — `backdrop-filter: blur(40px) saturate(1.8)` 多层叠加
- **粒子背景** — 白色细粒从底部向上漂浮
- **模糊发光** — 文字采用多层 `text-shadow` 与 `drop-shadow`
- **暗角** — 中心透明、边缘渐黑的径向遮罩

### 布局
- 3×2 网格, 玻璃卡片化分区
- 钟体居左跨 2 行, 给数字"主角感"
- 天气 / 日历 / 每日一言 三块卡片, 环形呼应

## 🎯 功能特性

- **🕐 超大数字时钟** — Orbitron 字体 + 灵镜光感
- **☁️ 三源容错天气** — 和风天气 (国内主力) + wttr.in + open-meteo 多级降级
- **📅 高精度农历/节气** — 公历/农历双向转换、干支、生肖
- **💬 每日一言** — 1265 句中外名言, 30 天内不重复, 点击卡片可手动刷新
- **🌸 Live2D 虚拟形象** — Cubism 4 SDK, 支持 Hiyori / shizuku 模型
- **✨ 灵镜光感背景** — 动态漂浮粒子 + 毛玻璃
- **🌍 国内 IP 定位** — 浏览器 geolocation 优先 + IP 定位兜底

## 📸 截图

<!-- 实际运行截图，建议在 release 页面查看 -->

## 🚀 快速开始

### 方式一：直接下载（推荐）

从 [Releases](../../releases) 页面下载：
- **`LingJing Clock Setup 1.0.0.exe`** — NSIS 安装版（推荐）
- **`LingJingClock-Portable.exe`** — 便携版（解压即用）

### 方式二：源码运行

```bash
# 克隆
git clone https://github.com/<owner>/lingjing-clock.git
cd lingjing-clock

# 安装依赖
npm install

# 开发模式
npm start

# 打包
npm run dist     # 输出到 dist/
```

## 🛠️ 技术栈

- **Electron 31.7.7** — 跨平台桌面框架
- **Pixi.js 6 + pixi-live2d-display 0.4** — Live2D 渲染
- **Cubism 4 SDK** — Live2D 模型
- **electron-builder 24** — 多目标打包（NSIS + portable）

## 📁 目录结构

```
lingjing-clock/
├── main.js                  # Electron 主进程
├── preload.js               # 预加载脚本
├── index.html               # 入口 HTML
├── package.json             # 依赖 + 打包配置
├── css/
│   └── style.css            # 灵镜光感全部样式
├── js/
│   ├── app.js               # 应用初始化
│   ├── clock.js             # 时钟
│   ├── calendar.js          # 农历/日历/名言
│   ├── lunar.js             # 高精度农历算法
│   ├── weather.js           # 天气（和风/wttr.in/open-meteo）
│   ├── live2d-loader.js     # Live2D 加载
│   └── quotes.js            # 1265 句名言
├── assets/
│   ├── wallpaper.jpg        # 背景壁纸
│   ├── icon.ico             # 应用图标
│   └── live2d/              # Live2D 模型（Hiyori / shizuku）
└── README.md
```

## 🔑 隐私说明（重要）

本项目内嵌了**和风天气**的 API Key（混淆存储在 `js/weather.js` 中）。

为了让上游公开仓库 clone 后"开箱即用"，代码对 key 做了 **obfuscation（混淆）**处理：

```js
// 拆分 + 反转 + Base64 (在 js/weather.js 的 WEATHER_CONFIG 中)
_k1 = 'ZWY5MWMyZTRkYWM2NmNiYm'
_k2 = 'IwMDRhMzY4ZTYxNGViMWI='
key = atob(_k1 + _k2).split('').reverse().join('')
```

> ⚠️ 原始 key **不直接出现在任何文件**中（包括本 README、源码、commit history）。如需查看还原后的值，可在浏览器 DevTools 中执行 `atob('ZWY5MWMyZTRkYWM2NmNiYm' + 'IwMDRhMzY4ZTYxNGViMWI=').split('').reverse().join('')`。

### ⚠️ 请知悉

- **这不是真正的安全加密**——任何前端 JS 都能被浏览器调试或反编译还原
- 仅用于**防止普通用户的简单文本搜索（grep / IDE 搜索）**和直接复制
- 如果你 fork 本项目并修改 key，请保持同样的混淆结构
- 如果你 fork 后发布到公开渠道，请**确保你有合法的 API Key 使用权**
- 滥用作者原 key 可能导致 key 被和风官方封禁，届时作者会替换为新 key

### 🔧 自定义你的 Key

如需替换为你自己的和风天气 Key：

1. 在 [和风天气开发者平台](https://dev.qweather.com/) 注册并获取 Key
2. 修改 `js/weather.js` 中的 `_k1` 和 `_k2`（按相同算法编码你自己的 key）
3. 或直接替换 `hefengKey` getter 返回值（不混淆，但便于调试）

## 🐛 故障排查

| 问题 | 解决方案 |
|---|---|
| 天气显示"数据获取失败" | 检查网络，本应用按"和风 → wttr.in → open-meteo"顺序尝试 |
| Live2D 不显示 | 确认 `assets/live2d/Hiyori/` 完整存在 |
| 打包失败（app.asar 被锁） | 关闭已运行的 EXE 实例，或输出到新目录 `dist_v9/` |

## 🪞 关于「灵境UI / 灵镜光感」

> 屏幕如镜, 光从内生。

**灵境UI** 是灵境时钟的原创桌面视觉设计语言, **灵镜光感** 是其核心视觉效果。

命名取东方禅意与古典意境, 与"灵动岛"、"光遇"等当代命名, 皆为对自身视觉的独立标记, 非对任何既有系统或产品之仿。

## 🤝 贡献

欢迎 PR 和 Issue。本项目以"够用就好"为原则，避免过度工程化。

## 📄 License

MIT
