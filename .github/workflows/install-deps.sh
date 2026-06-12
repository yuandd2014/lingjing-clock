#!/bin/bash
# Linux Electron 运行时依赖安装 (兼容 Ubuntu 22.04 Jammy + 24.04 Noble)
# v1.4.0 — Kubuntu 优先适配
set -e

# 加载 OS 版本
. /etc/os-release
echo "Detected: $ID $VERSION_ID ($VERSION_CODENAME)"

# Ubuntu 24.04+ (Noble) 迁移: libasound2 → libasound2t64
if [ "$ID" = "ubuntu" ] && dpkg --compare-versions "$VERSION_ID" "ge" "24.04"; then
  ASOUND="libasound2t64"
else
  ASOUND="libasound2"
fi
echo "Using $ASOUND for $ID $VERSION_ID"

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xauth \
  libxrandr2 \
  libgbm1 \
  libxshmfence1 \
  libxcb-dri3-0 \
  libdrm2 \
  libatspi2.0-0 \
  "$ASOUND" \
  fakeroot \
  dpkg \
  rpm

# libappindicator 单独装 (某些镜像源没默认包含, 用 || true 兜底)
sudo apt-get install -y --no-install-recommends libappindicator3-1 libsecret-1-0 || \
  echo "WARN: libappindicator3-1 装失败, tray 在某些 DE 上可能不可用"

echo "OK: 系统依赖装完"
