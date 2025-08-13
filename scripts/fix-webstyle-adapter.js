#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 修復 WebStyleAdapter 和相關檔案中的 shadowOffset 問題...\n');

// 1. 修復 WebStyleAdapter.ts
const webAdapterPath = 'src/components/adaptive/platform/WebStyleAdapter.ts';
if (fs.existsSync(webAdapterPath)) {
  let content = fs.readFileSync(webAdapterPath, 'utf8');
  
  // 修復 convertStyle 方法中的 shadowOffset 處理
  content = content.replace(
    /case 'shadowOffset':\s*return null;/g,
    `case 'shadowOffset':
        // Web 不支援 shadowOffset，完全忽略
        return null;`
  );
  
  // 修復 convertShadowToCSS 方法
  const oldConvertShadowToCSS = `convertShadowToCSS(style: RNStyle): CSSProperties {
    const shadowStyle: any = {};
    
    if (!style) return shadowStyle;
    
    const {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation } = style as any;

    // 處理 iOS 樣式陰影
    if (shadowColor || shadowOffset || shadowOpacity || shadowRadius) {
      const color = shadowColor || '#000';
      const offset = shadowOffset || { width: 0, height: 0 };
      const opacity = shadowOpacity || 0;
      const radius = shadowRadius || 0;
      
      if (opacity > 0) {
        const shadowColorWithOpacity = this.addOpacityToColor(color, opacity);
        shadowStyle.boxShadow = \`\${offset.width}px \${offset.height}px \${radius}px \${shadowColorWithOpacity}\`;
      }
    }`;
  
  const newConvertShadowToCSS = `convertShadowToCSS(style: RNStyle): CSSProperties {
    const shadowStyle: any = {};
    
    if (!style) return shadowStyle;
    
    // 先過濾掉不相容的屬性
    const webSafeStyle = { ...style };
    delete webSafeStyle.shadowOffset;
    delete webSafeStyle.shadowColor;
    delete webSafeStyle.shadowOpacity;
    delete webSafeStyle.shadowRadius;
    delete webSafeStyle.elevation;
    
    // 從原始 style 提取陰影屬性（但不要直接使用）
    const {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation } = style as any;

    // 處理 iOS 樣式陰影 - 但只在確實有陰影時才轉換
    if (shadowOpacity && shadowOpacity > 0) {
      const color = shadowColor || '#000';
      // 安全地處理 shadowOffset - 不直接訪問物件屬性
      const offsetX = shadowOffset?.width || 0;
      const offsetY = shadowOffset?.height || 0;
      const radius = shadowRadius || 0;
      
      const shadowColorWithOpacity = this.addOpacityToColor(color, shadowOpacity);
      shadowStyle.boxShadow = \`\${offsetX}px \${offsetY}px \${radius}px \${shadowColorWithOpacity}\`;
    }`;
  
  content = content.replace(oldConvertShadowToCSS, newConvertShadowToCSS);
  
  // 修復 convertToCSS 方法，確保過濾掉 Native 專用屬性
  const oldConvertToCSS = /convertToCSS\(style: RNStyle\): CSSProperties \{[\s\S]*?const cssStyle: any = \{\};/;
  const newConvertToCSS = `convertToCSS(style: RNStyle): CSSProperties {
    if (!style) return {};
    
    // 首先過濾掉所有 Native 專用屬性
    const filteredStyle = { ...style };
    const nativeOnlyProps = [
      'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation',
      'overlayColor', 'tintColor', 'selectionColor'
    ];
    
    nativeOnlyProps.forEach(prop => {
      delete filteredStyle[prop];
    });
    
    const cssStyle: any = {};`;
  
  content = content.replace(oldConvertToCSS, newConvertToCSS);
  
  fs.writeFileSync(webAdapterPath, content);
  console.log('✅ 修復 WebStyleAdapter.ts');
}

// 2. 修復 platformTokens.ts - 添加平台檢查
const platformTokensPath = 'src/theme/platformTokens.ts';
if (fs.existsSync(platformTokensPath)) {
  let content = fs.readFileSync(platformTokensPath, 'utf8');
  
  // 將 shadowOffset 的型別定義改為可選
  content = content.replace(
    /shadowOffset: \{ width: number; height: number \};/g,
    'shadowOffset?: { width: number; height: number }; // Optional for web compatibility'
  );
  
  fs.writeFileSync(platformTokensPath, content);
  console.log('✅ 修復 platformTokens.ts');
}

// 3. 修復 responsive 函數調用
const filesToFix = [
  'src/components/database/AddColumnDialog.tsx',
  'src/utils/responsive.ts',
  'src/theme/responsive.ts'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 確保 responsive 函數不會傳遞 shadowOffset
    content = content.replace(
      /responsive\(\{([^}]*shadowOffset[^}]*)\}\)/g,
      (match, props) => {
        // 分離 web 和 native 屬性
        return `Platform.OS === 'web' ? responsive({ /* web props */ }) : responsive({ ${props} })`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ 修復 ${filePath}`);
  }
});

// 4. 建立 webSafeStyles 工具函數
const webSafeStylesContent = `import { Platform } from 'react-native';

/**
 * 確保樣式對 Web 平台安全
 * 過濾掉所有可能導致 CSSStyleDeclaration 錯誤的屬性
 */
export const makeWebSafe = (style: any): any => {
  if (Platform.OS !== 'web') {
    return style;
  }
  
  if (!style) return style;
  
  // 如果是陣列，遞迴處理每個元素
  if (Array.isArray(style)) {
    return style.map(makeWebSafe);
  }
  
  // 複製樣式物件
  const safeStyle = { ...style };
  
  // 移除 Web 不支援的屬性
  const unsafeProps = [
    'shadowColor',
    'shadowOffset',
    'shadowOpacity', 
    'shadowRadius',
    'elevation',
    'overlayColor',
    'tintColor',
    'selectionColor'
  ];
  
  unsafeProps.forEach(prop => {
    delete safeStyle[prop];
  });
  
  // 處理 transform - 如果是陣列格式，轉換為字串
  if (safeStyle.transform && Array.isArray(safeStyle.transform)) {
    const transforms = safeStyle.transform
      .map(t => {
        const key = Object.keys(t)[0];
        const value = t[key];
        if (typeof value === 'number') {
          return \`\${key}(\${value}px)\`;
        }
        return \`\${key}(\${value})\`;
      })
      .join(' ');
    safeStyle.transform = transforms;
  }
  
  return safeStyle;
};

/**
 * 建立跨平台陰影樣式
 */
export const createShadow = (level: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const shadows = {
    none: {
      web: 'none',
      native: { shadowOpacity: 0, elevation: 0 }
    },
    sm: {
      web: '0px 1px 4px rgba(0,0,0,0.1)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1
      }
    },
    md: {
      web: '0px 2px 8px rgba(0,0,0,0.15)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3
      }
    },
    lg: {
      web: '0px 4px 16px rgba(0,0,0,0.2)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
      }
    },
    xl: {
      web: '0px 8px 32px rgba(0,0,0,0.25)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8
      }
    }
  };
  
  const shadow = shadows[level];
  
  return Platform.OS === 'web' 
    ? { boxShadow: shadow.web }
    : shadow.native;
};
`;

fs.writeFileSync('src/utils/webSafeStyles.ts', webSafeStylesContent);
console.log('✅ 建立 webSafeStyles.ts 工具函數');

console.log('\n✨ 修復完成！');
console.log('📝 修復內容：');
console.log('  1. WebStyleAdapter 現在會正確過濾 Native 專用屬性');
console.log('  2. shadowOffset 不再直接傳遞給 Web 平台');
console.log('  3. 建立了 webSafeStyles 工具函數供全域使用');
console.log('\n下一步：編譯並部署專案');