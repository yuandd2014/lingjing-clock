# 阿里云盘半自动上传 — 灵境时钟国内下载方案

> **为什么用阿里云盘**: 之前试过 ghproxy.com / ghfast.top 镜像 (停用) + Cloudflare Workers 自建代理 (workers.dev 域名在国内被墙). 半自动走网盘方案是当前最稳的选择 — 不依赖任何第三方镜像, 不需要付费域名, 阿里云盘不限速.

## 流程概览

```
[本地编译]                                       [本地脚本链]
npm run dist                                     1. install-aliyunpan.ps1    (一次性, 下载 CLI)
       │                                          2. aliyunpan login          (一次性, 扫码授权)
       ▼                                          3. upload-aliyunpan.js       (每次 release, 跑一次)
dist_v18/LingJing.Clock.Setup.X.Y.Z.exe  ───►   4. patch-aliyun-to-download  (写 download.html)
LingJingClock-Portable.exe                       5. 手动 uncomment 阿里云盘段
       │                                          6. push-website-aliyun.js    (推官网)
       ▼
阿里云盘 /灵境时钟/vX.Y.Z/  + 分享链接
```

## 一次性准备 (跑一次就好)

```powershell
# 1. 下载 aliyunpan CLI (Windows x64, 6.4MB, 解压到 build/tmp/aliyunpan/)
powershell -ExecutionPolicy Bypass -File 'd:\桌面时钟\build\scripts\install-aliyunpan.ps1'

# 2. 登录 (会输出 OAuth 链接, 浏览器打开, 二次扫码)
& 'd:\桌面时钟\build\tmp\aliyunpan\aliyunpan.exe' login
```

登录后凭据存在用户目录 (e.g. `C:\Users\yuan5\aliyunpan_config.json`), 不进 git.

## 每次 release 跑这个

```powershell
# 1. 编译 (先确认 dist_v18/ 没被系统锁, 锁了就改 package.json output 改名)
npm run dist

# 2. 上传到阿里云盘 + 拿 share URL (写 build/tmp/aliyun-share.json)
node 'd:\桌面时钟\build\scripts\upload-aliyunpan.js'

# 3. 把 share URL 写进 website-site/download.html
node 'd:\桌面时钟\build\scripts\patch-aliyun-to-download.js'

# 4. 手动打开 download.html 的阿里云盘段 (删 <!--  和 -->)

# 5. 推官网
node 'd:\桌面时钟\build\tmp\push-website-aliyun.js'
```

## 脚本索引

| 脚本 | 用途 | 频率 |
|------|------|------|
| [install-aliyunpan.ps1](./install-aliyunpan.ps1) | 下载 + 解压 aliyunpan CLI | 一次性 |
| [upload-aliyunpan.js](./upload-aliyunpan.js) | 跑 aliyunpan upload + share, 写 .json | 每次 release |
| [patch-aliyun-to-download.js](./patch-aliyun-to-download.js) | 把 .json 写进 download.html 的 href | 每次 release |
| [test-patch-aliyun.js](./test-patch-aliyun.js) | 单测 patch 脚本 (5 cases) | dev 时跑 |
| [push-website-aliyun.js](../tmp/push-website-aliyun.js) | 推官网 | 每次 release |

## 为什么不用纯 OpenAPI 自写?

`tickstep/aliyunpan` (Go) 已经稳定维护, v0.3.8 修复了 share 命令生成分享链接错误, OAuth 流程 (`openapi.alipan.com/oauth/authorize`) 也跑得通. 自己写 Node 调 OpenAPI 等于重复造轮子, 还会跟 aliyunpan 后端协议升级脱节. 走 CLI 是最省心的方式 — 出问题升级 CLI 就行, 不用改我们自己的脚本.

## 注意事项

- **dist 目录锁定**: 如果 `dist_v18/` 被系统锁 (旧进程没退), `npm run dist` 会 fail. 改 `package.json` 的 `directories.output` (e.g. `dist_v19`) 解决, 跟项目惯例一致.
- **重复上传**: `aliyunpan upload` 重复传同名文件会失败, 脚本不会自动 skip. 如果出错, 进 aliyunpan 控制台删旧文件再跑.
- **重复 share**: `share set` 重复会创建新 share_id, 旧 share_id 仍然有效. download.html 只显示最新一个, 旧的可以手动 cancel (`aliyunpan share cancel <id>`).
- **mode 1 失败回退到 mode 3**: `.exe` 可能被阿里云盘以版权原因拒绝普通分享, 脚本会自动退到快传 (mode 3, 无提取码但需要登录). 详见 upload-aliyunpan.js 注释.
- **半自动**: 故意不做"编译完自动上传 + 推官网"全链 — 上传是用户主动动作 (避免误推 + 让用户控制 release 时机). patch 跟 uncomment 也是手动, 因为 uncomment 操作属于"内容编辑"不该被脚本自动做.

## 调试

```powershell
# 干跑 (只打印计划, 不真上传)
node 'd:\桌面时钟\build\scripts\upload-aliyunpan.js' --dry-run --verbose

# 跑 patch 测试 (5 个 case, 验证 patch 行为)
node 'd:\桌面时钟\build\scripts\test-patch-aliyun.js'

# 手动看 share list
& 'd:\桌面时钟\build\tmp\aliyunpan\aliyunpan.exe' share list
```

## 相关链接

- 阿里云盘 CLI GitHub: <https://github.com/tickstep/aliyunpan>
- v0.3.8 Windows x64: <https://github.com/tickstep/aliyunpan/releases/download/v0.3.8/aliyunpan-v0.3.8-windows-x64.zip>
- 阿里云盘 OpenAPI: <https://help.aliyun.com/zh/pds/drive-and-photo-service-dev/>
