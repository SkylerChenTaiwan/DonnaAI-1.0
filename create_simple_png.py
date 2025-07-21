#!/usr/bin/env python3
"""創建最簡單的 PNG 圖片（純色）"""
import struct
import zlib
import os

def create_minimal_png():
    """創建一個最小的 PNG 檔案（紅色方塊）"""
    # PNG 檔頭
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (Image Header)
    width = 100
    height = 100
    bit_depth = 8
    color_type = 2  # RGB
    ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, color_type, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (Image Data) - 純紅色
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type: None
        for x in range(width):
            raw_data += b'\xff\x00\x00'  # RGB: 紅色
    
    compressed_data = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed_data)
    idat_chunk = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    # 組合所有 chunks
    png_data = png_header + ihdr_chunk + idat_chunk + iend_chunk
    
    # 儲存檔案
    output_path = os.path.join(os.path.dirname(__file__), 'assets', 'test', 'minimal-red.png')
    with open(output_path, 'wb') as f:
        f.write(png_data)
    
    print(f"最小 PNG 已創建: {output_path}")
    return output_path

def create_base64_test_png():
    """創建一個小的 PNG 並轉換為 base64"""
    from PIL import Image
    import base64
    import io
    
    # 創建 50x50 的綠色圖片
    img = Image.new('RGB', (50, 50), color='#2ecc71')
    
    # 轉換為 base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    # 儲存 base64 字串
    output_path = os.path.join(os.path.dirname(__file__), 'assets', 'test', 'base64-test.txt')
    with open(output_path, 'w') as f:
        f.write(f"data:image/png;base64,{img_base64}")
    
    print(f"Base64 PNG 已創建: {output_path}")
    print(f"Base64 長度: {len(img_base64)} 字元")
    
    return img_base64

if __name__ == "__main__":
    create_minimal_png()
    create_base64_test_png()