// 灵境 Splash — 安装仪式
// 4-5s 进度 0→100% 动画, 然后通知主进程退出
// 主进程通过 ipcRenderer.on('splash-done') 接收, 或 5s 后自动退

const HINTS = [
  '正在准备灵境…',
  '装点时间的光毯…',
  '唤出灵境UI…',
  '调整灵镜光感…',
  '即将开启灵境…'
];

const progressBar = document.getElementById('splash-progress-bar');
const hint = document.getElementById('splash-hint');
const stage = document.querySelector('.splash-stage');

let progress = 0;
let hintIdx = 0;
const TOTAL_MS = 4500; // 总时长 4.5s (留 500ms 给淡出)

const startTime = Date.now();
const hintInterval = setInterval(() => {
  hintIdx = Math.min(hintIdx + 1, HINTS.length - 1);
  hint.style.animation = 'none';
  void hint.offsetHeight; // 触发重排重启动画
  hint.style.animation = '';
  hint.textContent = HINTS[hintIdx];
}, Math.floor(TOTAL_MS / HINTS.length));

const tickInterval = setInterval(() => {
  const elapsed = Date.now() - startTime;
  progress = Math.min(100, (elapsed / TOTAL_MS) * 100);
  progressBar.style.width = progress + '%';
  progressBar.parentElement.setAttribute('aria-valuenow', Math.floor(progress));

  if (progress >= 100) {
    clearInterval(tickInterval);
    clearInterval(hintInterval);
    hint.textContent = '灵境已就绪';
    // 通知主进程退出
    setTimeout(() => {
      try {
        if (window.lingjingSplash && window.lingjingSplash.dismiss) {
          window.lingjingSplash.dismiss();
        }
      } catch (e) {
        // 主进程 fallback
      }
    }, 350);
  }
}, 30);

// 防御: 8s 强制退出 (防卡死)
setTimeout(() => {
  clearInterval(tickInterval);
  clearInterval(hintInterval);
  if (window.lingjingSplash && window.lingjingSplash.dismiss) {
    window.lingjingSplash.dismiss();
  }
}, 8000);

// 键盘: Esc / Enter 立即退
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (window.lingjingSplash && window.lingjingSplash.dismiss) {
      window.lingjingSplash.dismiss();
    }
  }
}, true);
