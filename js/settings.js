/**
 * 设置模块 — 数据 / 持久化 / 应用
 * 6 大类: weather / calendar / solar / live2d / particles / clock
 * 存储: localStorage 'lingjing-settings-v1'
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'lingjing-settings-v1';

  // 默认值
  const DEFAULTS = {
    weather:   { visible: true, opacity: 0.85 },
    calendar:  { visible: true, opacity: 0.85 },
    solar:     { visible: true, opacity: 0.85 },
    live2d:    { visible: true, opacity: 1.00, model: 'Hiyori' },
    particles: { visible: true, count: 10 },
    clock:     { size: 140, opacity: 1.00, align: 'left' },
    // v1.2.0: 自动更新 (默认开启, NSIS 装时勾选值优先, 装好后用户可关)
    autoUpdateEnabled: true,
  };

  let current = deepClone(DEFAULTS);

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function mergeDeep(target, src) {
    for (const k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
        target[k] = mergeDeep(target[k] || {}, src[k]);
      } else {
        target[k] = src[k];
      }
    }
    return target;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) current = mergeDeep(deepClone(DEFAULTS), JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); }
    catch (e) { /* ignore */ }
  }

  // 重建粒子 (条数变更时)
  function rebuildParticles(count) {
    const c = document.getElementById('particles');
    if (!c) return;
    c.innerHTML = '';
    if (!count) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 15 + 's';
      p.style.animationDuration = (10 + Math.random() * 10) + 's';
      p.style.opacity = (Math.random() * 0.5 + 0.2).toFixed(2);
      p.style.willChange = 'transform';
      c.appendChild(p);
    }
  }

  // 把当前设置写到 DOM
  function apply() {
    // 4 个面板
    const map = {
      '.area-weather': current.weather,
      '.area-calendar': current.calendar,
      '.area-solar': current.solar,
    };
    for (const sel in map) {
      const el = document.querySelector(sel);
      if (!el) continue;
      el.style.display = map[sel].visible ? '' : 'none';
      el.style.opacity = String(map[sel].opacity);
    }

    // Live2D
    const l2d = document.querySelector('.live2d-layer');
    if (l2d) {
      l2d.style.display = current.live2d.visible ? '' : 'none';
      l2d.style.opacity = String(current.live2d.opacity);
    }

    // 粒子
    const p = document.getElementById('particles');
    if (p) {
      p.style.display = current.particles.visible ? '' : 'none';
      if (current.particles.visible) {
        const real = p.querySelectorAll('.particle').length;
        if (real !== current.particles.count) rebuildParticles(current.particles.count);
      }
    }

    // 时钟
    const clk = document.getElementById('clock');
    if (clk) {
      clk.style.fontSize = current.clock.size + 'px';
      clk.style.opacity = String(current.clock.opacity);
      // 时钟在 area-clock 里, 通过改 wrapper 控制对齐
      const wrap = document.querySelector('.clock-wrapper');
      if (wrap) {
        wrap.style.alignItems =
          current.clock.align === 'center' ? 'center' :
          current.clock.align === 'right' ? 'flex-end' : 'flex-start';
      }
    }

    // 布局: 根据可见面板数切 grid 模板
    if (window.Layout && typeof window.Layout.apply === 'function') {
      window.Layout.apply(current);
    }
  }

  // 公开 API
  window.Settings = {
    get: () => deepClone(current),
    defaults: () => deepClone(DEFAULTS),
    set(key, val) {
      const parts = key.split('.');
      let o = current;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
        o = o[parts[i]];
      }
      o[parts[parts.length - 1]] = val;
      save();
      apply();
    },
    reset() { current = deepClone(DEFAULTS); save(); apply(); },
    apply,
  };

  // 启动加载 + 应用 (延迟一点, 等其他模块先初始化 DOM)
  function boot() {
    load();
    setTimeout(apply, 50);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
