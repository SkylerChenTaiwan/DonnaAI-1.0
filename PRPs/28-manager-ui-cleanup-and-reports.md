name: "Manager UI Cleanup and Default Reports"
description: |

## Purpose
清理主管模式UI中過多的顏色使用，統一套用設計規範，並重新組織首頁內容，將統計報表作為主要內容顯示。

## Core Principles
1. **設計一致性**: 嚴格遵循 monochromatic gray theme 設計規範
2. **內容優先**: 統計報表是主管最關心的內容，應該佔據主要視覺空間
3. **簡潔清晰**: 移除不必要的裝飾性元素和過多的顏色
4. **預設體驗**: 提供預設報表，讓新用戶立即看到價值
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
1. 統一主管模式UI的顏色主題，使用單色灰階設計系統
2. 重新組織首頁內容層級，將統計報表提升為主要內容
3. 實現預設報表生成機制，提供即開即用的體驗
4. 確保智能分析頁面也遵循相同的設計規範

## Why
- 當前UI使用了太多不同的顏色（藍、綠、橙、紅等），缺乏視覺一致性
- 「管理功能」和「團隊成員」等區塊佔據了太多空間，但不是主管最關心的內容
- 新用戶看到空白的報表區域，無法立即理解功能價值
- 需要更專業、簡潔的視覺呈現

## What
### 設計規範統一
根據 `/PRPs/design-specs/04-frontend-pages-design-spec.md`，應用以下顏色系統：
- **主色調**: `#1A1A1A` (深灰黑色) - 用於按鈕和互動元素
- **背景**: `#F5F5F5` (淺灰白色) - 主背景
- **卡片背景**: `#FFFFFF` (純白) - 所有卡片
- **文字**: 主要 `#1A1A1A`，次要 `#666666`，第三級 `#999999`
- **邊框**: `#E5E7EB` (淺灰)
- **狀態色**: 僅在必要時使用（成功綠、錯誤紅）

### 首頁內容重組
1. **移除或簡化**：
   - 團隊統計卡片（移到次要位置）
   - 管理功能網格（整合到導航或其他頁面）
   - 團隊成員列表（移到人事頁面）
   - AI建議（整合到智能分析）

2. **主要內容結構**：
   ```
   [頭部: 用戶信息 + 模式切換]
   [快速操作: 佈達 + 指派]
   [統計報表: 佔據主要空間]
   ```

### 預設報表實現
創建 6 個預設報表模板：
1. 本月銷售趨勢
2. 團隊績效對比
3. 客戶分布圖
4. 任務完成率
5. 會議效率分析
6. AI使用統計

### Success Criteria
- [ ] 所有UI元素遵循單色灰階設計系統
- [ ] 首頁主要內容為統計報表
- [ ] 新用戶能看到預設報表
- [ ] 智能分析對話框也套用相同設計規範
- [ ] 視覺呈現專業、簡潔、一致

## All Needed Context

### Documentation & References
```yaml
# 設計規範文件
- file: /PRPs/design-specs/04-frontend-pages-design-spec.md
  why: 完整的設計系統定義，包含顏色、間距、字型
  
- file: /src/theme/colors.ts
  why: 當前顏色定義，需要確認是否需要更新

# 需要修改的組件
- file: /src/screens/dashboard/ManagerDashboard.tsx
  why: 主管儀表板主頁面，需要重新設計
  
- file: /src/components/manager/SavedReportsGrid.tsx
  why: 報表網格組件，需要支援預設報表
  
- file: /src/components/analytics/AnalyticsDialog.tsx
  why: 智能分析對話框，需要套用設計規範

# 報表相關服務
- file: /src/services/firebase/managerActions.ts
  why: saveReport 函數，用於創建預設報表
  
- file: /src/stores/queryStore.ts
  why: 查詢處理邏輯，了解如何生成圖表數據

# 參考實現
- file: /PRPs/11v-seed-test-data.md
  why: 種子數據生成邏輯，可參考實現預設報表
```

### Current Implementation Analysis
```typescript
// 當前 ManagerDashboard 的問題：
1. 顏色過多：
   - 快速操作按鈕：#FF6B6B (紅), #34C759 (綠)
   - 統計卡片：#007AFF, #34C759, #FF9500, #FF3B30
   - 管理功能圖標：每個都有不同顏色
   
2. 內容層級問題：
   - 統計報表在最底部
   - 團隊統計、管理功能、團隊成員佔據主要空間
   
3. 沒有預設報表機制
```

### Desired Implementation
```typescript
// 新的頁面結構
ManagerDashboard
├── Header (固定)
│   ├── UserInfo
│   └── ModeToggle
├── QuickActions (精簡)
│   ├── 佈達 (深灰色)
│   └── 指派 (深灰色)
└── MainContent
    └── SavedReportsGrid (擴展到全屏)
        ├── 預設報表 (如果沒有保存的報表)
        └── 用戶保存的報表
```

### Known Gotchas
```typescript
// CRITICAL: React Native 樣式覆蓋
// 確保所有硬編碼的顏色都被替換

// CRITICAL: 預設報表數據
// 需要生成合理的模擬數據，不能是隨機數據

// CRITICAL: 報表權限
// 預設報表應該標記為系統生成，不允許刪除

// CRITICAL: 首次載入體驗
// 檢查是否已有預設報表，避免重複創建
```

## Implementation Blueprint

### Data models
```typescript
// 預設報表模板
interface DefaultReportTemplate {
  name: string;
  query: string;
  chartType: 'bar' | 'line' | 'pie';
  generateData: (organizationId: string, teamId?: string) => ChartData;
  tags: string[];
}

// 擴展 SavedReport 以支援預設標記
interface SavedReport {
  // ... existing fields
  isDefault?: boolean;  // 標記為預設報表
  isEditable?: boolean; // 是否可編輯/刪除
}
```

### Pseudocode
```typescript
// Task 1: 創建設計系統常量
const DesignSystem = {
  colors: {
    primary: '#1A1A1A',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: '#E5E7EB',
    // 僅保留必要的狀態色
    status: {
      success: '#34C759',
      error: '#FF3B30',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  }
};

// Task 2: 預設報表模板
const defaultReportTemplates: DefaultReportTemplate[] = [
  {
    name: '本月銷售趨勢',
    query: '顯示本月每日銷售額趨勢',
    chartType: 'line',
    generateData: (orgId) => ({
      type: 'line',
      data: generateMonthlyTrend(),
      options: { ... }
    }),
    tags: ['銷售', '月度', '趨勢']
  },
  // ... 其他5個模板
];

// Task 3: 初始化預設報表
const initializeDefaultReports = async (userId: string, orgId: string) => {
  // 檢查是否已有預設報表
  const existingDefaults = await checkExistingDefaults(userId, orgId);
  
  if (existingDefaults.length === 0) {
    // 創建預設報表
    for (const template of defaultReportTemplates) {
      const reportData = {
        name: template.name,
        query: template.query,
        chartType: template.chartType,
        chartData: template.generateData(orgId),
        isPublic: true,
        isDefault: true,
        isEditable: false,
        tags: template.tags,
        organizationId: orgId,
      };
      
      await saveReport(reportData, userId, 'DonnaAI 系統');
    }
  }
};

// Task 4: 重新設計 ManagerDashboard
const ManagerDashboard = () => {
  // 簡化的結構，專注於報表顯示
  return (
    <Layout>
      <Header />
      <QuickActions simplified />
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>數據分析</Text>
        <SavedReportsGrid 
          showDefault={true}
          fullScreen={true}
        />
      </View>
    </Layout>
  );
};
```

### List of tasks
```yaml
Task 1:
UPDATE theme system:
  - CREATE: src/theme/designSystem.ts with monochromatic colors
  - UPDATE: src/theme/colors.ts to reference design system
  - ENSURE: All colors follow the grayscale theme

Task 2:
CREATE default reports mechanism:
  - CREATE: src/services/reports/defaultReports.ts
  - DEFINE: 6 default report templates with realistic data
  - IMPLEMENT: Data generation functions for each template
  - ADD: Initialization logic to create defaults on first load

Task 3:
REFACTOR ManagerDashboard.tsx:
  - REMOVE: Team stats cards
  - REMOVE: Management actions grid  
  - REMOVE: Team members section
  - REMOVE: AI suggestions
  - SIMPLIFY: Quick actions (only 佈達 and 指派)
  - EXPAND: SavedReportsGrid to be main content
  - APPLY: Monochromatic color scheme throughout

Task 4:
UPDATE SavedReportsGrid.tsx:
  - ADD: Support for displaying default reports
  - MODIFY: Empty state to initialize defaults
  - UPDATE: Card styling to match design system
  - REMOVE: Colorful icons, use grayscale

Task 5:
UPDATE AnalyticsDialog.tsx:
  - APPLY: Design system colors
  - REMOVE: Blue (#007AFF) accent colors
  - UPDATE: Button and input styles
  - ENSURE: Consistent with main UI

Task 6:
UPDATE related components:
  - QuickSaveButton.tsx: Apply design system
  - AnnouncementModal.tsx: Update colors
  - TaskAssignmentModal.tsx: Update colors

Task 7:
IMPLEMENT first-run experience:
  - CHECK: If user has no saved reports
  - CALL: initializeDefaultReports
  - SHOW: Loading state during initialization
  - DISPLAY: Default reports immediately

Task 8:
TEST complete flow:
  - New user sees default reports
  - Can save custom reports from analytics
  - Default reports cannot be deleted
  - All UI follows design system
```

### Integration Points
```yaml
AUTHENTICATION:
  - Hook: useAuth to get current user
  - Check: First time user to show defaults

ORGANIZATION:
  - Hook: useOrganization for team/org context  
  - Filter: Reports by organization

ANALYTICS:
  - Integrate: Save report flow
  - Ensure: Consistent styling
  
NAVIGATION:
  - Update: Navigation to analytics dialog
  - Remove: Links to removed sections
```

## Validation Loop

### Level 1: Visual Consistency
```bash
# Manual inspection checklist
- [ ] No blue (#007AFF) in manager UI
- [ ] No bright colors except status indicators
- [ ] All cards use white background
- [ ] All text follows color hierarchy
- [ ] Consistent spacing and borders
```

### Level 2: Component Testing
```typescript
// Test default report generation
describe('Default Reports', () => {
  it('should create 6 default reports for new users', async () => {
    const newUserId = 'test-user';
    await initializeDefaultReports(newUserId, 'test-org');
    
    const reports = await getSavedReports(newUserId);
    expect(reports.length).toBe(6);
    expect(reports.every(r => r.isDefault)).toBe(true);
  });
  
  it('should not recreate defaults if they exist', async () => {
    // Second call should not duplicate
    await initializeDefaultReports(userId, orgId);
    const reports = await getSavedReports(userId);
    expect(reports.length).toBe(6);
  });
});
```

### Level 3: Integration Testing
```bash
# Test complete flow
1. Create new test user
2. Login as manager
3. Verify default reports appear
4. Save custom report from analytics
5. Verify it appears with defaults
6. Verify cannot delete defaults
```

### Level 4: TypeScript Validation
```bash
npx tsc --noEmit
# Should have no errors
```

## Final Validation Checklist
- [ ] Manager dashboard uses only grayscale colors
- [ ] Reports are the primary content on homepage  
- [ ] New users see 6 default reports
- [ ] Analytics dialog matches design system
- [ ] Quick actions use dark gray (#1A1A1A)
- [ ] No unnecessary colorful elements
- [ ] Professional, clean appearance
- [ ] Consistent spacing and typography

---

## Anti-Patterns to Avoid
- ❌ Don't use iOS blue (#007AFF) as primary color
- ❌ Don't create random/meaningless chart data
- ❌ Don't allow deletion of default reports
- ❌ Don't keep colorful status badges everywhere
- ❌ Don't maintain the cluttered multi-section layout

## 實作優先順序
1. 建立設計系統常量檔案
2. 實現預設報表機制
3. 重構 ManagerDashboard 
4. 更新 SavedReportsGrid
5. 統一所有相關組件的樣式

## 設計考量
- 使用深灰色 (#1A1A1A) 作為主要互動色
- 保持充足的留白，避免視覺擁擠
- 報表卡片使用微妙的陰影增加層次
- 統一使用 12/16/18px 的字體大小體系
- 圓角統一使用 8px (按鈕) 和 12px (卡片)

---

**信心等級：9/10** - 設計規範明確，現有代碼結構清晰，主要工作是樣式調整和預設報表實現。挑戰在於生成有意義的預設數據。