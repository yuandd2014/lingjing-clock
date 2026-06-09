; 灵境时钟 NSIS 钩子
; 包含位置: electron-builder include="build/installer.nsh"
; 文档: https://www.electron.build/configuration/nsis#custom-nsis-script
;
; 重要: electron-builder 24.13.0 对主安装器 和 uninstaller 都 !include 这个文件
; (header 阶段无条件 include)。但 uninstaller 走 SilentInstall silent 分支,
; 不调 customWelcomePage / licensePage / customFinishPage 等 macro, 也不调 StartApp
; 函数, 会触发 NSIS warning 6010 "install function not referenced" -> 编译失败。
; 包裹 !ifndef BUILD_UNINSTALLER 让 uninstaller 完全不加载这段。

!ifndef BUILD_UNINSTALLER

; 兼容 electron-builder 24.13.0: isUpdated macro 在 24.13.0 未通过 defines 注入,
; 模板 (common.nsh / assistedInstaller.nsh) 仍引用, 编译会报 macro not found。
; 这里补一个空定义, 让 ${isUpdated} 在 ${If} 中永远求值为 false (走 Else 分支)
!macro isUpdated
!macroend
; 兜底: 显式 !include LogicLib, 防止 NSIS 在我们的 installer.nsh 解析时 LogicLib 还没加载
; (MUI2 虽 transitive include, 但 24.13.0 assistedInstaller.nsh 用 ${If} ${endIf} 大写 I 风格,
; 我们的 StartApp 统一用大写 ${If} / ${Else} / ${EndIf} 保持一致)
!include LogicLib.nsh

; === 1. 启用欢迎页 (使用灵境色头) ===
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "欢迎使用灵境时钟"
  !define MUI_WELCOMEPAGE_TITLE_3LINES
  !define MUI_WELCOMEPAGE_TEXT "灵境时钟 v${VERSION}$\r$\n搭载灵境UI 与灵镜光感, 让桌面成为时间的画布。$\r$\n$\r$\n点击下一步开始安装, 默认会创建桌面与开始菜单快捷方式, 装完自动启动。"
  !insertmacro MUI_PAGE_WELCOME
!macroend

; === 2. 显示精简用户协议 ===
; 注意: electron-builder 24.13.0 会根据 package.json `build.nsis.license` 字段
; 自动生成 !macro licensePage, 这里不能重复定义, 否则报 "macro already exists"
; (license path 在 package.json 已经指 LICENSE.txt, electron-builder 自动处理)

; === 3. 自绘 "安装选项" 页 (在路径选择后, install 前) ===
!macro customPageAfterChangeDir
  !include nsDialogs.nsh

  Var DialogInstallOptions
  Var CheckboxAutoUpdate
  Var CheckboxDesktopShortcut
  Var CheckboxStartMenuShortcut
  Var AutoUpdateEnabled
  Var DesktopShortcutEnabled
  Var StartMenuShortcutEnabled

  Function CreateInstallOptionsPage
    !insertmacro MUI_HEADER_TEXT "安装选项" "选择您要的功能 (可全部保持默认)"

    nsDialogs::Create 1018
    Pop $DialogInstallOptions

    ${If} $DialogInstallOptions == error
      Abort
    ${EndIf}

    ; 标题
    ${NSD_CreateLabel} 0 0u 100% 14u "灵境时钟 安装选项"
    Pop $0

    ; --- 自动更新组 ---
    ${NSD_CreateGroupBox} 0 18u 100% 44u "自动检查更新"
    Pop $0

    ${NSD_CreateCheckbox} 10u 30u 100% 12u "启用自动检查更新 (推荐)"
    Pop $CheckboxAutoUpdate
    ${NSD_Check} $CheckboxAutoUpdate

    ${NSD_CreateLabel} 22u 46u 100% 14u "需要联网获取新版本, 您随时可在 设置 中关闭"
    Pop $0

    ; --- 快捷方式组 ---
    ${NSD_CreateGroupBox} 0 68u 100% 50u "快捷方式"
    Pop $0

    ${NSD_CreateCheckbox} 10u 80u 100% 12u "创建桌面快捷方式"
    Pop $CheckboxDesktopShortcut
    ${NSD_Check} $CheckboxDesktopShortcut

    ${NSD_CreateCheckbox} 10u 96u 100% 12u "创建开始菜单快捷方式"
    Pop $CheckboxStartMenuShortcut
    ${NSD_Check} $CheckboxStartMenuShortcut

    ; 说明
    ${NSD_CreateLabel} 0 124u 100% 16u "所有选项装好之后仍可在 设置 中调整"
    Pop $0

    nsDialogs::Show
  FunctionEnd

  Function LeaveInstallOptionsPage
    ${NSD_GetState} $CheckboxAutoUpdate $AutoUpdateEnabled
    ${NSD_GetState} $CheckboxDesktopShortcut $DesktopShortcutEnabled
    ${NSD_GetState} $CheckboxStartMenuShortcut $StartMenuShortcutEnabled
  FunctionEnd

  Page custom CreateInstallOptionsPage LeaveInstallOptionsPage
!macroend

; === 4. customInstall: 写注册表 (用户选择) + 启动 splash (装好仪式) ===
; 触发时机: installSection.nsh 复制 app 文件 + 写注册表 + 创建快捷方式之后
!macro customInstall
  ; 把用户选项写到注册表 (HKCU\Software\LingJing Clock\)
  WriteRegDWORD HKCU "Software\LingJing Clock" "AutoUpdate" $AutoUpdateEnabled
  WriteRegDWORD HKCU "Software\LingJing Clock" "DesktopShortcut" $DesktopShortcutEnabled
  WriteRegDWORD HKCU "Software\LingJing Clock" "StartMenuShortcut" $StartMenuShortcutEnabled
  WriteRegStr HKCU "Software\LingJing Clock" "InstallPath" "$INSTDIR"

  ; 启动灵境 splash 仪式 (splash 模式: 4-5s 自动退, 不影响主流程)
  ; $INSTDIR 已写好 app exe, 直接 ExecWait
  ; HideWindow 让 splash 显示在前台
  HideWindow
  ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --splash-mode --splash-context=installer'
  BringToFront
!macroend

; === 5. 自定义 finish 页文案 ===
!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "灵境时钟 安装完成"
  !define MUI_FINISHPAGE_TITLE_3LINES
  !define MUI_FINISHPAGE_TEXT "灵境时钟已经装好, 您可以立即体验, 也可以稍后再从桌面或开始菜单启动。$\r$\n$\r$\n所有安装选项都可以在 设置 中调整。"
  !define MUI_FINISHPAGE_RUN "1"
  !define MUI_FINISHPAGE_RUN_TEXT "立即体验灵境时钟"
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_FINISHPAGE_RUN_NOTCHECKED
  !insertmacro MUI_PAGE_FINISH
  !echo "MUI_PAGE_FINISH 展开完毕, MUI_FINISHPAGE_RUN=${MUI_FINISHPAGE_RUN}, RUN_FUNCTION=${MUI_FINISHPAGE_RUN_FUNCTION}"
!macroend

; 配合 MUI_FINISHPAGE_RUN_FUNCTION 的 StartApp 函数
; (assistedInstaller.nsh 默认只在 !ifndef customFinishPage 时定义, 我们用了 customFinishPage, 所以这里要补)
; 不依赖 $launchLink 变量 (赋值在 install section 后, 此处未声明会触发 warning 6000),
; 也不依赖 StdUtils::ExecShellAsUser plugin, 用 NSIS 原生 Exec + 硬编码可执行文件名
; (productFilename "LingJing Clock" 来自 package.json, 极小概率变, 若变这里同步改即可)
Function StartApp
  ${If} ${isUpdated}
    Exec '"$INSTDIR\LingJing Clock.exe" --updated'
  ${Else}
    Exec '"$INSTDIR\LingJing Clock.exe"'
  ${EndIf}
FunctionEnd

; === uninstall 钩子: 清理注册表 (可选, 卸载会自动清) ===
!macro customUnWelcomePage
  !define MUI_UNWELCOMEPAGE_TITLE "卸载灵境时钟"
  !define MUI_UNWELCOMEPAGE_TITLE_3LINES
  !define MUI_UNWELCOMEPAGE_TEXT "卸载将删除灵境时钟本身, 但不会删除您的本地数据 (天气缓存、设置、Live2D 模型)。$\r$\n$\r$\n如需彻底清理, 卸载后手动删除用户目录下的相关文件。"
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

!endif ; BUILD_UNINSTALLER 守护结束
