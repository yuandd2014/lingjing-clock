/**
 * 灵境 Onboarding — 首次启动毛玻璃欢迎页
 *
 * 触发: localStorage 'lingjing-firstrun-v1' 不存在 (或 !== 'true')
 * 关闭: 点 "开始使用" / "稍后再说" / Esc / Enter
 * 二次启动: 跳过 (已写 flag)
 * 重看入口: 设置面板底部 "重新显示欢迎页" → FirstRun.show(true) 强制
 *
 * 设计:
 *  - 全屏遮罩 + 中心模态, 复用 settings-overlay 风格
 *  - 1.4s 冷白月光光毯横扫入场
 *  - 3 张卡错峰 fade-in + translateY (80ms 错开)
 *  - 主按钮呼吸 + 点击 ripple
 *  - 全部用 CSS transform / opacity, 0 layout
 *  - prefers-reduced-motion 兜底 (0 动效直接显示)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'lingjing-firstrun-v1';

  // 内部状态
  let overlay, stage, lightSweep, primaryBtn, lastFocus;

  // 写 flag — 多次启动只显示一次
  function markDone() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); }
    catch (e) { /* 隐私模式 / 配额满: 静默, 下次启动仍会显示 */ }
  }

  // 检查是否需要显示
  function isNeeded() {
    try { return localStorage.getItem(STORAGE_KEY) !== 'true'; }
    catch (e) { return true; /* 读不到默认显示一次 */ }
  }

  // 构造 DOM (按需, 第一次 show() 时才建)
  function ensureDOM() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'firstrun-overlay';
    overlay.id = 'firstrun-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'firstrun-title');
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="light-sweep" aria-hidden="true"></div>
      <div class="firstrun-stage" tabindex="-1">
        <div class="firstrun-mark" aria-hidden="true">
          <span class="firstrun-mark-glyph">灵</span>
        </div>
        <h1 class="firstrun-title" id="firstrun-title">灵境时钟</h1>
        <p class="firstrun-subtitle">已为你装上桌面</p>
        <p class="firstrun-tagline">5 秒认识你的桌面伴侣</p>

        <div class="firstrun-cards">
          <article class="firstrun-card" style="--card-delay: 700ms">
            <div class="firstrun-card-icon" aria-hidden="true">▣</div>
            <h3 class="firstrun-card-title">右下角热区</h3>
            <p class="firstrun-card-desc">鼠标移到屏幕右下角, 唤出控制条 — 平时桌面干净, 需要时一点就出</p>
          </article>
          <article class="firstrun-card" style="--card-delay: 800ms">
            <div class="firstrun-card-icon" aria-hidden="true">◐</div>
            <h3 class="firstrun-card-title">设置面板</h3>
            <p class="firstrun-card-desc">8 大类 11 项配置, 改完即生效, 不用重启</p>
          </article>
          <article class="firstrun-card" style="--card-delay: 900ms">
            <div class="firstrun-card-icon" aria-hidden="true">⌘</div>
            <h3 class="firstrun-card-title">快捷键</h3>
            <p class="firstrun-card-desc"><kbd>Esc</kbd> 退出全屏 · <kbd>Ctrl</kbd>+<kbd>R</kbd> 刷新 · 右下角 ⚙ 唤出设置</p>
          </article>
        </div>

        <div class="firstrun-actions">
          <button type="button" class="firstrun-btn firstrun-btn-ghost" data-action="later">稍后再说</button>
          <button type="button" class="firstrun-btn firstrun-btn-primary" data-action="start">
            <span class="firstrun-btn-label">开始使用</span>
            <span class="firstrun-btn-arrow" aria-hidden="true">→</span>
            <span class="firstrun-btn-ripple" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    lightSweep = overlay.querySelector('.light-sweep');
    stage = overlay.querySelector('.firstrun-stage');
    primaryBtn = overlay.querySelector('[data-action="start"]');

    // 事件
    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'start' || action === 'later') {
        dismiss(action === 'start');
      }
    });

    // 遮罩点击不关 (强引导, 不允许"手滑"逃掉)
  }

  // 键盘: Esc = "稍后再说", Enter = "开始使用"
  function bindKeys() {
    if (overlay._bound) return;
    overlay._bound = true;
    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        dismiss(false);
      } else if (e.key === 'Enter') {
        // 只在焦点不在输入框时拦截
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.stopImmediatePropagation();
        e.preventDefault();
        dismiss(true);
      }
    }, true);
  }

  // 展示
  // force=true: 强制展示, 用于设置面板 "重新显示欢迎页"
  function show(force) {
    ensureDOM();
    bindKeys();
    if (!force && !isNeeded()) return false;

    lastFocus = document.activeElement;
    // 1.5 轮 v1.2.1+: 战略性 will-change (show 时加, dismiss 时移除)
    overlay.style.willChange = 'opacity, transform';
    const stage = overlay.querySelector('.firstrun-stage');
    if (stage) stage.style.willChange = 'opacity, transform';
    overlay.hidden = false;
    // 强制 reflow, 让 transition / animation 能跑
    void overlay.offsetWidth;
    overlay.classList.add('show');
    // 焦点跳到主按钮 (屏幕阅读器友好)
    setTimeout(() => {
      if (primaryBtn) primaryBtn.focus({ preventScroll: true });
    }, 80);

    // v1.2.1 2 轮: 鼠标驱动 markFloat — mousemove 算 ±8px 偏移, rAF 平滑
    unbindMarkFloat = bindMarkFloat(stage);

    return true;
  }

  // 关闭
  // userStart=true: 用户选了"开始使用" (主流程)
  // userStart=false: 用户选了"稍后再说" / Esc (也写 flag, 不再打扰)
  function dismiss(userStart) {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('show');
    overlay.classList.add('hide');
    // 退场: 用 transitionend 替 setTimeout 280ms (慢机器上不会跳变)
    const onEnd = (e) => {
      if (e.target !== overlay && !(e.target && e.target.classList && e.target.classList.contains('firstrun-stage'))) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
      overlay.removeEventListener('transitionend', onEnd);
      overlay.hidden = true;
      overlay.classList.remove('hide');
      overlay.style.willChange = '';  // 释放 GPU
      const stage = overlay.querySelector('.firstrun-stage');
      if (stage) stage.style.willChange = '';
      // 还原焦点
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
      }
    };
    overlay.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      overlay.removeEventListener('transitionend', onEnd);
      if (overlay.classList.contains('hide')) {
        overlay.hidden = true;
        overlay.classList.remove('hide');
        overlay.style.willChange = '';
      }
    }, 380);
    markDone();
    // 触发自定义事件, 设置面板可以监听
    try {
      window.dispatchEvent(new CustomEvent('lingjing:firstrun-done', {
        detail: { started: !!userStart }
      }));
    } catch (e) {}

    // v1.2.1 2 轮: 释放 markFloat mousemove 监听 + rAF + inline transform
    if (typeof unbindMarkFloat === 'function') {
      try { unbindMarkFloat(); } catch (e) {}
      unbindMarkFloat = null;
    }
  }

  // 灵字 mark 鼠标驱动 — 跟手 ±8px, mouseleave 慢回中心
  // 用 rAF + lerp 平滑 (1.5 轮性能原则: 不用 setInterval, 不用每像素 setStyle)
  function bindMarkFloat(stageEl) {
    if (!stageEl) return null;
    const mark = stageEl.querySelector('.firstrun-mark');
    if (!mark) return null;
    // prefers-reduced-motion 用户: 直接返回 null, 保持 CSS 默认静态
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    let raf = 0;
    let tx = 0, ty = 0;  // 目标
    let cx = 0, cy = 0;  // 当前
    const RANGE = 8;     // px 最大偏移

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      mark.style.transform = 'translate3d(' + cx.toFixed(2) + 'px, ' + cy.toFixed(2) + 'px, 0)';
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onMove = (e) => {
      const rect = stageEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (e.clientX - rect.left) / rect.width;   // 0~1
      const py = (e.clientY - rect.top)  / rect.height;  // 0~1
      tx = (px - 0.5) * 2 * RANGE;  // -RANGE ~ +RANGE
      ty = (py - 0.5) * 2 * RANGE;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    stageEl.addEventListener('mousemove', onMove);
    stageEl.addEventListener('mouseleave', onLeave);

    return function unbind() {
      stageEl.removeEventListener('mousemove', onMove);
      stageEl.removeEventListener('mouseleave', onLeave);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      mark.style.transform = '';
    };
  }

  // 重置 flag (供设置面板"重新显示欢迎页" 调用)
  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch (e) {}
  }

  // 公开 API
  window.FirstRun = {
    show,    // show(force?: boolean) — force=true 强制展示
    dismiss,
    reset,   // 清 flag, 下次 show() 会再展示
    isNeeded, // 只读检查
  };

  // 启动: 首次安装才自动展示
  // 等 LingJingLoader 4 组件 ready 才展示 (走 IPC 桥), 避免 250ms 抢跑挡加载
  function boot() {
    if (!isNeeded()) return;
    if (window.lingjingLoader && typeof window.lingjingLoader.onReady === 'function') {
      window.lingjingLoader.onReady(() => {
        // 略延迟 100ms, 让主窗口完全 settle 再弹
        setTimeout(() => show(false), 100);
      });
    } else {
      // 兜底: 开发 / 装包模式没有 lingjingLoader, 800ms 后展示
      setTimeout(() => show(false), 800);
    }
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
