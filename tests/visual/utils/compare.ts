/**
 * 視覺測試圖片比較工具
 * 提供像素級圖片比較和差異檢測功能
 */

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

// 比較配置介面
export interface ComparisonConfig {
  threshold: number;           // 差異閾值 (0-1)
  includeAA: boolean;         // 是否包含抗鋸齒檢查
  alpha: number;              // Alpha 通道權重
  aaColor: [number, number, number]; // 抗鋸齒像素顏色
  diffColor: [number, number, number]; // 差異像素顏色
  diffColorAlt?: [number, number, number]; // 替代差異顏色
  createDiffImage: boolean;    // 是否建立差異圖片
  maskColor?: [number, number, number]; // 遮罩顏色
}

// 比較結果介面
export interface ComparisonResult {
  match: boolean;              // 是否匹配
  pixelDiffCount: number;      // 不同像素數量
  pixelDiffPercentage: number; // 不同像素百分比
  totalPixels: number;         // 總像素數
  diffImage?: Buffer;          // 差異圖片 buffer
  diffImagePath?: string;      // 差異圖片路徑
  metadata: {
    baselineSize: { width: number; height: number };
    actualSize: { width: number; height: number };
    threshold: number;
    comparisonTime: number;    // 比較耗時 (ms)
  };
}

// 區域遮罩介面
export interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
}

// 圖片比較工具類別
export class ImageComparator {
  private config: ComparisonConfig;

  constructor(config: Partial<ComparisonConfig> = {}) {
    this.config = {
      threshold: 0.2,
      includeAA: false,
      alpha: 0.1,
      aaColor: [255, 255, 0],      // 黃色
      diffColor: [255, 0, 255],    // 洋紅色
      createDiffImage: true,
      ...config,
    };
  }

  /**
   * 比較兩張圖片
   */
  async compareImages(
    baselinePath: string,
    actualPath: string,
    outputDiffPath?: string,
    customConfig?: Partial<ComparisonConfig>
  ): Promise<ComparisonResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };

    try {
      // 載入圖片
      const [baselineBuffer, actualBuffer] = await Promise.all([
        fs.readFile(baselinePath),
        fs.readFile(actualPath),
      ]);

      return this.compareBuffers(baselineBuffer, actualBuffer, outputDiffPath, config);
    } catch (error) {
      throw new Error(`圖片比較失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 比較兩個圖片 Buffer
   */
  async compareBuffers(
    baselineBuffer: Buffer,
    actualBuffer: Buffer,
    outputDiffPath?: string,
    customConfig?: Partial<ComparisonConfig>
  ): Promise<ComparisonResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };

    try {
      // 解析 PNG 圖片
      const baseline = PNG.sync.read(baselineBuffer);
      const actual = PNG.sync.read(actualBuffer);

      // 檢查尺寸
      if (baseline.width !== actual.width || baseline.height !== actual.height) {
        throw new Error(
          `圖片尺寸不匹配: 基線 ${baseline.width}x${baseline.height}, 實際 ${actual.width}x${actual.height}`
        );
      }

      const { width, height } = baseline;
      const totalPixels = width * height;

      // 創建差異圖片
      const diff = new PNG({ width, height });

      // 執行像素比較
      const pixelDiffCount = pixelmatch(
        baseline.data,
        actual.data,
        diff.data,
        width,
        height,
        {
          threshold: config.threshold,
          includeAA: config.includeAA,
          alpha: config.alpha,
          aaColor: config.aaColor,
          diffColor: config.diffColor,
          diffColorAlt: config.diffColorAlt,
        }
      );

      const pixelDiffPercentage = (pixelDiffCount / totalPixels) * 100;
      const match = pixelDiffCount === 0;

      let diffImage: Buffer | undefined;
      let diffImagePath: string | undefined;

      // 生成差異圖片
      if (config.createDiffImage && pixelDiffCount > 0) {
        diffImage = PNG.sync.write(diff);

        if (outputDiffPath) {
          await this.saveDiffImage(diffImage, outputDiffPath);
          diffImagePath = outputDiffPath;
        }
      }

      const comparisonTime = Date.now() - startTime;

      return {
        match,
        pixelDiffCount,
        pixelDiffPercentage,
        totalPixels,
        diffImage,
        diffImagePath,
        metadata: {
          baselineSize: { width: baseline.width, height: baseline.height },
          actualSize: { width: actual.width, height: actual.height },
          threshold: config.threshold,
          comparisonTime,
        },
      };
    } catch (error) {
      throw new Error(`Buffer 比較失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 帶遮罩的圖片比較
   */
  async compareWithMask(
    baselinePath: string,
    actualPath: string,
    maskRegions: MaskRegion[],
    outputDiffPath?: string,
    customConfig?: Partial<ComparisonConfig>
  ): Promise<ComparisonResult> {
    const config = { ...this.config, ...customConfig };

    // 載入圖片
    const [baselineBuffer, actualBuffer] = await Promise.all([
      fs.readFile(baselinePath),
      fs.readFile(actualPath),
    ]);

    // 應用遮罩
    const maskedBaseline = await this.applyMask(baselineBuffer, maskRegions);
    const maskedActual = await this.applyMask(actualBuffer, maskRegions);

    // 執行比較
    return this.compareBuffers(maskedBaseline, maskedActual, outputDiffPath, config);
  }

  /**
   * 應用遮罩到圖片
   */
  private async applyMask(imageBuffer: Buffer, maskRegions: MaskRegion[]): Promise<Buffer> {
    const image = PNG.sync.read(imageBuffer);
    const maskColor = this.config.maskColor || [128, 128, 128]; // 預設灰色

    for (const region of maskRegions) {
      for (let y = region.y; y < region.y + region.height && y < image.height; y++) {
        for (let x = region.x; x < region.x + region.width && x < image.width; x++) {
          const idx = (image.width * y + x) << 2;
          image.data[idx] = maskColor[0];     // R
          image.data[idx + 1] = maskColor[1]; // G
          image.data[idx + 2] = maskColor[2]; // B
          // 保持 alpha 不變
        }
      }
    }

    return PNG.sync.write(image);
  }

  /**
   * 批量比較圖片
   */
  async batchCompare(
    comparisons: Array<{
      id: string;
      baselinePath: string;
      actualPath: string;
      outputDiffPath?: string;
      config?: Partial<ComparisonConfig>;
    }>
  ): Promise<Array<{ id: string; result: ComparisonResult; error?: string }>> {
    const results = [];

    for (const comparison of comparisons) {
      try {
        const result = await this.compareImages(
          comparison.baselinePath,
          comparison.actualPath,
          comparison.outputDiffPath,
          comparison.config
        );

        results.push({
          id: comparison.id,
          result,
        });
      } catch (error) {
        results.push({
          id: comparison.id,
          result: {} as ComparisonResult, // 提供預設值避免錯誤
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * 生成比較統計
   */
  generateComparisonStats(results: ComparisonResult[]): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    averageDifference: number;
    maxDifference: number;
    minDifference: number;
  } {
    const total = results.length;
    const passed = results.filter(r => r.match).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    const differences = results.map(r => r.pixelDiffPercentage);
    const averageDifference = differences.reduce((a, b) => a + b, 0) / differences.length || 0;
    const maxDifference = Math.max(...differences, 0);
    const minDifference = Math.min(...differences, 0);

    return {
      total,
      passed,
      failed,
      passRate,
      averageDifference,
      maxDifference,
      minDifference,
    };
  }

  /**
   * 保存差異圖片
   */
  private async saveDiffImage(diffBuffer: Buffer, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(outputPath, diffBuffer);
  }

  /**
   * 建立側邊比較圖片
   */
  async createSideBySideComparison(
    baselinePath: string,
    actualPath: string,
    diffPath: string,
    outputPath: string
  ): Promise<void> {
    const [baselineBuffer, actualBuffer, diffBuffer] = await Promise.all([
      fs.readFile(baselinePath),
      fs.readFile(actualPath),
      fs.readFile(diffPath),
    ]);

    const baseline = PNG.sync.read(baselineBuffer);
    const actual = PNG.sync.read(actualBuffer);
    const diff = PNG.sync.read(diffBuffer);

    const { width, height } = baseline;
    const combined = new PNG({ width: width * 3, height: height });

    // 複製基線圖片（左側）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (width * y + x) << 2;
        const dstIdx = ((width * 3) * y + x) << 2;
        
        combined.data[dstIdx] = baseline.data[srcIdx];
        combined.data[dstIdx + 1] = baseline.data[srcIdx + 1];
        combined.data[dstIdx + 2] = baseline.data[srcIdx + 2];
        combined.data[dstIdx + 3] = baseline.data[srcIdx + 3];
      }
    }

    // 複製實際圖片（中間）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (width * y + x) << 2;
        const dstIdx = ((width * 3) * y + (x + width)) << 2;
        
        combined.data[dstIdx] = actual.data[srcIdx];
        combined.data[dstIdx + 1] = actual.data[srcIdx + 1];
        combined.data[dstIdx + 2] = actual.data[srcIdx + 2];
        combined.data[dstIdx + 3] = actual.data[srcIdx + 3];
      }
    }

    // 複製差異圖片（右側）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (width * y + x) << 2;
        const dstIdx = ((width * 3) * y + (x + width * 2)) << 2;
        
        combined.data[dstIdx] = diff.data[srcIdx];
        combined.data[dstIdx + 1] = diff.data[srcIdx + 1];
        combined.data[dstIdx + 2] = diff.data[srcIdx + 2];
        combined.data[dstIdx + 3] = diff.data[srcIdx + 3];
      }
    }

    const combinedBuffer = PNG.sync.write(combined);
    await this.saveDiffImage(combinedBuffer, outputPath);
  }

  /**
   * 清理舊的差異圖片
   */
  async cleanupOldDiffs(diffDir: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(diffDir);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(diffDir, file);
        const stat = await fs.stat(filepath);
        
        if (now - stat.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      // 忽略清理錯誤
      console.warn('清理舊差異圖片時發生錯誤:', error);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ComparisonConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 工具函數
export const createImageComparator = (config?: Partial<ComparisonConfig>): ImageComparator => {
  return new ImageComparator(config);
};

// 預設導出
export default ImageComparator;