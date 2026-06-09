/**
 * 设置面板 UI — 6 大类配置
 * 渲染 / 绑定 / 打开关闭
 */

(function() {
  'use strict';

  const SECTIONS = [
    {
      key: 'weather', title: '天气面板', icon: '☁️',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
      ],
    },
    {
      key: 'calendar', title: '日历面板', icon: '📅',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
      ],
    },
    {
      key: 'solar', title: '节气面板', icon: '🌾',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
      ],
    },
    {
      key: 'live2d', title: 'Live2D 角色', icon: '🌸',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
        { type: 'select', key: 'model',   label: '模型',
          options: [
            { v: 'Hiyori', t: 'Hiyori' },
            { v: 'shizuku', t: '志贵 (v1 暂未开放)' },
          ] },
      ],
    },
    {
      key: 'particles', title: '背景粒子', icon: '✨',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'count',   label: '粒子数', min: 0, max: 30, step: 1, integer: true },
      ],
    },
    {
      key: 'clock', title: '时钟数字', icon: '🕐',
      items: [
        { type: 'range',  key: 'size',    label: '字号', min: 80, max: 220, step: 2, unit: 'px', integer: true },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
        { type: 'select', key: 'align',   label: '对齐',
          options: [
            { v: 'left', t: '左' },
            { v: 'center', t: '中' },
            { v: 'right', t: '右' },
          ] },
      ],
    },
  ];

  function fmtVal(v, item) {
    if (typeof v !== 'number') return String(v);
    if (item.unit) return Math.round(v) + item.unit;
    if (item.integer) return String(Math.round(v));
    return v.toFixed(2);
  }

  function buildRow(item, secKey, val) {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const fullKey = secKey + '.' + item.key;

    if (item.type === 'switch') {
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<label class="settings-switch">' +
          '<input type="checkbox" data-key="' + fullKey + '"' + (val ? ' checked' : '') + '>' +
          '<span class="settings-switch-slider"></span>' +
        '</label>';
    } else if (item.type === 'range') {
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<div class="settings-range-wrap">' +
          '<input type="range" class="settings-range" data-key="' + fullKey + '"' +
            (item.integer ? ' data-integer="1"' : '') +
            ' min="' + item.min + '" max="' + item.max + '" step="' + item.step + '"' +
            ' value="' + val + '">' +
          '<span class="settings-range-val" data-val-for="' + fullKey + '">' +
            fmtVal(val, item) + '</span>' +
        '</div>';
    } else if (item.type === 'select') {
      const opts = item.options.map(o =>
        '<option value="' + o.v + '"' + (val === o.v ? ' selected' : '') + '>' + o.t + '</option>'
      ).join('');
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<select class="settings-select" data-key="' + fullKey + '">' + opts + '</select>';
    }
    return row;
  }

  function render() {
    const body = document.getElementById('settings-body');
    if (!body) return;
    const s = window.Settings.get();
    body.innerHTML = '';
    for (const sec of SECTIONS) {
      const secEl = document.createElement('div');
      secEl.className = 'settings-section';
      const head = document.createElement('div');
      head.className = 'settings-section-head';
      head.innerHTML = '<span class="settings-section-icon">' + sec.icon + '</span>' +
                       '<span>' + sec.title + '</span>';
      secEl.appendChild(head);
      const group = s[sec.key] || {};
      for (const item of sec.items) {
        secEl.appendChild(buildRow(item, sec.key, group[item.key]));
      }
      body.appendChild(secEl);
    }
  }

  // 单次事件代理, 监听所有 change/input
  function onBodyInput(e) {
    const t = e.target;
    const key = t.dataset && t.dataset.key;
    if (!key) return;
    let val;
    if (t.type === 'checkbox') {
      val = t.checked;
    } else if (t.type === 'range') {
      val = parseFloat(t.value);
      if (t.dataset.integer) val = Math.round(val);
      const span = document.querySelector('[data-val-for="' + key + '"]');
      if (span) {
        const parts = key.split('.');
        const sec = SECTIONS.find(s => s.key === parts[0]);
        if (sec) {
          const it = sec.items.find(i => i.key === parts[1]);
          if (it) span.textContent = fmtVal(val, it);
        }
      }
    } else if (t.tagName === 'SELECT') {
      val = t.value;
    } else {
      return;
    }
    window.Settings.set(key, val);
  }

  function open() {
    render();
    const ov = document.getElementById('settings-overlay');
    ov.hidden = false;
    // 强制 reflow, 触发 transition
    void ov.offsetWidth;
    ov.classList.add('show');
  }

  function close() {
    const ov = document.getElementById('settings-overlay');
    ov.classList.remove('show');
    setTimeout(() => { ov.hidden = true; }, 220);
  }

  function bind() {
    const body = document.getElementById('settings-body');
    body.addEventListener('change', onBodyInput);
    body.addEventListener('input', onBodyInput);

    document.getElementById('btn-settings').addEventListener('click', open);
    document.getElementById('settings-close').addEventListener('click', close);
    document.getElementById('settings-done').addEventListener('click', close);
    document.getElementById('settings-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'settings-overlay') close();
    });
    document.getElementById('settings-reset').addEventListener('click', async () => {
      const ok = await window.Modal.confirm('确定要恢复默认设置吗?');
      if (ok) {
        window.Settings.reset();
        render();
      }
    });

    // 重新显示欢迎页 — 关闭设置面板, 触发 firstrun 强制展示
    document.getElementById('settings-show-welcome').addEventListener('click', () => {
      close();
      // 稍等关闭动画再开, 体验更顺
      setTimeout(() => {
        if (window.FirstRun) {
          window.FirstRun.reset();  // 清 flag (虽然 force=true 不需要, 写一致)
          window.FirstRun.show(true);
        }
      }, 240);
    });

    // ESC 关闭 (但优先让 app.js 的退出 app 逻辑)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('settings-overlay').hidden) {
        e.stopImmediatePropagation();
        e.preventDefault();
        close();
      }
    }, true);
  }

  function boot() {
    bind();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
