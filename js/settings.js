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
    // v1.3.0: 主题色 — 8 个灵境品牌色, 用户可在设置面板切换
    // v1.3.1: 字体 — 4 套 (system / noto / hyqi / inter)
    theme:     { accent: 'aurora-purple', font: 'system' },
    // v1.2.1: 自动更新 — 默认开启, 用户可关; 后台扫描间隔 (ms)
    // 1.2.0 默认 6s 启动一次 + 用户手动点"立即检查" — 加 1h 周期扫描, 平衡"不打扰"和"不错过"
    autoUpdateEnabled: true,
    autoUpdateCheckInterval: 3600000,   // 1 小时
    autoUpdateFirstHintShown: false,    // 首启"已开启"提示 — 弹过一次就 true, 不再骚扰
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
  // v1.2.1 3 轮: DocumentFragment 一次性建 14 个, 1 次 reflow (vs 旧 14 次)
  // v1.2.1 3 轮: animationDelay 改负数 (-15 ~ 0s), 粒子立即开始飘, 不等
  // v1.2.1 3 轮: 删 inline willChange=transform (1.5 轮性能原则: CSS 永久 will-change 占 GPU, 留给 show/hide 战略性加)
  // v1.2.1 3 轮: count=0 时立即清空 (旧版会保留动画空跑占 GPU)
  function rebuildParticles(count) {
    const c = document.getElementById('particles');
    if (!c) return;
    if (!count) {
      c.innerHTML = '';
      return;
    }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = (Math.random() * 100) + '%';
      // 负 delay: 粒子像"已经飘了 X 秒", 打开页面就看到满屏飘, 不等 0~15s 启动
      p.style.animationDelay = (-Math.random() * 15) + 's';
      p.style.animationDuration = (10 + Math.random() * 10) + 's';
      p.style.opacity = (Math.random() * 0.5 + 0.2).toFixed(2);
      frag.appendChild(p);
    }
    c.innerHTML = '';
    c.appendChild(frag);
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
    // v1.2.1 3 轮: 隐藏时切 animationPlayState: paused + display: none + 清 innerHTML
    // 让粒子彻底停 (不占 GPU, 不跑 transform), 而不是 display:none 之后还空跑
    const p = document.getElementById('particles');
    if (p) {
      if (current.particles.visible) {
        p.style.display = '';
        p.style.animationPlayState = 'running';
        const real = p.querySelectorAll('.particle').length;
        if (real !== current.particles.count) rebuildParticles(current.particles.count);
      } else {
        p.style.animationPlayState = 'paused';
        p.style.display = 'none';
        p.innerHTML = '';
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

    // v1.3.0 bug 修 B2: 任何设置变更后应用主题色 + 字体缩放
    // applyTheme 已存在, 但 apply() 没调, 改设置后主题色不更新
    if (window.Theme) {
      window.Theme.applyTheme(current.theme);
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
