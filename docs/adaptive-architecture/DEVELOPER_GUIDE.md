# Adaptive Architecture 開發者指南

## 概述

本指南提供 Adaptive Architecture 的詳細 API 文檔、開發模式和進階用法，是開發者的完整參考手冊。

## 📋 目錄

- [核心 API](#核心-api)
- [元件 API](#元件-api)
- [開發模式](#開發模式)
- [進階用法](#進階用法)
- [擴展指南](#擴展指南)
- [效能優化](#效能優化)
- [除錯指南](#除錯指南)

---

## 核心 API

### PlatformAdapter

統一平台適配器，提供跨平台一致的 API。

```typescript
class PlatformAdapter {
  // 取得單例實例
  static getInstance(): PlatformAdapter;
  
  // 平台檢測
  get isWeb(): boolean;
  get isNative(): boolean;
  get platform(): 'web' | 'ios' | 'android';
  
  // 樣式適配
  getStyleAdapter(): StyleAdapter;
  
  // 平台資訊
  getPlatformInfo(): PlatformInfo;
  
  // 除錯模式
  setDebugMode(enabled: boolean): void;
}
```

#### 使用範例

```typescript
import { PlatformAdapter } from '@components/adaptive/platform';

const adapter = PlatformAdapter.getInstance();

// 平台檢測
if (adapter.isWeb) {
  console.log('運行在 Web 平台');
} else {
  console.log('運行在 Native 平台');
}

// 取得詳細平台資訊
const info = adapter.getPlatformInfo();
console.log('平台:', info.platform);
console.log('版本:', info.version);
console.log('使用者代理:', info.userAgent);
```

#### PlatformInfo Interface

```typescript
interface PlatformInfo {
  platform: 'web' | 'ios' | 'android';
  version?: string;
  isWeb: boolean;
  isNative: boolean;
  userAgent?: string;
  screenDimensions: {
    width: number;
    height: number;
  };
}
```

### StyleAdapter

處理樣式在不同平台之間的轉換。

```typescript
interface StyleAdapter {
  // 樣式適配
  adaptStyles(styles: any): any;
  
  // 樣式轉換
  convertToWebStyles(rnStyles: any): CSSProperties;
  convertToNativeStyles(webStyles: CSSProperties): any;
  
  // CSS-in-JS 轉換
  toCSSString(styles: any): string;
}
```

#### 使用範例

```typescript
const adapter = PlatformAdapter.getInstance();
const styleAdapter = adapter.getStyleAdapter();

// React Native 樣式
const rnStyles = {
  flex: 1,
  padding: 16,
  backgroundColor: '#ffffff',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
};

// 自動適配到當前平台
const adaptedStyles = styleAdapter.adaptStyles(rnStyles);

// 手動轉換
const webStyles = styleAdapter.convertToWebStyles(rnStyles);
// 結果: { display: 'flex', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
```

### DesignSystem

設計系統 tokens 和工具函數。

```typescript
export const DesignSystem = {
  colors: {
    primary: string;
    secondary: string;
    background: {
      default: string;
      card: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  
  spacing: {
    xs: number;    // 4
    sm: number;    // 8
    md: number;    // 16
    lg: number;    // 24
    xl: number;    // 32
    xxl: number;   // 48
  };
  
  typography: {
    heading: TypographyStyle;
    subheading: TypographyStyle;
    body: TypographyStyle;
    caption: TypographyStyle;
    button: TypographyStyle;
  };
  
  borderRadius: {
    sm: number;    // 4
    md: number;    // 8
    lg: number;    // 16
    full: number;  // 9999
  };
  
  shadows: {
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
  };
};
```

#### 擴展 DesignSystem

```typescript
// 擴展顏色系統
const CustomDesignSystem = {
  ...DesignSystem,
  colors: {
    ...DesignSystem.colors,
    brand: {
      light: '#e3f2fd',
      main: '#2196f3',
      dark: '#1976d2',
    },
  },
};

// 使用自定義主題
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DesignSystemContext.Provider value={CustomDesignSystem}>
      {children}
    </DesignSystemContext.Provider>
  );
};
```

---

## 元件 API

### AdaptiveView

統一容器元件，取代 `View`(Native) 和 `div`(Web)。

```typescript
interface AdaptiveViewProps {
  // 基本屬性
  style?: ViewStyle | CSSProperties;
  children?: React.ReactNode;
  
  // 無障礙
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  
  // 測試
  testID?: string;
  
  // 事件處理
  onPress?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  
  // 平台特定
  webProps?: React.HTMLAttributes<HTMLDivElement>;
  nativeProps?: ViewProps;
}
```

#### 使用範例

```typescript
<AdaptiveView
  style={styles.container}
  accessible={true}
  accessibilityLabel="主要內容區域"
  testID="main-container"
  onPress={() => console.log('容器被點擊')}
>
  <AdaptiveText>內容</AdaptiveText>
</AdaptiveView>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.default,
  },
});
```

### AdaptiveText

統一文字元件，支援變體和語義化樣式。

```typescript
interface AdaptiveTextProps {
  // 內容
  children: React.ReactNode;
  
  // 樣式變體
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'button';
  
  // 文字屬性
  color?: keyof DesignSystem['colors']['text'] | string;
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  align?: 'left' | 'center' | 'right' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // 佈局
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  
  // 樣式
  style?: TextStyle | CSSProperties;
  
  // 無障礙
  accessible?: boolean;
  accessibilityLabel?: string;
  
  // 平台特定
  webProps?: React.HTMLAttributes<HTMLSpanElement>;
  nativeProps?: TextProps;
}
```

#### 使用範例

```typescript
<AdaptiveText
  variant="heading"
  color="primary"
  weight="bold"
  align="center"
  numberOfLines={2}
  ellipsizeMode="tail"
  style={styles.title}
>
  這是一個標題
</AdaptiveText>

// 使用語義化顏色
<AdaptiveText color="text.secondary">
  次要文字
</AdaptiveText>

// 自定義顏色
<AdaptiveText color="#FF6B35">
  自定義顏色文字
</AdaptiveText>
```

### AdaptiveButton

統一按鈕元件，支援多種變體和狀態。

```typescript
interface AdaptiveButtonProps {
  // 內容
  children: React.ReactNode;
  
  // 變體和尺寸
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  
  // 狀態
  disabled?: boolean;
  loading?: boolean;
  
  // 圖示
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  
  // 佈局
  fullWidth?: boolean;
  
  // 事件
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  
  // 樣式
  style?: ViewStyle | CSSProperties;
  textStyle?: TextStyle | CSSProperties;
  
  // 無障礙
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // 測試
  testID?: string;
}
```

#### 使用範例

```typescript
// 基本按鈕
<AdaptiveButton variant="primary" onPress={handleSubmit}>
  提交
</AdaptiveButton>

// 帶圖示的按鈕
<AdaptiveButton
  variant="secondary"
  size="large"
  leftIcon={<Icon name="star" size={16} />}
  onPress={handleFavorite}
>
  加入收藏
</AdaptiveButton>

// 載入狀態
<AdaptiveButton
  variant="primary"
  loading={isSubmitting}
  disabled={!isValid}
  fullWidth
  onPress={handleSubmit}
>
  {isSubmitting ? '提交中...' : '提交'}
</AdaptiveButton>

// 純圖示按鈕
<AdaptiveButton
  variant="ghost"
  iconOnly
  accessibilityLabel="關閉"
  onPress={handleClose}
>
  <Icon name="close" size={20} />
</AdaptiveButton>
```

### AdaptiveInput

統一輸入元件，支援多種輸入類型和驗證。

```typescript
interface AdaptiveInputProps {
  // 基本屬性
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  
  // 變體
  variant?: 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';
  
  // 輸入類型
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoFocus?: boolean;
  
  // 狀態
  disabled?: boolean;
  readOnly?: boolean;
  error?: string | boolean;
  
  // 圖示和標籤
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  
  // 事件
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  
  // 樣式
  style?: ViewStyle | CSSProperties;
  inputStyle?: TextStyle | CSSProperties;
  
  // 無障礙
  accessibilityLabel?: string;
  
  // 平台特定
  webProps?: React.InputHTMLAttributes<HTMLInputElement>;
  nativeProps?: TextInputProps;
}
```

#### 使用範例

```typescript
// 基本輸入框
<AdaptiveInput
  placeholder="請輸入用戶名"
  value={username}
  onChangeText={setUsername}
  leftIcon={<Icon name="user" size={16} />}
/>

// 密碼輸入框
<AdaptiveInput
  variant="outline"
  label="密碼"
  placeholder="請輸入密碼"
  secureTextEntry={!showPassword}
  value={password}
  onChangeText={setPassword}
  rightIcon={
    <AdaptiveButton
      variant="ghost"
      iconOnly
      onPress={() => setShowPassword(!showPassword)}
    >
      <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} />
    </AdaptiveButton>
  }
/>

// 帶驗證的輸入框
<AdaptiveInput
  label="電子郵件"
  placeholder="請輸入電子郵件"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  error={emailError}
  helperText={emailError || "我們不會分享您的電子郵件"}
/>
```

---

## 開發模式

### 1. 元件設計模式

#### Compound Components 模式

```typescript
// Modal 元件系統
export const AdaptiveModal = {
  Root: AdaptiveModalRoot,
  Header: AdaptiveModalHeader,
  Body: AdaptiveModalBody,
  Footer: AdaptiveModalFooter,
};

// 使用方式
<AdaptiveModal.Root visible={isOpen} onClose={handleClose}>
  <AdaptiveModal.Header>
    <AdaptiveText variant="heading">標題</AdaptiveText>
  </AdaptiveModal.Header>
  <AdaptiveModal.Body>
    <AdaptiveText>內容</AdaptiveText>
  </AdaptiveModal.Body>
  <AdaptiveModal.Footer>
    <AdaptiveButton variant="primary" onPress={handleConfirm}>
      確認
    </AdaptiveButton>
  </AdaptiveModal.Footer>
</AdaptiveModal.Root>
```

#### Render Props 模式

```typescript
interface AdaptiveFormProps {
  children: (props: {
    values: any;
    errors: any;
    handleChange: (field: string) => (value: string) => void;
    handleSubmit: () => void;
  }) => React.ReactNode;
  onSubmit: (values: any) => void;
  validationSchema?: any;
}

export const AdaptiveForm: React.FC<AdaptiveFormProps> = ({ children, onSubmit }) => {
  // 表單邏輯...
  
  return (
    <AdaptiveView>
      {children({ values, errors, handleChange, handleSubmit })}
    </AdaptiveView>
  );
};

// 使用方式
<AdaptiveForm onSubmit={handleSubmit}>
  {({ values, errors, handleChange, handleSubmit }) => (
    <AdaptiveView>
      <AdaptiveInput
        value={values.email}
        onChangeText={handleChange('email')}
        error={errors.email}
      />
      <AdaptiveButton onPress={handleSubmit}>提交</AdaptiveButton>
    </AdaptiveView>
  )}
</AdaptiveForm>
```

### 2. 狀態管理模式

#### 使用 Context 進行狀態共享

```typescript
// 創建主題 Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: typeof DesignSystem.colors;
}

const ThemeContext = React.createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const colors = useMemo(() => ({
    ...DesignSystem.colors,
    ...(theme === 'dark' ? darkModeColors : {}),
  }), [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 使用 Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

#### 自定義 Hooks 模式

```typescript
// 平台適配 Hook
export const usePlatformAdapter = () => {
  return useMemo(() => PlatformAdapter.getInstance(), []);
};

// 響應式設計 Hook
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  return useMemo(() => ({
    isSmall: dimensions.width < 768,
    isMedium: dimensions.width >= 768 && dimensions.width < 1024,
    isLarge: dimensions.width >= 1024,
    width: dimensions.width,
    height: dimensions.height,
  }), [dimensions]);
};

// 表單驗證 Hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema: ValidationSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const validate = useCallback((fieldsToValidate?: (keyof T)[]) => {
    // 驗證邏輯...
  }, [validationSchema]);
  
  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // 即時驗證
    validate([field]);
  }, [validate]);
  
  return { values, errors, handleChange, validate };
};
```

---

## 進階用法

### 1. 自定義 Adaptive 元件

```typescript
// 建立自定義 Adaptive 元件
interface AdaptiveCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined';
  padding?: keyof typeof DesignSystem.spacing;
  style?: ViewStyle | CSSProperties;
}

const WebCard: React.FC<AdaptiveCardProps> = ({ 
  children, 
  variant = 'elevated', 
  padding = 'md',
  style 
}) => (
  <div
    style={{
      padding: DesignSystem.spacing[padding],
      borderRadius: DesignSystem.borderRadius.md,
      backgroundColor: DesignSystem.colors.background.card,
      ...(variant === 'elevated' ? {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      } : {
        border: `1px solid ${DesignSystem.colors.border}`,
      }),
      ...style,
    }}
  >
    {children}
  </div>
);

const NativeCard: React.FC<AdaptiveCardProps> = ({ 
  children, 
  variant = 'elevated', 
  padding = 'md',
  style 
}) => (
  <View
    style={[
      {
        padding: DesignSystem.spacing[padding],
        borderRadius: DesignSystem.borderRadius.md,
        backgroundColor: DesignSystem.colors.background.card,
        ...(variant === 'elevated' ? {
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        } : {
          borderWidth: 1,
          borderColor: DesignSystem.colors.border,
        }),
      },
      style,
    ]}
  >
    {children}
  </View>
);

export const AdaptiveCard = forwardRef<any, AdaptiveCardProps>((props, ref) => {
  const adapter = PlatformAdapter.getInstance();
  
  if (adapter.isWeb) {
    return <WebCard {...props} ref={ref} />;
  } else {
    return <NativeCard {...props} ref={ref} />;
  }
});
```

### 2. 進階樣式適配

```typescript
// 複雜樣式適配
export const useAdaptiveStyles = <T extends Record<string, any>>(
  styles: T,
  dependencies: any[] = []
): T => {
  const adapter = usePlatformAdapter();
  
  return useMemo(() => {
    const styleAdapter = adapter.getStyleAdapter();
    const adaptedStyles: any = {};
    
    for (const [key, style] of Object.entries(styles)) {
      adaptedStyles[key] = styleAdapter.adaptStyles(style);
    }
    
    return adaptedStyles;
  }, [adapter, ...dependencies]);
};

// 使用方式
const MyComponent = () => {
  const styles = useAdaptiveStyles({
    container: {
      flex: 1,
      padding: DesignSystem.spacing.md,
      backgroundColor: DesignSystem.colors.background.default,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: DesignSystem.colors.text.primary,
    },
  });
  
  return (
    <AdaptiveView style={styles.container}>
      <AdaptiveText style={styles.title}>標題</AdaptiveText>
    </AdaptiveView>
  );
};
```

### 3. 動畫和過渡

```typescript
// 跨平台動畫 Hook
export const useAdaptiveAnimation = (
  animatedValue: Animated.Value,
  config: {
    duration?: number;
    easing?: (value: number) => number;
    useNativeDriver?: boolean;
  } = {}
) => {
  const adapter = usePlatformAdapter();
  
  const animate = useCallback((toValue: number) => {
    if (adapter.isWeb) {
      // Web 使用 CSS 過渡
      return new Promise(resolve => {
        Animated.timing(animatedValue, {
          toValue,
          duration: config.duration || 300,
          useNativeDriver: false, // Web 上不支援 native driver
        }).start(resolve);
      });
    } else {
      // Native 使用原生動畫
      return new Promise(resolve => {
        Animated.timing(animatedValue, {
          toValue,
          duration: config.duration || 300,
          useNativeDriver: config.useNativeDriver !== false,
        }).start(resolve);
      });
    }
  }, [adapter, animatedValue, config]);
  
  return animate;
};
```

---

## 擴展指南

### 1. 新增設計 Token

```typescript
// 擴展顏色系統
declare module '@theme/designSystem' {
  interface DesignSystemColors {
    brand: {
      50: string;
      100: string;
      500: string;
      900: string;
    };
    semantic: {
      positive: string;
      negative: string;
      neutral: string;
    };
  }
}

// 實現擴展
export const ExtendedDesignSystem = {
  ...DesignSystem,
  colors: {
    ...DesignSystem.colors,
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#06b6d4',
      900: '#164e63',
    },
    semantic: {
      positive: '#16a34a',
      negative: '#dc2626',
      neutral: '#6b7280',
    },
  },
};
```

### 2. 自定義平台檢測

```typescript
// 擴展平台檢測邏輯
export class ExtendedPlatformAdapter extends PlatformAdapter {
  get isTablet(): boolean {
    if (this.isWeb) {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    } else {
      const { width, height } = Dimensions.get('window');
      const minDimension = Math.min(width, height);
      const maxDimension = Math.max(width, height);
      return minDimension >= 768 && maxDimension >= 1024;
    }
  }
  
  get isDesktop(): boolean {
    if (this.isWeb) {
      return window.innerWidth >= 1024;
    }
    return false;
  }
  
  get hasHover(): boolean {
    if (this.isWeb) {
      return window.matchMedia('(hover: hover)').matches;
    }
    return false;
  }
}
```

### 3. 建立主題系統

```typescript
// 主題介面定義
interface Theme {
  colors: typeof DesignSystem.colors;
  spacing: typeof DesignSystem.spacing;
  typography: typeof DesignSystem.typography;
  mode: 'light' | 'dark';
}

// 深色主題
const darkTheme: Theme = {
  ...DesignSystem,
  colors: {
    ...DesignSystem.colors,
    background: {
      default: '#121212',
      card: '#1e1e1e',
      overlay: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      disabled: '#666666',
    },
  },
  mode: 'dark',
};

// 主題提供者
export const AdaptiveThemeProvider: React.FC<{
  theme?: Theme;
  children: React.ReactNode;
}> = ({ theme = DesignSystem, children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 效能優化

### 1. 元件效能優化

```typescript
// 使用 React.memo 優化元件重新渲染
export const AdaptiveOptimizedComponent = React.memo<ComponentProps>(
  ({ title, onPress }) => {
    return (
      <AdaptiveButton onPress={onPress}>
        <AdaptiveText>{title}</AdaptiveText>
      </AdaptiveButton>
    );
  },
  // 自定義比較函數
  (prevProps, nextProps) => {
    return prevProps.title === nextProps.title && 
           prevProps.onPress === nextProps.onPress;
  }
);

// 使用 useMemo 快取計算結果
const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
    }));
  }, [data]);
  
  const styles = useMemo(() => {
    const adapter = PlatformAdapter.getInstance();
    return adapter.getStyleAdapter().adaptStyles(componentStyles);
  }, []);
  
  return (
    <AdaptiveView style={styles.container}>
      {processedData.map(item => (
        <AdaptiveText key={item.id}>{item.title}</AdaptiveText>
      ))}
    </AdaptiveView>
  );
};
```

### 2. 樣式效能優化

```typescript
// 樣式快取系統
class StyleCache {
  private cache = new Map<string, any>();
  
  getStyles(key: string, factory: () => any): any {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const styles = factory();
    this.cache.set(key, styles);
    return styles;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const styleCache = new StyleCache();

// 使用快取
export const useOptimizedStyles = (styleFactory: () => any, dependencies: any[]) => {
  return useMemo(() => {
    const key = JSON.stringify(dependencies);
    return styleCache.getStyles(key, styleFactory);
  }, dependencies);
};
```

### 3. 圖片載入優化

```typescript
// 自適應圖片元件
interface AdaptiveImageProps {
  source: ImageSourcePropType | { uri: string };
  placeholder?: React.ReactNode;
  style?: ImageStyle | CSSProperties;
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  source,
  placeholder,
  style,
  lazy = true,
  quality = 'medium',
}) => {
  const adapter = usePlatformAdapter();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // 圖片品質優化
  const optimizedSource = useMemo(() => {
    if (typeof source === 'object' && 'uri' in source) {
      const qualityParams = {
        low: 'w=400&q=60',
        medium: 'w=800&q=80', 
        high: 'w=1200&q=95',
      };
      
      const separator = source.uri.includes('?') ? '&' : '?';
      return {
        ...source,
        uri: `${source.uri}${separator}${qualityParams[quality]}`,
      };
    }
    return source;
  }, [source, quality]);
  
  if (adapter.isWeb) {
    return (
      <img
        src={typeof optimizedSource === 'object' ? optimizedSource.uri : undefined}
        style={style as CSSProperties}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    );
  } else {
    return (
      <Image
        source={optimizedSource}
        style={style as ImageStyle}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    );
  }
};
```

---

## 除錯指南

### 1. 除錯工具

```typescript
// 啟用除錯模式
if (__DEV__) {
  PlatformAdapter.getInstance().setDebugMode(true);
}

// 除錯 Hook
export const useDebugInfo = (name: string, props: any) => {
  useEffect(() => {
    if (__DEV__) {
      console.log(`[${name}] Props:`, props);
    }
  }, [name, props]);
  
  useEffect(() => {
    if (__DEV__) {
      console.log(`[${name}] Mounted`);
      return () => console.log(`[${name}] Unmounted`);
    }
  }, [name]);
};

// 使用方式
const MyComponent = (props) => {
  useDebugInfo('MyComponent', props);
  
  return <AdaptiveView>{/* 元件內容 */}</AdaptiveView>;
};
```

### 2. 效能監控

```typescript
// 效能監控 Hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);
  
  // 記錄渲染開始時間
  renderStart.current = performance.now();
  renderCount.current += 1;
  
  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      
      if (__DEV__ && renderTime > 16) { // 超過一幀的時間
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    }
  });
  
  return {
    renderCount: renderCount.current,
  };
};
```

### 3. 錯誤處理

```typescript
// 錯誤邊界元件
interface AdaptiveErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AdaptiveErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  AdaptiveErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): AdaptiveErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdaptiveErrorBoundary caught an error:', error, errorInfo);
    
    // 可以將錯誤報告給監控服務
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Component Error', {
        error: error.message,
        stack: error.stack,
        errorInfo,
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}

// 預設錯誤回退元件
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <AdaptiveView style={styles.errorContainer}>
    <AdaptiveText variant="heading" color="error">
      出現錯誤
    </AdaptiveText>
    <AdaptiveText color="text.secondary">
      {__DEV__ ? error.message : '請重新整理頁面或聯絡支援'}
    </AdaptiveText>
  </AdaptiveView>
);
```

---

## 測試指南

### 1. 單元測試

```typescript
// 測試工具設定
import { render, fireEvent } from '@testing-library/react-native';
import { AdaptiveButton } from '@components/adaptive/core';

// Mock PlatformAdapter
jest.mock('@components/adaptive/platform', () => ({
  PlatformAdapter: {
    getInstance: jest.fn(() => ({
      isWeb: false,
      isNative: true,
      getStyleAdapter: jest.fn(() => ({
        adaptStyles: jest.fn(styles => styles),
      })),
    })),
  },
}));

describe('AdaptiveButton', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <AdaptiveButton>測試按鈕</AdaptiveButton>
    );
    
    expect(getByText('測試按鈕')).toBeTruthy();
  });
  
  it('should call onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <AdaptiveButton onPress={mockPress}>點擊我</AdaptiveButton>
    );
    
    fireEvent.press(getByText('點擊我'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });
  
  it('should apply correct styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <AdaptiveButton style={customStyle} testID="test-button">
        按鈕
      </AdaptiveButton>
    );
    
    const button = getByTestId('test-button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });
});
```

### 2. 整合測試

```typescript
// 整合測試範例
describe('AdaptiveForm Integration', () => {
  it('should handle form submission correctly', async () => {
    const mockSubmit = jest.fn();
    
    const { getByPlaceholderText, getByText } = render(
      <AdaptiveForm onSubmit={mockSubmit}>
        <AdaptiveInput placeholder="用戶名" testID="username-input" />
        <AdaptiveInput placeholder="密碼" secureTextEntry testID="password-input" />
        <AdaptiveButton testID="submit-button">提交</AdaptiveButton>
      </AdaptiveForm>
    );
    
    // 填寫表單
    fireEvent.changeText(getByPlaceholderText('用戶名'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('密碼'), 'password123');
    
    // 提交表單
    fireEvent.press(getByText('提交'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });
});
```

---

這個開發者指南涵蓋了 Adaptive Architecture 的主要 API 和開發模式。如需更詳細的資訊，請參考相關的專門文件。