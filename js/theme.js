/**
 * v1.3.0 主题色/排版 — 8 个灵境品牌色预设 + applyTheme
 * IIFE 闭包, 公开 window.Theme
 */
(function() {
  'use strict';

  // 8 个灵境品牌协调色 (按"灵境" + "Apple 风" + "夜景屏保" 美学挑选)
  // id 用 kebab-case 英文, 持久化用 id; name 是中文显示
  const THEME_PRESETS = [
    { id: 'aurora-purple', name: '极光紫', hex: '#B57BFF' },
    { id: 'mint-green',    name: '薄荷绿', hex: '#4FE0B0' },
    { id: 'dark-gold',     name: '暗金',   hex: '#D4AF37' },
    { id: 'glacier-blue',  name: '冰川蓝', hex: '#6FB1FC' },
    { id: 'gothic-grey',   name: '哥特灰', hex: '#8B7E74' },
    { id: 'peach-pink',    name: '蜜桃粉', hex: '#FFAFA0' },
    { id: 'wave-cyan',     name: '电波青', hex: '#00D4D4' },
    { id: 'sweet-orange',  name: '甜橙',   hex: '#FF9F43' },
  ];

  // 根据 id 查 hex (找不到 fallback 极光紫)
  function hexOf(accentId) {
    const p = THEME_PRESETS.find(x => x.id === accentId);
    return p ? p.hex : THEME_PRESETS[0].hex;
  }

  // 4 套字体映射: 切到对应 :root --font-family-* 变量
  const FONT_VAR_MAP = {
    'system': '--font-family-system',
    'noto':   '--font-family-noto',
    'hyqi':   '--font-family-hyqi',
    'inter':  '--font-family-inter',
  };

  // 切字体 — 读 :root 上预定义好的 --font-family-* 变量, 然后覆盖 --font-family
  function applyFont(name) {
    const cssVarName = FONT_VAR_MAP[name] || FONT_VAR_MAP['system'];
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
    if (value) {
      document.documentElement.style.setProperty('--font-family', value);
    }
  }

  // 把主题写到 :root CSS 变量 — atomic 切换, 屏幕不闪
  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.accent) {
      root.style.setProperty('--primary-accent', hexOf(theme.accent));
    }
    if (theme.font) {
      applyFont(theme.font);
    }
  }

  window.Theme = { THEME_PRESETS, applyTheme, applyFont, hexOf, FONT_VAR_MAP };
})();
