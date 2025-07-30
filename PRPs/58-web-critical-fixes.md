# PRP-58: Web 關鍵問題修復

**建立日期**: 2025-07-30
**目標**: 修復三個影響 Web 版使用體驗的關鍵問題
**優先級**: 高

## 背景

Web 版本已經部署到 Firebase Hosting，但在實際使用中發現三個嚴重影響使用體驗的問題：

1. **Modal 頁面導航問題**：從 APP 版移植過來的 Modal 頁面在 Web 上無法返回
2. **Icon 無法顯示**：所有圖標都無法正常顯示，影響整體 UI 體驗
3. **CSV 上傳功能失效**：CSV 批量上傳功能完全無反應

## 問題分析

### 1. Modal 頁面導航問題

**現況分析**：
- AppNavigator.tsx 中定義了多個 Modal 頁面（CreateCustomerModal、EditProfileModal 等）
- 使用 `presentation: 'modal'` 在移動端可以通過手勢返回，但 Web 端沒有此功能
- Web 端需要明確的關閉按鈕或導航方式

**根本原因**：
- React Navigation 的 modal presentation 在 Web 上的行為與移動端不同
- 缺少 Web 特定的關閉機制

### 2. Icon 顯示問題

**現況分析**：
- 使用 @expo/vector-icons 的 Ionicons
- 已嘗試多種解決方案：CDN 載入、Web Components、字體預載
- 瀏覽器控制台顯示字體載入錯誤："OTS parsing error: invalid sfntVersion"

**根本原因**：
- Expo Web 的字體載入機制與原生不同
- 可能是字體檔案路徑或格式問題
- Web Components 方式可能與 React Native Web 不相容

### 3. CSV 上傳功能問題

**現況分析**：
- CSVUploader.tsx 使用 expo-document-picker
- 程式碼中有未定義變數錯誤（userId、teamId、organizationId）
- Web 端的檔案選擇行為可能與移動端不同

**根本原因**：
- expo-document-picker 在 Web 上的相容性問題
- 程式碼錯誤導致功能無法正常執行

## 實作計劃

### 階段一：修復 Modal 導航（優先級：高）

#### 1.1 建立 Web 專用 Modal 包裝元件

```typescript
// src/components/web/WebModal.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { isWebPlatform } from '@/utils/web-detector';

interface WebModalProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const WebModal: React.FC<WebModalProps> = ({ 
  children, 
  showCloseButton = true 
}) => {
  const navigation = useNavigation();
  
  if (!isWebPlatform() || !showCloseButton) {
    return <>{children}</>;
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      {children}
    </View>
  );
};
```

#### 1.2 更新所有 Modal 頁面

為每個 Modal 頁面添加 WebModal 包裝，確保 Web 端有關閉按鈕。

### 階段二：修復 Icon 顯示（優先級：高）

#### 2.1 實作混合解決方案

```typescript
// src/components/common/Icon.tsx
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons as RNIonicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Web 端使用 ion-icon web component
const WebIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // 轉換 icon 名稱格式（React Native 到 Ionicons Web）
  const webIconName = name.replace(/-outline$/, '').replace(/-sharp$/, '');
  
  return (
    <ion-icon 
      name={webIconName}
      style={{
        fontSize: `${size}px`,
        color,
        ...style
      }}
    />
  );
};

// 統一的 Icon 元件
export const Icon: React.FC<IconProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebIcon {...props} />;
  }
  return <RNIonicons {...props} />;
};
```

#### 2.2 更新 HTML 模板

確保 Web Components 正確載入：

```html
<!-- web/index.html -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <!-- ... 其他內容 ... -->
  
  <!-- Ionicons Web Components -->
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
  
  <!-- 自定義元素定義 -->
  <script>
    // 確保自定義元素被正確註冊
    customElements.define('ion-icon', class extends HTMLElement {});
  </script>
</head>
<!-- ... -->
</html>
```

#### 2.3 全域替換 Ionicons 引用

使用批量搜尋替換，將所有：
```typescript
import { Ionicons } from '@expo/vector-icons';
```
替換為：
```typescript
import { Icon } from '@/components/common/Icon';
```

### 階段三：修復 CSV 上傳（優先級：中）

#### 3.1 修復未定義變數錯誤

```typescript
// src/components/input/CSVUploader.tsx
// 修復第 175-177 行
const handleStartImport = useCallback(async () => {
  if (!parseResult || !validationSummary) return;

  try {
    setLoading(true);
    
    // 從 auth store 獲取使用者資訊
    const { user } = useAuthStore.getState();
    
    const options: ImportOptions = {
      batchSize: 100,
      skipDuplicates: true,
      updateExisting: false,
      userId: user?.uid || '',
      teamId: user?.teamId || '',
      organizationId: user?.organizationId || '',
      onProgress: (progress) => {
        setImportProgress({
          percentage: progress.percentage,
          current: progress.currentOperation,
          estimatedTime: progress.estimatedTimeRemaining,
        });
      },
    };
    
    // ... 其餘程式碼
  } catch (error) {
    // ... 錯誤處理
  }
}, [parseResult, validationSummary, onComplete]);
```

#### 3.2 實作 Web 專用檔案選擇

```typescript
// src/utils/web-file-picker.ts
import { Platform } from 'react-native';

export const pickDocument = async (options: any) => {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          resolve({
            canceled: false,
            assets: [{
              uri,
              name: file.name,
              size: file.size,
              mimeType: file.type,
            }]
          });
        } else {
          resolve({ canceled: true });
        }
      };
      
      input.click();
    });
  } else {
    // 使用原生 DocumentPicker
    const DocumentPicker = await import('expo-document-picker');
    return DocumentPicker.getDocumentAsync(options);
  }
};
```

#### 3.3 更新 CSVUploader 使用 Web 相容的檔案選擇

```typescript
// src/components/input/CSVUploader.tsx
import { pickDocument } from '@/utils/web-file-picker';

const handleFileSelect = useCallback(async () => {
  try {
    const result = await pickDocument({
      type: ['text/csv', 'application/csv', 'text/comma-separated-values'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    
    // ... 其餘處理邏輯
  } catch (error) {
    // ... 錯誤處理
  }
}, []);
```

## 實作步驟

### 第一步：Modal 導航修復
1. 建立 WebModal 包裝元件
2. 更新所有 Modal 頁面使用 WebModal
3. 測試每個 Modal 的關閉功能

### 第二步：Icon 顯示修復
1. 建立統一的 Icon 元件
2. 更新 HTML 模板
3. 全域替換 Ionicons 引用
4. 測試所有頁面的圖標顯示

### 第三步：CSV 上傳修復
1. 修復程式碼錯誤
2. 實作 Web 檔案選擇器
3. 測試 CSV 上傳完整流程

## 驗證標準

### Modal 導航驗證
- [ ] 所有 Modal 頁面都有明顯的關閉按鈕
- [ ] 點擊關閉按鈕可以正確返回
- [ ] 鍵盤 ESC 鍵可以關閉 Modal（加分項）

### Icon 顯示驗證
- [ ] 所有頁面的圖標都正常顯示
- [ ] 圖標大小和顏色正確
- [ ] 沒有控制台錯誤

### CSV 上傳驗證
- [ ] 可以選擇 CSV 檔案
- [ ] 檔案解析正確顯示預覽
- [ ] 可以成功匯入資料
- [ ] 錯誤處理正常運作

## 風險評估

1. **Icon 元件全域替換風險**：需要大量修改，可能影響現有功能
   - 緩解：分批進行，先在幾個頁面測試
   
2. **Web 檔案 API 相容性**：不同瀏覽器可能有差異
   - 緩解：測試主流瀏覽器（Chrome、Firefox、Safari、Edge）
   
3. **Modal 行為改變**：可能影響使用者體驗
   - 緩解：保持與原生端一致的視覺和行為

## 成功指標

1. Web 版本可以正常使用所有 Modal 功能
2. 所有圖標正確顯示，無錯誤訊息
3. CSV 批量上傳功能恢復正常
4. 使用者回饋改善

## 附錄

### 參考資源
- [React Navigation Web Support](https://reactnavigation.org/docs/web-support)
- [Ionicons Web Components](https://ionicframework.com/docs/ionicons)
- [File API MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_API)

### 相關 Issue
- Web 響應式佈局（PRP-57）
- Expo SDK 53 升級（PRP-07）