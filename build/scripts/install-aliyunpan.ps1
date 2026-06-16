// build/scripts/install-aliyunpan.ps1
// 一键下载 + 解压 aliyunpan CLI (tickstep/aliyunpan v0.3.8 Windows x64)
// 说明:
//  - 阿里云盘 share 命令在 v0.3.8 修复了分享链接错误 (v0.3.9 反倒没出 windows 版, 所以用 v0.3.8)
//  - 解压到 build/tmp/aliyunpan/, 上传脚本默认会优先找这里的 aliyunpan.exe
//  - 解压后用户跑一次 .\aliyunpan.exe login 完成扫码登录, 凭据存在用户目录的 aliyunpan_config.json
//  - PowerShell 执行策略需要 Bypass, 本脚本会显式 -ExecutionPolicy Bypass 调自己

$ErrorActionPreference = 'Stop'

$RepoRoot = 'd:\桌面时钟'
$TmpDir = Join-Path $RepoRoot 'build\tmp\aliyunpan'
$ZipPath = Join-Path $TmpDir 'aliyunpan-v0.3.8-windows-x64.zip'
$ExePath = Join-Path $TmpDir 'aliyunpan.exe'
$Url = 'https://github.com/tickstep/aliyunpan/releases/download/v0.3.8/aliyunpan-v0.3.8-windows-x64.zip'
$Sha256Expected = $null  # 暂不强制校验, 体积小 (6.4MB), 走 TLS 信任 GitHub

function Write-Step($msg) {
  Write-Host "[install-aliyunpan] " -NoNewline -ForegroundColor Cyan
  Write-Host $msg
}

if (-not (Test-Path $TmpDir)) {
  New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
}

if (Test-Path $ExePath) {
  Write-Step "aliyunpan.exe 已存在: $ExePath"
  & $ExePath --version 2>&1 | Select-Object -First 1
  exit 0
}

Write-Step "下载 aliyunpan v0.3.8 windows-x64 ..."
Write-Step "  URL: $Url"
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $Url -OutFile $ZipPath -UseBasicParsing -TimeoutSec 120
} catch {
  Write-Step "下载失败: $_"
  Write-Step "  备用: 直接浏览器打开 https://github.com/tickstep/aliyunpan/releases/tag/v0.3.8"
  Write-Step "  下载 aliypan-v0.3.8-windows-x64.zip, 手动解压到 $TmpDir"
  exit 1
}

$ZipSize = (Get-Item $ZipPath).Length / 1MB
Write-Step ("下载完成 ({0:N2} MB)" -f $ZipSize)

Write-Step "解压到 $TmpDir ..."
try {
  Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
} catch {
  Write-Step "解压失败: $_"
  exit 1
}

# 清理 zip
Remove-Item $ZipPath -Force

# 验证 exe
if (-not (Test-Path $ExePath)) {
  # v0.3.8 zip 里可能有 aliyunpan-v0.3.8-windows-x64/ 子目录
  $Nested = Get-ChildItem -Path $TmpDir -Recurse -Filter 'aliyunpan.exe' | Select-Object -First 1
  if ($Nested) {
    Write-Step "发现嵌套目录, 移动到 $TmpDir\aliyunpan.exe"
    Move-Item $Nested.FullName $ExePath -Force
  } else {
    Write-Step "未找到 aliyunpan.exe, 请检查 $TmpDir"
    exit 1
  }
}

Write-Step "完成!"
Write-Host ""
Write-Host "  下一步: 跑一次登录 (一次性):" -ForegroundColor Yellow
Write-Host "    & '$ExePath' login" -ForegroundColor White
Write-Host ""
Write-Host "  登录流程: " -ForegroundColor Yellow
Write-Host "    1. 程序会输出一个 OAuth 链接" -ForegroundColor White
Write-Host "    2. 浏览器打开, 阿里官方授权" -ForegroundColor White
Write-Host "    3. 二次跳转后, 用阿里云盘 APP 扫码" -ForegroundColor White
Write-Host "    4. 切回 aliyunpan 按 Enter 完成" -ForegroundColor White
Write-Host ""
Write-Host "  登录完成后, 跑上传脚本: " -ForegroundColor Yellow
Write-Host "    node 'd:/桌面时钟/build/scripts/upload-aliyunpan.js'" -ForegroundColor White
Write-Host ""
