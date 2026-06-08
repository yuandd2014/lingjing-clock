const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  // 授予所有权限（Electron 默认拒绝 navigator.geolocation）
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    return callback(true);
  });

  // 必须同时设置 check handler，否则 geolocation 权限检查不通过
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return true;
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
