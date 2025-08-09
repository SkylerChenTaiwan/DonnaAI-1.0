# PRP-88: Web 專用圖標元件系統

## 📋 元資訊
- **PRP 編號**: 88
- **標題**: Web 專用圖標元件系統 - 徹底解決 NetworkError 與字體載入問題
- **作者**: AI Assistant
- **創建日期**: 2025-08-09
- **預估工時**: 4-6 小時
- **優先級**: 高
- **相關 PRPs**: 無

## 🎯 目標
創建專門為 Web 平台設計的圖標元件系統，完全繞過 @expo/vector-icons 的字體載入機制，徹底解決 NetworkError 和字體載入問題。

## 🔍 背景

### 現有問題
根據 `docs/troubleshooting/expo-web-icons-solution.md` 的記錄：
1. **Metro Bundler 破壞字體檔案**: Metro 將二進制字體檔案當作文本處理，導致字體損壞
2. **@expo/vector-icons 嘗試載入損壞字體**: 元件內部仍會嘗試 fetch 本地字體，拋出 NetworkError
3. **CDN 解決方案治標不治本**: 雖然 CDN 載入了正確字體，但無法阻止元件內部的錯誤載入邏輯

### 錯誤訊息
```
index-ce7904557ee558…45988dc1189a.js:522 Uncaught (in promise) NetworkError: A network error occurred.
```

### 現有嘗試與限制
- ❌ 使用 CDN 載入字體 - 圖標顯示但仍有 NetworkError
- ❌ 攔截錯誤 - 可能掩蓋其他真實錯誤
- ❌ 各種字體載入策略 - 無法控制 @expo/vector-icons 內部行為

## 📚 技術研究

### 1. 現有程式碼模式
專案中已有 SVG 圖標實現範例：
- `src/components/database/notion/NotionIcons.tsx` - 使用 React.createElement 創建 SVG
- 平台判斷模式：`Platform.OS === 'web'`
- 現有 react-native-svg@15.11.2 支援

### 2. 外部最佳實踐
根據 2024-2025 React Native Web 圖標最佳實踐：
- 使用 SVG 而非字體圖標（可縮放、輕量、可樣式化）
- 實作 tree-shaking 優化（只打包使用的圖標）
- 支援標準 props（size、color、style）
- 確保跨平台一致性

### 3. 參考資源
- [React Native SVG](https://github.com/software-mansion/react-native-svg)
- [SVGR 工具](https://react-svgr.com/)
- [Hugeicons React 實踐](https://hugeicons.com/blog/design/10-best-react-and-svg-icon-libraries-in-2024)

## 🏗️ 實作架構

### 核心設計原則
1. **平台隔離**: Web 和 Native 完全分離的實現
2. **API 相容**: 保持與現有 Icon/MaterialIcon 元件相同的 API
3. **漸進遷移**: 不需要一次性修改所有使用處
4. **效能優化**: 使用靜態 SVG，避免運行時載入
5. **類型安全**: 完整的 TypeScript 支援

### 目錄結構
```
src/components/common/
├── Icon.tsx                    # 更新：加入平台判斷
├── Icon.web.tsx                # 新增：Web 專用實現
├── MaterialIcon.tsx            # 更新：加入平台判斷  
├── MaterialIcon.web.tsx        # 新增：Web 專用實現
├── icons/
│   ├── ionicons/
│   │   ├── index.ts           # 匯出所有 Ionicons
│   │   ├── add.tsx            # 單個圖標元件
│   │   └── ...
│   ├── material/
│   │   ├── index.ts           # 匯出所有 Material Icons
│   │   ├── add.tsx            # 單個圖標元件
│   │   └── ...
│   └── utils/
│       └── createIcon.tsx     # 圖標工廠函數
```

## 💻 實作計畫

### 第一階段：建立基礎架構

#### 1. 創建圖標工廠函數
```typescript
// src/components/common/icons/utils/createIcon.tsx
import React from 'react';
import { View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

export function createIcon(paths: string[], viewBox: string = "0 0 24 24") {
  return React.memo<IconProps>(({ size = 24, color = '#000', style }) => {
    if (typeof window === 'undefined') {
      // SSR 環境返回空元件
      return null;
    }

    return (
      <View style={[{ width: size, height: size }, style]}>
        <svg
          width={size}
          height={size}
          viewBox={viewBox}
          fill={color}
          style={{ display: 'block' }}
        >
          {paths.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </svg>
      </View>
    );
  });
}
```

#### 2. 創建常用圖標
```typescript
// src/components/common/icons/ionicons/add.tsx
import { createIcon } from '../utils/createIcon';

export const AddIcon = createIcon(
  ['M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z']
);

// 以此類推創建所有需要的圖標...
```

### 第二階段：實作 Web 專用元件

#### 3. Icon.web.tsx 實現
```typescript
// src/components/common/Icon.web.tsx
import React from 'react';
import { ViewStyle } from 'react-native';
import * as IoniconsWeb from './icons/ionicons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// 圖標名稱映射
const iconMap: Record<string, React.ComponentType<any>> = {
  'add': IoniconsWeb.AddIcon,
  'add-circle': IoniconsWeb.AddCircleIcon,
  'arrow-back': IoniconsWeb.ArrowBackIcon,
  // ... 其他映射
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found, using default`);
    return <IoniconsWeb.HelpCircleIcon size={size} color={color} style={style} />;
  }
  
  return <IconComponent size={size} color={color} style={style} />;
};

export type { IconProps };
```

#### 4. 更新主 Icon 元件
```typescript
// src/components/common/Icon.tsx
import { Platform } from 'react-native';

// 條件性載入
const IconImplementation = Platform.select({
  web: () => require('./Icon.web').Icon,
  default: () => require('@expo/vector-icons').Ionicons,
})();

export const Icon = IconImplementation;
export type { IconProps } from './Icon.web';
```

### 第三階段：批量生成圖標

#### 5. 創建圖標生成腳本
```javascript
// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');

// 圖標資料（從現有 SVG 提取）
const ioniconsData = {
  'add': ['M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'],
  'add-circle': ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z'],
  // ... 更多圖標
};

// 生成圖標檔案
Object.entries(ioniconsData).forEach(([name, paths]) => {
  const componentName = name.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('') + 'Icon';
  
  const content = `
import { createIcon } from '../utils/createIcon';

export const ${componentName} = createIcon(
  ${JSON.stringify(paths)}
);
`;
  
  const fileName = name.replace(/-/g, '_') + '.tsx';
  fs.writeFileSync(
    path.join(__dirname, '../src/components/common/icons/ionicons', fileName),
    content.trim()
  );
});
```

### 第四階段：測試與驗證

#### 6. 單元測試
```typescript
// src/tests/components/common/Icon.web.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon } from '@/components/common/Icon.web';

describe('Icon.web', () => {
  it('應該正確渲染圖標', () => {
    const { getByTestId } = render(
      <Icon name="add" size={24} color="#000" testID="icon" />
    );
    
    const icon = getByTestId('icon');
    expect(icon).toBeTruthy();
  });
  
  it('應該應用正確的尺寸和顏色', () => {
    const { getByTestId } = render(
      <Icon name="add" size={32} color="#ff0000" testID="icon" />
    );
    
    const icon = getByTestId('icon');
    expect(icon.props.style).toMatchObject({
      width: 32,
      height: 32,
    });
  });
  
  it('當圖標不存在時應顯示預設圖標', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    render(<Icon name="non-existent" />);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Icon "non-existent" not found, using default'
    );
  });
});
```

### 第五階段：移除舊方案

#### 7. 清理 fix-web-icons.js
移除或註解掉 CDN 字體載入邏輯，因為不再需要：
```javascript
// scripts/fix-web-icons.js
// 保留錯誤攔截但移除字體載入
```

#### 8. 更新建構腳本
```json
// package.json
{
  "scripts": {
    "web:build": "expo export --platform web --output-dir dist-web && node scripts/fix-portal.js",
    // 移除 fix-web-icons.js 或保留錯誤處理部分
  }
}
```

## 📊 實作任務清單

1. [ ] **基礎架構** (1小時)
   - [ ] 創建 icons 目錄結構
   - [ ] 實作 createIcon 工廠函數
   - [ ] 設置 TypeScript 類型定義

2. [ ] **圖標創建** (2小時)
   - [ ] 收集現有使用的所有圖標名稱
   - [ ] 提取對應的 SVG 路徑
   - [ ] 批量生成圖標元件

3. [ ] **Web 元件實作** (1小時)
   - [ ] 創建 Icon.web.tsx
   - [ ] 創建 MaterialIcon.web.tsx
   - [ ] 實作圖標映射邏輯

4. [ ] **整合與測試** (1小時)
   - [ ] 更新主元件的平台判斷
   - [ ] 編寫單元測試
   - [ ] 本地測試驗證

5. [ ] **部署與驗證** (1小時)
   - [ ] 編譯 Web 版本
   - [ ] 部署到 Firebase
   - [ ] 驗證 NetworkError 消失
   - [ ] 確認圖標正確顯示

## ✅ 驗證標準

### 功能驗證
```bash
# 1. 編譯檢查
npm run web:build

# 2. 單元測試
npm run test -- Icon.web

# 3. 本地測試
npm run web:dev
# 開啟瀏覽器 Console，確認無 NetworkError

# 4. 部署測試
npm run web:deploy
# 訪問 https://donnaai-5e601.web.app
# 確認圖標正常顯示且無錯誤
```

### 成功標準
- [ ] Console 無 NetworkError
- [ ] 所有圖標正確顯示
- [ ] 顏色和尺寸 props 正常工作
- [ ] 不影響 Native 平台
- [ ] 測試覆蓋率 > 80%

## 🚀 遷移策略

### 階段一：並行運行
1. 新元件與舊元件並存
2. 逐步測試各頁面
3. 收集問題回饋

### 階段二：逐步遷移
1. 先遷移問題最多的頁面
2. 監控錯誤日誌
3. 確保功能正常

### 階段三：完全替換
1. 移除 @expo/vector-icons 的 Web 使用
2. 清理 CDN 載入邏輯
3. 更新文檔

## 📝 注意事項

### 技術考量
1. **SVG 內容安全**: 確保 SVG 路徑來源可靠
2. **Bundle 大小**: 使用 tree-shaking 優化
3. **SSR 相容**: 處理 server-side rendering 情況
4. **快取策略**: 利用瀏覽器快取機制

### 效能優化
1. **懶載入**: 考慮按需載入圖標
2. **Memoization**: 使用 React.memo 避免重複渲染
3. **批量處理**: 一次性載入常用圖標

### 維護考量
1. **圖標更新流程**: 建立標準化的新增圖標流程
2. **版本管理**: 追蹤圖標變更歷史
3. **文檔更新**: 維護圖標使用指南

## 🎯 預期成果

### 立即效益
- ✅ 徹底解決 NetworkError 問題
- ✅ 移除對 CDN 的依賴
- ✅ 改善頁面載入速度
- ✅ 提升開發體驗

### 長期價值
- ✅ 完全控制圖標系統
- ✅ 更容易客製化和擴展
- ✅ 減少第三方依賴
- ✅ 提高系統穩定性

## 📚 參考資料

### 內部文檔
- `docs/troubleshooting/expo-web-icons-solution.md` - 問題分析與嘗試方案
- `src/components/database/notion/NotionIcons.tsx` - 現有 SVG 實現參考

### 外部資源
- [React Native SVG Documentation](https://github.com/software-mansion/react-native-svg)
- [SVGR - Transform SVG into React Components](https://react-svgr.com/)
- [Expo Vector Icons Issue #26843](https://github.com/expo/expo/issues/26843)

## 🔄 更新歷史
- 2025-08-09: 初始版本

---

**信心評分**: 9/10

此 PRP 提供了完整的實作路徑，包含：
- 詳細的問題分析和背景
- 具體的程式碼範例
- 清晰的實作步驟
- 完整的測試策略
- 漸進式遷移計畫

唯一的不確定性在於需要轉換的圖標數量，但透過腳本自動化可以有效處理。