#!/usr/bin/env python3
"""創建測試用的 PNG 圖片"""
from PIL import Image, ImageDraw, ImageFont
import os

# 創建一個簡單的測試圖片
def create_test_png():
    # 創建 256x256 的圖片，藍色背景
    img = Image.new('RGB', (256, 256), color='#3498db')
    draw = ImageDraw.Draw(img)
    
    # 添加白色文字
    text = "TEST PNG"
    # 使用內建字體，避免字體問題
    try:
        # 嘗試獲取較大的字體
        font = ImageFont.load_default()
        # 計算文字位置（置中）
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((256 - text_width) // 2, (256 - text_height) // 2)
        draw.text(position, text, fill='white', font=font)
    except:
        # 如果字體有問題，使用預設方法
        draw.text((80, 120), text, fill='white')
    
    # 儲存為標準 PNG
    output_dir = os.path.join(os.path.dirname(__file__), 'assets', 'test')
    os.makedirs(output_dir, exist_ok=True)
    
    # 儲存不同格式的 PNG 以測試
    # 1. 標準 RGB PNG
    img.save(os.path.join(output_dir, 'test-rgb.png'), 'PNG', optimize=False)
    
    # 2. RGBA PNG（含透明通道）
    img_rgba = Image.new('RGBA', (256, 256), color=(52, 152, 219, 255))
    draw_rgba = ImageDraw.Draw(img_rgba)
    draw_rgba.text((80, 120), text, fill=(255, 255, 255, 255))
    img_rgba.save(os.path.join(output_dir, 'test-rgba.png'), 'PNG', optimize=False)
    
    # 3. 8-bit PNG（調色板模式）
    img_8bit = img.convert('P', palette=Image.ADAPTIVE, colors=256)
    img_8bit.save(os.path.join(output_dir, 'test-8bit.png'), 'PNG', optimize=False)
    
    print("測試 PNG 已創建:")
    print(f"- {output_dir}/test-rgb.png (標準 RGB)")
    print(f"- {output_dir}/test-rgba.png (含透明通道)")
    print(f"- {output_dir}/test-8bit.png (8-bit 調色板)")

if __name__ == "__main__":
    create_test_png()