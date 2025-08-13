# AdaptiveModal 使用指南

## 📖 概述

AdaptiveModal 是一個跨平台統一的 Modal 元件，已在專案中完整實作於 `/src/components/adaptive/core/AdaptiveModal.tsx`。它自動處理 Web 和 Native 平台的差異，提供一致的 API 和使用體驗。

## ✨ 主要特性

- ✅ 跨平台支援（Web/iOS/Android）
- ✅ Web Portal 實現
- ✅ ESC 鍵關閉（Web）
- ✅ 點擊外部關閉
- ✅ 多種尺寸和動畫
- ✅ 內建按鈕系統
- ✅ 無障礙支援
- ✅ TypeScript 完整類型

## 🚀 快速開始

### 基本使用

```typescript
import { AdaptiveModal } from '@/components/adaptive/core/AdaptiveModal';

function MyComponent() {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <Button onPress={() => setVisible(true)}>開啟 Modal</Button>
      
      <AdaptiveModal
        visible={visible}
        onClose={() => setVisible(false)}
        title="標題"
        subtitle="副標題"
      >
        <Text>Modal 內容</Text>
      </AdaptiveModal>
    </>
  );
}
```

### 帶按鈕的 Modal

```typescript
<AdaptiveModal
  visible={visible}
  onClose={() => setVisible(false)}
  title="確認操作"
  primaryButton={{
    title: '確認',
    onPress: handleConfirm,
    variant: 'primary'
  }}
  secondaryButton={{
    title: '取消',
    onPress: handleCancel,
    variant: 'outline'
  }}
>
  <Text>您確定要執行此操作嗎？</Text>
</AdaptiveModal>
```

### 使用 ConfirmModal

```typescript
import { ConfirmModal } from '@/components/adaptive/core/AdaptiveModal';

<ConfirmModal
  visible={showConfirm}
  title="刪除確認"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  confirmText="刪除"
  cancelText="取消"
>
  <Text>此操作無法復原，確定要刪除嗎？</Text>
</ConfirmModal>
```

### 使用 AlertModal

```typescript
import { AlertModal } from '@/components/adaptive/core/AdaptiveModal';

<AlertModal
  visible={showAlert}
  title="操作成功"
  onOK={() => setShowAlert(false)}
  okText="知道了"
>
  <Text>您的資料已成功儲存！</Text>
</AlertModal>
```

## 📝 API 參考

### AdaptiveModal Props

| 屬性 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| **visible** | `boolean` | `false` | 控制 Modal 顯示/隱藏 |
| **onClose** | `() => void` | - | 關閉事件處理 |
| **onShow** | `() => void` | - | 顯示時觸發 |
| **onDismiss** | `() => void` | - | 隱藏時觸發 |
| **title** | `string` | - | Modal 標題 |
| **subtitle** | `string` | - | Modal 副標題 |
| **children** | `ReactNode` | - | Modal 內容 |
| **size** | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | Modal 尺寸 |
| **position** | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'center'` | Modal 位置 |
| **animationType** | `'slide' \| 'fade' \| 'none'` | `'fade'` | 動畫類型 |
| **closeOnOverlayClick** | `boolean` | `true` | 點擊遮罩層關閉 |
| **closeOnEscape** | `boolean` | `true` | ESC 鍵關閉 (Web) |
| **showCloseButton** | `boolean` | `true` | 顯示關閉按鈕 |
| **preventScroll** | `boolean` | `true` | 防止背景滾動 (Web) |
| **primaryButton** | `ButtonConfig` | - | 主要按鈕配置 |
| **secondaryButton** | `ButtonConfig` | - | 次要按鈕配置 |
| **portal** | `boolean` | `true` | 使用 Portal (Web) |
| **testID** | `string` | - | 測試 ID |

### ButtonConfig

```typescript
interface ButtonConfig {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}
```

### 尺寸說明

- **small**: 最大寬度 400px
- **medium**: 最大寬度 600px（預設）
- **large**: 最大寬度 800px
- **fullscreen**: 全螢幕

## 🔄 遷移指南

### 從 react-native Modal 遷移

**Before:**
```typescript
import { Modal } from 'react-native';

<Modal
  visible={visible}
  animationType="slide"
  onRequestClose={onClose}
>
  <View>
    <Text>內容</Text>
    <Button title="關閉" onPress={onClose} />
  </View>
</Modal>
```

**After:**
```typescript
import { AdaptiveModal } from '@/components/adaptive/core/AdaptiveModal';

<AdaptiveModal
  visible={visible}
  animationType="slide"
  onClose={onClose}
>
  <Text>內容</Text>
</AdaptiveModal>
```

### 從 Platform.OS 條件遷移

**Before:**
```typescript
{Platform.OS === 'web' ? (
  <View style={webModalStyles}>
    {/* Web 實作 */}
  </View>
) : (
  <Modal visible={visible}>
    {/* Native 實作 */}
  </Modal>
)}
```

**After:**
```typescript
<AdaptiveModal visible={visible} onClose={onClose}>
  {/* 統一實作 */}
</AdaptiveModal>
```

### 從 WebModal 遷移

**Before:**
```typescript
import { WebModal } from '@/components/web/WebModal';

<WebModal onClose={handleClose}>
  <View>內容</View>
</WebModal>
```

**After:**
```typescript
import { AdaptiveModal } from '@/components/adaptive/core/AdaptiveModal';

<AdaptiveModal
  visible={true}
  onClose={handleClose}
  showCloseButton={true}
>
  <View>內容</View>
</AdaptiveModal>
```

## 🎨 樣式自訂

### 使用自訂樣式

```typescript
<AdaptiveModal
  visible={visible}
  style={{
    maxWidth: 500,
    minHeight: 300
  }}
  overlayStyle={{
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  }}
  contentStyle={{
    borderRadius: 20,
    padding: 24
  }}
  headerStyle={{
    backgroundColor: '#f0f0f0'
  }}
>
  <Text>自訂樣式內容</Text>
</AdaptiveModal>
```

### Web 和 Native 特定樣式

```typescript
<AdaptiveModal
  visible={visible}
  webStyle={{
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  }}
  nativeStyle={{
    elevation: 10
  }}
>
  <Text>平台特定樣式</Text>
</AdaptiveModal>
```

## 🧪 測試

### 單元測試範例

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { AdaptiveModal } from '@/components/adaptive/core/AdaptiveModal';

describe('MyModal', () => {
  it('should show and hide modal', () => {
    const onClose = jest.fn();
    const { getByText, queryByText, rerender } = render(
      <AdaptiveModal visible={false} onClose={onClose}>
        <Text>測試內容</Text>
      </AdaptiveModal>
    );
    
    // 初始隱藏
    expect(queryByText('測試內容')).toBeNull();
    
    // 顯示 Modal
    rerender(
      <AdaptiveModal visible={true} onClose={onClose}>
        <Text>測試內容</Text>
      </AdaptiveModal>
    );
    
    expect(getByText('測試內容')).toBeTruthy();
    
    // 關閉 Modal
    fireEvent.press(getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

## ⚠️ 注意事項

1. **Portal 目標**：Web 平台預設使用 document.body 作為 Portal 目標，可透過 `portalTarget` 自訂
2. **防止滾動**：Web 平台會自動防止背景滾動，可透過 `preventScroll={false}` 關閉
3. **無障礙**：記得設定適當的 `accessibilityLabel` 和 `accessibilityRole`
4. **記憶體管理**：確保在元件卸載時正確關閉 Modal

## 🚫 不要做的事

- ❌ 不要直接使用 `react-native` 的 `Modal`
- ❌ 不要使用 `Platform.OS` 判斷
- ❌ 不要建立新的 Modal 包裝器
- ❌ 不要忘記處理 `onClose` 事件

## 📚 完整範例

### 複雜表單 Modal

```typescript
function EditProfileModal({ visible, onClose, user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser({ name, email });
      showSuccessToast('個人資料已更新');
      onClose();
    } catch (error) {
      showErrorToast('更新失敗');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdaptiveModal
      visible={visible}
      onClose={onClose}
      title="編輯個人資料"
      size="medium"
      primaryButton={{
        title: '儲存',
        onPress: handleSave,
        loading: loading,
        disabled: !name || !email
      }}
      secondaryButton={{
        title: '取消',
        onPress: onClose,
        disabled: loading
      }}
    >
      <View style={styles.form}>
        <TextInput
          label="姓名"
          value={name}
          onChangeText={setName}
          placeholder="請輸入姓名"
        />
        <TextInput
          label="電子郵件"
          value={email}
          onChangeText={setEmail}
          placeholder="請輸入電子郵件"
          keyboardType="email-address"
        />
      </View>
    </AdaptiveModal>
  );
}
```

### 列表選擇 Modal

```typescript
function SelectItemModal({ visible, onClose, onSelect, items }) {
  return (
    <AdaptiveModal
      visible={visible}
      onClose={onClose}
      title="選擇項目"
      size="large"
      showCloseButton={true}
    >
      <ScrollView>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          >
            <Text>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </AdaptiveModal>
  );
}
```

## 🔗 相關資源

- [AdaptiveModal 原始碼](/src/components/adaptive/core/AdaptiveModal.tsx)
- [測試檔案](/src/components/adaptive/core/__tests__/AdaptiveModal.test.tsx)
- [Modal 審計報告](/docs/modal-audit-report.md)

---

**最後更新**: 2025-08-13  
**維護者**: Claude