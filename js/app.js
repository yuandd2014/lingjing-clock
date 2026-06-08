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
});

// 防止右键菜单 (可选, 默认开启, 像桌面 app 一样)
// document.addEventListener('contextmenu', e => e.preventDefault());
