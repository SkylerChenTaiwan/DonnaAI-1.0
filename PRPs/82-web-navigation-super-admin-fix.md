# PRP-82: 修復 Web 導航系統與 Super Admin 頁面架構

## 問題描述

### 使用者回報的關鍵問題
1. **導航斷層**：從首頁進入「組織管理」後，無法返回上一層
2. **側邊欄消失**：進入 Super Admin 頁面後側邊欄完全消失
3. **按鈕功能重複**：組織卡片上的設定按鈕與直接點擊卡片功能相同
4. **Icon 載入失敗**：部分按鈕圖標可能未正確載入

### 根本原因分析

#### 1. 導航架構問題
- WebNavigator 只處理主要 Tab 頁面（Home, Database, Tools, Settings）
- Super Admin 頁面（OrganizationsScreen, OrganizationDetailScreen 等）直接使用 Stack Navigator
- 這導致從 Settings 導航到 OrganizationsScreen 時，離開了 WebNavigator 的範圍，失去側邊欄

#### 2. 佈局系統不一致
- OrganizationsScreen 在 Web 平台直接返回內容，期待 WebNavigator 提供側邊欄
- 但實際上它被 Stack Navigator 直接渲染，沒有側邊欄包裹

#### 3. UX 設計缺陷
- 缺少返回按鈕或麵包屑導航
- 冗餘的操作按鈕（設定按鈕與卡片點擊功能相同）
- Icon 組件在 Web 平台可能有渲染問題

## 現有架構研究

### 檔案結構
```
src/navigation/
├── AppNavigator.tsx        # 主導航器，決定使用 WebNavigator 或 MainTabNavigator
├── WebNavigator.tsx        # Web 平台側邊欄導航（只包含主要 Tab）
├── MainTabNavigator.tsx    # 移動端底部導航
└── layoutConfig.ts         # 佈局配置（定義哪些頁面需要側邊欄）

src/screens/superadmin/
├── OrganizationsScreen.tsx       # 組織列表
├── OrganizationDetailScreen.tsx  # 組織詳情
└── SuperAdminDashboard.tsx       # Super Admin 首頁
```

### 關鍵程式碼參考

#### AppNavigator.tsx
- Line 71: `shouldUseWebNav` 決定使用 WebNavigator
- Line 109: MainTabs 使用 WebNavigator 或 MainTabNavigator
- Line 166-190: OrganizationsScreen 直接註冊在 Stack Navigator

#### WebNavigator.tsx
- Line 112-132: 只包含 Home, Database, Tools, Settings 四個主要頁面
- Line 88-98: 側邊欄渲染邏輯

#### OrganizationsScreen.tsx
- Line 267-268: Web 平台直接返回內容（期待有側邊欄包裹）
- Line 175-193: 冗餘的操作按鈕

## 解決方案設計

### 方案 A：擴展 WebNavigator（推薦）
將所有需要側邊欄的頁面都納入 WebNavigator 管理

**優點**：
- 統一的導航體驗
- 側邊欄始終可見
- 符合 Web 應用程式的導航模式

**缺點**：
- 需要重構導航結構
- 可能影響深層連結

### 方案 B：創建 AdminWebNavigator
為 Admin 頁面創建專門的導航器

**優點**：
- 模組化管理
- 不影響現有主要頁面

**缺點**：
- 增加複雜度
- 需要處理導航器切換

### 方案 C：使用 Layout Wrapper
在每個 Admin 頁面手動添加側邊欄

**優點**：
- 改動最小
- 獨立控制每個頁面

**缺點**：
- 代碼重複
- 不符合 DRY 原則

## 實作計劃

### Phase 1: 導航架構重構

#### 1.1 擴展 WebNavigator
```typescript
// src/navigation/WebNavigator.tsx
const WebNavigator = () => {
  // ... existing code ...
  
  return (
    <View style={styles.container}>
      {/* 側邊欄 */}
      {showSidebar && (
        <View style={[styles.sidebarContainer, ...]}>
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        </View>
      )}
      
      {/* 主內容區 */}
      <View style={styles.mainContent}>
        {showTopBar && <TopBar />}
        
        {/* 擴展路由 */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* 現有主要頁面 */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Database" component={DatabaseScreen} />
          <Stack.Screen name="Tools" component={ToolsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          
          {/* 新增 Admin 頁面 */}
          <Stack.Screen name="OrganizationsScreen" component={OrganizationsScreen} />
          <Stack.Screen name="OrganizationDetailScreen" component={OrganizationDetailScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} />
          // ... 其他 Admin 頁面
        </Stack.Navigator>
      </View>
    </View>
  );
};
```

#### 1.2 更新 AppNavigator
移除 Stack Navigator 中的 Admin 頁面定義，避免重複註冊

#### 1.3 更新側邊欄導航項目
```typescript
// src/components/navigation/Sidebar.tsx
const navigationItems = [
  // ... existing items ...
  {
    id: 'Admin',
    title: '管理',
    icon: 'settings-outline',
    hasChildren: true,
    children: [
      { id: 'OrganizationsScreen', title: '組織管理' },
      { id: 'UserManagementScreen', title: '用戶管理' },
      // ... 其他管理頁面
    ]
  }
];
```

### Phase 2: UX 改進

#### 2.1 添加麵包屑導航
```typescript
// src/components/navigation/Breadcrumbs.tsx
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.item}>
          {index > 0 && <Text style={styles.separator}>/</Text>}
          {item.onPress ? (
            <TouchableOpacity onPress={item.onPress}>
              <Text style={styles.link}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.current}>{item.label}</Text>
          )}
        </View>
      ))}
    </View>
  );
};
```

#### 2.2 移除冗餘按鈕
```typescript
// src/screens/superadmin/OrganizationsScreen.tsx
// 移除設定按鈕，保留狀態切換按鈕
<View style={styles.orgActions}>
  <TouchableOpacity
    style={styles.actionButton}
    onPress={() => handleToggleStatus(item)}
  >
    <Icon
      name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
      size={20}
      color={DesignSystem.colors.gray[700]}
    />
    <Text style={styles.actionLabel}>
      {item.status === 'active' ? '停用' : '啟用'}
    </Text>
  </TouchableOpacity>
</View>
```

#### 2.3 修復 Icon 載入問題
```typescript
// 確保 Icon 組件在 Web 平台正確載入
// 可能需要添加 fallback 或使用 SVG
```

### Phase 3: 導航邏輯優化

#### 3.1 統一導航方法
```typescript
// src/utils/navigation.ts
export const navigateToAdmin = (navigation: any, screen: string, params?: any) => {
  if (Platform.OS === 'web') {
    // Web 平台確保在 WebNavigator 內導航
    navigation.navigate(screen, params);
  } else {
    // 移動端使用 Stack 導航
    navigation.navigate(screen, params);
  }
};
```

#### 3.2 返回導航處理
```typescript
// src/hooks/useBackNavigation.ts
export const useBackNavigation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // 根據當前路由決定預設返回位置
      const defaultBackRoute = getDefaultBackRoute(route.name);
      navigation.navigate(defaultBackRoute);
    }
  };
  
  return { goBack };
};
```

### Phase 4: 測試驗證

#### 4.1 功能測試清單
- [ ] 從 Settings 導航到 OrganizationsScreen，側邊欄保持可見
- [ ] 從 OrganizationsScreen 導航到 OrganizationDetailScreen，側邊欄保持可見
- [ ] 返回導航正常工作
- [ ] 所有按鈕功能正確，無重複
- [ ] Icon 正確顯示
- [ ] 響應式佈局正常

#### 4.2 相容性測試
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

## 實作順序

1. **備份現有程式碼**
2. **擴展 WebNavigator** - 添加 Admin 頁面路由
3. **更新 AppNavigator** - 移除重複的路由定義
4. **更新側邊欄** - 添加 Admin 導航項目
5. **修復 OrganizationsScreen** - 移除冗餘按鈕
6. **添加麵包屑導航** - 提供清晰的位置指示
7. **測試所有導航路徑**
8. **修復發現的問題**
9. **部署到測試環境**
10. **用戶驗收測試**

## 驗證指標

### 必須通過的檢查
```bash
# TypeScript 類型檢查
npm run type-check

# ESLint 檢查
npm run lint

# 建置 Web 版本
npm run web:build

# 執行測試
npm run test
```

### 功能驗證
1. 側邊欄在所有 Admin 頁面保持可見
2. 可以從任何 Admin 頁面返回
3. 所有導航路徑正常工作
4. 無控制台錯誤
5. 效能指標無明顯下降

## 風險評估

### 高風險
- 導航架構變更可能影響現有功能
- 深層連結可能需要調整

### 中風險
- 狀態管理可能需要調整
- 側邊欄高亮顯示邏輯需要更新

### 低風險
- UI 樣式調整
- Icon 組件更新

## 備選方案

如果擴展 WebNavigator 遇到困難，可以：
1. 使用 React Context 管理側邊欄狀態
2. 創建 HOC 包裹需要側邊欄的頁面
3. 使用 React Router（需要較大改動）

## 參考資料

### 內部檔案
- `/src/navigation/WebNavigator.tsx` - 現有 Web 導航器
- `/src/navigation/AppNavigator.tsx` - 主導航器
- `/src/navigation/layoutConfig.ts` - 佈局配置
- `/src/screens/superadmin/OrganizationsScreen.tsx` - 組織管理頁面

### 外部資源
- [React Navigation Nesting Navigators](https://reactnavigation.org/docs/nesting-navigators)
- [React Navigation Web Support](https://reactnavigation.org/docs/web-support)
- [Expo Router Web Navigation](https://docs.expo.dev/router/advanced/web/)

## 成功標準

1. **功能完整性** - 所有導航功能正常工作
2. **用戶體驗** - 導航直觀、返回路徑清晰
3. **程式碼品質** - 無重複程式碼、架構清晰
4. **效能** - 導航響應快速、無卡頓
5. **相容性** - 支援主流瀏覽器

## 實作信心指數：8/10

**扣分原因**：
- 導航架構改動較大，可能有未預見的影響 (-1)
- Icon 組件問題可能需要額外調試 (-1)

**加分因素**：
- 問題原因明確，解決方案清晰
- 有完整的測試計劃
- 備選方案充分

---

**建立日期**: 2025-08-07
**優先級**: P0（緊急）
**預估工時**: 4-6 小時
**影響範圍**: Web 平台所有 Admin 頁面