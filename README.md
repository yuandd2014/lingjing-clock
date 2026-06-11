# 灵境时钟 · LingJing Clock

> 屏幕如镜, 光从内生。

让 Windows 桌面, 拥有一面映照时间的镜子。

[![下载最新版](https://img.shields.io/badge/下载-最新版-0071e3?style=for-the-badge)](https://github.com/yuandd2014/lingjing-clock/releases/latest)
[![平台](https://img.shields.io/badge/平台-Windows%2010%2F11-0071e3?style=flat-square)](#)
[![架构](https://img.shields.io/badge/架构-x64-34c759?style=flat-square)](#)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-8e8e93?style=flat-square)](#)
[![UI](https://img.shields.io/badge/UI-灵境UI-ff6b9d?style=flat-square)](https://yuandd2014.github.io/lingjing-clock-website/design.html)

---

## 🎯 功能特性

- **🕐 超大数字时钟** — 时分秒跳动, 数字一望便知
- **☁️ 逐时天气预报** — 今日剩余小时 + 明日关键时段, 6 条数据一目了然
- **📅 农历节气** — 公历/农历双向转换, 二十四节气、干支纪年
- **💬 每日一言** — 古典到现代, 总有一句击中你, 30 天内不重复
- **🌸 Live2D 角色** — Hiyori 在你桌前待命, 鼠标交互、动作随机
- **🎨 8 套主题色 + 4 套字体** — 灵境UI 灵境品牌色, 系统默认 / 思源黑体 / 苹方替代 / Inter 4 选 1
- **🔄 自动检查更新** — 静默后台扫描 GitHub Releases, 默认开启可一键关

---

## 🚀 快速开始

### 方式一: 直接下载 (推荐)

从 [Releases · 最新版](https://github.com/yuandd2014/lingjing-clock/releases/latest) 下载:

| 文件 | 大小 | 说明 |
|---|---|---|
| **`LingJing.Clock.Setup.${version}.exe`** | **89 MB** | NSIS 安装版 (推荐) |
| **`LingJingClock-Portable.exe`** | **89 MB** | 便携版, 解压即用 |
| `LingJing.Clock.Setup.${version}.exe.blockmap` | 96 KB | 增量更新用 |

> 💡 也可访问 [官网 lingjing-clock-website](https://yuandd2014.github.io/lingjing-clock-website/) 获取最新下载链接, 或 [更新日志](https://yuandd2014.github.io/lingjing-clock-website/changelog.html) 看版本变化

### 方式二: 源码运行

```bash
git clone https://github.com/yuandd2014/lingjing-clock.git
cd lingjing-clock

npm install
npm start          # 开发模式 (npx electron .)

npm run dist       # 打包到 dist_v{N}/ (N 随版本递增, 避免旧版文件锁)
```

### 官网

更多内容 (设计语言 / 关于 / 隐私) 见 [yuandd2014.github.io/lingjing-clock-website](https://yuandd2014.github.io/lingjing-clock-website/)。

---

## 🐛 故障排查

| 问题 | 解决方案 |
|---|---|
| 天气显示"数据获取失败" | 检查网络, 本应用按"和风 → open-meteo" 顺序尝试 (主源和风) |
| Live2D 不显示 | 确认 `assets/live2d/Hiyori/` 完整存在 |
| 打包失败 (`app.asar` 被锁) | 关闭已运行的 EXE 实例, 或输出到新目录 `dist_v{N+1}/` |
| 安装器显示老版本 | 删除旧版, 重新下载最新安装包 |
| 启动卡 splash | 关闭 Defender 实时保护再启动, 或等 5s 自动跳过 |

---

## 🤝 贡献

欢迎 PR 和 Issue。本项目以"够用就好"为原则, 避免过度工程化。

## 📄 License

MIT
