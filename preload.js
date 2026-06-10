const { contextBridge, ipcRenderer } = require('electron');

// 灵境 Splash 仪式
contextBridge.exposeInMainWorld('lingjingSplash', {
  dismiss: () => ipcRenderer.send('splash-dismiss')
});

// 灵境 Loader 桥 (主进程 ↔ splash 通信, 主窗口用)
contextBridge.exposeInMainWorld('lingjingLoader', {
  // 主窗口 → splash: 上报组件状态
  report: (id, state, error) => ipcRenderer.send('loader-report', { id, state, error: error || null }),
  // 主窗口 → splash: 订阅 ready (firstrun.js 等)
  onReady: (callback) => {
    const handler = () => { try { callback(); } catch (e) { /* 静默 */ } };
    ipcRenderer.on('loader-ready', handler);
    return () => ipcRenderer.removeListener('loader-ready', handler);
  },
});

// 主窗口 API
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),

  // 自动更新
  autoUpdateCheck: () => ipcRenderer.send('auto-update-check'),
  autoUpdateInstall: () => ipcRenderer.send('auto-update-install'),
  getAutoUpdateEnabled: () => ipcRenderer.sendSync('auto-update-get-enabled'),
  // v1.2.1+: 渲染进程 (first-run hint 一键关闭) 通知主进程关掉定时扫描
  autoUpdateSetEnabled: (enabled) => ipcRenderer.send('auto-update-set-enabled', !!enabled),
  onUpdateEvent: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('auto-update-event', handler);
    return () => ipcRenderer.removeListener('auto-update-event', handler);
  },

  // Splash 监听主窗口的 loader-report (splash 内部转本地 LingJingLoader)
  onLoaderReport: (callback) => {
    const handler = (_e, data) => { try { callback(data); } catch (e) { /* 静默 */ } };
    ipcRenderer.on('loader-report', handler);
    return () => ipcRenderer.removeListener('loader-report', handler);
  },
});
