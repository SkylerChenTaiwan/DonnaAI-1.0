# PRP-23: 修復 PRP-22 導航架構和載入狀態問題

## 概述
修復 PRP-22 實作中的兩個主要問題：
1. 恢復原本的「+」按鈕導航架構，讓 CreateTaskModal 預設顯示語音輸入
2. 修復首頁顯示「請先登入」的載入狀態問題

## 背景與動機
PRP-22 的實作誤解了需求：
- **原始需求**：保留「+」按鈕，點擊後選擇「任務」時，Modal 內預設顯示語音輸入
- **實際實作**：移除「+」按鈕，新增 Task 標籤到導航列
- **額外問題**：首頁在已登入狀態下顯示「請先登入」

## 目標
1. **恢復導航架構**：保留原本的「+」按鈕和 ActionPopover
2. **優化任務建立流程**：CreateTaskModal 預設顯示語音輸入介面
3. **修復載入狀態**：正確處理首頁的資料載入狀態
4. **保留優點**：保留 PRP-22 中的 TaskListSection 和 RecentCustomersSection

## 技術分析

### 問題一：導航架構
**現況（PRP-22 後）**：
```typescript
// MainTabNavigator.tsx
Home | Task | Database | Tools | Settings
```

**應該改回**：
```typescript
// MainTabNavigator.tsx  
Home | Database | + | Tools | Settings
```

### 問題二：載入狀態
**現況問題**：
```typescript
// EnhancedDashboard.tsx
if (!authUser || !currentOrganization || !currentTeam) {
  return <Text>請先登入</Text>
}
```

**根本原因**：沒有處理 loading 狀態，資料還在載入時就判定為未登入

## 實作步驟

### 第一階段：恢復導航架構

1. **恢復 MainTabNavigator.tsx**：
   ```typescript
   // 1. 重新引入 ActionPopover
   import { ActionPopover } from '@/components/common/ActionPopover';
   
   // 2. 恢復狀態管理
   const [showActionModal, setShowActionModal] = useState(false);
   const addButtonRef = useRef<View>(null);
   
   // 3. 恢復 AddAction 標籤
   <Tab.Screen
     name="AddAction"
     component={EmptyComponent}
     options={{
       title: '',
       tabBarLabel: () => null,
     }}
     listeners={{
       tabPress: (e) => {
         e.preventDefault();
         setShowActionModal(true);
       },
     }}
   />
   
   // 4. 恢復 ActionPopover
   <ActionPopover
     visible={showActionModal}
     onClose={() => setShowActionModal(false)}
     onAction={handleActionSelect}
   />
   ```

2. **更新 navigation types**：
   ```typescript
   export type MainTabParamList = {
     Home: undefined;
     Database: undefined;
     AddAction: undefined; // 恢復此項
     Tools: undefined;
     Settings: undefined;
   };
   ```

3. **刪除不需要的檔案**：
   - 刪除 `/src/screens/task/CreateTaskScreen.tsx`（改回使用 Modal）

### 第二階段：修改 CreateTaskModal

1. **更新 CreateTaskModal.tsx**：
   ```typescript
   // 預設模式改為語音
   const mode = route.params?.mode || 'voice';
   
   // 語音模式時使用 SimplifiedVoiceTaskInput
   {mode === 'voice' ? (
     <SimplifiedVoiceTaskInput
       onTaskCreated={handleTaskCreated}
       userId={user?.uid || ''}
       organizationId={currentOrganization?.id || ''}
       teamId={currentTeam?.id || ''}
     />
   ) : (
     // 原本的 TaskForm
   )}
   ```

2. **調整 SimplifiedVoiceTaskInput**：
   - 確保在 Modal 環境中正常運作
   - 任務建立成功後關閉 Modal

### 第三階段：修復首頁載入狀態

1. **修改 EnhancedDashboard.tsx**：
   ```typescript
   export const EnhancedDashboard: React.FC = () => {
     const { user: authUser } = useAuth();
     const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
     const { user, mode, toggleMode } = useAuthStore();
     
     // 處理載入狀態
     if (orgLoading) {
       return (
         <Layout style={styles.container}>
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color="#FF6B6B" />
             <Text style={styles.loadingText}>載入中...</Text>
           </View>
         </Layout>
       );
     }
     
     // 真正的未登入檢查
     if (!authUser) {
       return (
         <Layout style={styles.container}>
           <View style={styles.emptyState}>
             <Text style={styles.emptyText}>請先登入</Text>
           </View>
         </Layout>
       );
     }
     
     // 組織資訊可能為空（新用戶）
     if (!currentOrganization || !currentTeam) {
       return (
         <Layout style={styles.container}>
           <View style={styles.emptyState}>
             <Text style={styles.emptyText}>請先設定組織資訊</Text>
           </View>
         </Layout>
       );
     }
     
     // 正常渲染
     return (
       // ... 原本的內容
     );
   };
   ```

### 第四階段：整合測試

1. 確認導航流程：
   - 點擊「+」按鈕 → 顯示 ActionPopover
   - 選擇「任務」→ 開啟 CreateTaskModal
   - Modal 預設顯示語音輸入介面
   - 可切換到文字輸入

2. 確認首頁載入：
   - 載入中顯示 loading 狀態
   - 已登入用戶正常顯示內容
   - 未登入用戶顯示登入提示

## 現有程式碼參考

### 需要恢復的檔案（從 git 歷史）
- `git show af5c8ed4:src/navigation/MainTabNavigator.tsx` - 原始的導航結構
- `git show af5c8ed4:src/components/common/ActionPopover.tsx` - ActionPopover 元件

### 需要修改的檔案
- `/src/navigation/MainTabNavigator.tsx` - 恢復「+」按鈕
- `/src/types/navigation.ts` - 恢復 AddAction 類型
- `/src/screens/modals/CreateTaskModal.tsx` - 整合語音輸入
- `/src/screens/dashboard/EnhancedDashboard.tsx` - 修復載入狀態

### 可以保留的元件
- `/src/components/input/SimplifiedVoiceTaskInput.tsx` - 語音輸入元件
- `/src/components/dashboard/TaskListSection.tsx` - 任務列表
- `/src/components/dashboard/RecentCustomersSection.tsx` - 近期客戶

## 注意事項

1. **保留優點**：PRP-22 中的 TaskListSection 和 RecentCustomersSection 是好的改進，應該保留
2. **Modal 適配**：SimplifiedVoiceTaskInput 需要在 Modal 環境中正常運作
3. **狀態管理**：確保 useOrganization hook 正確返回 loading 狀態
4. **向後相容**：確保既有的任務建立流程仍然可用

## 驗證標準

```bash
# TypeScript 檢查
npm run type-check

# 測試導航流程
# 1. 啟動應用
# 2. 點擊「+」按鈕
# 3. 選擇「任務」
# 4. 確認顯示語音輸入介面
# 5. 確認可以切換到文字輸入

# 測試首頁載入
# 1. 登出後重新登入
# 2. 確認顯示 loading 狀態
# 3. 確認載入完成後顯示正常內容
```

## 成功指標
1. 「+」按鈕恢復正常運作
2. 點擊「任務」直接顯示語音輸入（在 Modal 中）
3. 首頁不再錯誤顯示「請先登入」
4. 保留 TaskListSection 和 RecentCustomersSection 功能

## 風險評估
- **低風險**：主要是恢復原有功能，風險較低
- **中風險**：需要確保 SimplifiedVoiceTaskInput 在 Modal 中正常運作

---

**評分：9/10**
- 明確的問題診斷和解決方案
- 詳細的實作步驟和程式碼範例
- 考慮了載入狀態和錯誤處理
- 保留了 PRP-22 的優點