/**
 * PRP-124: 實體提取引擎單元測試
 * 
 * @description 測試實體提取、驗證和標準化功能
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { EntityExtractionEngine } from '../entity-extraction';
import type { ExtractedEntity } from '../../../docs/types/ai-query-data-models';

describe('EntityExtractionEngine', () => {
  let entityEngine: EntityExtractionEngine;

  beforeEach(() => {
    entityEngine = new EntityExtractionEngine();
  });

  describe('extractEntities', () => {
    // 1. 預期使用測試
    it('should extract metric entities correctly', () => {
      const text = '這個月的營收和客戶數量';
      const entities = entityEngine.extractEntities(text);

      const metricEntities = entities.filter(e => e.type === 'metric');
      expect(metricEntities).toHaveLength(2);
      
      expect(metricEntities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: expect.any(Number)
          }),
          expect.objectContaining({
            type: 'metric',
            value: '客戶數量',
            normalizedValue: 'customer_count',
            confidence: expect.any(Number)
          })
        ])
      );
    });

    it('should extract time period entities', () => {
      const text = '過去三個月和這個月的數據';
      const entities = entityEngine.extractEntities(text);

      const timeEntities = entities.filter(e => e.type === 'time_period');
      expect(timeEntities.length).toBeGreaterThan(0);

      timeEntities.forEach(entity => {
        expect(entity.normalizedValue).toEqual(
          expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
            granularity: expect.any(String)
          })
        );
      });
    });

    it('should extract numeric threshold entities', () => {
      const text = '營收超過100萬元或成長率大於5%的資料';
      const entities = entityEngine.extractEntities(text);

      const numericEntities = entities.filter(e => e.type === 'threshold');
      expect(numericEntities.length).toBeGreaterThan(0);

      expect(numericEntities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'threshold',
            normalizedValue: expect.any(Number),
            attributes: expect.objectContaining({
              numericType: expect.stringMatching(/currency|percentage/)
            })
          })
        ])
      );
    });

    it('should extract dimension entities', () => {
      const text = '按地區和部門分組統計';
      const entities = entityEngine.extractEntities(text);

      const dimensionEntities = entities.filter(e => e.type === 'dimension');
      expect(dimensionEntities).toHaveLength(2);

      expect(dimensionEntities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'dimension',
            normalizedValue: 'region'
          }),
          expect.objectContaining({
            type: 'dimension',
            normalizedValue: 'department'
          })
        ])
      );
    });

    it('should extract comparison operators', () => {
      const text = '比較今年和去年的增長率';
      const entities = entityEngine.extractEntities(text);

      const comparisonEntities = entities.filter(e => e.type === 'comparison_operator');
      expect(comparisonEntities.length).toBeGreaterThan(0);

      expect(comparisonEntities[0]).toEqual(
        expect.objectContaining({
          type: 'comparison_operator',
          normalizedValue: 'compare'
        })
      );
    });

    it('should extract aggregation functions', () => {
      const text = '計算總和、平均值和最大值';
      const entities = entityEngine.extractEntities(text);

      const aggregationEntities = entities.filter(e => e.type === 'aggregation');
      expect(aggregationEntities.length).toBeGreaterThan(0);

      expect(aggregationEntities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ normalizedValue: 'sum' }),
          expect.objectContaining({ normalizedValue: 'avg' }),
          expect.objectContaining({ normalizedValue: 'max' })
        ])
      );
    });

    // 2. 邊界條件測試
    it('should handle empty text', () => {
      const text = '';
      const entities = entityEngine.extractEntities(text);

      expect(entities).toHaveLength(0);
    });

    it('should handle text with no recognizable entities', () => {
      const text = '隨機的文字內容沒有任何業務意義';
      const entities = entityEngine.extractEntities(text);

      // 應該回傳降級實體或空陣列
      if (entities.length > 0) {
        expect(entities[0].confidence).toBeLessThan(0.5);
      }
    });

    it('should handle text with special characters', () => {
      const text = '營收（包含稅費）> $1,000,000 !!!';
      const entities = entityEngine.extractEntities(text);

      const metricEntity = entities.find(e => e.type === 'metric');
      expect(metricEntity).toBeDefined();
      expect(metricEntity!.normalizedValue).toBe('revenue');
    });

    it('should handle overlapping entity positions', () => {
      const text = '客戶數量增長率';
      const entities = entityEngine.extractEntities(text);

      // 檢查是否有位置重疊的實體被正確處理
      const positions = entities.map(e => ({
        start: e.position?.start || 0,
        end: e.position?.end || 0
      }));

      // 檢查沒有完全重疊的位置
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const pos1 = positions[i];
          const pos2 = positions[j];
          
          if (pos1.start === pos2.start && pos1.end === pos2.end) {
            // 如果位置完全相同，應該只保留信心度最高的
            const entity1 = entities[i];
            const entity2 = entities[j];
            expect(entity1.confidence).not.toEqual(entity2.confidence);
          }
        }
      }
    });

    // 3. 失敗情況測試
    it('should handle mixed languages gracefully', () => {
      const text = 'revenue for 這個月 and customer count';
      const entities = entityEngine.extractEntities(text);

      expect(entities.length).toBeGreaterThan(0);
      
      const metricEntities = entities.filter(e => e.type === 'metric');
      expect(metricEntities.length).toBeGreaterThan(0);
    });
  });

  describe('validateEntities', () => {
    it('should validate correct entities', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'metric',
          value: '營收',
          normalizedValue: 'revenue',
          confidence: 0.9,
          position: { start: 0, end: 2 }
        },
        {
          type: 'time_period',
          value: '這個月',
          normalizedValue: {
            start: new Date(2025, 7, 1),
            end: new Date(2025, 7, 31),
            granularity: 'month'
          },
          confidence: 0.8,
          position: { start: 3, end: 6 }
        }
      ];

      const result = entityEngine.validateEntities(entities, '營收這個月');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch invalid time ranges', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'time_period',
          value: '無效時間',
          normalizedValue: {
            start: new Date(2025, 7, 31),
            end: new Date(2025, 7, 1), // 結束時間早於開始時間
            granularity: 'month'
          },
          confidence: 0.8
        }
      ];

      const result = entityEngine.validateEntities(entities, '無效時間');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('開始時間晚於結束時間')
        ])
      );
    });

    it('should catch low confidence entities', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'metric',
          value: '不確定',
          normalizedValue: 'unknown',
          confidence: 0.1 // 過低的信心度
        }
      ];

      const result = entityEngine.validateEntities(entities, '不確定的內容');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('信心度過低')
        ])
      );
    });

    it('should provide warnings for incomplete combinations', () => {
      const entities: ExtractedEntity[] = [
        {
          type: 'comparison_operator',
          value: '比較',
          normalizedValue: 'compare',
          confidence: 0.9
        }
        // 缺少時間實體進行比較
      ];

      const result = entityEngine.validateEntities(entities, '比較數據');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('比較查詢建議包含兩個時間期間')
        ])
      );
    });
  });

  describe('normalizeEntity', () => {
    it('should normalize metric entities', () => {
      const entity: ExtractedEntity = {
        type: 'metric',
        value: '業績',
        normalizedValue: undefined,
        confidence: 0.8
      };

      const normalized = entityEngine.normalizeEntity(entity);

      expect(normalized.normalizedValue).toBe('sales');
    });

    it('should normalize time entities', () => {
      const entity: ExtractedEntity = {
        type: 'time_period',
        value: '上個月',
        normalizedValue: undefined,
        confidence: 0.8
      };

      const normalized = entityEngine.normalizeEntity(entity);

      expect(normalized.normalizedValue).toEqual(
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
          granularity: 'month'
        })
      );
    });

    it('should handle normalization errors gracefully', () => {
      const entity: ExtractedEntity = {
        type: 'metric',
        value: '無法標準化的內容',
        normalizedValue: undefined,
        confidence: 0.8
      };

      const normalized = entityEngine.normalizeEntity(entity);

      // 應該返回原始實體而不是拋出錯誤
      expect(normalized).toEqual(entity);
    });
  });

  describe('context enhancement', () => {
    it('should enhance entities with user context', () => {
      const text = '這個月的業績';
      const context = {
        userRole: 'sales_manager',
        currentPage: 'dashboard'
      };

      const entities = entityEngine.extractEntities(text, context);

      const metricEntity = entities.find(e => e.type === 'metric');
      expect(metricEntity?.confidence).toBeGreaterThan(0.8);
    });

    it('should boost confidence for admin users on admin pages', () => {
      const text = '系統使用率';
      const context = {
        userRole: 'admin',
        currentPage: 'analytics'
      };

      const entities = entityEngine.extractEntities(text, context);

      const metricEntity = entities.find(e => e.type === 'metric');
      if (metricEntity) {
        expect(metricEntity.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should use previous entities for consistency', () => {
      const text = '這個月';
      const context = {
        previousEntities: [
          {
            type: 'time_period',
            value: '這個月',
            normalizedValue: { start: new Date(), end: new Date(), granularity: 'month' },
            confidence: 0.9,
            position: { start: 0, end: 3 }
          }
        ]
      };

      const entities = entityEngine.extractEntities(text, context);

      const timeEntity = entities.find(e => e.type === 'time_period');
      if (timeEntity) {
        expect(timeEntity.confidence).toBeGreaterThan(0.85);
      }
    });
  });

  describe('performance', () => {
    it('should extract entities within reasonable time', () => {
      const text = '過去十二個月中每個地區和部門的營收、客戶數量、轉換率等關鍵指標的統計分析';
      const startTime = Date.now();

      entityEngine.extractEntities(text);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // 2秒內完成
    });

    it('should handle large text efficiently', () => {
      const text = '營收數據分析報告：'.repeat(100) + '這個月的營收統計';
      const startTime = Date.now();

      const entities = entityEngine.extractEntities(text);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
      expect(entities.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle Chinese numbers correctly', () => {
      const text = '三個月的營收增長一百萬元';
      const entities = entityEngine.extractEntities(text);

      const timeEntity = entities.find(e => e.type === 'time_period');
      const numericEntity = entities.find(e => e.type === 'threshold');

      expect(timeEntity).toBeDefined();
      expect(numericEntity).toBeDefined();
    });

    it('should handle relative time expressions', () => {
      const text = '前天、昨天、今天、明天的數據';
      const entities = entityEngine.extractEntities(text);

      const timeEntities = entities.filter(e => e.type === 'time_period');
      expect(timeEntities.length).toBeGreaterThan(0);

      timeEntities.forEach(entity => {
        expect(entity.attributes?.relative).toBe(true);
      });
    });

    it('should handle compound metrics', () => {
      const text = '平均客單價和客戶留存率';
      const entities = entityEngine.extractEntities(text);

      const metricEntities = entities.filter(e => e.type === 'metric');
      expect(metricEntities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ normalizedValue: 'average_order_value' }),
          expect.objectContaining({ normalizedValue: 'retention_rate' })
        ])
      );
    });
  });
});