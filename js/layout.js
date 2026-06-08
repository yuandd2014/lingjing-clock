/**
 * 布局策略 — 按可见"其他"面板数切 grid 模板
 * 4 种: N0 / N1 / N2 / N3 (clock 永远在, 不算)
 *
 *   N3: clock 左 1.2fr + 3 面板 (weather cal solar) 占右 2 列
 *   N2: clock 左 1.2fr + 2 面板竖排右 1fr
 *   N1: clock 左 1fr   + 1 面板右 1fr
 *   N0: clock 居中占满
 */

(function() {
  'use strict';

  function visibleCount(s) {
    return [s.weather.visible, s.calendar.visible, s.solar.visible].filter(Boolean).length;
  }

  function visibleNames(s) {
    const v = [];
    if (s.weather.visible) v.push('weather');
    if (s.calendar.visible) v.push('calendar');
    if (s.solar.visible) v.push('solar');
    return v;
  }

  function reset(el) {
    if (!el) return;
    el.style.gridColumn = '';
    el.style.gridRow = '';
    el.style.gridArea = '';
  }

  function set(el, col, row, colSpan, rowSpan) {
    if (!el) return;
    el.style.gridColumn = col + ' / ' + (col + (colSpan || 1));
    el.style.gridRow = row + ' / ' + (row + (rowSpan || 1));
  }

  function apply(s) {
    const container = document.querySelector('.container');
    if (!container) return;
    const n = visibleCount(s);
    container.dataset.layout = 'N' + n;

    // 重置所有 area
    ['clock', 'weather', 'calendar', 'solar'].forEach((name) => {
      reset(document.querySelector('.area-' + name));
    });
    container.style.gridTemplateColumns = '';
    container.style.gridTemplateRows = '';
    container.style.gridTemplateAreas = '';

    const vis = visibleNames(s);
    const $ = (sel) => document.querySelector(sel);

    if (n === 3) {
      // clock 占左列 (跨 2 行)
      // weather 右上, calendar 左下, solar 右下
      container.style.gridTemplateColumns = '1.2fr 1fr 1fr';
      container.style.gridTemplateRows = '1fr 1fr';
      set($('.area-clock'),    1, 1, 1, 2);
      set($('.area-weather'),  2, 1, 2, 1);
      set($('.area-calendar'), 2, 2, 1, 1);
      set($('.area-solar'),    3, 2, 1, 1);
    } else if (n === 2) {
      // clock 左 1.2fr, 2 面板右列上下
      container.style.gridTemplateColumns = '1.2fr 1fr';
      container.style.gridTemplateRows = '1fr 1fr';
      set($('.area-clock'), 1, 1, 1, 2);
      vis.forEach((name, i) => {
        set($('.area-' + name), 2, i + 1, 1, 1);
      });
    } else if (n === 1) {
      // clock 左 1fr, 1 面板右 1fr (clock 居中放大效果)
      container.style.gridTemplateColumns = '1fr 1fr';
      container.style.gridTemplateRows = '1fr';
      set($('.area-clock'), 1, 1, 1, 1);
      vis.forEach((name) => {
        set($('.area-' + name), 2, 1, 1, 1);
      });
    } else if (n === 0) {
      container.style.gridTemplateColumns = '1fr';
      container.style.gridTemplateRows = '1fr';
      set($('.area-clock'), 1, 1, 1, 1);
    }
  }

  window.Layout = { apply, visibleCount };
})();
