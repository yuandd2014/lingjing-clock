const { app, BrowserWindow, screen, ipcMain, Notification } = require('electron');
const path = require('path');

// 检测 --splash-mode (NSIS 安装仪式 / 手动测试)
const isSplashMode = process.argv.includes('--splash-mode');

let mainWindow;

function createMainWindow() {
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
    show: true,
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSplashWindow() {
  // 480x360 居中圆角 splash
  const splashWin = new BrowserWindow({
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

  // preload 暴露 dismiss 接口给 splash 调
  splashWin.loadFile('splash.html');

  // splash 自动退 (4.5s + 350ms 退场 + 200ms 缓冲 = 5.1s)
  const autoQuit = setTimeout(() => {
    if (!splashWin.isDestroyed()) {
      splashWin.close();
    }
    setTimeout(() => app.quit(), 200);
  }, 5100);

  // IPC: splash 主动请求退出
  ipcMain.once('splash-dismiss', () => {
    clearTimeout(autoQuit);
    if (!splashWin.isDestroyed()) {
      splashWin.close();
    }
    setTimeout(() => app.quit(), 200);
  });

  splashWin.on('closed', () => {
    clearTimeout(autoQuit);
    setTimeout(() => app.quit(), 200);
  });
}

app.whenReady().then(() => {
  if (isSplashMode) {
    createSplashWindow();
    return;
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // === 自动更新: 静默检查 ===
  // 启动 6s 后, 第一次静默检查 (不打扰用户)
  setTimeout(() => {
    initAutoUpdater();
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
