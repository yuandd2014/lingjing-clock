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
      key: 'solar', title: '节气面板', icon: '◑',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
      ],
    },
    {
      key: 'live2d', title: 'Live2D 角色', icon: '✦',
      items: [
        { type: 'switch', key: 'visible', label: '显示' },
        { type: 'range',  key: 'opacity', label: '透明度', min: 0.3, max: 1, step: 0.05 },
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
    {
      key: '_system', title: '系统更新', icon: '🔄',
      items: [
        { type: 'switch', key: 'autoUpdateEnabled', label: '自动检查更新' },
        { type: 'action', key: 'checkNow', label: '立即检查更新' },
      ],
    },
    // v1.3.0: 主题色/排版 — 8 个灵境品牌色
    // v1.3.1: 字体 — 4 套 (system / noto 思源黑体 / hyqi 苹方替代 / inter 英文优化)
    {
      key: 'theme', title: '主题', icon: '🎨',
      items: [
        { type: 'select', key: 'accent', label: '主题色',
          options: [
            { v: 'aurora-purple', t: '极光紫' },
            { v: 'mint-green',    t: '薄荷绿' },
            { v: 'dark-gold',     t: '暗金' },
            { v: 'glacier-blue',  t: '冰川蓝' },
            { v: 'gothic-grey',   t: '哥特灰' },
            { v: 'peach-pink',    t: '蜜桃粉' },
            { v: 'wave-cyan',     t: '电波青' },
            { v: 'sweet-orange',  t: '甜橙' },
          ] },
        { type: 'select', key: 'font', label: '字体',
          options: [
            { v: 'system', t: '系统默认' },
            { v: 'noto',   t: '思源黑体 (中文优化)' },
            { v: 'hyqi',   t: '苹方替代 HYQiHei (Apple 风)' },
            { v: 'inter',  t: 'Inter (英文/数字优化)' },
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
    // _system 是顶层 key, 不要加 secKey 前缀
    const isTopLevel = secKey === '_system';
    const dataKey = isTopLevel ? item.key : fullKey;

    if (item.type === 'switch') {
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<label class="settings-switch">' +
          '<input type="checkbox" data-key="' + dataKey + '"' + (val ? ' checked' : '') + '>' +
          '<span class="settings-switch-slider"></span>' +
        '</label>';
    } else if (item.type === 'range') {
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<div class="settings-range-wrap">' +
          '<input type="range" class="settings-range" data-key="' + dataKey + '"' +
            (item.integer ? ' data-integer="1"' : '') +
            ' min="' + item.min + '" max="' + item.max + '" step="' + item.step + '"' +
            ' value="' + val + '">' +
          '<span class="settings-range-val" data-val-for="' + dataKey + '">' +
            fmtVal(val, item) + '</span>' +
        '</div>';
    } else if (item.type === 'select') {
      const opts = item.options.map(o =>
        '<option value="' + o.v + '"' + (val === o.v ? ' selected' : '') + '>' + o.t + '</option>'
      ).join('');
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<select class="settings-select" data-key="' + dataKey + '">' + opts + '</select>';
    } else if (item.type === 'action') {
      row.innerHTML =
        '<span class="settings-row-label">' + item.label + '</span>' +
        '<button type="button" class="settings-action-btn" data-key="' + dataKey + '">检查</button>';
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
      // v1.2.1 修: _system section 字段在 current 顶层, 不在 s._system 子对象
      // 之前 s._system 是 undefined → group[item.key] 是 undefined → 开关永远不显示 checked
      // 现在: 顶层 section 时 group 直接用 current 整体, 子 section 时取 s[sec.key]
      const group = sec.key === '_system' ? s : (s[sec.key] || {});
      for (const item of sec.items) {
        secEl.appendChild(buildRow(item, sec.key, group[item.key]));
      }
      body.appendChild(secEl);
    }
  }

  // 单次事件代理, 监听所有 change/input
  // 1.5 轮 v1.2.1+: input 事件只更新显示 (span 文字), change 事件 (mouseup) 才真写 Settings
  // 避免拖动滑块期间每次像素都 rebuildParticles, 性能急救
  function onBodyInput(e) {
    const t = e.target;
    const key = t.dataset && t.dataset.key;
    if (!key) return;
    if (t.type === 'checkbox' || t.tagName === 'SELECT') {
      // 立即写 (checkbox/select 不会高频触发)
      let val = t.type === 'checkbox' ? t.checked : t.value;
      window.Settings.set(key, val);
      return;
    }
    if (t.type === 'range') {
      // 只更新 span 文字 (不调 Settings.set, 松手 change 事件才真写)
      const val = parseFloat(t.value);
      const span = document.querySelector('[data-val-for="' + key + '"]');
      if (span) {
        const parts = key.split('.');
        const sec = SECTIONS.find(s => s.key === parts[0]);
        if (sec) {
          const it = sec.items.find(i => i.key === parts[1]);
          if (it) span.textContent = fmtVal(val, it);
        }
      }
    }
  }
  function onBodyChange(e) {
    const t = e.target;
    const key = t.dataset && t.dataset.key;
    if (!key) return;
    let val;
    if (t.type === 'checkbox') {
      val = t.checked;
    } else if (t.type === 'range') {
      val = parseFloat(t.value);
      if (t.dataset.integer) val = Math.round(val);
    } else if (t.tagName === 'SELECT') {
      val = t.value;
    } else {
      return;
    }
    // range 松手才真写, 触发 Settings.set -> apply (rebuildParticles 等)
    window.Settings.set(key, val);
  }
  function open() {
    render();
    const ov = document.getElementById('settings-overlay');
    // 1.5 轮 v1.2.1+: 战略性 will-change
    ov.style.willChange = 'opacity, transform';
    ov.hidden = false;
    // 强制 reflow, 触发 transition
    void ov.offsetWidth;
    ov.classList.add('show');
  }

  function close() {
    const ov = document.getElementById('settings-overlay');
    ov.classList.remove('show');
    // 退场: 用 transitionend 替 setTimeout 220ms (慢机器上不会跳变)
    const onEnd = (e) => {
      if (e.target !== ov) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
      ov.removeEventListener('transitionend', onEnd);
      ov.hidden = true;
      ov.style.willChange = '';  // 释放 GPU
    };
    ov.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      ov.removeEventListener('transitionend', onEnd);
      if (!ov.classList.contains('show')) {
        ov.hidden = true;
        ov.style.willChange = '';
      }
    }, 350);
    // 弹"应用设置中..."模态进度条, 遮住 settings 关闭 + 粒子 rebuild 期间
    showApplyingModal();
  }

  // 模态进度条: 遮住 settings 关闭到粒子 rebuild 完成的感知延迟
  function showApplyingModal() {
    let modal = document.getElementById('settings-apply-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-apply-modal';
      modal.className = 'settings-apply-modal';
      modal.setAttribute('role', 'status');
      modal.setAttribute('aria-live', 'polite');
      modal.innerHTML =
        '<div class="settings-apply-stage">' +
          '<div class="settings-apply-spinner" aria-hidden="true"></div>' +
          '<div class="settings-apply-label">应用设置中…</div>' +
        '</div>';
      document.body.appendChild(modal);
    }
    requestAnimationFrame(() => modal.classList.add('show'));
    // 实际粒子 rebuild 是同步的, 但 CSS 关闭动画 220ms + rebuild 100-300ms, 800ms 足够
    setTimeout(() => {
      modal.classList.remove('show');
      setTimeout(() => { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); }, 240);
    }, 800);
  }

  function bind() {
    const body = document.getElementById('settings-body');
    body.addEventListener('input', onBodyInput);
    body.addEventListener('change', onBodyChange);

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

    // "立即检查更新" 按钮
    body.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('settings-action-btn') && t.dataset.key === 'checkNow') {
        if (window.electronAPI && window.electronAPI.autoUpdateCheck) {
          window.electronAPI.autoUpdateCheck();
          t.disabled = true;
          t.textContent = '检查中…';
          setTimeout(() => {
            try { t.disabled = false; t.textContent = '检查'; } catch (e) {}
          }, 4000);
        }
      }
    });

    // 自动更新事件 → 弹一个非阻塞卡片
    if (window.electronAPI && window.electronAPI.onUpdateEvent) {
      window.electronAPI.onUpdateEvent((data) => {
        showUpdateToast(data);
      });
    }

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

  // 自动更新 toast (非阻塞卡片, 6s 自动消失)
  function showUpdateToast(data) {
    const existing = document.getElementById('update-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.className = 'update-toast';
    const phase = data && data.phase;
    const ver = data && data.version;
    if (phase === 'install') {
      toast.innerHTML =
        '<div class="update-toast-icon">✨</div>' +
        '<div class="update-toast-body">' +
          '<div class="update-toast-title">灵境时钟 v' + (ver || '新版本') + ' 已下载</div>' +
          '<div class="update-toast-sub">重启后生效, 也可以稍后在 设置 中手动更新</div>' +
        '</div>' +
        '<button class="update-toast-action" id="update-toast-install">立即重启</button>' +
        '<button class="update-toast-close" id="update-toast-close">×</button>';
    } else {
      toast.innerHTML =
        '<div class="update-toast-icon">⏬</div>' +
        '<div class="update-toast-body">' +
          '<div class="update-toast-title">发现新版本 v' + (ver || '') + '</div>' +
          '<div class="update-toast-sub">正在后台下载, 装好会通知您</div>' +
        '</div>' +
        '<button class="update-toast-close" id="update-toast-close">×</button>';
    }
    document.body.appendChild(toast);
    // 1.5 轮 v1.2.1+: 战略性 will-change
    toast.style.willChange = 'opacity, transform';
    requestAnimationFrame(() => toast.classList.add('show'));

    const close = () => {
      toast.classList.remove('show');
      // 退场: transitionend 替 setTimeout 300ms
      const onEnd = (e) => {
        if (e.target !== toast) return;
        if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
        toast.removeEventListener('transitionend', onEnd);
        toast.style.willChange = '';
        toast.remove();
      };
      toast.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        toast.removeEventListener('transitionend', onEnd);
        if (!toast.classList.contains('show')) {
          toast.style.willChange = '';
          toast.remove();
        }
      }, 380);
    };
    document.getElementById('update-toast-close').addEventListener('click', close);
    const installBtn = document.getElementById('update-toast-install');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.autoUpdateInstall) {
          window.electronAPI.autoUpdateInstall();
        }
      });
    }
    setTimeout(close, phase === 'install' ? 12000 : 6000);
  }

  // v1.2.1+: 首启"自动更新已开启"提示 toast
  // 只弹一次 (autoUpdateFirstHintShown flag), 5s 自动消失或一键关闭
  // 关闭: 调 Settings.set('autoUpdateEnabled', false) 真正关掉, 不是只关这个提醒
  function showAutoUpdateHint() {
    if (!window.Settings || typeof window.Settings.get !== 'function') return;
    const s = window.Settings.get();
    if (s.autoUpdateFirstHintShown) return;            // 已弹过, 不再骚扰
    if (!s.autoUpdateEnabled) return;                  // 已关闭, 不需要提示
    if (document.getElementById('auto-update-hint')) return;  // 已存在

    // 立即写 flag (即使网络异常 / 用户立刻关窗, 都不会再弹第二次)
    window.Settings.set('autoUpdateFirstHintShown', true);

    const hint = document.createElement('div');
    hint.id = 'auto-update-hint';
    hint.className = 'update-toast update-toast-hint';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.innerHTML =
      '<div class="update-toast-icon">🔄</div>' +
      '<div class="update-toast-body">' +
        '<div class="update-toast-title">自动检查更新已开启</div>' +
        '<div class="update-toast-sub">' +
          '启动时 + 每 1 小时, 匿名向 GitHub 查询新版本. 仅发送: 操作系统 / Electron / app 版本, 不含个人数据.' +
        '</div>' +
      '</div>' +
      '<button class="update-toast-action update-toast-action-close" id="auto-update-hint-close">关闭</button>';

    document.body.appendChild(hint);
    hint.style.willChange = 'opacity, transform';
    requestAnimationFrame(() => hint.classList.add('show'));

    const close = (userAct) => {
      hint.classList.remove('show');
      const onEnd = (e) => {
        if (e.target !== hint) return;
        if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
        hint.removeEventListener('transitionend', onEnd);
        hint.style.willChange = '';
        hint.remove();
      };
      hint.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        hint.removeEventListener('transitionend', onEnd);
        if (!hint.classList.contains('show')) {
          hint.style.willChange = '';
          hint.remove();
        }
      }, 380);
      if (userAct) {
        // 一键关闭 = 整个自动更新关掉 (不是只关这个提醒)
        // 同时调 IPC 通知主进程停止定时扫描
        try {
          window.Settings.set('autoUpdateEnabled', false);
          if (window.electronAPI && typeof window.electronAPI.autoUpdateSetEnabled === 'function') {
            window.electronAPI.autoUpdateSetEnabled(false);
          }
        } catch (e) { /* 静默 */ }
      }
    };
    document.getElementById('auto-update-hint-close').addEventListener('click', () => close(true));
    // 5s 自动消失 (用户没点也算"已知情")
    setTimeout(() => close(false), 5000);
  }
  // 暴露给 app.js / firstrun.js 调
  window.LingJingSettingsUI = window.LingJingSettingsUI || {};
  window.LingJingSettingsUI.showAutoUpdateHint = showAutoUpdateHint;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
