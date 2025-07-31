# PRP-63: 導航系統 Notion 風格重新設計

## 概述
重新設計 DonnaAI 的導航系統，使其更接近 Notion 的 2024/2025 年設計風格，解決當前佈局的多個問題。

## 問題分析

### 現有問題
1. **側邊欄未延伸到底部** - 側邊欄下方有空白區域，不符合 Notion 的滿高度設計
2. **"新增" 按鈕過大** - 當前 48x48px 的按鈕相比其他導航圖標過大
3. **側邊欄過寬** - 280px 寬度對於內容量來說過寬，浪費空間
4. **缺少可展開的子導航** - 資料庫項目應該有懸停時顯示的展開箭頭
5. **中間欄位佔用空間** - 桌面版的分頁容器減少了資料庫的可用空間
6. **背景層次過多** - 應使用單一白色背景而非多層背景

### 目標狀態
- 側邊欄寬度：220px（更緊湊）
- 新增按鈕：32x32px（與其他圖標一致）
- 側邊欄高度：100vh（全螢幕高度）
- 可展開的資料庫導航系統
- 單一白色背景層
- 最大化資料庫內容區域

## 技術方案

### 1. 側邊欄佈局修正

#### 調整側邊欄容器
```typescript
// Sidebar.tsx 樣式調整
sidebar: {
  width: 220,  // 從 280px 減少到 220px
  height: '100vh',  // 確保全高度
  position: 'fixed' as 'fixed',  // 固定定位
  left: 0,
  top: 0,
  backgroundColor: '#ffffff',
  borderRightWidth: 1,
  borderRightColor: '#e9e9e7',
  zIndex: 100,
}
```

#### 調整新增按鈕尺寸
```typescript
actionButton: {
  width: 32,  // 從 48px 減少到 32px
  height: 32,  // 從 48px 減少到 32px
  borderRadius: 6,  // 調整圓角
  backgroundColor: DesignSystem.colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
}
```

### 2. 可展開的資料庫導航

#### 新增 ExpandableMenuItem 組件
```typescript
interface ExpandableMenuItemProps {
  label: string;
  icon: string;
  isActive: boolean;
  hasChildren?: boolean;
  expanded?: boolean;
  onPress: () => void;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}

const ExpandableMenuItem: React.FC<ExpandableMenuItemProps> = ({
  label,
  icon,
  isActive,
  hasChildren,
  expanded,
  onPress,
  onToggleExpand,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <View>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.menuItem,
          isActive && styles.menuItemActive,
          hovered && styles.menuItemHover,
        ]}
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
      >
        <Icon name={icon} size={20} color={isActive ? '#37352f' : '#787774'} />
        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
          {label}
        </Text>
        {hasChildren && isHovered && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={onToggleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name={expanded ? 'chevron-down' : 'chevron-forward'} 
              size={16} 
              color="#91918e" 
            />
          </TouchableOpacity>
        )}
      </Pressable>
      {expanded && children && (
        <View style={styles.subMenuContainer}>
          {children}
        </View>
      )}
    </View>
  );
};
```

#### 資料庫子項目結構
```typescript
const databaseSubItems = [
  { id: 'customers', label: '客戶', icon: 'person' },
  { id: 'records', label: '紀錄', icon: 'document-text' },
  { id: 'tasks', label: '任務', icon: 'checkbox' },
];
```

### 3. 移除中間欄位（桌面分頁容器）

#### 修改 DatabaseScreen.tsx
```typescript
// 移除 desktopSidebar 樣式
// 直接渲染內容而不使用中間容器

return (
  <Layout>
    <View style={styles.mainContent}>
      {/* 直接渲染資料庫內容 */}
      {renderContent()}
    </View>
  </Layout>
);

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',  // 單一白色背景
    marginLeft: 220,  // 配合新的側邊欄寬度
  },
});
```

### 4. 統一背景顏色

#### 全局樣式調整
```typescript
// 移除所有層疊背景
// 使用單一白色背景 #ffffff
// 邊框使用 #e9e9e7
```

## 實施步驟

### 第一階段：基礎佈局調整（Day 1）
1. ✅ 修改 Sidebar.tsx 的寬度和高度設定
2. ✅ 調整新增按鈕尺寸
3. ✅ 修正側邊欄的定位方式
4. ✅ 測試響應式佈局

### 第二階段：可展開導航實作（Day 2）
1. ✅ 建立 ExpandableMenuItem 組件
2. ✅ 實作懸停顯示展開箭頭
3. ✅ 整合子項目導航
4. ✅ 添加展開/收合動畫

### 第三階段：移除中間欄位（Day 3）
1. ✅ 修改 DatabaseScreen 佈局結構
2. ✅ 調整內容區域邊距
3. ✅ 確保響應式設計正常運作

### 第四階段：統一視覺風格（Day 4）
1. ✅ 統一所有背景為白色
2. ✅ 調整邊框和陰影
3. ✅ 優化懸停效果
4. ✅ 最終測試和調整

## 成功指標
- [ ] 側邊欄延伸到螢幕底部
- [ ] 新增按鈕與其他圖標大小一致
- [ ] 側邊欄寬度適中（220px）
- [ ] 資料庫項目可展開/收合
- [ ] 無中間欄位，內容區域最大化
- [ ] 統一的白色背景

## 風險評估
- **低風險**：佈局調整可能影響現有的響應式設計
- **中風險**：可展開導航需要新的狀態管理
- **緩解措施**：保留原始檔案備份，逐步實施變更

## 預期成果
完成後，DonnaAI 的導航系統將更接近 Notion 的現代極簡設計，提供更好的使用者體驗和更大的內容顯示空間。