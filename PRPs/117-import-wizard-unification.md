# PRP-117: ImportWizard 與 UserImportWizard 統一重構計劃

## 概述
**目標**：完全移除已棄用的 ImportWizard 元件，統一使用 UserImportWizard，並重構 LegacyDataImportScreen 以獲取完整的組織物件。

**背景**：
- ImportWizard 和 UserImportWizard 功能重複，造成維護困難
- ImportWizard 缺少模式切換（簡易/進階）功能
- LegacyDataImportScreen 是唯一仍在使用 ImportWizard 的地方
- UserImportWizard 需要完整的 Organization 物件，而 ImportWizard 只需要 organizationId

## 研究發現

### 1. 現況分析
#### ImportWizard 使用情況
- **唯一使用處**：`/src/components/screens/admin/LegacyDataImportScreen.tsx` (第 37, 741 行)
- **已棄用標記**：ImportWizard.tsx 第 2 行已標註 `@deprecated`

#### UserImportWizard 使用情況（已成功遷移）
- `/src/screens/superadmin/OrganizationDetailScreen.tsx`
- `/src/screens/superadmin/CreateOrganizationScreen.tsx`
- `/src/components/organization/UserAssistanceSection.tsx`
- `/src/components/organization/BulkImportUsersModal.tsx`
- `/src/components/superadmin/onboarding/steps/UserImportStepV2.tsx`

### 2. 主要差異比較

| 特性 | ImportWizard | UserImportWizard |
|-----|-------------|------------------|
| **Props** | `organizationId: string` | `organization: Organization` |
| **階段數** | 4 階段 | 3 階段 |
| **模式切換** | ❌ 無 | ✅ 簡易/進階模式 |
| **檔案合併** | ✅ 支援 | ✅ 支援 |
| **Web 平台優化** | ⚠️ 部分 | ✅ 完整 |
| **維護狀態** | 已棄用 | 活躍維護 |

### 3. 組織資料獲取模式
```typescript
// 現有函數位置：/src/services/firebase/admin/organizationService.ts
export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  const db = getFirebaseDb();
  const orgRef = doc(db, 'organizations', orgId);
  const orgDoc = await getDoc(orgRef);
  
  if (!orgDoc.exists()) {
    return null;
  }
  
  const data = orgDoc.data();
  return {
    id: orgDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as Organization;
};
```

### 4. ImportWizard 檔案結構
需要刪除的檔案（15 個）：
```
/src/components/import/
├── ImportWizard.tsx                # 主元件
├── IntelligentFieldMapper.tsx      # 智能映射
├── FieldMappingModal.tsx           # 欄位映射 Modal
└── stages/
    ├── DatabaseSelector.tsx         # 資料庫選擇
    ├── FileUploadMerger.tsx        # 檔案上傳合併
    ├── FieldMapper.tsx             # 欄位映射
    ├── DataAssignmentStep.tsx      # 資料分配
    └── components/
        ├── FilePreview.tsx
        ├── MergePreview.tsx
        ├── FieldMappingRow.tsx
        ├── ValidationResults.tsx
        ├── ImportProgress.tsx
        ├── ImportSummary.tsx
        └── ErrorList.tsx
```

## 實作計劃

### 階段 1：重構 LegacyDataImportScreen（第 1-2 天）

#### 1.1 獲取完整組織物件
```typescript
// MODIFY: /src/components/screens/admin/LegacyDataImportScreen.tsx

import { getOrganization } from '@/services/firebase/admin/organizationService';
import { Organization } from '@/types/entities';

export function LegacyDataImportScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const organizationId = route?.params?.organizationId || user?.organizationId;
  
  // 新增：組織物件狀態
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  
  // 新增：獲取組織詳情
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) {
        setIsLoadingOrg(false);
        return;
      }
      
      try {
        setIsLoadingOrg(true);
        const org = await getOrganization(organizationId);
        
        if (!org) {
          Alert.alert('錯誤', '找不到組織資訊');
          navigation.goBack();
          return;
        }
        
        setOrganization(org);
      } catch (error) {
        console.error('獲取組織失敗:', error);
        Alert.alert('錯誤', '無法載入組織資訊');
        navigation.goBack();
      } finally {
        setIsLoadingOrg(false);
      }
    };
    
    fetchOrganization();
  }, [organizationId]);
  
  // ... rest of component
}
```

#### 1.2 替換 ImportWizard 為 UserImportWizard
```typescript
// MODIFY: 第 741-752 行
{useNewWizard && organization && (
  <UserImportWizard
    visible={true}
    organization={organization}
    onClose={() => navigation.goBack()}
    onImportComplete={(result) => {
      Alert.alert(
        '匯入完成',
        `成功匯入 ${result.imported} 位用戶`,
        [{ text: '確定', onPress: () => navigation.goBack() }]
      );
    }}
    useIntelligentMapping={true}
  />
)}
```

#### 1.3 處理載入狀態
```typescript
// ADD: 載入中的顯示
if (isLoadingOrg) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
      <Text style={styles.loadingText}>載入組織資訊...</Text>
    </View>
  );
}

if (!organization) {
  return (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={48} color={DesignSystem.colors.error} />
      <Text style={styles.errorTitle}>無法載入組織資訊</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.retryText}>返回</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 階段 2：移除舊版切換開關（第 2 天）

#### 2.1 簡化 LegacyDataImportScreen
```typescript
// REMOVE: 第 76 行
const [useNewWizard, setUseNewWizard] = useState(true);

// REMOVE: 第 729-739 行（切換開關 UI）
// REMOVE: 第 771-779 行（切換開關 UI）

// SIMPLIFY: 直接使用 UserImportWizard
return (
  <UserImportWizard
    visible={true}
    organization={organization}
    onClose={() => navigation.goBack()}
    onImportComplete={handleImportComplete}
    useIntelligentMapping={true}
  />
);
```

### 階段 3：刪除 ImportWizard 相關檔案（第 3 天）

#### 3.1 移除 import 語句
```bash
# 從 LegacyDataImportScreen 移除
# REMOVE: 第 37 行
import ImportWizard from '@/components/import/ImportWizard';
```

#### 3.2 刪除所有 ImportWizard 檔案
```bash
# 執行刪除命令
rm -rf src/components/import/
```

#### 3.3 清理測試檔案
```bash
# 如果存在測試檔案
rm -rf tests/components/import/
```

### 階段 4：驗證和測試（第 3-4 天）

#### 4.1 功能驗證清單
- [ ] LegacyDataImportScreen 正常載入
- [ ] 組織資訊正確顯示
- [ ] UserImportWizard 正常開啟
- [ ] 檔案上傳功能正常
- [ ] 簡易/進階模式切換正常
- [ ] 檔案合併功能正常（進階模式）
- [ ] 欄位映射功能正常
- [ ] 匯入執行成功
- [ ] 錯誤處理正常

#### 4.2 邊界案例測試
- [ ] 無組織 ID 的處理
- [ ] 組織不存在的處理
- [ ] 網路錯誤的處理
- [ ] 大檔案上傳測試
- [ ] 多檔案合併測試

## 風險評估

### 高風險
1. **資料遷移中斷**
   - 影響：用戶無法匯入舊系統資料
   - 緩解：保留舊版本備份，可快速回滾

### 中風險
2. **效能問題**
   - 影響：載入組織資訊可能造成延遲
   - 緩解：實作快取機制

3. **權限問題**
   - 影響：用戶可能無權限獲取完整組織物件
   - 緩解：確保權限規則正確配置

### 低風險
4. **UI 差異**
   - 影響：用戶需要適應新介面
   - 緩解：提供使用說明

## 成功標準

1. **程式碼品質**
   - ✅ 完全移除 ImportWizard 及相關檔案
   - ✅ 無重複程式碼
   - ✅ 統一使用 UserImportWizard

2. **功能完整性**
   - ✅ 所有原有功能正常運作
   - ✅ 新增模式切換功能可用
   - ✅ Web 平台體驗改善

3. **效能指標**
   - ✅ 頁面載入時間 < 2 秒
   - ✅ 組織資訊獲取 < 1 秒
   - ✅ 檔案處理效能不降低

4. **維護性**
   - ✅ 減少 15 個檔案（約 3000 行程式碼）
   - ✅ 單一匯入元件易於維護
   - ✅ 清晰的錯誤處理流程

## 部署計劃

### 前置準備
1. 備份現有程式碼
2. 建立功能分支：`feature/unify-import-wizards`
3. 通知相關團隊成員

### 部署步驟
1. 在開發環境完成所有變更
2. 執行完整測試套件
3. 在測試環境驗證
4. 部署到生產環境
5. 監控錯誤日誌 24 小時

### 回滾計劃
如發生嚴重問題：
1. 立即切換回主分支
2. 恢復 ImportWizard 檔案
3. 還原 LegacyDataImportScreen 變更
4. 重新部署

## 後續優化建議

1. **快取組織資訊**
   - 使用 React Query 或類似工具
   - 減少重複的 API 呼叫

2. **預載入優化**
   - 在導航前預先載入組織資訊
   - 改善用戶體驗

3. **錯誤追蹤**
   - 整合 Sentry 或類似工具
   - 追蹤匯入過程的錯誤

4. **使用分析**
   - 追蹤匯入功能使用情況
   - 了解用戶偏好的模式

## 相關文件
- [UserImportWizard 文件](/docs/components/UserImportWizard.md)
- [組織服務 API](/docs/api/organizationService.md)
- [資料匯入指南](/docs/guides/data-import.md)

---

**建立日期**：2025-01-31
**預計完成**：2025-02-04
**負責人**：開發團隊
**狀態**：⏳ 待執行