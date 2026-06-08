/**
 * 虚拟形象模块
 * 支持图片加载、错误处理、CSS动画
 */

function initCharacter() {
  const img = document.getElementById('character-img');
  if (!img) return;

  img.addEventListener('error', () => {
    img.style.display = 'none';
    const layer = document.querySelector('.character-layer');
    const placeholder = document.createElement('div');
    placeholder.className = 'character-placeholder';
    placeholder.innerHTML = `
      <div style="font-size:120px;opacity:0.3;">👤</div>
      <div style="font-size:14px;opacity:0.5;margin-top:12px;text-align:center;">
        请放入角色图片<br>assets/character.png
      </div>
    `;
    layer.appendChild(placeholder);
  });

  img.style.opacity = '0';
  img.addEventListener('load', () => {
    img.style.transition = 'opacity 1.5s ease';
    setTimeout(() => img.style.opacity = '1', 100);
  });
}

initCharacter();
