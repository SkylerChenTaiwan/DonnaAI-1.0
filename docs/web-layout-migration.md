# Web 響應式佈局遷移追蹤文件

## 概述
此文件追蹤 PRP-61 Web 響應式佈局統一化的實作進度。目標是將所有頁面遷移到使用 UnifiedWebLayout 系統，確保在桌面和平板橫向模式下正確顯示側邊欄。

## 遷移狀態說明
- ✅ 已完成：頁面已成功遷移到 UnifiedWebLayout
- 🔄 進行中：正在進行遷移工作
- ❌ 待處理：尚未開始遷移
- ⚠️ 需要特殊處理：有特殊情況需要額外注意

## 核心基礎設施
- ✅ 統一斷點系統 (`src/theme/responsive.ts`)
- ✅ 更新 `useResponsiveLayout.ts` 使用統一斷點
- ✅ 更新 `web.ts` 使用統一斷點
- ✅ 建立 `withUnifiedWebLayout` HOC
- ✅ 建立 `useResponsiveStyles` Hook

## 頁面遷移進度

### 高優先級 - 管理頁面
| 頁面 | 檔案路徑 | 狀態 | 備註 |
|------|---------|------|------|
| 組織管理 | `src/screens/superadmin/OrganizationsScreen.tsx` | ✅ | 已正確實作，作為範例 |
| 用戶管理 | `src/screens/admin/UserManagementScreen.tsx` | ✅ | 使用 migrateToUnifiedWebLayout |
| 管理儀表板 | `src/screens/admin/AdminDashboard.tsx` | ✅ | 使用 migrateToUnifiedWebLayout |
| 組織詳情 | `src/screens/superadmin/OrganizationDetailScreen.tsx` | ❌ | 需要遷移 |
| 舊系統導入 | `src/components/screens/admin/LegacyDataImportScreen.tsx` | ✅ | 使用 migrateToUnifiedWebLayout |

### 中優先級 - 詳細檢視頁面
| 頁面 | 檔案路徑 | 狀態 | 備註 |
|------|---------|------|------|
| 客戶詳情 | `src/screens/customer/CustomerDetailScreen.tsx` | ❌ | 需要遷移 |
| 記錄詳情 | `src/screens/record/RecordDetailScreen.tsx` | ❌ | 需要遷移 |
| 任務詳情 | `src/screens/task/TaskDetailScreen.tsx` | ❌ | 需要遷移 |
| 人員詳情 | `src/screens/personnel/PersonnelDetailScreen.tsx` | ❌ | 需要遷移 |

### 低優先級 - 主要 Tab 頁面
| 頁面 | 檔案路徑 | 狀態 | 備註 |
|------|---------|------|------|
| 首頁 | `src/screens/home/HomeScreen.tsx` | ❌ | WebNavigator 處理 |
| 資料庫 | `src/screens/database/DatabaseScreen.tsx` | ❌ | WebNavigator 處理 |
| 工具 | `src/screens/tools/ToolsScreen.tsx` | ❌ | WebNavigator 處理 |
| 設定 | `src/screens/settings/SettingsScreen.tsx` | ❌ | WebNavigator 處理 |

### 不需遷移 - Modal 和認證頁面
| 頁面 | 原因 |
|------|------|
| 登入/註冊頁面 | 不需要側邊欄 |
| 創建/編輯 Modal | 以 Modal 形式顯示 |
| 錯誤頁面 | 特殊佈局 |

## 技術債務清理
- ❌ 移除或棄用 `ResponsiveLayout` 組件
- ❌ 統一所有硬編碼的斷點值
- ❌ 清理重複的響應式樣式定義

## 測試清單
- [ ] 桌面版（1920x1080）側邊欄顯示
- [ ] 桌面版（1024x768）側邊欄顯示
- [ ] 平板橫向（1024x768）側邊欄可切換
- [ ] 平板直向（768x1024）頂部導航
- [ ] 手機版（375x667）頂部導航
- [ ] 頁面切換無佈局跳動
- [ ] 側邊欄收合/展開動畫流暢

## 已知問題
1. **斷點不一致**：`web.ts` 缺少 `wideScreen` 斷點定義
2. **路由限制**：`WebNavigator` 只處理主要 Tab 頁面
3. **樣式衝突**：部分頁面可能有自定義響應式樣式

## 下一步行動
1. 更新所有斷點引用到統一系統
2. 建立 HOC 簡化遷移過程
3. 開始高優先級頁面遷移

## 更新歷史
- 2025-07-31：建立文件，完成基礎分析
- 2025-07-31：建立統一斷點系統檔案
- 2025-07-31：完成所有斷點引用更新
- 2025-07-31：建立 withUnifiedWebLayout HOC 和 useResponsiveStyles Hook
- 2025-07-31：完成高優先級頁面遷移 (UserManagement, AdminDashboard, LegacyDataImport)