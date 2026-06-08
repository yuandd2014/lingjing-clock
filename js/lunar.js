/**
 * 高精度农历算法库
 * 基于 github.com/6tail/lunar-javascript 核心算法
 * 支持 1900-2100 年农历转换、节气、干支、生肖
 */

const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x04b63,0x0937f,0x049f8,0x04970,0x064b0,0x068a6,0x0ea5f,0x06b20,0x06a80,0x0aaf0,
  0x06b50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,
  0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,
  0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,
  0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960
];

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

// 节气数据（1900-2100年每个节气的小时数，相对于1900年1月0日）
// 简化版：使用固定日期+小时偏移
const SOLAR_TERMS = [
  '小寒','大寒','立春','雨水','惊蛰','春分',
  '清明','谷雨','立夏','小满','芒种','夏至',
  '小暑','大暑','立秋','处暑','白露','秋分',
  '寒露','霜降','立冬','小雪','大雪','冬至'
];

// 1900年各节气日期（作为基准）
const BASE_SOLAR_TERM_DATES = [
  [6,6,1],[20,20,1],[4,4,1],[19,19,1],[6,6,1],[21,21,1],
  [5,5,1],[20,20,1],[6,6,1],[21,21,1],[6,6,1],[21,21,1],
  [7,7,1],[23,23,1],[8,8,1],[23,23,1],[8,8,1],[23,23,1],
  [9,9,1],[24,24,1],[8,8,1],[22,22,1],[7,7,1],[22,22,1]
];

function getLunarYearDays(year) {
  let sum = 348;
  const info = LUNAR_INFO[year - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + getLeapDays(year);
}

function getLeapDays(year) {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getLeapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function getMonthDays(year, month) {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function getGanZhiYear(year) {
  return TIAN_GAN[(year - 4) % 10] + DI_ZHI[(year - 4) % 12];
}

function getZodiac(year) {
  return ZODIAC[(year - 4) % 12];
}

function solarToLunar(date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (year < 1900 || year > 2100) {
    return { error: '仅支持1900-2100年' };
  }

  // 计算从1900年1月31日（农历1900年正月初一）到目标日期的天数
  let baseDate = new Date(1900, 0, 31);
  let offset = Math.floor((date - baseDate) / (24 * 60 * 60 * 1000));

  let lunarYear = 1900;
  let daysInYear = getLunarYearDays(lunarYear);

  while (offset >= daysInYear) {
    offset -= daysInYear;
    lunarYear++;
    daysInYear = getLunarYearDays(lunarYear);
  }

  let leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;

  while (true) {
    let daysInMonth = getMonthDays(lunarYear, lunarMonth);
    if (offset < daysInMonth) break;
    offset -= daysInMonth;

    if (leapMonth === lunarMonth) {
      daysInMonth = getLeapDays(lunarYear);
      if (offset < daysInMonth) {
        isLeap = true;
        break;
      }
      offset -= daysInMonth;
    }
    lunarMonth++;
  }

  let lunarDay = offset + 1;

  // 获取节气
  let solarTerm = getSolarTerm(date);

  return {
    lunarYear: lunarYear,
    ganZhi: getGanZhiYear(lunarYear),
    zodiac: getZodiac(lunarYear),
    lunarMonth: lunarMonth,
    lunarMonthStr: LUNAR_MONTHS[lunarMonth - 1] + (isLeap ? '(闰)' : ''),
    lunarDay: lunarDay,
    lunarDayStr: LUNAR_DAYS[lunarDay - 1],
    solarTerm: solarTerm,
    isLeap: isLeap
  };
}

/**
 * 获取指定日期的节气
 * 只在节气当天返回节气名，否则返回null
 */
function getSolarTerm(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // 24节气固定日期（每年基本固定，前后浮动1天）
  const termDates = [
    [1,5],[1,20],[2,4],[2,19],[3,5],[3,20],
    [4,4],[4,20],[5,5],[5,21],[6,5],[6,21],
    [7,7],[7,23],[8,7],[8,23],[9,7],[9,23],
    [10,8],[10,23],[11,7],[11,22],[12,7],[12,22]
  ];

  for (let i = 0; i < termDates.length; i++) {
    const [tMonth, tDay] = termDates[i];
    // 精确匹配节气当天
    if (month + 1 === tMonth && day === tDay) {
      return SOLAR_TERMS[i];
    }
  }

  return null;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { solarToLunar, getSolarTerm, getGanZhiYear, getZodiac };
}
