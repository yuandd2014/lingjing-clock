/**
 * 天气系统 - 和风天气国内版
 *
 * 数据源优先级:
 *   1. 和风天气 (主力，国内快，API Key 已内置)
 *   2. wttr.in   (备用1，海外，IP自动定位，10s超时)
 *   3. open-meteo (备用2，海外，无Key，10s超时)
 *
 * 每个数据源独立重试1次，失败后间隔2s再试。
 * 启动时先读缓存立即渲染，然后并行请求和风天气 + GPS后台优化。
 */

const WEATHER_CONFIG = {
  updateInterval: 30 * 60 * 1000,
  cacheTTL: 2 * 60 * 60 * 1000,
  defaultCity: '重庆',
  defaultLat: 29.5630,
  defaultLon: 106.5516,
  // ============================================================
  // 和风天气 API Key (Base64 混淆 + 字符串拆分, 仅作 obfuscation)
  // 算法: 原始 key → 字符反转 → Base64 → 拆为两段
  // 还原: atob(part1+part2).split('').reverse().join('')
  // 注意: 这不是真正的安全加密, 仅防止简单文本搜索和直接复制.
  //      专业用户通过 JS 调试仍可还原, 详见 README 隐私说明.
  // ============================================================
  _k1: 'ZWY5MWMyZTRkYWM2NmNiYm',
  _k2: 'IwMDRhMzY4ZTYxNGViMWI=',
  get hefengKey() {
    return atob(this._k1 + this._k2).split('').reverse().join('');
  },
};

// 和风天气图标码 → emoji 映射
const HEFENG_ICONS = {
  100: { icon: '☀️', text: '晴' },
  101: { icon: '🌤️', text: '多云' },
  102: { icon: '⛅', text: '阴' },
  103: { icon: '☁️', text: '阴天' },
  104: { icon: '☁️', text: '阴' },
  150: { icon: '🌦️', text: '晴转阵雨' },
  151: { icon: '🌦️', text: '多云转阵雨' },
  152: { icon: '🌧️', text: '阵雨' },
  153: { icon: '🌧️', text: '强阵雨' },
  160: { icon: '🌦️', text: '晴转小雨' },
  161: { icon: '🌦️', text: '小雨' },
  162: { icon: '🌧️', text: '中雨' },
  163: { icon: '🌧️', text: '大雨' },
  164: { icon: '🌧️', text: '大雨' },
  165: { icon: '🌧️', text: '暴雨' },
  166: { icon: '🌧️', text: '大暴雨' },
  167: { icon: '🌧️', text: '特大暴雨' },
  168: { icon: '🌧️', text: '极端降雨' },
  170: { icon: '🌨️', text: '晴转雨夹雪' },
  171: { icon: '🌨️', text: '多云转雨夹雪' },
  172: { icon: '🌨️', text: '雨夹雪' },
  173: { icon: '❄️', text: '小雪' },
  174: { icon: '❄️', text: '中雪' },
  175: { icon: '❄️', text: '大雪' },
  176: { icon: '❄️', text: '暴雪' },
  177: { icon: '🌨️', text: '雨夹雪' },
  178: { icon: '❄️', text: '冰粒' },
  179: { icon: '🌪️', text: '雷阵雨' },
  180: { icon: '⛈️', text: '雷阵雨' },
  181: { icon: '⛈️', text: '强雷阵雨' },
  182: { icon: '⛈️', text: '雷阵雨伴冰雹' },
  183: { icon: '🌫️', text: '雾' },
  184: { icon: '🌫️', text: '霾' },
  185: { icon: '🌫️', text: '大雾' },
  186: { icon: '🌫️', text: '强霾' },
  187: { icon: '🌬️', text: '扬沙' },
  188: { icon: '🌬️', text: '浮尘' },
  189: { icon: '🌪️', text: '沙尘暴' },
  190: { icon: '🌪️', text: '强沙尘暴' },
  200: { icon: '🌬️', text: '风' },
  201: { icon: '🌪️', text: '大风' },
  202: { icon: '🌪️', text: '强风' },
  203: { icon: '🌪️', text: '风暴' },
  204: { icon: '🌪️', text: '强风暴' },
  300: { icon: '🌧️', text: '小雨' },
  301: { icon: '🌧️', text: '中雨' },
  302: { icon: '🌧️', text: '大雨' },
  303: { icon: '🌧️', text: '暴雨' },
  304: { icon: '🌧️', text: '大暴雨' },
  305: { icon: '🌧️', text: '特大暴雨' },
  306: { icon: '❄️', text: '小雪' },
  307: { icon: '❄️', text: '中雪' },
  308: { icon: '❄️', text: '大雪' },
  309: { icon: '❄️', text: '暴雪' },
  310: { icon: '🌧️', text: '雨' },
  311: { icon: '🌨️', text: '雨夹雪' },
  312: { icon: '❄️', text: '雪' },
  313: { icon: '🌧️', text: '冻雨' },
  314: { icon: '🌫️', text: '雾' },
  315: { icon: '🌫️', text: '霾' },
  316: { icon: '🌬️', text: '扬沙' },
  317: { icon: '🌪️', text: '沙尘暴' },
  318: { icon: '⛈️', text: '雷阵雨' },
  319: { icon: '⛈️', text: '强雷阵雨' },
  350: { icon: '🌧️', text: '小雨' },
  351: { icon: '🌧️', text: '中雨' },
  352: { icon: '🌧️', text: '大雨' },
  353: { icon: '🌧️', text: '暴雨' },
  354: { icon: '🌧️', text: '大暴雨' },
  355: { icon: '🌧️', text: '特大暴雨' },
  356: { icon: '❄️', text: '小雪' },
  357: { icon: '❄️', text: '中雪' },
  358: { icon: '❄️', text: '大雪' },
  359: { icon: '❄️', text: '暴雪' },
  360: { icon: '🌧️', text: '雨' },
  361: { icon: '🌨️', text: '雨夹雪' },
  362: { icon: '❄️', text: '雪' },
  363: { icon: '🌧️', text: '冻雨' },
  364: { icon: '🌫️', text: '雾' },
  365: { icon: '🌫️', text: '霾' },
  366: { icon: '🌬️', text: '扬沙' },
  367: { icon: '🌪️', text: '沙尘暴' },
  368: { icon: '⛈️', text: '雷阵雨' },
  369: { icon: '⛈️', text: '强雷阵雨' },
  384: { icon: '🌧️', text: '雨' },
  385: { icon: '❄️', text: '雪' },
  386: { icon: '🌨️', text: '雨夹雪' },
  387: { icon: '🌧️', text: '冻雨' },
  388: { icon: '🌫️', text: '雾' },
  389: { icon: '🌫️', text: '霾' },
  390: { icon: '🌬️', text: '扬沙' },
  391: { icon: '🌪️', text: '沙尘暴' },
  392: { icon: '⛈️', text: '雷阵雨' },
  393: { icon: '⛈️', text: '强雷阵雨' },
  394: { icon: '🌧️', text: '雨' },
  395: { icon: '❄️', text: '雪' },
  396: { icon: '🌨️', text: '雨夹雪' },
  397: { icon: '🌧️', text: '冻雨' },
  398: { icon: '🌫️', text: '雾' },
  399: { icon: '🌫️', text: '霾' },
  400: { icon: '🌬️', text: '扬沙' },
  401: { icon: '🌪️', text: '沙尘暴' },
  402: { icon: '⛈️', text: '雷阵雨' },
  403: { icon: '⛈️', text: '强雷阵雨' },
};

// wttr.in 天气代码 → emoji 映射 (备用源1)
const WWO_CODES = {
  113: { icon: '☀️', text: '晴' },
  116: { icon: '🌤️', text: '多云' },
  119: { icon: '☁️', text: '阴' },
  122: { icon: '☁️', text: '阴天' },
  143: { icon: '🌫️', text: '雾' },
  176: { icon: '🌦️', text: '阵雨' },
  179: { icon: '🌨️', text: '雨夹雪' },
  182: { icon: '🌨️', text: '雨夹雪' },
  185: { icon: '🌨️', text: '冻雨' },
  200: { icon: '⛈️', text: '雷阵雨' },
  227: { icon: '🌨️', text: '吹雪' },
  230: { icon: '🌨️', text: '暴风雪' },
  248: { icon: '🌫️', text: '雾' },
  260: { icon: '🌫️', text: '冻雾' },
  263: { icon: '🌦️', text: '毛毛雨' },
  266: { icon: '🌦️', text: '小雨' },
  281: { icon: '🌨️', text: '冻雨' },
  284: { icon: '🌨️', text: '大冻雨' },
  293: { icon: '🌦️', text: '小雨' },
  296: { icon: '🌦️', text: '小雨' },
  299: { icon: '🌧️', text: '中雨' },
  302: { icon: '🌧️', text: '中雨' },
  305: { icon: '🌧️', text: '大雨' },
  308: { icon: '🌧️', text: '大雨' },
  311: { icon: '🌨️', text: '冻雨' },
  314: { icon: '🌨️', text: '大冻雨' },
  317: { icon: '🌨️', text: '雨夹雪' },
  320: { icon: '🌨️', text: '雨夹雪' },
  323: { icon: '❄️', text: '小雪' },
  326: { icon: '❄️', text: '小雪' },
  329: { icon: '❄️', text: '中雪' },
  332: { icon: '❄️', text: '中雪' },
  335: { icon: '❄️', text: '大雪' },
  338: { icon: '❄️', text: '大雪' },
  350: { icon: '🌨️', text: '冰粒' },
  353: { icon: '🌧️', text: '阵雨' },
  356: { icon: '🌧️', text: '大阵雨' },
  359: { icon: '🌧️', text: '暴雨' },
  362: { icon: '🌨️', text: '雨夹雪' },
  365: { icon: '🌨️', text: '雨夹雪' },
  368: { icon: '❄️', text: '阵雪' },
  371: { icon: '❄️', text: '大雪' },
  374: { icon: '🌨️', text: '冰粒' },
  377: { icon: '🌨️', text: '冰粒' },
  386: { icon: '⛈️', text: '雷阵雨' },
  389: { icon: '⛈️', text: '大雷雨' },
  392: { icon: '⛈️', text: '雷阵雪' },
  395: { icon: '⛈️', text: '大雷雪' },
};

// open-meteo 天气代码 → emoji 映射 (备用源2)
const OPENMETEO_ICONS = {
  0:  { icon: '☀️', text: '晴' },
  1:  { icon: '🌤️', text: '多云' },
  2:  { icon: '⛅', text: '阴' },
  3:  { icon: '☁️', text: '阴天' },
  45: { icon: '🌫️', text: '雾' },
  48: { icon: '🌫️', text: '雾凇' },
  51: { icon: '🌦️', text: '毛毛雨' },
  53: { icon: '🌦️', text: '小雨' },
  55: { icon: '🌧️', text: '中雨' },
  61: { icon: '🌦️', text: '小雨' },
  63: { icon: '🌧️', text: '中雨' },
  65: { icon: '🌧️', text: '大雨' },
  71: { icon: '❄️', text: '小雪' },
  73: { icon: '❄️', text: '中雪' },
  75: { icon: '❄️', text: '大雪' },
  80: { icon: '🌦️', text: '阵雨' },
  81: { icon: '🌧️', text: '中阵雨' },
  82: { icon: '🌧️', text: '大阵雨' },
  85: { icon: '❄️', text: '小雪' },
  86: { icon: '❄️', text: '大雪' },
  95: { icon: '⛈️', text: '雷雨' },
  96: { icon: '⛈️', text: '雷雨伴冰雹' },
  99: { icon: '⛈️', text: '大雷雨伴冰雹' },
};

// ============================================================
// AQI 颜色映射 (中国国标)
// ============================================================
function getAqiColor(aqi) {
  if (aqi <= 50)  return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

// ============================================================
// 工具函数
// ============================================================

/** 带超时的 fetch，返回解析后的 JSON */
function fetchWithTimeout(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);

    fetch(url, { signal: controller.signal, cache: 'no-cache' })
      .then(r => {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(d => {
        clearTimeout(timer);
        resolve(d);
      })
      .catch(e => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** 重试一次：首次失败后等待 2s 再试 */
async function retryOnce(fn, timeoutMs) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  } catch (e) {
    console.warn('[Weather] 第1次失败，2s后重试:', e.message);
    await new Promise(r => setTimeout(r, 2000));
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  }
}

/** 获取 GPS 坐标 */
function getGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation 不支持'));
    navigator.geolocation.getCurrentPosition(
      p => {
        console.log('[Weather] GPS:', p.coords.latitude.toFixed(4), p.coords.longitude.toFixed(4));
        resolve({ lat: p.coords.latitude, lon: p.coords.longitude });
      },
      e => reject(new Error(e.message)),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  });
}

// ============================================================
// 缓存
// ============================================================
function cacheWeather(weather) {
  try {
    localStorage.setItem('weather_cache', JSON.stringify({ data: weather, time: Date.now() }));
  } catch (e) { /* 静默失败 */ }
}

function getCachedWeather() {
  try {
    const raw = JSON.parse(localStorage.getItem('weather_cache') || 'null');
    if (!raw || !raw.data || Date.now() - raw.time > WEATHER_CONFIG.cacheTTL) return null;
    return raw.data;
  } catch (e) { return null; }
}

// ============================================================
// 数据源1: 和风天气 (主力) - 自动探测可用Host
// ============================================================

// 探测可用的和风Host (用户专属 API Host)
async function detectHefengHost() {
  if (WEATHER_CONFIG.hefengHost) return WEATHER_CONFIG.hefengHost;

  // 用户提供的专属API Host (验证可用)
  const hosts = ['nk7fc3rumq.re.qweatherapi.com', 'api.qweather.com', 'devapi.qweather.com'];
  const loc = `${WEATHER_CONFIG.defaultLon},${WEATHER_CONFIG.defaultLat}`;

  for (const host of hosts) {
    try {
      const url = `https://${host}/v7/weather/now?location=${loc}&key=${WEATHER_CONFIG.hefengKey}`;
      const data = await fetchWithTimeout(url, 5000);
      if (data && data.code === '200') {
        console.log('[Weather] HeFeng host OK:', host);
        WEATHER_CONFIG.hefengHost = host;
        return host;
      } else {
        console.warn('[Weather] host', host, 'code=' + (data && data.code));
      }
    } catch (e) {
      console.warn('[Weather] host', host, 'failed:', e.message);
    }
  }
  throw new Error('和风所有Host不可用');
}

async function fetchFromHeFeng(lat, lon) {
  const host = await detectHefengHost();
  const baseUrl = `https://${host}/v7`;
  const loc = `${lon.toFixed(2)},${lat.toFixed(2)}`;
  const key = WEATHER_CONFIG.hefengKey;

  // 关键: 用 allSettled 替代 all, 单接口失败不阻塞其他
  const [nowRes, hourlyRes, dailyRes, airRes, indicesRes] = await Promise.allSettled([
    fetchWithTimeout(`${baseUrl}/weather/now?location=${loc}&key=${key}`, 6000),
    fetchWithTimeout(`${baseUrl}/weather/24h?location=${loc}&key=${key}`, 6000),
    fetchWithTimeout(`${baseUrl}/weather/7d?location=${loc}&key=${key}`, 6000),
    fetchWithTimeout(`${baseUrl}/air/now?location=${loc}&key=${key}`, 6000),
    fetchWithTimeout(`${baseUrl}/indices/1d?type=1,3,5&location=${loc}&key=${key}`, 6000),
  ]);

  if (nowRes.status !== 'fulfilled' || nowRes.value.code !== '200') {
    throw new Error(`和风 now: ${nowRes.status === 'fulfilled' ? 'code=' + nowRes.value.code : nowRes.reason.message}`);
  }

  const nowData = nowRes.value;
  const n = nowData.now;
  const icon = HEFENG_ICONS[parseInt(n.icon)] || { icon: '⛅', text: n.text };

  // ---- hourly ----
  const nowHour = new Date().getHours();
  const todayStr = new Date().toISOString().substring(0, 10);
  const hourly = [];

  if (hourlyRes.status === 'fulfilled' && hourlyRes.value.code === '200') {
    (hourlyRes.value.hourly || []).forEach(h => {
      const hour = parseInt(h.fxTime.substring(11, 13));
      const dateStr = h.fxTime.substring(0, 10);
      const isToday = dateStr === todayStr;

      // 跳过今天已经过去的时段
      if (isToday && hour <= nowHour) return;
      // 明天只保留关键时段
      if (!isToday && ![6, 9, 12, 15, 18, 21].includes(hour)) return;

      const hIcon = HEFENG_ICONS[parseInt(h.icon)] || { icon: '⛅', text: h.text };
      hourly.push({
        time: isToday ? `${hour}:00` : `明天${hour}:00`,
        temp: parseInt(h.temp),
        icon: hIcon.icon,
        desc: h.text,
        tomorrow: !isToday,
      });
    });
  }

  // ---- daily ----
  const daily = [];
  if (dailyRes.status === 'fulfilled' && dailyRes.value.code === '200') {
    (dailyRes.value.daily || []).forEach(d => {
      daily.push({
        date: d.fxDate.substring(5),
        max: parseInt(d.tempMax),
        min: parseInt(d.tempMin),
        icon: (HEFENG_ICONS[parseInt(d.iconDay)] || { icon: '⛅' }).icon,
        sunrise: d.sunrise,
        sunset: d.sunset,
      });
    });
  }

  // ---- air ---- 空气质量 - 可选, 免费Key可能没权限, 失败时跳过
  let air = null;
  if (airRes.status === 'fulfilled' && airRes.value.code === '200' && airRes.value.now) {
    air = {
      aqi: parseInt(airRes.value.now.aqi),
      level: airRes.value.now.level,
      category: airRes.value.now.category,
      primary: airRes.value.now.primary || '无',
      pm25: parseFloat(airRes.value.now.pm2p5),
      pm10: parseFloat(airRes.value.now.pm10),
    };
  } else if (airRes.status === 'fulfilled') {
    console.warn('[Weather] 和风 air 不可用: code=' + airRes.value.code);
  } else {
    console.warn('[Weather] 和风 air 失败:', airRes.reason.message);
  }

  // ---- indices ---- 生活指数 - 可选
  let indices = [];
  if (indicesRes.status === 'fulfilled' && indicesRes.value.code === '200' && indicesRes.value.daily) {
    indices = (indicesRes.value.daily || []).map(i => ({
      name: i.name,
      category: i.category,
      text: i.text,
    }));
  } else if (indicesRes.status === 'fulfilled') {
    console.warn('[Weather] 和风 indices 不可用: code=' + indicesRes.value.code);
  } else {
    console.warn('[Weather] 和风 indices 失败:', indicesRes.reason.message);
  }

  return {
    location: { city: WEATHER_CONFIG.defaultCity, lat, lon },
    current: {
      temp: parseInt(n.temp),
      feelsLike: parseInt(n.feelsLike),
      humidity: parseInt(n.humidity),
      desc: icon.text,
      icon: icon.icon,
      windDir: n.windDir,
      windScale: n.windScale,
      vis: n.vis,
    },
    hourly,
    daily,
    air,
    indices,
  };
}

// ============================================================
// 数据源2: wttr.in (备用)
// ============================================================
async function fetchFromWttr(lat, lon) {
  let url;
  if (lat !== undefined && lon !== undefined) {
    url = `https://wttr.in/${lat},${lon}?format=j1`;
  } else {
    url = 'https://wttr.in/?format=j1';
  }

  const raw = await fetchWithTimeout(url, 10000);
  if (!raw || !raw.current_condition || !raw.current_condition[0]) {
    throw new Error('wttr.in 数据异常');
  }

  const area = (raw.nearest_area && raw.nearest_area[0]) || {};
  const cityName = area.areaName?.[0]?.value || area.region?.[0]?.value || WEATHER_CONFIG.defaultCity;
  const areaLat = parseFloat(area.latitude) || lat || WEATHER_CONFIG.defaultLat;
  const areaLon = parseFloat(area.longitude) || lon || WEATHER_CONFIG.defaultLon;

  const cur = raw.current_condition[0];
  const wcode = parseInt(cur.weatherCode) || 113;
  const wmo = WWO_CODES[wcode] || { icon: '⛅', text: cur.weatherDesc?.[0]?.value || '多云' };

  const current = {
    temp: parseInt(cur.temp_C),
    feelsLike: parseInt(cur.FeelsLikeC) || parseInt(cur.temp_C),
    humidity: parseInt(cur.humidity),
    desc: wmo.text,
    icon: wmo.icon,
    windDir: cur.winddir16Point || '',
    windScale: parseInt(cur.windSpeed) || 0,
    vis: cur.visibility || '',
  };

  // ---- hourly ----
  const nowHour = new Date().getHours();
  const nowDay = new Date().getDate();
  const hourly = [];

  for (const day of (raw.weather || [])) {
    const dayDate = new Date(day.date);
    const isToday = dayDate.getDate() === nowDay;
    for (const h of (day.hourly || [])) {
      const hTime = parseInt(h.time) / 100;
      if (isToday && hTime <= nowHour) continue;
      if (!isToday && ![6, 9, 12, 15, 18, 21].includes(hTime)) continue;
      const hcode = parseInt(h.weatherCode) || 113;
      const hwmo = WWO_CODES[hcode] || { icon: '⛅', text: '' };
      hourly.push({
        time: isToday ? `${hTime}:00` : `明天${hTime}:00`,
        temp: parseInt(h.tempC),
        icon: hwmo.icon,
        desc: hwmo.text,
        tomorrow: !isToday,
      });
    }
  }

  // ---- daily ----
  const daily = (raw.weather || []).slice(0, 7).map(day => ({
    date: day.date.substring(5),
    max: parseInt(day.maxtempC),
    min: parseInt(day.mintempC),
    icon: (WWO_CODES[parseInt(day.hourly?.[4]?.weatherCode) || 113] || { icon: '⛅' }).icon,
  }));

  return {
    location: { city: cityName, lat: areaLat, lon: areaLon },
    current,
    hourly,
    daily,
    air: null,
    indices: [],
  };
}

// ============================================================
// 数据源3: open-meteo (备用)
// ============================================================
async function fetchFromOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
    `&timezone=Asia/Shanghai&forecast_days=7`;

  const data = await fetchWithTimeout(url, 10000);
  if (!data || !data.current) throw new Error('open-meteo 数据异常');

  const wc = data.current.weather_code;
  const wmo = OPENMETEO_ICONS[wc] || { icon: '⛅', text: '多云' };

  // ---- hourly ----
  const nowHour = new Date().getHours();
  const hourly = [];

  if (data.hourly) {
    // 今天剩余
    for (let i = nowHour + 1; i < 24; i++) {
      const idx = i - nowHour - 1;
      if (idx < data.hourly.time.length) {
        const hw = OPENMETEO_ICONS[data.hourly.weather_code[idx]] || { icon: '⛅' };
        hourly.push({
          time: `${i}:00`,
          temp: Math.round(data.hourly.temperature_2m[idx]),
          icon: hw.icon,
          desc: hw.text || '',
          tomorrow: false,
        });
      }
    }
    // 明天关键时段
    [6, 9, 12, 15, 18, 21].forEach(h => {
      const idx = 24 - nowHour - 1 + h;
      if (idx >= 0 && idx < data.hourly.time.length) {
        const hw = OPENMETEO_ICONS[data.hourly.weather_code[idx]] || { icon: '⛅' };
        hourly.push({
          time: `明天${h}:00`,
          temp: Math.round(data.hourly.temperature_2m[idx]),
          icon: hw.icon,
          desc: hw.text || '',
          tomorrow: true,
        });
      }
    });
  }

  // ---- daily ----
  const daily = [];
  if (data.daily) {
    for (let i = 0; i < data.daily.time.length; i++) {
      daily.push({
        date: data.daily.time[i].substring(5),
        max: Math.round(data.daily.temperature_2m_max[i]),
        min: Math.round(data.daily.temperature_2m_min[i]),
        icon: (OPENMETEO_ICONS[data.daily.weather_code[i]] || { icon: '⛅' }).icon,
        sunrise: data.daily.sunrise ? data.daily.sunrise[i] : undefined,
        sunset: data.daily.sunset ? data.daily.sunset[i] : undefined,
      });
    }
  }

  return {
    location: { city: WEATHER_CONFIG.defaultCity, lat, lon },
    current: {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature || data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      desc: wmo.text,
      icon: wmo.icon,
      windDir: '',
      windScale: Math.round(data.current.wind_speed_10m || 0),
      vis: '',
    },
    hourly,
    daily,
    air: null,
    indices: [],
  };
}

// ============================================================
// 渲染
// ============================================================

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

function renderWeather(weather) {
  if (!weather || !weather.current) return;

  const loc = weather.location || {};
  const cur = weather.current;

  setText('weather-city', '📍 ' + (loc.city || WEATHER_CONFIG.defaultCity));
  setText('weather-icon', cur.icon);
  setText('weather-temp', cur.temp + '°');
  setText('weather-condition', cur.desc);
  setText('weather-feels', cur.feelsLike != null ? '体感 ' + cur.feelsLike + '°' : '');

  if (weather.daily && weather.daily.length > 0) {
    setText('weather-range', weather.daily[0].max + '° / ' + weather.daily[0].min + '°');
  } else {
    setText('weather-range', '');
  }

  renderHourly(weather.hourly || []);

  // AQI
  if (weather.air) {
    setText('weather-aqi', weather.air.aqi + ' ' + weather.air.category);
    if (weather.air.primary && weather.air.primary !== 'NA') {
      setText('weather-aqi-primary', '· ' + weather.air.primary);
    } else {
      setText('weather-aqi-primary', '');
    }
    const aqiEl = document.getElementById('weather-aqi');
    if (aqiEl) aqiEl.style.color = getAqiColor(weather.air.aqi);
  } else {
    setText('weather-aqi', '');
    setText('weather-aqi-primary', '');
  }

  renderIndices(weather.indices || []);
  renderDaily(weather.daily || []);
}

function renderHourly(hourly) {
  const el = document.getElementById('weather-forecast');
  if (!el) return;
  const items = hourly.slice(0, 6);
  el.innerHTML = items.map(it =>
    `<div class="forecast-item${it.tomorrow ? ' forecast-tomorrow' : ''}">` +
      `<div class="forecast-time">${it.time}</div>` +
      `<div class="forecast-icon">${it.icon}</div>` +
      `<div class="forecast-temp">${it.temp}°</div>` +
      `<div class="forecast-desc">${it.desc || ''}</div>` +
    `</div>`
  ).join('');
}

function renderIndices(indices) {
  const el = document.getElementById('weather-indices');
  if (!el) return;
  if (!indices || indices.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = indices.map(idx =>
    `<div class="index-item">` +
      `<span class="index-name">${idx.name}:</span>` +
      `<span class="index-category">${idx.category}</span>` +
    `</div>`
  ).join('');
}

function renderDaily(daily) {
  const el = document.getElementById('weather-daily');
  if (!el) return;
  if (!daily || daily.length <= 1) {
    el.innerHTML = '';
    return;
  }
  const items = daily.slice(1, 7);
  el.innerHTML = items.map(d =>
    `<div class="daily-item">` +
      `<div class="daily-date">${d.date}</div>` +
      `<div class="daily-icon">${d.icon}</div>` +
      `<div class="daily-temp">${d.max}°/${d.min}°</div>` +
    `</div>`
  ).join('');
}

function showErrorState(errors) {
  setText('weather-city', '📍 ' + WEATHER_CONFIG.defaultCity);
  setText('weather-temp', '--°');
  setText('weather-condition', (errors && errors[0]) || '数据获取失败');
  setText('weather-range', '');
  setText('weather-feels', '');
  setText('weather-aqi', '');
  setText('weather-aqi-primary', '');
  const fEl = document.getElementById('weather-forecast');
  if (fEl) fEl.innerHTML = '';
  const iEl = document.getElementById('weather-indices');
  if (iEl) iEl.innerHTML = '';
  const dEl = document.getElementById('weather-daily');
  if (dEl) dEl.innerHTML = '';
}

// ============================================================
// 主流程
// ============================================================

async function loadWeather(coords) {
  const lat = coords?.lat || WEATHER_CONFIG.defaultLat;
  const lon = coords?.lon || WEATHER_CONFIG.defaultLon;
  const errors = [];

  // 1) 和风天气 主力 (用户专属Host, air/now是付费接口已用allSettled容错)
  try {
    const weather = await retryOnce(() => fetchFromHeFeng(lat, lon), 8000);
    if (weather) {
      console.log('[Weather] 和风 success:', weather.current.temp + '°', 'air=' + (weather.air ? 'yes' : 'no'));
      cacheWeather(weather);
      renderWeather(weather);
      return;
    }
  } catch (e) { errors.push('和风: ' + e.message); console.warn('[Weather] 和风失败:', e.message); }

  // 2) wttr.in 备用
  try {
    const weather = await retryOnce(() => fetchFromWttr(coords?.lat, coords?.lon), 10000);
    if (weather) {
      console.log('[Weather] wttr.in success:', weather.location.city, weather.current.temp + '°');
      cacheWeather(weather);
      renderWeather(weather);
      return;
    }
  } catch (e) { errors.push('wttr: ' + e.message); console.warn('[Weather] wttr失败:', e.message); }

  // 3) open-meteo 备用
  try {
    const weather = await retryOnce(() => fetchFromOpenMeteo(lat, lon), 10000);
    if (weather) {
      console.log('[Weather] open-meteo success:', weather.current.temp + '°');
      cacheWeather(weather);
      renderWeather(weather);
      return;
    }
  } catch (e) { errors.push('open-meteo: ' + e.message); console.warn('[Weather] open-meteo失败:', e.message); }

  console.error('[Weather] 全部数据源失败:', errors);
  showErrorState(errors);
}

function initWeather() {
  console.log('[Weather] Init (和风天气国内版)');

  // 先渲染缓存
  const cached = getCachedWeather();
  if (cached) {
    renderWeather(cached);
    console.log('[Weather] Loaded from cache');
  }

  // 立即用默认坐标加载
  loadWeather();

  // 0.5s 后尝试 GPS 优化
  setTimeout(async () => {
    try {
      const gps = await Promise.race([
        getGPSLocation(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 5000)),
      ]);
      if (gps) {
        console.log('[Weather] GPS acquired, reloading...');
        loadWeather(gps);
      }
    } catch (e) {
      console.log('[Weather] GPS unavailable');
    }
  }, 500);

  // 定时刷新
  setInterval(() => loadWeather(), WEATHER_CONFIG.updateInterval);
}

// 导出到全局
window.initWeather = initWeather;