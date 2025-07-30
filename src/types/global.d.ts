// 全域類型定義

// Ionicons Web Component 類型定義
declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': {
      name?: string;
      size?: string;
      color?: string;
      src?: string;
      style?: React.CSSProperties;
      class?: string;
    };
  }
}

// DOM 相關類型定義（用於 React Native Web）
declare global {
  // Window 對象擴展
  interface Window {
    // 可以根據需要添加自定義屬性
    [key: string]: any;
  }

  // 確保 navigator 可用
  const navigator: Navigator;
  
  // 確保 document 可用
  const document: Document;
}

// CSV 解析結果類型
export interface CSVParseResult {
  data: any[];
  errors: any[];
  meta: {
    delimiter?: string;
    linebreak?: string;
    aborted?: boolean;
    truncated?: boolean;
    cursor?: number;
    fields?: string[];
  };
  // 額外的可選屬性
  headers?: string[];
  success?: boolean;
}

// React Native Web 特定類型
declare module 'react-native' {
  // 擴展 StyleSheet 類型以支持 Web 特定樣式
  interface ViewStyle {
    // Web 特定樣式屬性
    cursor?: string;
    userSelect?: string;
    WebkitUserSelect?: string;
    MozUserSelect?: string;
    msUserSelect?: string;
  }

  interface TextStyle {
    // Web 特定文字樣式
    cursor?: string;
    userSelect?: string;
    WebkitUserSelect?: string;
    MozUserSelect?: string;
    msUserSelect?: string;
  }
}

// 確保檔案被視為模組
export {};