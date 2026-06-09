const { contextBridge, ipcRenderer } = require('electron');

// 灵境 Splash 仪式
contextBridge.exposeInMainWorld('lingjingSplash', {
  dismiss: () => ipcRenderer.send('splash-dismiss')
});

// 主窗口 API
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),

  // 自动更新
  autoUpdateCheck: () => ipcRenderer.send('auto-update-check'),
  autoUpdateInstall: () => ipcRenderer.send('auto-update-install'),
  getAutoUpdateEnabled: () => ipcRenderer.sendSync('auto-update-get-enabled'),
  onUpdateEvent: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('auto-update-event', handler);
    return () => ipcRenderer.removeListener('auto-update-event', handler);
  }
});
