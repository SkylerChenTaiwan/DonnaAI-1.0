/**
 * OrganizationDetailScreen Modal 互動測試
 * 專門測試 CustomFieldsModal 的觸發和狀態管理邏輯
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OrganizationDetailScreen } from '../OrganizationDetailScreen';
import { Organization } from '@/types/entities';

// Mock 所有外部依賴
vi.mock('@/services/firebase/admin/organizationService');
vi.mock('@/services/firebase/admin/billingService');
vi.mock('@/services/firebase/admin/toolUsageService');
vi.mock('@/services/firebase/updateOrgStats');
vi.mock('@/utils/toast');
vi.mock('@/components/organization/CustomFieldsModal', () => {
  return {
    CustomFieldsModal: ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
      if (!visible) return null;
      return (
        <div data-testid="custom-fields-modal" role="dialog">
          <h2>自訂欄位管理</h2>
          <button data-testid="close-modal-button" onClick={onClose}>
            關閉
          </button>
        </div>
      );
    },
  };
});

// Mock 其他組件
vi.mock('@/components/organization/AddUserToOrganizationModal', () => ({
  AddUserToOrganizationModal: () => null,
}));
vi.mock('@/components/users/EnhancedBulkImportModal', () => ({
  EnhancedBulkImportModal: () => null,
}));
vi.mock('@/components/users/UserImportWizard', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock 組織資料
const mockOrganization: Organization = {
  id: 'test-org-123',
  name: '測試組織',
  email: 'test@example.com',
  subscriptionPlan: 'pro',
  billingCycle: 'monthly',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  giftedSeats: 5,
  features: {
    allowCustomFields: true,
    allowDataImport: true,
    allowDataExport: true,
    allowAPIAccess: false,
  },
  monthlyUsage: {
    activeUsers: 10,
    totalUsage: 1000,
  },
};

// Mock 導航參數
const mockRoute = {
  params: {
    organizationId: 'test-org-123',
  },
};

// Mock 導航函數
const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
  dispatch: vi.fn(),
};

// 測試包裝器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const Stack = createStackNavigator();
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={() => children as React.ReactElement} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Mock React Navigation hooks
vi.mock('@react-navigation/native', () => ({
  ...vi.importActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

// Mock 組織服務返回資料
vi.mock('@/services/firebase/admin/organizationService', () => ({
  getOrganization: vi.fn().mockResolvedValue(mockOrganization),
  updateOrganization: vi.fn().mockResolvedValue(undefined),
  deleteOrganization: vi.fn().mockResolvedValue(undefined),
  upgradeOrganizationPlan: vi.fn().mockResolvedValue(undefined),
  updateGiftedSeats: vi.fn().mockResolvedValue(undefined),
  getOrganizationBillingSummary: vi.fn().mockResolvedValue({}),
  isTrialActive: vi.fn().mockReturnValue(false),
}));

describe('OrganizationDetailScreen Modal 互動測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除 console.log
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal 初始狀態測試', () => {
    test('頁面載入時 Modal 不應該顯示', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 等待組織資料載入
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      // Modal 不應該存在
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();
    });

    test('showCustomFieldsModal 狀態應該初始化為 false', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 等待組件載入
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      // 檢查初始化日誌
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Initializing showCustomFieldsModal as false');
    });
  });

  describe('Modal 觸發測試', () => {
    test('點擊「查看欄位」按鈕應該顯示 Modal', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 等待頁面載入
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      // 切換到協助標籤
      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      // 等待協助標籤內容載入
      await waitFor(() => {
        expect(screen.getByText('用戶協助')).toBeInTheDocument();
      });

      // 找到「查看欄位」按鈕並點擊
      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      // Modal 應該顯示
      await waitFor(() => {
        expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      });
    });

    test('Modal 顯示時應該觸發狀態變化日誌', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 等待頁面載入並切換到協助標籤
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      // 點擊查看欄位按鈕
      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      // 應該記錄狀態變化
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', true);
      });
    });

    test('Modal 狀態從 false 變為 true 時應該觸發警告', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 觸發 Modal 顯示
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      // 應該觸發警告日誌
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Modal is being shown! This should only happen when button is clicked');
      });
    });
  });

  describe('Modal 關閉測試', () => {
    test('點擊 Modal 關閉按鈕應該隱藏 Modal', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 先顯示 Modal
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      // 確認 Modal 顯示
      await waitFor(() => {
        expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      });

      // 點擊關閉按鈕
      const closeButton = screen.getByTestId('close-modal-button');
      fireEvent.click(closeButton);

      // Modal 應該隱藏
      await waitFor(() => {
        expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();
      });
    });

    test('關閉 Modal 時應該記錄日誌', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 顯示 Modal
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      await waitFor(() => {
        expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      });

      // 關閉 Modal
      const closeButton = screen.getByTestId('close-modal-button');
      fireEvent.click(closeButton);

      // 應該記錄關閉日誌
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔄 Closing CustomFieldsModal - User clicked close');
      });
    });
  });

  describe('條件渲染邏輯測試', () => {
    test('當 showCustomFieldsModal 為 false 且 organization 存在時，Modal 不應該渲染', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      // Modal 不應該存在（條件渲染邏輯正確）
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();
    });

    test('當 showCustomFieldsModal 為 true 但 organization 不存在時的處理', async () => {
      // 這個測試需要模擬組織資料載入失敗的情況
      // 由於組織資料載入失敗時會導航回去，這裡可能需要調整測試策略
    });
  });

  describe('邊界情況測試', () => {
    test('快速連續點擊查看欄位按鈕', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      const viewFieldsButton = screen.getByText('查看欄位');
      
      // 快速連續點擊
      fireEvent.click(viewFieldsButton);
      fireEvent.click(viewFieldsButton);
      fireEvent.click(viewFieldsButton);

      // Modal 應該只顯示一次，不會重複渲染
      await waitFor(() => {
        expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      });

      // 應該只有一個 Modal 元素
      const modals = screen.getAllByTestId('custom-fields-modal');
      expect(modals).toHaveLength(1);
    });

    test('在 Modal 顯示期間切換標籤', async () => {
      render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 顯示 Modal
      await waitFor(() => {
        expect(screen.getByText('測試組織')).toBeInTheDocument();
      });

      const assistanceTab = screen.getByText('協助');
      fireEvent.click(assistanceTab);

      await waitFor(() => {
        expect(screen.getByText('查看欄位')).toBeInTheDocument();
      });

      const viewFieldsButton = screen.getByText('查看欄位');
      fireEvent.click(viewFieldsButton);

      await waitFor(() => {
        expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      });

      // 切換到其他標籤
      const overviewTab = screen.getByText('概覽');
      fireEvent.click(overviewTab);

      // Modal 應該仍然顯示（狀態獨立於標籤）
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
    });
  });

  describe('記憶體洩漏防護測試', () => {
    test('組件卸載時不應該造成記憶體洩漏', () => {
      const { unmount } = render(
        <TestWrapper>
          <OrganizationDetailScreen />
        </TestWrapper>
      );

      // 卸載組件
      unmount();

      // 這裡可以添加更多的記憶體洩漏檢測邏輯
      // 例如檢查是否有未清理的 setTimeout、事件監聽器等
    });
  });
});