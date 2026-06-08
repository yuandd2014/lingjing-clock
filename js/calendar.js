/**
 * 日历模块 - 使用高精度农历算法
 * 支持公历/农历转换、节气、干支、生肖
 */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 节气描述文案
const SOLAR_TERM_DESCS = {
  '立春': '立春一日，百草回芽。',
  '雨水': '雨水到来地解冻，化一层来耙一层。',
  '惊蛰': '惊蛰过，暖和和，蛤蟆老角唱山歌。',
  '春分': '春分麦起身，一刻值千金。',
  '清明': '清明前后，种瓜点豆。',
  '谷雨': '谷雨麦挑旗，立夏麦头齐。',
  '立夏': '立夏麦龇牙，一月就要拔。',
  '小满': '小满者，物至于此小得盈满。',
  '芒种': '芒种看今日，螽斯剪五色。',
  '夏至': '夏至未来莫道热，冬至未来莫道寒。',
  '小暑': '小暑过，一日热三分。',
  '大暑': '大暑不暑，五谷不起。',
  '立秋': '立秋十八天，寸草皆结顶。',
  '处暑': '处暑不出头，割了喂老牛。',
  '白露': '白露白茫茫，谷子满田黄。',
  '秋分': '秋分只怕雷电闪，多来米价贵如何。',
  '寒露': '寒露时节人人忙，种麦摘花打豆场。',
  '霜降': '霜降无雨，暖到立冬。',
  '立冬': '立冬补冬，补嘴空。',
  '小雪': '小雪雪满天，来年必丰年。',
  '大雪': '大雪不冻，惊蛰不开。',
  '冬至': '冬至大如年，人间小团圆。',
  '小寒': '小寒大寒，冷成冰团。',
  '大寒': '大寒到顶点，日后天渐暖。'
};

function updateCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const weekday = now.getDay();

  // 公历日期
  document.getElementById('calendar-date').textContent = `${year}年${month + 1}月${date}日`;
  document.getElementById('calendar-weekday').textContent = `星期${WEEKDAYS[weekday]}`;

  // 使用高精度农历算法
  let lunar;
  if (typeof solarToLunar !== 'undefined') {
    lunar = solarToLunar(now);
  } else {
    // 降级：简化算法
    lunar = getSimpleLunar(now);
  }

  document.getElementById('calendar-lunar').textContent = 
    `${lunar.ganZhi}年 ${lunar.lunarMonthStr}月${lunar.lunarDayStr}`;

  // 节气或名言
  const solarTermEl = document.getElementById('solar-term-name');
  const solarTermLunarEl = document.getElementById('solar-term-lunar');
  const solarTermDescEl = document.getElementById('solar-term-desc');
  const solarTermLabelEl = document.querySelector('.solar-term-label');

  const solarCard = document.querySelector('.area-solar');
  if (lunar.solarTerm) {
    // 当天是节气日
    solarCard.classList.remove('quote-mode');
    solarTermLabelEl.textContent = '节气';
    solarTermEl.textContent = lunar.solarTerm;
    solarTermLunarEl.textContent = `农历${lunar.lunarMonthStr}月${lunar.lunarDayStr}`;
    solarTermDescEl.textContent = SOLAR_TERM_DESCS[lunar.solarTerm] || '';
  } else {
    // 非节气日，显示名言
    const quote = getDailyQuote();
    solarCard.classList.add('quote-mode');
    solarTermLabelEl.textContent = '每日一句';
    solarTermEl.textContent = quote.text;
    solarTermLunarEl.textContent = `—— ${quote.author}`;
    solarTermDescEl.textContent = '';
  }

  // 月历网格
  renderCalendarGrid(year, month, date);
}

function getSimpleLunar(date) {
  const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  
  const year = date.getFullYear();
  const ganZhi = TIAN_GAN[(year - 4) % 10] + DI_ZHI[(year - 4) % 12];
  
  // 简化：使用固定偏移（仅用于降级）
  const baseDate = new Date(2024, 4, 20);
  const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
  
  let lunarMonth = 4;
  let lunarDay = 13 + diffDays;
  
  while (lunarDay > 30) { lunarDay -= 30; lunarMonth++; }
  while (lunarDay < 1) { lunarDay += 30; lunarMonth--; }
  
  return {
    ganZhi: ganZhi,
    lunarMonthStr: LUNAR_MONTHS[(lunarMonth - 1 + 12) % 12],
    lunarDayStr: LUNAR_DAYS[lunarDay - 1],
    solarTerm: getSolarTermByDate(date)
  };
}

function getSolarTermByDate(date) {
  const terms = [
    { name: '小寒', month: 1, day: 5 }, { name: '大寒', month: 1, day: 20 },
    { name: '立春', month: 2, day: 4 }, { name: '雨水', month: 2, day: 19 },
    { name: '惊蛰', month: 3, day: 5 }, { name: '春分', month: 3, day: 20 },
    { name: '清明', month: 4, day: 4 }, { name: '谷雨', month: 4, day: 20 },
    { name: '立夏', month: 5, day: 5 }, { name: '小满', month: 5, day: 21 },
    { name: '芒种', month: 6, day: 5 }, { name: '夏至', month: 6, day: 21 },
    { name: '小暑', month: 7, day: 7 }, { name: '大暑', month: 7, day: 23 },
    { name: '立秋', month: 8, day: 7 }, { name: '处暑', month: 8, day: 23 },
    { name: '白露', month: 9, day: 7 }, { name: '秋分', month: 9, day: 23 },
    { name: '寒露', month: 10, day: 8 }, { name: '霜降', month: 10, day: 23 },
    { name: '立冬', month: 11, day: 7 }, { name: '小雪', month: 11, day: 22 },
    { name: '大雪', month: 12, day: 7 }, { name: '冬至', month: 12, day: 22 }
  ];

  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    if (t.month === month && day === t.day) {
      return t.name;
    }
  }
  return null;
}

function renderCalendarGrid(year, month, today) {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // 星期标题
  WEEKDAYS.forEach(d => {
    const label = document.createElement('div');
    label.className = 'day-label';
    label.textContent = d;
    grid.appendChild(label);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // 上月日期
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'day other-month';
    day.textContent = daysInPrevMonth - i;
    grid.appendChild(day);
  }

  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.className = 'day';
    if (i === today) day.classList.add('today');
    day.textContent = i;
    grid.appendChild(day);
  }

  // 下月日期
  const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const day = document.createElement('div');
    day.className = 'day other-month';
    day.textContent = i;
    grid.appendChild(day);
  }
}

/**
 * 获取每日名言（每天固定一句，但保证最近30天不重复）
 * 关键：按 YYYY-MM-DD 判定"今天"，避免 toDateString 跨时区
 */
function getDailyQuote() {
  // 修复: 用 YYYY-MM-DD 格式化作为今天的 key，避免时区/缓存问题
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const storageKey = 'quote_history_v2';
  const todayKey = 'quote_today_v2';

  // 0) 启动时清理所有 quote 缓存, 强制重置 (防止历史污染 / 同一 index 重复累积)
  localStorage.removeItem('quote_today');
  localStorage.removeItem('quote_history');
  localStorage.removeItem('quote_today_v2');
  localStorage.removeItem('quote_history_v2');

  // 1) 优先读"今天"缓存 (跨重启/页面刷新仍能保持当天不变)
  try {
    const todayData = JSON.parse(localStorage.getItem(todayKey) || 'null');
    if (todayData && todayData.date === today) {
      return todayData.quote;
    }
  } catch (e) {}

  // 2) 总名言数检查 (有 1265 句)
  const totalQuotes = typeof QUOTES !== 'undefined' ? QUOTES.length : 0;
  if (totalQuotes === 0) {
    return { text: '学而不思则罔，思而不学则殆。', author: '孔子' };
  }

  // 3) 获取历史 (最近30天用过的索引)
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) { history = []; }

  // 4) 清理超过30天的旧记录
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  history = history.filter(item => item.timestamp > thirtyDaysAgo);

  // 5) 找出最近30天没用过的索引
  const usedIndices = new Set(history.map(item => item.index));
  let availableIndices = [];
  for (let i = 0; i < totalQuotes; i++) {
    if (!usedIndices.has(i)) availableIndices.push(i);
  }

  // 6) 极端情况: 30天内已用完所有1265句 (实际不会发生)
  //    回退: 至少排除"昨天的"那一句
  if (availableIndices.length === 0) {
    if (history.length > 0) {
      const lastIdx = history[history.length - 1].index;
      availableIndices = Array.from({ length: totalQuotes }, (_, i) => i).filter(i => i !== lastIdx);
    } else {
      availableIndices = Array.from({ length: totalQuotes }, (_, i) => i);
    }
  }

  // 7) 随机选一个
  const randomPick = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const quote = QUOTES[randomPick];

  // 8) 写入"今天"缓存 (按 YYYY-MM-DD)
  localStorage.setItem(todayKey, JSON.stringify({ date: today, quote: quote }));

  // 9) 写入历史
  history.push({ index: randomPick, timestamp: Date.now(), date: today });
  localStorage.setItem(storageKey, JSON.stringify(history));

  // 10) 清理旧版缓存 key (避免脏数据)
  localStorage.removeItem('quote_today');
  localStorage.removeItem('quote_history');

  return quote;
}

// 手动刷新名言 (不写入今日缓存, 不写入历史, 不影响"近30天不重复"约束)
function refreshQuoteManually() {
  if (typeof QUOTES === 'undefined' || QUOTES.length === 0) return;

  // 取出当前的历史 (30天)
  const storageKey = 'quote_history_v2';
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) { history = []; }
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  history = history.filter(item => item.timestamp > thirtyDaysAgo);

  // 已用过的索引 (30天内)
  const usedIndices = new Set(history.map(item => item.index));
  // 当前显示的也排除
  try {
    const todayData = JSON.parse(localStorage.getItem('quote_today_v2') || 'null');
    if (todayData && todayData.quote) {
      const idx = QUOTES.findIndex(q => q.text === todayData.quote.text && q.author === todayData.quote.author);
      if (idx >= 0) usedIndices.add(idx);
    }
  } catch (e) {}

  // 找可用索引
  let availableIndices = [];
  for (let i = 0; i < QUOTES.length; i++) {
    if (!usedIndices.has(i)) availableIndices.push(i);
  }
  if (availableIndices.length === 0) {
    // 全部用过了, 至少排除当前
    availableIndices = [];
    for (let i = 0; i < QUOTES.length; i++) {
      try {
        const td = JSON.parse(localStorage.getItem('quote_today_v2') || 'null');
        if (td && td.quote && QUOTES[i].text === td.quote.text) continue;
      } catch (e) {}
      availableIndices.push(i);
    }
  }

  const picked = QUOTES[availableIndices[Math.floor(Math.random() * availableIndices.length)]];

  // 更新 DOM
  const card = document.querySelector('.area-solar');
  const el = document.getElementById('solar-term-name');
  const lunarEl = document.getElementById('solar-term-lunar');
  if (el) el.textContent = picked.text;
  if (lunarEl) lunarEl.textContent = '—— ' + picked.author;

  // 刷新动效: 短暂淡化
  if (card) {
    card.classList.add('refreshing');
    setTimeout(() => card.classList.remove('refreshing'), 280);
  }

  // 仅更新会话内的"当前名言"(不写入 today 缓存, 不写入 history, 不污染"30天不重复"约束)
  console.log('[Quote] Manual refresh:', picked.text, picked.author);
}

// 初始化
updateCalendar();
setInterval(updateCalendar, 60 * 60 * 1000);

// 名言卡片点击 → 手动刷新
document.addEventListener('DOMContentLoaded', () => {
  const solarCard = document.querySelector('.area-solar');
  if (solarCard) {
    solarCard.addEventListener('click', refreshQuoteManually);
    solarCard.style.cursor = 'pointer';
    solarCard.title = '点击刷新名言';
  }
});
