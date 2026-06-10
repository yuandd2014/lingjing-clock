/**
 * 应用控制模块
 * 粒子效果 + 右下角热区交互
 */

// 粒子效果 (粒子数 / 显隐由 settings.js 控制)
function initParticles() {
  // 由 settings.js 在 apply() 中按需重建
  // 这里不重复初始化, 避免和 settings 抢着改 DOM
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl+R 刷新
  if (e.key === 'r' || e.key === 'R') {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      location.reload();
    }
  }
  // ESC: 设置面板打开时由 settings-ui.js 拦截; 否则退出 app
  if (e.key === 'Escape') {
    // 若设置面板开着, 由 settings-ui.js 的 capture handler 处理
    if (window.electronAPI && window.electronAPI.closeApp) {
      window.electronAPI.closeApp();
    }
  }
});

// 刷新按钮
document.addEventListener('DOMContentLoaded', () => {
  // v1.3.0 bug 修 B1: 启动时应用主题色 + 字体缩放
  // applyTheme 函数已存在, 但没有任何地方调用, 主题色看不出应用
  // Theme / Settings 是 IIFE 注入到 window 的全局, 隐式访问即可
  Theme.applyTheme(Settings.get().theme);

  // 报告 particles ready (DOM 元素静态在 index.html, CSS 动画无 JS 初始化)
  // 走 IPC 桥 → 主进程 → splash 本地 LingJingLoader
  if (window.lingjingLoader) {
    window.lingjingLoader.report('particles', 'ready');
  }

  // 初始化天气
  if (typeof initWeather === 'function') {
    initWeather();
  }

  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => location.reload());
  }

  // 右下角热区 → 显示控制条
  // controls 默认 opacity:0, 仅当鼠标进入 .hot-corner (右下 100x100) 才显示
  const hot = document.getElementById('hot-corner');
  const controls = document.getElementById('controls');
  let hideTimer = null;
  function showControls() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    controls.classList.add('visible');
  }
  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => controls.classList.remove('visible'), 350);
  }
  if (hot && controls) {
    hot.addEventListener('mouseenter', showControls);
    hot.addEventListener('mouseleave', scheduleHide);
    // 鼠标已经悬停在 controls 上时不要消失
    controls.addEventListener('mouseenter', showControls);
    controls.addEventListener('mouseleave', scheduleHide);
  }

  // v1.2.1+: 首启"自动检查更新已开启"提示 toast
  // 延迟 1.5s 弹, 让 firstrun.js (如有) + 视觉先 settle
  setTimeout(() => {
    if (window.LingJingSettingsUI && typeof window.LingJingSettingsUI.showAutoUpdateHint === 'function') {
      window.LingJingSettingsUI.showAutoUpdateHint();
    }
  }, 1500);
});

// 防止右键菜单 (可选, 默认开启, 像桌面 app 一样)
// document.addEventListener('contextmenu', e => e.preventDefault());
