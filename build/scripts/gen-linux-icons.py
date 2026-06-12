"""
Linux icon 生成器 (v1.4.0)
- 复用 v1.3.1 极光紫配色 (AURORA_TOP/BOT/DEEP) + 顶部高光 + iOS 26 圆角矩形
- 产物: 7 个 PNG (16/32/48/64/128/256/512) + 1 个 SVG (可选, electron-builder 支持)
- 跟 build/scripts/gen-brand-assets.py 配色严格一致, 但作为正方形 icon 而非 NSIS 头图
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ===== 调色板 (跟 v1.3.1 brand assets 一致) =====
AURORA_TOP = (167, 139, 250)
AURORA_BOT = (196, 181, 253)
AURORA_DEEP = (124, 96, 230)
HIGHLIGHT = (255, 255, 255)
TEXT_LIGHT = (255, 255, 255)

# ===== 字体 (跟 brand assets 候选列表一致) =====
FONT_CANDIDATES = [
    r'C:\Windows\Fonts\msyhbd.ttc',
    r'C:\Windows\Fonts\msyh.ttc',
    r'C:\Windows\Fonts\simhei.ttf',
    r'C:\Windows\Fonts\msjhbd.ttc',
    r'C:\Windows\Fonts\arialbd.ttf',
    r'C:\Windows\Fonts\arial.ttf',
]

def find_font():
    for f in FONT_CANDIDATES:
        if os.path.exists(f):
            return f
    return None

FONT_PATH = find_font()
print(f'FONT_PATH: {FONT_PATH}')

def load_font(size):
    if FONT_PATH:
        try:
            return ImageFont.truetype(FONT_PATH, size)
        except Exception as e:
            print(f'font load fail: {e}')
    return ImageFont.load_default()

# ===== 工具 =====
def rounded_mask(size, radius):
    w, h = size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    return mask

def vgradient(size, top, bot):
    w, h = size
    img = Image.new('RGB', (w, h), top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        d.line([(0, y), (w, y)], fill=(r, g, b))
    return img

def make_icon(size):
    """生成 size×size 的正方形 icon, iOS 26 圆角 (22.37% radius) + 极光紫渐变 + 顶部高光 + 居中「灵」字"""
    # 1. 圆角矩形 (iOS 26 标准: 22.37% radius)
    radius = int(size * 0.2237)
    mask = rounded_mask((size, size), radius)

    # 2. 极光紫纵向渐变
    gradient = vgradient((size, size), AURORA_TOP, AURORA_BOT)

    # 3. 顶部高光 (iOS 26 风格: 上半部 30% 加亮, 模拟光从顶部照下来)
    highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.rectangle([0, 0, size, int(size * 0.45)], fill=(255, 255, 255, 38))
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=size * 0.04))

    # 4. 居中「灵」字 (Bold, size 的 52%)
    text_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    td = ImageDraw.Draw(text_layer)
    font_size = int(size * 0.52)
    font = load_font(font_size)
    # 居中
    bbox = td.textbbox((0, 0), '灵', font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (size - text_w) // 2 - bbox[0]
    text_y = (size - text_h) // 2 - bbox[1] - int(size * 0.04)  # 视觉居中微调
    # 字阴影 (深紫)
    shadow_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    sd.text((text_x + int(size * 0.012), text_y + int(size * 0.012)), '灵', font=font, fill=(124, 96, 230, 60))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=size * 0.008))
    # 主字
    td.text((text_x, text_y), '灵', font=font, fill=(255, 255, 255, 255))

    # 5. 合成
    final = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final.paste(gradient, (0, 0))
    final.alpha_composite(shadow_layer)
    final.alpha_composite(highlight)
    final.alpha_composite(text_layer)

    # 6. 应用圆角 mask
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(final, (0, 0), mask)
    return out

# ===== 主流程 =====
if __name__ == '__main__':
    out_dir = 'd:/桌面时钟/build/linux'
    os.makedirs(out_dir, exist_ok=True)

    sizes = [16, 32, 48, 64, 128, 256, 512]
    for s in sizes:
        img = make_icon(s)
        path = f'{out_dir}/icon-{s}.png'
        img.save(path, 'PNG', optimize=True)
        size_kb = os.path.getsize(path) / 1024
        print(f'  {s}x{s} -> {path}  ({size_kb:.1f} KB)')

    print('OK: 7 icon sizes generated')
