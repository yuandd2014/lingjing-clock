/**
 * 时钟模块 - 高精度时间显示
 * 支持时分秒、日期
 */

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 主时钟
  document.getElementById('clock').textContent = `${hours}:${minutes}`;

  // 秒数
  document.getElementById('clock-seconds').textContent = seconds;

  // 日期
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  document.getElementById('clock-date').textContent =
    `${month}月${date}日 ${weekdays[now.getDay()]}`;
}

// 每秒更新一次
setInterval(updateClock, 1000);
updateClock();
