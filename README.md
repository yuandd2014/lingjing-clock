# 灵境时钟 · LingJing Clock

> 屏幕如镜, 光从内生。

让 Windows 桌面, 拥有一面映照时间的镜子。

[![下载 v1.2.1](https://img.shields.io/badge/下载-v1.2.1-0071e3?style=for-the-badge)](https://github.com/yuandd2014/lingjing-clock/releases/latest)
[![平台](https://img.shields.io/badge/平台-Windows%2010%2F11-0071e3?style=flat-square)](#)
[![架构](https://img.shields.io/badge/架构-x64-34c759?style=flat-square)](#)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-8e8e93?style=flat-square)](#)
[![UI](https://img.shields.io/badge/UI-灵境UI-ff6b9d?style=flat-square)](#)
[![灵镜光感](https://img.shields.io/badge/光感-灵镜光感-7c3aed?style=flat-square)](#)

---

## 🪞 灵境 — 一面映照你桌面的镜子

灵境时钟不是一堆功能堆砌, 而是一件器物。时分秒跳动, 农历节气轮转, 天气阴晴, Live2D 角色在你桌前 — 一切都安静地、克制地, 映照在你眼前。

**灵境UI** 是本项目自研的桌面设计语言 — 屏幕如镜, **光从内生**。

---

## 🎁 这次更新 · v1.2.1

**灵境 安装仪式 + 自动更新 — 让升级也变得轻巧。**

- **🎁 灵境 安装仪式 (Splash)** — 装好立刻可见, 不再是干巴巴的"安装完成"。1.4s 冷白月光光毯 + 灵字 Logo 浮呼吸 + 紫青极光进度条
- **🖼️ NSIS 安装器品牌化** — 头图 / 侧栏 / 图标 全部烧灵境品牌色 (紫青极光渐变 + 灵字 Logo)
- **⚙️ 安装选项页** — 路径选择后, 自绘"安装选项"页 (3 个勾选 + 旁注)
- **🔔 自动检查更新** — 启动 6s 后静默检查; 有更新后台下载, 装好弹非阻塞 toast
- **📜 精简用户协议 (LICENSE.txt)** — ~200 字, 4 条
- **🪟 自定义 Welcome / Finish 页** — 灵境色头图 + 标题, 装完引导"立即体验灵境时钟"

**v1.x 历程**:

- 🌅 **v1.1.0** — 首次启动毛玻璃欢迎页, 让首次启动也有仪式感
- ⚙️ **v1.0.1** — GUI 设置面板 + 14 项配置, 让桌面时钟终于"听你的话"
- 🎉 **v1.0.0** — 首发, 基础功能

---

## 🪞 灵境UI · 四象归一

**灵镜光感** 是灵境UI 的核心视觉效果, 一束光, 拆成四种语言:

| 元素 | 描述 |
|---|---|
| 🪟 **毛玻璃** | `backdrop-filter: blur(40px) saturate(1.8)` 多层叠加 |
| ✨ **粒子背景** | 白色细粒从底部向上漂浮 |
| 💡 **模糊发光** | 文字多层 `text-shadow` + `drop-shadow` |
| 🌑 **暗角** | 中心透明, 边缘渐黑的径向遮罩 |

---

## 🎯 功能特性

- **🕐 超大数字时钟** — Orbitron 字体 + 灵镜光感
- **☁️ 三源容错天气** — 和风天气 (国内主力) + wttr.in + open-meteo, 永不离线
- **📅 高精度农历/节气** — 公历/农历双向转换、干支、生肖
- **💬 每日一言** — **477 句** 精选 (古典到现代), 30 天内不重复, 点击卡片可手动刷新
- **🌸 Live2D 虚拟形象** — Hiyori / 志贵, 鼠标交互、动作随机
- **✨ 灵镜光感背景** — 动态漂浮粒子 + 毛玻璃
- **🌍 国内 IP 定位** — 浏览器 geolocation 优先 + IP 定位兜底
- **⚙️ 6 大类设置** — 天气 / 日历 / 节气 / Live2D / 粒子 / 时钟 共 14 项
- **🔄 自动检查更新** — 静默后台, 非阻塞 toast 通知

---

## 📸 主视觉

![灵境时钟 实时演示](assets/img/lingjing-demo.gif)

---

## 🚀 快速开始

### 方式一: 直接下载 (推荐)

从 [Releases · v1.2.0](https://github.com/yuandd2014/lingjing-clock/releases/tag/v1.2.0) 下载:

| 文件 | 大小 | 说明 |
|---|---|---|
| **`LingJing.Clock.Setup.1.2.1.exe`** | **95 MB** | NSIS 安装版 (推荐) |
| **`LingJingClock-Portable.exe`** | **93 MB** | 便携版, 解压即用 |
| `LingJing.Clock.Setup.1.2.0.exe.blockmap` | 96 KB | 增量更新用 |

> 💡 也可访问 [官网 lingjing-clock-website](https://yuandd2014.github.io/lingjing-clock-website/) 获取最新下载链接

### 方式二: 源码运行

```bash
git clone https://github.com/yuandd2014/lingjing-clock.git
cd lingjing-clock

npm install
npm start          # 开发模式

npm run dist       # 打包到 dist_v10/
```

---

## 🛠️ 技术栈

- **Electron 31.7.7** — 跨平台桌面框架
- **Pixi.js 6 + pixi-live2d-display 0.4** — Live2D 渲染
- **Cubism 4 SDK** — Live2D 模型 (Hiyori / shizuku)
- **electron-builder 24** — NSIS + portable 打包
- **electron-updater 6** — 自动更新 (启动 6s 后静默检查)

---

## 📁 目录结构

```
lingjing-clock/
├── main.js                  # Electron 主进程
├── preload.js               # 预加载脚本
├── index.html               # 入口 HTML
├── splash.html              # 灵境 安装仪式
├── package.json             # 依赖 + 打包配置
├── css/
│   ├── style.css            # 灵镜光感全部样式
│   └── splash.css           # 安装仪式专用样式
├── js/
│   ├── app.js               # 应用初始化
│   ├── clock.js             # 时钟
│   ├── calendar.js          # 农历/日历/名言
│   ├── lunar.js             # 高精度农历算法
│   ├── weather.js           # 天气 (和风/wttr.in/open-meteo)
│   ├── live2d-loader.js     # Live2D 加载
│   ├── settings.js          # 设置数据 / 持久化
│   ├── settings-ui.js       # 设置面板 UI
│   ├── firstrun.js          # 首次启动欢迎页
│   ├── splash.js            # 安装仪式
│   └── quotes.js            # 477 句精选名言
├── assets/
│   ├── character.png        # 角色默认图
│   ├── character.svg        # 角色 SVG
│   ├── live2d/              # Live2D 模型 (Hiyori / shizuku)
│   └── img/                 # 静态资源 (lingjing-demo.gif 等)
├── build/
│   ├── installer.nsh        # NSIS 安装器钩子
│   ├── installerHeader.bmp  # 安装器头图 (164×55)
│   ├── installerSidebar.bmp # 安装器侧栏 (164×314)
│   ├── installerIcon.ico    # 安装器图标 (256×256)
│   └── installerHeaderIcon.ico
├── LICENSE.txt              # 用户协议
├── CHANGELOG.md             # 完整更新日志
└── README.md
```

---

## 🔑 隐私说明 (重要)

本项目内嵌了**和风天气**的 API Key (混淆存储在 `js/weather.js` 中)。

为了让上游公开仓库 clone 后"开箱即用", 代码对 key 做了 **obfuscation (混淆)** 处理:

```js
// 拆分 + 反转 + Base64 (在 js/weather.js 的 WEATHER_CONFIG 中)
_k1 = 'ZWY5MWMyZTRkYWM2NmNiYm'
_k2 = 'IwMDRhMzY4ZTYxNGViMWI='
key = atob(_k1 + _k2).split('').reverse().join('')
```

> ⚠️ 原始 key **不直接出现在任何文件**中 (包括本 README、源码、commit history)

### ⚠️ 请知悉

- **这不是真正的安全加密** — 任何前端 JS 都能被浏览器调试或反编译还原
- 仅用于**防止普通用户的简单文本搜索 (grep / IDE 搜索)** 和直接复制
- 如果你 fork 本项目并发布到公开渠道, 请**确保你有合法的 API Key 使用权**

---

## 🔄 自动更新 — 隐私说明 (v1.2.1+)

灵境时钟内置了"自动检查更新"功能 (默认开启), 让您不必手动下载新版本。

### 工作方式

- **启动后 6 秒**: 静默调用一次, 检查 GitHub Releases 有没有新版本
- **之后每 1 小时**: 同样静默调用一次
- **发现新版本**: 后台下载 (不打扰) → 下载完成弹非阻塞 toast → 您点"立即重启"才生效
- **不强制重启**: 您可以稍后再说, 不会半夜被强制更新吵醒

### 隐私 — 我们发什么, 不发什么

✅ **发送的 (匿名, 必需)**

| 字段 | 用途 |
|---|---|
| 操作系统版本 (Windows 10/11) | GitHub API 路由 |
| Electron 版本 | GitHub API 路由 |
| 灵境时钟当前版本 | 判断有没有更新 |
| 检查时间戳 | 缓存优化 |

🚫 **不发送的 (您的东西我们不要)**

- ❌ 您的 IP **不记录** (GitHub 自动丢弃)
- ❌ 任何使用数据 (打开了什么, 停留多久, 任何)
- ❌ 任何文件内容 / 屏幕截图 / 个人数据

> 简言之: 我们**只**问 GitHub "有新版本吗?", **不**上传任何东西, **不**上报任何统计

### 三种关闭方式

1. **首启提示一键关闭** — 首次启动 5 秒内会弹"自动检查更新已开启"提示, 直接点"关闭"
2. **设置 → 系统更新 → 自动检查更新 (关)** — 随时可关
3. **NSIS 装时取消勾选** — 安装时"启用自动检查更新"留空, 写注册表永久记住

### 网络异常兜底

- 无网络 / 访问不了 GitHub → 静默失败, 不弹任何错
- 检查失败 → 下一个 1 小时周期再试

---

## 🐛 故障排查

| 问题 | 解决方案 |
|---|---|
| 天气显示"数据获取失败" | 检查网络, 本应用按"和风 → wttr.in → open-meteo" 顺序尝试 |
| Live2D 不显示 | 确认 `assets/live2d/Hiyori/` 完整存在 |
| 打包失败 (`app.asar` 被锁) | 关闭已运行的 EXE 实例, 或输出到新目录 `dist_v10/` |
| 安装器显示老版本 | 删除旧版, 重新下载 v1.2.0 安装包 |

---

## 🪞 关于「灵境UI / 灵镜光感」

> 屏幕如镜, 光从内生。

**灵境UI** 是灵境时钟的原创桌面视觉设计语言, **灵镜光感** 是其核心视觉效果。

命名取东方禅意与古典意境, 与"灵动岛"、"光遇"等当代命名, 皆为对自身视觉的独立标记, 非对任何既有系统或产品之仿。

---

## 🤝 贡献

欢迎 PR 和 Issue。本项目以"够用就好"为原则, 避免过度工程化。

## 📄 License

MIT
