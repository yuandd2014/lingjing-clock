const { app, BrowserWindow, screen, ipcMain, Notification } = require('electron');
const path = require('path');

// 检测 --splash-mode (NSIS 安装仪式 / 手动测试)
const isSplashMode = process.argv.includes('--splash-mode');

let mainWindow = null;
let splashWin = null;
let mainWindowReady = false;     // 主窗口 did-finish-load
let pendingMainShow = false;     // splash 已 dismiss, 等主窗口 ready
let pendingLoaderReady = false;  // splash 已 dismiss, 等主窗口 ready 后发 loader-ready
let splashAutoTimer = null;

function doShowMain() {
  // 启动模式: 关闭 splash + 显示主窗口
  if (splashWin && !splashWin.isDestroyed()) splashWin.close();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
}

function createMainWindow(showImmediately = true) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: false,
    movable: false,
    show: !!showImmediately,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    return callback(true);
  });
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return true;
  });

  mainWindow.loadFile('index.html');

  // 启动模式: 等主窗口加载完再 show (避免白屏)
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindowReady = true;
    if (pendingMainShow) doShowMain();
    if (pendingLoaderReady) {
      pendingLoaderReady = false;
      mainWindow.webContents.send('loader-ready');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    mainWindowReady = false;
    pendingMainShow = false;
    pendingLoaderReady = false;
  });
}

function createSplashWindow() {
  // 480x360 居中圆角 splash
  splashWin = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  // 装包模式用 ?install=1 强制走装包分支; 启动模式不带参数走启动分支
  if (isSplashMode) {
    splashWin.loadFile('splash.html?install=1');
    // 装包模式: 4.5s + 350ms 退场 + 200ms 缓冲 = 5.1s 自动退
    splashAutoTimer = setTimeout(() => {
      if (splashWin && !splashWin.isDestroyed()) splashWin.close();
      setTimeout(() => app.quit(), 200);
    }, 5100);
  } else {
    // 启动模式: 等 LingJingLoader 4 组件 ready 才 dismiss
    splashWin.loadFile('splash.html');
  }

  // IPC: splash 主动请求退出 (装包/启动模式分流)
  ipcMain.once('splash-dismiss', () => {
    if (splashAutoTimer) { clearTimeout(splashAutoTimer); splashAutoTimer = null; }
    if (isSplashMode) {
      // 装包模式: splash 关 → app.quit
      if (splashWin && !splashWin.isDestroyed()) splashWin.close();
      setTimeout(() => app.quit(), 200);
    } else {
      // 启动模式: splash.js 已渐隐 280ms + setTimeout 300ms 后调 dismiss
      // 关 splash + show main + 通知主窗口 loader-ready
      if (mainWindowReady) {
        doShowMain();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('loader-ready');
        }
      } else {
        pendingMainShow = true;
        pendingLoaderReady = true;
      }
    }
  });

  // 启动模式: 主窗口 report → 转发到 splash 调本地 LingJingLoader.report
  ipcMain.on('loader-report', (_e, payload) => {
    if (splashWin && !splashWin.isDestroyed()) {
      splashWin.webContents.send('loader-report', payload);
    }
  });

  splashWin.on('closed', () => {
    if (splashAutoTimer) { clearTimeout(splashAutoTimer); splashAutoTimer = null; }
    if (isSplashMode) {
      setTimeout(() => app.quit(), 200);
    }
  });
}

app.whenReady().then(() => {
  if (isSplashMode) {
    // 装包模式: 只开 splash (4.5s 仪式 + app.quit)
    createSplashWindow();
    return;
  }

  // 启动模式: 主窗口预加载(不显示) + 开 splash 走启动模式
  // splash 4 组件 ready → dismiss → 主窗口 show
  createMainWindow(false);
  createSplashWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // === 自动更新: 静默检查 ===
  // v1.2.1+: 启动 6s 后, 第一次静默检查 + 建 1h 周期扫描
  setTimeout(() => {
    initAutoUpdater();
    if (readAutoUpdateEnabled() && !autoUpdateIntervalTimer) {
      const interval = readAutoUpdateInterval();
      autoUpdateIntervalTimer = setInterval(initAutoUpdater, interval);
      log.info('[auto-updater] interval scheduled: ' + (interval / 60000) + 'min');
    }
  }, 6000);
});

// ESC 退出应用
ipcMain.on('close-app', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// === 自动更新 ===
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;  // 后台下载
autoUpdater.autoInstallOnAppQuit = false;  // 不强制重启, 让用户决定

let updateNotified = false;
let autoUpdateIntervalTimer = null;  // v1.2.1+: 1h 周期扫描 timer

function initAutoUpdater() {
  // 用户是否启用? 读注册表 (NSIS 装时写) + settings
  const enabled = readAutoUpdateEnabled();
  if (!enabled) {
    log.info('[auto-updater] disabled by user/registry');
    return;
  }

  log.info('[auto-updater] checking for updates...');
  autoUpdater.checkForUpdates().catch((err) => {
    log.warn('[auto-updater] check failed:', err && err.message);
  });
}

autoUpdater.on('update-available', (info) => {
  log.info('[auto-updater] update available:', info && info.version);
  if (updateNotified) return;
  updateNotified = true;
  notifyUpdate(info, 'download');
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('[auto-updater] update downloaded:', info && info.version);
  notifyUpdate(info, 'install');
});

autoUpdater.on('error', (err) => {
  log.warn('[auto-updater] error:', err && err.message);
});

function notifyUpdate(info, phase) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  // 通知渲染进程弹卡片
  mainWindow.webContents.send('auto-update-event', {
    phase,
    version: info && info.version,
    releaseNotes: info && info.releaseNotes
  });
}

// 读注册表 + localStorage 来判断用户是否启用自动更新
function readAutoUpdateEnabled() {
  // 1. 优先读 NSIS 装时写的注册表
  try {
    const { execSync } = require('child_process');
    const out = execSync(
      'reg query "HKCU\\Software\\LingJing Clock" /v AutoUpdate 2>nul',
      { encoding: 'utf8', windowsHide: true }
    );
    if (out && /AutoUpdate\s+REG_DWORD\s+0x0/.test(out)) {
      return false;  // 用户装时取消勾选
    }
    if (out && /AutoUpdate\s+REG_DWORD\s+0x1/.test(out)) {
      return true;  // 用户装时勾选
    }
  } catch (e) {
    // 注册表不存在 (开发模式 / 旧版) → 默认真
  }
  // 2. 读 app 内设置
  try {
    const userData = app.getPath('userData');
    const settingsPath = path.join(userData, 'lingjing-settings-v1.json');
    if (require('fs').existsSync(settingsPath)) {
      const s = JSON.parse(require('fs').readFileSync(settingsPath, 'utf8'));
      if (s && typeof s.autoUpdateEnabled === 'boolean') {
        return s.autoUpdateEnabled;
      }
    }
  } catch (e) {
    // settings 损坏 → 默认真
  }
  return true;  // 默认开启
}

// IPC: 渲染进程手动触发检查 / 应用更新
ipcMain.on('auto-update-check', () => {
  autoUpdater.checkForUpdates().catch(() => {});
});

ipcMain.on('auto-update-install', () => {
  if (mainWindow) {
    autoUpdater.quitAndInstall(false, true);
  }
});

ipcMain.on('auto-update-get-enabled', (e) => {
  e.returnValue = readAutoUpdateEnabled();
});

// v1.2.1+: 渲染进程一键关闭 — 关掉定时扫描 timer
ipcMain.on('auto-update-set-enabled', (_e, enabled) => {
  if (enabled) {
    // 重新启用 — 立刻查一次 + 重建 1h 周期
    if (!autoUpdateIntervalTimer) {
      log.info('[auto-updater] re-enabled, scheduling...');
      initAutoUpdater();
      const interval = readAutoUpdateInterval();
      autoUpdateIntervalTimer = setInterval(initAutoUpdater, interval);
    }
  } else {
    // 关掉 — 清掉 timer
    if (autoUpdateIntervalTimer) {
      clearInterval(autoUpdateIntervalTimer);
      autoUpdateIntervalTimer = null;
      log.info('[auto-updater] disabled by renderer, interval cleared');
    }
  }
});

// 读 settings 里的 autoUpdateCheckInterval (ms), 兜底 1 小时
function readAutoUpdateInterval() {
  try {
    const userData = app.getPath('userData');
    const settingsPath = path.join(userData, 'lingjing-settings-v1.json');
    if (require('fs').existsSync(settingsPath)) {
      const s = JSON.parse(require('fs').readFileSync(settingsPath, 'utf8'));
      const n = parseInt(s && s.autoUpdateCheckInterval, 10);
      if (n && n >= 60000 && n <= 86400000) return n;  // 1 分钟 ~ 1 天之间
    }
  } catch (e) { /* 兜底用默认 */ }
  return 3600000;  // 1 小时
}
