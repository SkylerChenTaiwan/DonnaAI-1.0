/**
 * StylePriorityManager 測試套件
 * 驗證樣式優先級系統的正確性
 */

import { StylePriorityManager } from '../StylePriorityManager';
import { StylePriority } from '../types';
import type { StyleConfig } from '../types';

describe('StylePriorityManager', () => {
  let manager: StylePriorityManager;

  beforeEach(() => {
    manager = StylePriorityManager.getInstance();
    manager.clearCache();
  });

  describe('單例模式', () => {
    it('應該返回相同的實例', () => {
      const instance1 = StylePriorityManager.getInstance();
      const instance2 = StylePriorityManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('樣式優先級合併', () => {
    it('應該按照優先級順序合併樣式', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { backgroundColor: 'white', padding: 10 },
          source: 'default'
        },
        {
          priority: StylePriority.USER_STYLE,
          style: { backgroundColor: 'blue', margin: 20 },
          source: 'user'
        },
        {
          priority: StylePriority.PLATFORM_STYLE,
          style: { backgroundColor: 'red' },
          source: 'platform'
        }
      ];

      const result = manager.mergeStyles(configs);
      
      // 應該使用最高優先級的背景顏色
      expect(result.style.backgroundColor).toBe('red');
      // 應該保留沒有衝突的樣式
      expect(result.style.padding).toBe('10px');
      expect(result.style.margin).toBe('20px');
    });

    it('應該正確處理 size preset 優先級', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { width: 100, height: 100 },
          source: 'default'
        },
        {
          priority: StylePriority.SIZE_PRESET,
          style: { width: '95vw', height: '95vh' },
          source: 'size-fullscreen'
        }
      ];

      const result = manager.mergeStyles(configs);
      
      expect(result.style.width).toBe('95vw');
      expect(result.style.height).toBe('95vh');
    });

    it('應該讓 contentStyle 覆蓋 webStyle', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.PLATFORM_STYLE,
          style: { borderRadius: 8 },
          source: 'web-style'
        },
        {
          priority: StylePriority.CONTENT_STYLE,
          style: { borderRadius: 0 },
          source: 'content-style'
        }
      ];

      const result = manager.mergeStyles(configs);
      
      expect(result.style.borderRadius).toBe('0px');
    });
  });

  describe('Web 平台轉換', () => {
    it('應該為數值添加 px 單位', () => {
      const style = {
        width: 100,
        height: 200,
        padding: 10,
        margin: 20
      };

      const result = manager.adaptStyle(style, 'web');
      
      expect(result.width).toBe('100px');
      expect(result.height).toBe('200px');
      expect(result.padding).toBe('10px');
      expect(result.margin).toBe('20px');
    });

    it('應該展開 marginHorizontal 和 marginVertical', () => {
      const style = {
        marginHorizontal: 10,
        marginVertical: 20
      };

      const result = manager.adaptStyle(style, 'web');
      
      expect(result.marginLeft).toBe('10px');
      expect(result.marginRight).toBe('10px');
      expect(result.marginTop).toBe('20px');
      expect(result.marginBottom).toBe('20px');
    });

    it('應該轉換 elevation 為 boxShadow', () => {
      const style = { elevation: 2 };
      const result = manager.adaptStyle(style, 'web');
      
      expect(result.boxShadow).toContain('rgba');
    });
  });

  describe('除錯模式', () => {
    it('應該在除錯模式下追蹤衝突', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { color: 'black' },
          source: 'default'
        },
        {
          priority: StylePriority.USER_STYLE,
          style: { color: 'blue' },
          source: 'user'
        }
      ];

      const result = manager.mergeStyles(configs, { debug: true });
      
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts?.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
    });
  });

  describe('快取功能', () => {
    it('應該快取合併結果', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { backgroundColor: 'white' },
          source: 'default'
        }
      ];

      // 第一次調用
      const result1 = manager.mergeStyles(configs);
      // 第二次調用（應該從快取返回）
      const result2 = manager.mergeStyles(configs);
      
      expect(result1).toEqual(result2);
    });

    it('清除快取後應該重新計算', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { backgroundColor: 'white' },
          source: 'default'
        }
      ];

      const result1 = manager.mergeStyles(configs);
      manager.clearCache();
      const result2 = manager.mergeStyles(configs);
      
      // 結果應該相同，但是是新計算的
      expect(result1.style).toEqual(result2.style);
    });
  });

  describe('靜態輔助方法', () => {
    it('createConfig 應該創建正確的配置', () => {
      const config = StylePriorityManager.createConfig(
        { backgroundColor: 'blue' },
        StylePriority.USER_STYLE,
        'test-source'
      );

      expect(config.style).toEqual({ backgroundColor: 'blue' });
      expect(config.priority).toBe(StylePriority.USER_STYLE);
      expect(config.source).toBe('test-source');
    });

    it('merge 應該快速合併多個樣式', () => {
      const style1 = { backgroundColor: 'white' };
      const style2 = { padding: 10 };
      const style3 = { backgroundColor: 'blue' };

      const result = StylePriorityManager.merge(style1, style2, style3);
      
      expect(result.backgroundColor).toBe('blue');
      expect(result.padding).toBe('10px');
    });
  });

  describe('important 標記', () => {
    it('應該在 forceImportant 時添加 !important', () => {
      const configs: StyleConfig[] = [
        {
          priority: StylePriority.DEFAULT,
          style: { backgroundColor: 'white' },
          source: 'default'
        }
      ];

      const result = manager.mergeStyles(configs, { 
        platform: 'web',
        forceImportant: true 
      });
      
      expect(result.style.backgroundColor).toContain('!important');
    });
  });
});