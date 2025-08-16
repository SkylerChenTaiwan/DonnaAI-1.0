# Phase 1 程式碼重構建議報告

**日期**: 2025-01-16
**Agent**: code-refactor-optimizer
**檢查範圍**: DynamicFieldAnalyzer.ts

## 整體評分：6.5/10

## 關鍵問題

### 🔴 Critical（必須修復）

1. **inferDataType 方法複雜度過高**
   - Cyclomatic Complexity > 30
   - 建議：使用策略模式拆分

2. **記憶體使用問題**
   - `countDuplicates` 使用 JSON.stringify 可能爆炸
   - 建議：使用 hash 函數

3. **效能瓶頸**
   - O(n²) 複雜度問題
   - 建議：批次處理與串流

### 🟡 High Priority

1. **重複的模式匹配邏輯**
   - 建議：抽取為獨立服務

2. **缺乏單元測試**
   - 建議：達到 80% 覆蓋率

## 重構方案

### 1. 策略模式重構 inferDataType

```typescript
interface TypeDetectionStrategy {
  detect(sample: string): boolean;
  getConfidence(samples: string[]): number;
  getType(): FieldDataType;
}

class EmailDetectionStrategy implements TypeDetectionStrategy {
  private pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  detect(sample: string): boolean {
    return this.pattern.test(sample);
  }
  
  getConfidence(samples: string[]): number {
    const matches = samples.filter(s => this.detect(s));
    return matches.length / samples.length;
  }
  
  getType(): FieldDataType {
    return 'email';
  }
}
```

### 2. 優化重複檢測

```typescript
private createRowFingerprint(row: any[]): string {
  let hash = 0;
  for (const value of row) {
    const str = String(value ?? '');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
  }
  return hash.toString(36);
}
```

### 3. 實作串流處理

```typescript
async* analyzeCSVStream(
  headers: string[],
  dataStream: AsyncIterable<any[]>
): AsyncGenerator<FieldAnalysis> {
  const buffer: any[][] = [];
  const bufferSize = 100;
  
  for await (const row of dataStream) {
    buffer.push(row);
    
    if (buffer.length >= bufferSize) {
      yield await this.analyzeBuffer(headers, buffer);
      buffer.length = 0;
    }
  }
}
```

## 效能優化預期成果

| 優化項目 | 預期改善 |
|---------|---------|
| 記憶體使用 | -70% |
| 重複檢測速度 | 5-10x |
| 大檔案處理 | 支援 GB 級 |
| 平行處理 | 2-4x (多核心) |
| 快取命中 | 90% 速度提升 |

## 實施優先順序

1. **立即（本週）**
   - 修復 inferDataType 複雜度
   - 優化重複檢測

2. **短期（2週內）**
   - 實作串流處理
   - 加入單元測試

3. **中期（1個月）**
   - 完整策略模式重構
   - 效能優化與快取

## 預期成果
實施後程式碼品質評分：**8.5-9/10**