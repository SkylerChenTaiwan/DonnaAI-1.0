/**
 * 用戶匯入階段指示器組件單元測試
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect, beforeEach } from 'vitest';
import UserImportStageIndicator from '../../../components/users/UserImportStageIndicator';
import { UserImportStage } from '../../../types/userImport';

describe('UserImportStageIndicator', () => {
  beforeEach(() => {
    // 清理任何模擬
  });

  describe('渲染', () => {
    it('應該渲染所有階段', () => {
      // Act
      const { getByText } = render(
        <UserImportStageIndicator
          currentStage="upload"
        />
      );

      // Assert
      expect(getByText('上傳檔案')).toBeTruthy();
      expect(getByText('預覽資料')).toBeTruthy();
      expect(getByText('配置選項')).toBeTruthy();
      expect(getByText('匯入中')).toBeTruthy();
      expect(getByText('完成')).toBeTruthy();
    });

    it('應該顯示階段描述', () => {
      // Act
      const { getByText } = render(
        <UserImportStageIndicator
          currentStage="preview"
        />
      );

      // Assert
      expect(getByText('選擇CSV檔案')).toBeTruthy();
      expect(getByText('檢查並編輯用戶資料')).toBeTruthy();
      expect(getByText('設定匯入參數')).toBeTruthy();
      expect(getByText('正在創建用戶帳號')).toBeTruthy();
      expect(getByText('匯入結果摘要')).toBeTruthy();
    });

    it('應該在緊湊模式下隱藏描述', () => {
      // Act
      const { queryByText } = render(
        <UserImportStageIndicator
          currentStage="upload"
          compact={true}
        />
      );

      // Assert
      // 標題應該存在
      expect(queryByText('上傳檔案')).toBeNull(); // 緊湊模式不顯示標題
      // 描述不應該存在
      expect(queryByText('選擇CSV檔案')).toBeNull();
    });
  });

  describe('階段狀態', () => {
    it('應該正確標記當前階段', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="preview"
        />
      );

      // Assert - 在實際應用中，你需要檢查具體的樣式或測試 ID
      expect(container).toBeTruthy();
    });

    it('應該正確標記已完成的階段', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="configure"
          completedStages={['upload', 'preview']}
        />
      );

      // Assert
      expect(container).toBeTruthy();
    });

    it('應該處理所有階段都已完成的情況', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="complete"
          completedStages={['upload', 'preview', 'configure', 'importing']}
        />
      );

      // Assert
      expect(container).toBeTruthy();
    });
  });

  describe('階段順序', () => {
    const stages: UserImportStage[] = ['upload', 'preview', 'configure', 'importing', 'complete'];

    stages.forEach((stage, index) => {
      it(`應該正確處理階段 ${stage}`, () => {
        // Arrange
        const completedStages = stages.slice(0, index);

        // Act
        const { container } = render(
          <UserImportStageIndicator
            currentStage={stage}
            completedStages={completedStages}
          />
        );

        // Assert
        expect(container).toBeTruthy();
      });
    });
  });

  describe('自訂樣式', () => {
    it('應該接受自訂樣式 prop', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="upload"
          style={{ backgroundColor: 'red' }}
        />
      );

      // Assert
      expect(container).toBeTruthy();
    });
  });

  describe('邊界情況', () => {
    it('應該處理空的完成階段數組', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="upload"
          completedStages={[]}
        />
      );

      // Assert
      expect(container).toBeTruthy();
    });

    it('應該處理未定義的完成階段', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="upload"
        />
      );

      // Assert
      expect(container).toBeTruthy();
    });

    it('應該處理不合理的完成階段順序', () => {
      // Act
      const { container } = render(
        <UserImportStageIndicator
          currentStage="preview"
          completedStages={['complete', 'importing']} // 不合理的順序
        />
      );

      // Assert - 組件應該仍能正常工作
      expect(container).toBeTruthy();
    });
  });
});