/**
 * 应用控制模块
 * 全屏控制、粒子效果、交互
 */

// 粒子效果
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  const particleCount = 10;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    particle.style.opacity = Math.random() * 0.5 + 0.2;
    particle.style.willChange = 'transform';
    container.appendChild(particle);
  }
}

// 全屏控制
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// 刷新页面
function refreshPage() {
  location.reload();
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
  if (e.key === 'Escape') {
    // ESC 直接退出应用
    if (window.electronAPI && window.electronAPI.closeApp) {
      window.electronAPI.closeApp();
    } else {
      // 非 Electron 环境：退出全屏
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }
  if (e.key === 'r' || e.key === 'R') {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      refreshPage();
    }
  }
});

// 双击全屏
document.addEventListener('dblclick', (e) => {
  if (e.target.closest('.control-btn')) return;
  toggleFullscreen();
});

// 控制按钮
document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  // 初始化天气
  if (typeof initWeather === 'function') {
    initWeather();
  }

  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnRefresh = document.getElementById('btn-refresh');

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }
  if (btnRefresh) {
    btnRefresh.addEventListener('click', refreshPage);
  }
});

// 防止右键菜单（可选）
// document.addEventListener('contextmenu', e => e.preventDefault());
