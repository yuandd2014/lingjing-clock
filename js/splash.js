// 灵境 Splash — 安装仪式 + 启动加载 (v1.2.1+)
// 装包模式: 4.5s 仪式 (无 LingJingLoader)
// 启动模式: 等 LingJingLoader.isReady (12s 兜底)

const progressBar = document.getElementById('splash-progress-bar');
const hint = document.getElementById('splash-hint');
const tagline = document.getElementById('splash-tagline');
const loaderList = document.getElementById('splash-loader-list');
const stage = document.querySelector('.splash-stage');
const versionEl = document.getElementById('splash-version');

// v1.3.0: 版本号从 URL ?v= 动态填 (主进程 main.js loadFile 时传 app.getVersion())
// 之前 splash.html 硬编码 v1.2.0 + splash.js tagline 硬编码 v1.2.1 → 2 处不一致
// 现在 .splash-version 是唯一版本号显示, 永远跟 package.json 一致
function fillVersion() {
  if (!versionEl) return;
  const params = new URLSearchParams(location.search);
  const v = params.get('v');
  if (v) {
    versionEl.textContent = 'v' + v;
  } else {
    // 兜底: 没传 v 时不显示
    versionEl.textContent = '';
  }
}
fillVersion();

function dismiss() {
  try {
    if (window.lingjingSplash && window.lingjingSplash.dismiss) {
      window.lingjingSplash.dismiss();
    }
  } catch (e) { /* 静默 */ }
}

// 立即派键盘
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    dismiss();
  }
}, true);

// 模式检测:
//   ?install=1 → 装包仪式 (主进程 --splash-mode 走这条)
//   有 LingJingLoader → 启动模式 (主窗口模块会调 report, 走 IPC 转发)
//   都没有 → 兜底装包模式
const isInstallMode = /[?&]install=1\b/.test(location.search);
if (isInstallMode || !window.LingJingLoader) {
  initInstall();
} else {
  // 启动模式: splash 自身字体是系统默认, 立即 ready
  // (主窗口用 Orbitron / Noto Sans SC, 由主窗口 reveal 后用, splash 不等)
  try { window.LingJingLoader.report('fonts', 'ready'); } catch (e) { /* 静默 */ }

  // 监听主进程转发的 loader-report (主窗口 → splash)
  if (window.electronAPI && window.electronAPI.onLoaderReport) {
    window.electronAPI.onLoaderReport((payload) => {
      if (!payload) return;
      try {
        window.LingJingLoader.report(payload.id, payload.state, payload.error);
      } catch (e) { /* 静默 */ }
    });
  }

  initStartup();
}

// ===== 装包模式: 4.5s 仪式 (跟 v1.2.0 一样) =====
function initInstall() {
  const HINTS = [
    '正在准备灵境…',
    '装点时间的光毯…',
    '唤出灵境UI…',
    '调整灵镜光感…',
    '即将开启灵境…',
  ];
  let progress = 0;
  let hintIdx = 0;
  const TOTAL_MS = 4500;
  const startTime = Date.now();

  const hintInterval = setInterval(() => {
    hintIdx = Math.min(hintIdx + 1, HINTS.length - 1);
    hint.style.animation = 'none';
    void hint.offsetHeight;
    hint.style.animation = '';
    hint.textContent = HINTS[hintIdx];
  }, Math.floor(TOTAL_MS / HINTS.length));

  const tick = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progress = Math.min(100, (elapsed / TOTAL_MS) * 100);
    progressBar.style.width = progress + '%';
    if (progressBar.parentElement) {
      progressBar.parentElement.setAttribute('aria-valuenow', Math.floor(progress));
    }
    if (progress >= 100) {
      clearInterval(tick);
      clearInterval(hintInterval);
      hint.textContent = '灵境已就绪';
      // v1.2.1 4 轮: 仪式感统一 — 装包模式也渐隐 280ms (跟启动模式一致)
      if (stage) {
        stage.style.transition = 'opacity 280ms ease';
        stage.style.opacity = '0';
      }
      setTimeout(dismiss, 300);
    }
  }, 16);

  // 8s 兜底
  setTimeout(() => { clearInterval(tick); clearInterval(hintInterval); dismiss(); }, 8000);
}

// ===== 启动模式: 接入 LingJingLoader, 等真 ready =====
function initStartup() {
  // 副标题 (启动模式才有, 装包模式没有)
  // v1.3.0: tagline 不再带版本号 — 版本号统一由 .splash-version 元素显示 (避免 2 处重复)
  if (tagline) {
    tagline.hidden = false;
    tagline.textContent = '正在唤醒灵境';
  }

  // 渲染 loader 列表
  const items = (window.LingJingLoader.getState && window.LingJingLoader.getState().items) || [];
  loaderList.innerHTML = items.map(item => `
    <li class="splash-loader-item" data-id="${item.id}" data-state="${item.state}">
      <span class="splash-loader-icon" aria-hidden="true">
        ${iconFor(item.state)}
      </span>
      <span class="splash-loader-name">${item.label}</span>
      <span class="splash-loader-state">${textFor(item.state)}</span>
    </li>
  `).join('');
  loaderList.hidden = false;

  function updateUI(snap) {
    if (!snap || !snap.items) return;
    snap.items.forEach(item => {
      const li = loaderList.querySelector(`[data-id="${item.id}"]`);
      if (!li) return;
      li.dataset.state = item.state;
      const iconEl = li.querySelector('.splash-loader-icon');
      const stateEl = li.querySelector('.splash-loader-state');
      if (iconEl) iconEl.innerHTML = iconFor(item.state);
      if (stateEl) stateEl.textContent = textFor(item.state);
    });
    progressBar.style.width = snap.progress + '%';
    if (progressBar.parentElement) {
      progressBar.parentElement.setAttribute('aria-valuenow', snap.progress);
    }
    // hint 跟当前 loading 组件
    const loading = snap.items.find(i => i.state === 'loading');
    if (loading) {
      hint.textContent = `正在唤醒${loading.label}…`;
    } else if (snap.progress >= 100) {
      hint.textContent = '灵境已就绪';
    } else {
      hint.textContent = '正在唤醒灵境…';
    }
  }

  // 订阅
  window.LingJingLoader.onProgress(updateUI);

  // 等 ready
  window.LingJingLoader.onReady(() => {
    progressBar.style.width = '100%';
    hint.textContent = '灵境已就绪';
    // 渐隐 280ms
    if (stage) {
      stage.style.transition = 'opacity 280ms ease';
      stage.style.opacity = '0';
    }
    setTimeout(dismiss, 300);
  });

  // 12s 兜底 (防 Live2D 永远加载不完)
  setTimeout(() => {
    if (!window.LingJingLoader.isReady()) {
      hint.textContent = '已就绪 (部分功能稍候)';
      if (stage) {
        stage.style.transition = 'opacity 280ms ease';
        stage.style.opacity = '0';
      }
      setTimeout(dismiss, 300);
    }
  }, 12000);
}

function iconFor(state) {
  if (state === 'ready') {
    return `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L4.8 8.8L9.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if (state === 'error') {
    return `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 3.5V6.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="6" cy="9" r="0.7" fill="currentColor"/>
    </svg>`;
  }
  // loading / pending
  return `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="splash-loader-spinner">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="20 6" opacity="0.4"/>
    <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  </svg>`;
}

function textFor(state) {
  if (state === 'ready') return '已就绪';
  if (state === 'error') return '用本地';
  if (state === 'loading') return '加载中…';
  return '待唤醒';
}
