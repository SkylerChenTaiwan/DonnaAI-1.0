# Adaptive Architecture 最佳實踐

## 概述

本文件收集了在使用 Adaptive Architecture 開發過程中的最佳實踐、常見模式和專家建議，幫助開發者寫出高品質、可維護的跨平台程式碼。

## 📋 目錄

- [架構設計原則](#架構設計原則)
- [元件開發模式](#元件開發模式)
- [樣式管理策略](#樣式管理策略)
- [效能最佳化](#效能最佳化)
- [測試策略](#測試策略)
- [錯誤處理](#錯誤處理)
- [可訪問性](#可訪問性)
- [程式碼組織](#程式碼組織)

---

## 架構設計原則

### 1. 單一責任原則 (SRP)

每個元件和模組都應該有且只有一個責任：

```typescript
// ❌ 不好的做法 - 元件職責過多
const UserProfileCard = ({ user, onEdit, onDelete, onShare }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  
  const handleSave = async () => {
    // 保存邏輯
    await api.updateUser(formData);
    setIsEditing(false);
  };
  
  const handleShare = () => {
    // 分享邏輯
    navigator.share({ title: user.name, url: user.profileUrl });
  };
  
  return (
    <AdaptiveView>
      {/* 複雜的 JSX */}
    </AdaptiveView>
  );
};

// ✅ 好的做法 - 職責分離
const UserProfile = ({ user }) => (
  <AdaptiveView style={styles.container}>
    <UserAvatar src={user.avatar} size="large" />
    <UserInfo user={user} />
  </AdaptiveView>
);

const UserActions = ({ user, onEdit, onDelete, onShare }) => (
  <AdaptiveView style={styles.actions}>
    <AdaptiveButton variant="primary" onPress={onEdit}>編輯</AdaptiveButton>
    <AdaptiveButton variant="outline" onPress={onShare}>分享</AdaptiveButton>
    <AdaptiveButton variant="ghost" onPress={onDelete}>刪除</AdaptiveButton>
  </AdaptiveView>
);

const UserProfileCard = ({ user, onEdit, onDelete, onShare }) => (
  <AdaptiveCard>
    <UserProfile user={user} />
    <UserActions user={user} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />
  </AdaptiveCard>
);
```

### 2. 開閉原則 (OCP)

元件應該對擴展開放，對修改關閉：

```typescript
// ✅ 使用組合模式實現可擴展性
interface AdaptiveListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  ListHeaderComponent?: React.ComponentType;
  ListFooterComponent?: React.ComponentType;
  ListEmptyComponent?: React.ComponentType;
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AdaptiveList = <T,>({
  data,
  renderItem,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ...props
}: AdaptiveListProps<T>) => {
  if (data.length === 0 && ListEmptyComponent) {
    return <ListEmptyComponent />;
  }
  
  return (
    <AdaptiveView>
      {ListHeaderComponent && <ListHeaderComponent />}
      {data.map((item, index) => (
        <Fragment key={index}>
          {renderItem(item, index)}
        </Fragment>
      ))}
      {ListFooterComponent && <ListFooterComponent />}
    </AdaptiveView>
  );
};
```

### 3. 依賴反轉原則 (DIP)

高層模組不應該依賴低層模組，兩者都應該依賴抽象：

```typescript
// ✅ 依賴抽象介面
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }
  
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

class NativeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }
  
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

// 依賴注入
class UserPreferencesService {
  constructor(private storage: StorageAdapter) {}
  
  async getUserTheme(): Promise<'light' | 'dark'> {
    const theme = await this.storage.getItem('user_theme');
    return (theme as 'light' | 'dark') || 'light';
  }
  
  async setUserTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.storage.setItem('user_theme', theme);
  }
}
```

---

## 元件開發模式

### 1. 組合勝於繼承

使用組合模式建立靈活的元件系統：

```typescript
// ✅ 組合模式
interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined';
  padding?: keyof typeof DesignSystem.spacing;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardFooterProps {
  children: React.ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const Card = {
  Root: ({ children, variant = 'elevated', padding = 'md' }: CardProps) => (
    <AdaptiveView style={[styles.card, styles[variant], { padding: DesignSystem.spacing[padding] }]}>
      {children}
    </AdaptiveView>
  ),
  
  Header: ({ title, subtitle, actions }: CardHeaderProps) => (
    <AdaptiveView style={styles.cardHeader}>
      <AdaptiveView style={styles.cardHeaderContent}>
        <AdaptiveText variant="heading">{title}</AdaptiveText>
        {subtitle && (
          <AdaptiveText variant="caption" color="text.secondary">
            {subtitle}
          </AdaptiveText>
        )}
      </AdaptiveView>
      {actions && (
        <AdaptiveView style={styles.cardHeaderActions}>
          {actions}
        </AdaptiveView>
      )}
    </AdaptiveView>
  ),
  
  Content: ({ children }: CardContentProps) => (
    <AdaptiveView style={styles.cardContent}>
      {children}
    </AdaptiveView>
  ),
  
  Footer: ({ children, justify = 'end' }: CardFooterProps) => (
    <AdaptiveView style={[styles.cardFooter, styles[`justify-${justify}`]]}>
      {children}
    </AdaptiveView>
  ),
};

// 使用方式
const UserCard = ({ user, onEdit, onDelete }) => (
  <Card.Root variant="elevated">
    <Card.Header 
      title={user.name}
      subtitle={user.email}
      actions={
        <AdaptiveButton variant="ghost" onPress={onEdit}>
          編輯
        </AdaptiveButton>
      }
    />
    <Card.Content>
      <AdaptiveText>{user.bio}</AdaptiveText>
    </Card.Content>
    <Card.Footer justify="between">
      <AdaptiveText variant="caption" color="text.secondary">
        加入於 {user.joinedAt}
      </AdaptiveText>
      <AdaptiveButton variant="outline" size="small" onPress={onDelete}>
        刪除
      </AdaptiveButton>
    </Card.Footer>
  </Card.Root>
);
```

### 2. 控制反轉 (IoC) 模式

讓元件接受外部控制邏輯：

```typescript
// ✅ 使用 render props 實現控制反轉
interface AdaptiveDataFetcherProps<T> {
  url: string;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export const AdaptiveDataFetcher = <T,>({ url, children }: AdaptiveDataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return children({ data, loading, error, refetch: fetchData });
};

// 使用方式
const UserList = () => (
  <AdaptiveDataFetcher<User[]> url="/api/users">
    {({ data, loading, error, refetch }) => {
      if (loading) return <AdaptiveText>載入中...</AdaptiveText>;
      if (error) return <ErrorMessage error={error} onRetry={refetch} />;
      if (!data) return <AdaptiveText>沒有資料</AdaptiveText>;
      
      return (
        <AdaptiveList
          data={data}
          renderItem={(user) => <UserCard key={user.id} user={user} />}
        />
      );
    }}
  </AdaptiveDataFetcher>
);
```

### 3. 高階元件模式 (HOC)

建立可重用的元件增強邏輯：

```typescript
// ✅ HOC 模式實現通用功能
interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: React.ComponentType;
}

export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithLoadingComponent = (props: P & WithLoadingProps) => {
    const { loading, loadingComponent: LoadingComponent = DefaultLoading, ...restProps } = props;
    
    if (loading) {
      return <LoadingComponent />;
    }
    
    return <WrappedComponent {...(restProps as P)} />;
  };
  
  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithLoadingComponent;
};

// 使用方式
const UserProfile = withLoading<UserProfileProps>(({ user }) => (
  <AdaptiveView>
    <AdaptiveText variant="heading">{user.name}</AdaptiveText>
    <AdaptiveText>{user.email}</AdaptiveText>
  </AdaptiveView>
));

// 在父元件中使用
<UserProfile user={user} loading={isLoading} />
```

---

## 樣式管理策略

### 1. 設計 Tokens 優先

始終使用設計系統的 tokens，避免硬編碼值：

```typescript
// ❌ 不好的做法
const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
});

// ✅ 好的做法
const styles = StyleSheet.create({
  container: {
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.card,
    borderRadius: DesignSystem.borderRadius.md,
    ...DesignSystem.shadows.sm,
  },
});
```

### 2. 響應式設計模式

建立適應不同螢幕大小的佈局：

```typescript
// ✅ 響應式設計 Hook
export const useResponsiveLayout = () => {
  const { width } = useWindowDimensions();
  
  return useMemo(() => ({
    isSmall: width < 768,
    isMedium: width >= 768 && width < 1024,
    isLarge: width >= 1024,
    columns: width < 768 ? 1 : width < 1024 ? 2 : 3,
    gutterSize: width < 768 ? DesignSystem.spacing.sm : DesignSystem.spacing.md,
  }), [width]);
};

// 使用響應式佈局
const ResponsiveGrid = ({ items }) => {
  const layout = useResponsiveLayout();
  
  const styles = useAdaptiveStyles({
    container: {
      flexDirection: layout.isSmall ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: layout.gutterSize,
    },
    item: {
      flex: layout.isSmall ? '1 1 100%' : `1 1 ${100 / layout.columns}%`,
      minWidth: 0, // 防止內容溢出
    },
  }, [layout]);
  
  return (
    <AdaptiveView style={styles.container}>
      {items.map((item, index) => (
        <AdaptiveView key={index} style={styles.item}>
          {item}
        </AdaptiveView>
      ))}
    </AdaptiveView>
  );
};
```

### 3. 主題系統最佳實踐

```typescript
// ✅ 完整的主題系統
interface ThemeColors {
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
  border: string;
  shadow: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: typeof DesignSystem.spacing;
  typography: typeof DesignSystem.typography;
  borderRadius: typeof DesignSystem.borderRadius;
  shadows: typeof DesignSystem.shadows;
}

const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: {
      default: '#ffffff',
      card: '#f8f9fa',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      disabled: '#adb5bd',
    },
    status: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
    },
    border: '#dee2e6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: DesignSystem.spacing,
  typography: DesignSystem.typography,
  borderRadius: DesignSystem.borderRadius,
  shadows: DesignSystem.shadows,
};

const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',
  colors: {
    ...lightTheme.colors,
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
    border: '#333333',
    shadow: 'rgba(255, 255, 255, 0.1)',
  },
};

// 主題 Context
const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// 主題感知樣式 Hook
export const useThemedStyles = <T extends Record<string, any>>(
  stylesFactory: (theme: Theme) => T
) => {
  const { theme } = useTheme();
  return useMemo(() => stylesFactory(theme), [theme, stylesFactory]);
};

// 使用方式
const MyComponent = () => {
  const styles = useThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    text: {
      color: theme.colors.text.primary,
      ...theme.typography.body,
    },
  }));
  
  return (
    <AdaptiveView style={styles.container}>
      <AdaptiveText style={styles.text}>主題化內容</AdaptiveText>
    </AdaptiveView>
  );
};
```

---

## 效能最佳化

### 1. 記憶化策略

```typescript
// ✅ 元件記憶化
const ExpensiveListItem = React.memo<{
  item: ListItem;
  onPress: (id: string) => void;
}>(({ item, onPress }) => {
  // 使用 useCallback 穩定化函數引用
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);
  
  // 使用 useMemo 快取計算結果
  const processedData = useMemo(() => {
    return processItemData(item);
  }, [item]);
  
  return (
    <AdaptiveButton onPress={handlePress}>
      <AdaptiveText>{processedData.title}</AdaptiveText>
    </AdaptiveButton>
  );
}, (prevProps, nextProps) => {
  // 自定義比較函數
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.updatedAt === nextProps.item.updatedAt &&
         prevProps.onPress === nextProps.onPress;
});

// ✅ 列表效能優化
const OptimizedList = ({ items, onItemPress }) => {
  // 穩定化回調函數
  const handleItemPress = useCallback((id: string) => {
    onItemPress(id);
  }, [onItemPress]);
  
  // 列表項渲染函數
  const renderItem = useCallback(({ item }: { item: ListItem }) => (
    <ExpensiveListItem 
      item={item} 
      onPress={handleItemPress}
    />
  ), [handleItemPress]);
  
  // 提取列表鍵值
  const keyExtractor = useCallback((item: ListItem) => item.id, []);
  
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // 效能優化選項
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={20}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  );
};
```

### 2. 虛擬化技術

```typescript
// ✅ 虛擬滾動實現
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items, itemHeight = 60 }) => {
  const adapter = usePlatformAdapter();
  
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItemComponent item={items[index]} />
    </div>
  );
  
  if (adapter.isWeb) {
    return (
      <List
        height={400}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    );
  } else {
    // Native 使用 VirtualizedList
    return (
      <VirtualizedList
        data={items}
        renderItem={({ item }) => <ListItemComponent item={item} />}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
    );
  }
};
```

### 3. 圖片載入優化

```typescript
// ✅ 圖片懶載入和快取
interface OptimizedImageProps {
  source: { uri: string };
  placeholder?: React.ReactNode;
  style?: ImageStyle;
  quality?: 'low' | 'medium' | 'high';
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  placeholder,
  style,
  quality = 'medium',
  lazy = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 圖片品質優化
  const optimizedUri = useMemo(() => {
    const qualityMap = {
      low: 'w=400&q=50',
      medium: 'w=800&q=75',
      high: 'w=1200&q=90',
    };
    
    const separator = source.uri.includes('?') ? '&' : '?';
    return `${source.uri}${separator}${qualityMap[quality]}`;
  }, [source.uri, quality]);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [lazy]);
  
  if (!inView) {
    return (
      <div ref={imgRef} style={style}>
        {placeholder}
      </div>
    );
  }
  
  return (
    <>
      {!loaded && placeholder}
      <img
        src={optimizedUri}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onLoad={() => setLoaded(true)}
        loading={lazy ? 'lazy' : 'eager'}
      />
    </>
  );
};
```

---

## 測試策略

### 1. 測試金字塔

```typescript
// ✅ 單元測試 - 測試單個函數/元件
describe('formatCurrency', () => {
  it('should format number as currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
  
  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
  
  it('should handle negative numbers', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });
});

// ✅ 整合測試 - 測試元件間互動
describe('UserForm Integration', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <UserForm onSubmit={mockSubmit} />
    );
    
    // 填寫表單
    fireEvent.changeText(getByLabelText('姓名'), 'John Doe');
    fireEvent.changeText(getByLabelText('電子郵件'), 'john@example.com');
    
    // 提交表單
    fireEvent.press(getByRole('button', { name: '提交' }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });
});

// ✅ E2E 測試 - 測試完整用戶流程
describe('User Registration Flow', () => {
  it('should allow user to register and login', async () => {
    const { user } = await render(<App />);
    
    // 導航到註冊頁面
    await user.press(screen.getByText('註冊'));
    
    // 填寫註冊表單
    await user.type(screen.getByLabelText('用戶名'), 'testuser');
    await user.type(screen.getByLabelText('電子郵件'), 'test@example.com');
    await user.type(screen.getByLabelText('密碼'), 'password123');
    
    // 提交註冊
    await user.press(screen.getByRole('button', { name: '註冊' }));
    
    // 驗證登入成功
    await waitFor(() => {
      expect(screen.getByText('歡迎，testuser')).toBeInTheDocument();
    });
  });
});
```

### 2. 視覺回歸測試

```typescript
// ✅ 視覺回歸測試設定
describe('AdaptiveButton Visual Tests', () => {
  const variants = ['primary', 'secondary', 'outline', 'ghost'];
  const sizes = ['small', 'medium', 'large'];
  const states = ['default', 'disabled', 'loading'];
  
  variants.forEach(variant => {
    sizes.forEach(size => {
      states.forEach(state => {
        it(`should render ${variant} ${size} ${state} correctly`, async () => {
          const props = {
            variant,
            size,
            disabled: state === 'disabled',
            loading: state === 'loading',
          };
          
          const screenshot = await captureScreenshot(
            <AdaptiveButton {...props}>
              測試按鈕
            </AdaptiveButton>
          );
          
          expect(screenshot).toMatchImageSnapshot({
            customSnapshotIdentifier: `button-${variant}-${size}-${state}`,
            threshold: 0.2,
          });
        });
      });
    });
  });
});
```

### 3. 效能測試

```typescript
// ✅ 效能測試
describe('Component Performance', () => {
  it('should render large list efficiently', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
    }));
    
    const startTime = performance.now();
    
    render(
      <OptimizedList 
        items={items}
        renderItem={({ item }) => <ListItem key={item.id} item={item} />}
      />
    );
    
    const renderTime = performance.now() - startTime;
    
    // 確保渲染時間在合理範圍內
    expect(renderTime).toBeLessThan(100); // 100ms
  });
  
  it('should not cause memory leaks', async () => {
    const { unmount } = render(<MyComponent />);
    
    // 記錄初始記憶體使用量
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // 多次掛載和卸載元件
    for (let i = 0; i < 10; i++) {
      const { unmount: unmountTemp } = render(<MyComponent />);
      unmountTemp();
    }
    
    // 強制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    unmount();
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 確保記憶體增長在合理範圍內
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB
  });
});
```

---

## 錯誤處理

### 1. 錯誤邊界最佳實踐

```typescript
// ✅ 分層錯誤邊界
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string = '';
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // 錯誤報告
    this.reportError(error, errorInfo);
    
    // 自定義錯誤處理
    this.props.onError?.(error, errorInfo);
  }
  
  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 發送到錯誤監控服務
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Component Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        errorId: this.errorId,
        timestamp: new Date().toISOString(),
      });
    }
  };
  
  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          level={this.props.level}
        />
      );
    }
    
    return this.props.children;
  }
}

// ✅ 錯誤回退元件
interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onRetry?: () => void;
  level?: 'app' | 'page' | 'component';
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  level = 'component',
}) => {
  const getMessage = () => {
    switch (level) {
      case 'app':
        return '應用程式發生錯誤，請重新載入頁面';
      case 'page':
        return '頁面載入失敗，請稍後再試';
      default:
        return '內容載入失敗';
    }
  };
  
  return (
    <AdaptiveView style={styles.errorContainer}>
      <AdaptiveText variant="heading" color="error">
        😵 出現錯誤
      </AdaptiveText>
      <AdaptiveText color="text.secondary" style={styles.errorMessage}>
        {getMessage()}
      </AdaptiveText>
      
      {__DEV__ && (
        <AdaptiveView style={styles.errorDetails}>
          <AdaptiveText variant="caption" color="text.secondary">
            {error.message}
          </AdaptiveText>
        </AdaptiveView>
      )}
      
      <AdaptiveView style={styles.errorActions}>
        {onRetry && (
          <AdaptiveButton variant="primary" onPress={onRetry}>
            重試
          </AdaptiveButton>
        )}
        <AdaptiveButton 
          variant="outline" 
          onPress={() => window.location.reload()}
        >
          重新載入
        </AdaptiveButton>
      </AdaptiveView>
    </AdaptiveView>
  );
};
```

### 2. 非同步錯誤處理

```typescript
// ✅ 非同步錯誤處理 Hook
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useAsyncOperation = <T>() => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      retryCount?: number;
      retryDelay?: number;
    } = {}
  ) => {
    const { onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await asyncFunction();
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    setState(prev => ({ ...prev, loading: false, error: lastError }));
    onError?.(lastError);
    throw lastError;
  }, []);
  
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  
  return { ...state, execute, reset };
};

// 使用方式
const MyComponent = () => {
  const { data, loading, error, execute } = useAsyncOperation<User[]>();
  
  const loadUsers = useCallback(async () => {
    await execute(
      () => fetchUsers(),
      {
        retryCount: 2,
        onSuccess: (users) => {
          console.log(`載入了 ${users.length} 個用戶`);
        },
        onError: (error) => {
          // 錯誤報告
          reportError(error);
        },
      }
    );
  }, [execute]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={loadUsers} />;
  
  return (
    <AdaptiveView>
      {data?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </AdaptiveView>
  );
};
```

---

## 可訪問性 (Accessibility)

### 1. 語義化標記

```typescript
// ✅ 正確的語義化標記
const AccessibleForm = () => {
  return (
    <AdaptiveView 
      accessibilityRole="form"
      accessibilityLabel="用戶註冊表單"
    >
      <AdaptiveText 
        variant="heading"
        accessibilityRole="heading"
        accessibilityLevel={1}
      >
        註冊新帳號
      </AdaptiveText>
      
      <AdaptiveInput
        label="姓名"
        placeholder="請輸入您的姓名"
        accessibilityLabel="姓名輸入框"
        accessibilityHint="請輸入您的真實姓名"
        required
      />
      
      <AdaptiveInput
        label="電子郵件"
        placeholder="example@email.com"
        accessibilityLabel="電子郵件輸入框"
        keyboardType="email-address"
        required
      />
      
      <AdaptiveButton
        variant="primary"
        accessibilityRole="button"
        accessibilityLabel="提交註冊表單"
        onPress={handleSubmit}
      >
        註冊
      </AdaptiveButton>
    </AdaptiveView>
  );
};
```

### 2. 鍵盤導航

```typescript
// ✅ 鍵盤導航支援
const NavigableList = ({ items, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        setFocusedIndex(0);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  return (
    <AdaptiveView
      ref={listRef}
      accessibilityRole="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <AdaptiveView
          key={item.id}
          accessibilityRole="option"
          accessibilitySelected={index === focusedIndex}
          style={[
            styles.listItem,
            index === focusedIndex && styles.focusedItem
          ]}
        >
          <AdaptiveText>{item.title}</AdaptiveText>
        </AdaptiveView>
      ))}
    </AdaptiveView>
  );
};
```

### 3. 螢幕閱讀器支援

```typescript
// ✅ 螢幕閱讀器優化
const AccessibleDataTable = ({ data, columns }) => {
  return (
    <AdaptiveView
      accessibilityRole="table"
      accessibilityLabel={`資料表格，包含 ${data.length} 行資料`}
    >
      {/* 表格標題 */}
      <AdaptiveView 
        accessibilityRole="row"
        style={styles.tableHeader}
      >
        {columns.map(column => (
          <AdaptiveText
            key={column.key}
            accessibilityRole="columnheader"
            variant="caption"
            weight="bold"
            style={styles.tableHeaderCell}
          >
            {column.title}
          </AdaptiveText>
        ))}
      </AdaptiveView>
      
      {/* 表格內容 */}
      {data.map((row, rowIndex) => (
        <AdaptiveView
          key={row.id}
          accessibilityRole="row"
          accessibilityLabel={`第 ${rowIndex + 1} 行`}
          style={styles.tableRow}
        >
          {columns.map(column => (
            <AdaptiveText
              key={column.key}
              accessibilityRole="cell"
              accessibilityLabel={`${column.title}: ${row[column.key]}`}
              style={styles.tableCell}
            >
              {row[column.key]}
            </AdaptiveText>
          ))}
        </AdaptiveView>
      ))}
    </AdaptiveView>
  );
};
```

---

## 程式碼組織

### 1. 檔案結構最佳實踐

```
src/
├── components/
│   ├── adaptive/           # Adaptive 元件庫
│   │   ├── core/          # 核心元件
│   │   ├── platform/      # 平台適配器
│   │   └── index.ts       # 統一匯出
│   ├── common/            # 通用元件
│   └── screens/           # 頁面元件
├── hooks/                 # 自定義 Hooks
├── services/              # 業務邏輯服務
├── utils/                 # 工具函數
├── theme/                 # 設計系統
├── types/                 # TypeScript 類型定義
└── constants/             # 常數定義
```

### 2. 匯入/匯出策略

```typescript
// ✅ 統一匯出入口
// src/components/adaptive/index.ts
export { AdaptiveView } from './core/AdaptiveView';
export { AdaptiveText } from './core/AdaptiveText';
export { AdaptiveButton } from './core/AdaptiveButton';
export { AdaptiveInput } from './core/AdaptiveInput';
export { PlatformAdapter } from './platform/PlatformAdapter';
export type { 
  AdaptiveViewProps,
  AdaptiveTextProps,
  AdaptiveButtonProps,
  AdaptiveInputProps,
} from './types';

// ✅ 使用統一匯入
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  type AdaptiveButtonProps,
} from '@components/adaptive';

// ❌ 避免直接匯入內部檔案
import { AdaptiveButton } from '@components/adaptive/core/AdaptiveButton';
```

### 3. 命名慣例

```typescript
// ✅ 一致的命名慣例

// 元件名稱：PascalCase + Adaptive 前綴
export const AdaptiveButton = () => {};
export const AdaptiveModal = () => {};

// Hook 名稱：camelCase + use 前綴
export const useAdaptiveStyles = () => {};
export const usePlatformAdapter = () => {};

// 工具函數：camelCase
export const formatCurrency = () => {};
export const validateEmail = () => {};

// 常數：UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.example.com';
export const DEFAULT_TIMEOUT = 5000;

// 類型定義：PascalCase + Props/State/Config 等後綴
export interface AdaptiveButtonProps {}
export interface UserState {}
export interface ApiConfig {}

// 檔案名稱：kebab-case
// adaptive-button.tsx
// user-profile.tsx
// api-client.ts
```

---

這些最佳實踐將幫助您建立高品質、可維護且效能優良的 Adaptive Architecture 應用程式。定期回顧和更新這些實踐，以確保與最新的開發趨勢保持同步。