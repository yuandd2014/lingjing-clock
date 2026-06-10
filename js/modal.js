/**
 * 统一弹窗 — alert / confirm / toast
 * 替代 window.confirm / window.alert, 自带毛玻璃风格
 */

(function() {
  'use strict';

  let overlay, box, iconEl, msgEl, btnsEl, toastWrap;

  function ensureDOM() {
    if (overlay) return;
    overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.hidden = true;
      overlay.innerHTML =
        '<div class="modal-box" role="alertdialog" aria-modal="true">' +
          '<div class="modal-icon" id="modal-icon"></div>' +
          '<div class="modal-message" id="modal-message"></div>' +
          '<div class="modal-buttons" id="modal-buttons"></div>' +
        '</div>';
      document.body.appendChild(overlay);
    }
    box = overlay.querySelector('.modal-box');
    iconEl = overlay.querySelector('#modal-icon');
    msgEl = overlay.querySelector('#modal-message');
    btnsEl = overlay.querySelector('#modal-buttons');

    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      toastWrap.id = 'toast-wrap';
      document.body.appendChild(toastWrap);
    }
  }

  function show() {
    // 1.5 轮 v1.2.1+: 战略性 will-change (show 时加, hide 时移除, 避免永久占 GPU)
    overlay.style.willChange = 'opacity, transform';
    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add('show');
  }
  function hide() {
    // 退场: 用 transitionend 替 setTimeout 220ms (慢机器上不会跳变)
    overlay.classList.remove('show');
    const onEnd = (e) => {
      if (e.target !== overlay && e.target !== box) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
      overlay.removeEventListener('transitionend', onEnd);
      overlay.hidden = true;
      overlay.style.willChange = '';  // 释放 GPU
    };
    overlay.addEventListener('transitionend', onEnd);
    // 兜底: 慢机器上 350ms 后强制 hidden (再保险)
    setTimeout(() => {
      overlay.removeEventListener('transitionend', onEnd);
      if (!overlay.classList.contains('show')) {
        overlay.hidden = true;
        overlay.style.willChange = '';
      }
    }, 350);
  }

  function buildButtons(buttons) {
    btnsEl.innerHTML = '';
    buttons.forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = 'modal-btn modal-btn-' + (b.kind || 'secondary');
      btn.textContent = b.text;
      btn.addEventListener('click', () => {
        hide();
        if (b.onClick) b.onClick();
      });
      btnsEl.appendChild(btn);
    });
  }

  function alert_(message, opts) {
    ensureDOM();
    opts = opts || {};
    iconEl.textContent = opts.icon || 'ℹ️';
    iconEl.className = 'modal-icon icon-' + (opts.iconType || 'info');
    msgEl.textContent = message;
    return new Promise((resolve) => {
      buildButtons([{ text: opts.okText || '知道了', kind: 'primary', onClick: resolve }]);
      show();
    });
  }

  function confirm_(message, opts) {
    ensureDOM();
    opts = opts || {};
    iconEl.textContent = opts.icon || '?';
    iconEl.className = 'modal-icon icon-' + (opts.iconType || 'warning');
    msgEl.textContent = message;
    return new Promise((resolve) => {
      buildButtons([
        { text: opts.cancelText || '取消', kind: 'ghost', onClick: () => resolve(false) },
        { text: opts.okText || '确定',   kind: 'primary', onClick: () => resolve(true) },
      ]);
      show();
    });
  }

  function toast(message, type) {
    ensureDOM();
    type = type || 'info';
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '!' : 'ℹ';
    t.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-msg">' + message + '</span>';
    toastWrap.appendChild(t);
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, opts_default(type));
  }
  function opts_default(type) { return 2400; }

  // 点击遮罩关闭 (仅 confirm 取消)
  function bindOverlay() {
    if (overlay._bound) return;
    overlay._bound = true;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // 模拟点取消
        const cancel = btnsEl.querySelector('.modal-btn-ghost');
        if (cancel) cancel.click();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) {
        e.stopImmediatePropagation();
        e.preventDefault();
        const cancel = btnsEl.querySelector('.modal-btn-ghost');
        if (cancel) cancel.click();
        else hide();
      }
    }, true);
  }

  function boot() {
    ensureDOM();
    bindOverlay();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 公开 API
  window.Modal = { alert: alert_, confirm: confirm_, toast };
})();
