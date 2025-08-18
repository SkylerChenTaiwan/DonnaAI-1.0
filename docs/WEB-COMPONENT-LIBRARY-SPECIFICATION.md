# DonnaAI Web 版元件庫規格

## 📋 概述

基於現有的 **Adaptive Architecture** 和 **DesignSystem**，為新的純 Web 版本建立標準化元件庫。繼承現有的設計 tokens 和組件架構思想，但針對 Web 平台進行最佳化。

### 🎯 設計原則
- **繼承現有設計系統** - 使用已驗證的 DesignSystem tokens
- **純 Web 最佳化** - 不需要跨平台相容性考量  
- **Notion 風格美學** - 延續現有的單色灰階設計
- **高效能** - 針對大量資料處理最佳化

---

## 🎨 設計系統基礎

### 顏色系統（沿用現有）
```typescript
// 基於 src/theme/designSystem.ts
export const WebDesignSystem = {
  colors: {
    // 主色調（深灰色系）
    primary: '#2C2C2C',
    
    // 按鈕色彩系統
    button: {
      primary: {
        default: '#1A1A1A',
        hover: '#2C2C2C', 
        pressed: '#0A0A0A'
      },
      secondary: {
        default: '#F7F7F7',
        hover: '#ECECEC',
        pressed: '#E0E0E0'
      },
      outline: {
        border: '#D0D0D0',
        borderHover: '#A0A0A0',
        background: 'transparent',
        backgroundHover: 'rgba(0, 0, 0, 0.03)'
      }
    },
    
    // 文字色
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
      tertiary: '#999999',
      disabled: '#CCCCCC',
      inverse: '#FFFFFF'
    },
    
    // 背景色
    background: {
      primary: '#FFFFFF',
      surface: '#FFFFFF',
      input: '#FAFAFA'
    },
    
    // 邊框色  
    border: {
      light: '#E5E7EB',
      default: '#D1D5DB',
      medium: '#B5B5B5',
      dark: '#9CA3AF'
    },
    
    // 狀態色
    status: {
      success: '#34C759',
      warning: '#FF9500', 
      error: '#FF3B30',
      info: '#5856D6'
    },
    
    // 灰階系統
    gray: {
      50: '#FAFAFA',
      100: '#F8F8F8',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    }
  },
  
  // 間距系統
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // 字體系統
  typography: {
    h1: { fontSize: '32px', lineHeight: '40px', fontWeight: '700' },
    h2: { fontSize: '24px', lineHeight: '32px', fontWeight: '600' },
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: '600' },
    h4: { fontSize: '18px', lineHeight: '24px', fontWeight: '600' },
    body: { fontSize: '16px', lineHeight: '24px', fontWeight: '400' },
    bodySmall: { fontSize: '14px', lineHeight: '20px', fontWeight: '400' },
    caption: { fontSize: '12px', lineHeight: '16px', fontWeight: '400' },
    button: { fontSize: '14px', lineHeight: '20px', fontWeight: '500' }
  },
  
  // 圓角系統
  borderRadius: {
    sm: '8px',
    md: '12px', 
    lg: '16px',
    button: '6px',
    full: '9999px'
  },
  
  // 陰影系統
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.15)'
  },
  
  // 動畫系統
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease'
  }
};
```

### Tailwind CSS 設定
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C2C2C',
        gray: {
          50: '#FAFAFA',
          100: '#F8F8F8',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717'
        },
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#5856D6'
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px', 
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px'
      },
      borderRadius: {
        'button': '6px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

---

## 🧩 基礎元件規格

### Button 元件
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  children,
  className = ''
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];
  
  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
    text: 'text-gray-700 hover:text-gray-900 underline-offset-4 hover:underline'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm rounded-button',
    medium: 'px-4 py-2 text-sm rounded-button', 
    large: 'px-5 py-2.5 text-base rounded-button'
  };
  
  const classes = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner className="w-4 h-4 mr-2" />}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
```

### Input 元件
```typescript
// components/ui/Input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  variant?: 'outline' | 'filled';
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  variant = 'outline',
  size = 'medium',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  error,
  leftIcon,
  rightIcon,
  onChange,
  onFocus,
  onBlur,
  className = ''
}) => {
  const baseClasses = [
    'w-full border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];
  
  const variantClasses = {
    outline: [
      'bg-white border-gray-300',
      'focus:border-gray-500 focus:ring-gray-300',
      error ? 'border-red-500 focus:border-red-500 focus:ring-red-300' : ''
    ].join(' '),
    filled: [
      'bg-gray-50 border-transparent',
      'focus:bg-white focus:border-gray-300 focus:ring-gray-300',
      error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-300' : ''
    ].join(' ')
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm rounded-md',
    medium: 'px-3 py-2 text-sm rounded-md',
    large: 'px-4 py-2.5 text-base rounded-md'
  };
  
  const classes = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className
  ].join(' ');
  
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">{leftIcon}</span>
        </div>
      )}
      
      <input
        type={type}
        className={classes}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span className="text-gray-400">{rightIcon}</span>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

### Card 元件
```typescript
// components/ui/Card.tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  children,
  className = '',
  onClick
}) => {
  const baseClasses = [
    'bg-white rounded-lg transition-shadow',
    onClick ? 'cursor-pointer hover:shadow-md' : ''
  ];
  
  const variantClasses = {
    default: 'shadow-sm border border-gray-200',
    elevated: 'shadow-lg',
    outline: 'border-2 border-gray-300'
  };
  
  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };
  
  const classes = [
    ...baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className
  ].join(' ');
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component className={classes} onClick={onClick}>
      {children}
    </Component>
  );
};
```

---

## 📊 專業元件規格

### NotionTable 元件（承襲現有架構）
```typescript
// components/table/NotionTable.tsx
// 基於 src/components/database/notion/NotionTable.tsx 的 Web 優化版本

interface NotionTableProps {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  onRowEdit?: (row: any) => void;
  onRowDelete?: (rowId: string) => void;
  onCellEdit?: (rowId: string, field: string, value: any) => void;
  onColumnAdd?: () => void;
  onColumnEdit?: (column: TableColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  multiSelect?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  virtualScrolling?: boolean;
  stickyHeader?: boolean;
}

interface TableColumn {
  id: string;
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'email' | 'phone';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  options?: string[]; // for select/multiselect
  required?: boolean;
  placeholder?: string;
}

export const NotionTable: React.FC<NotionTableProps> = ({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  onRowClick,
  onRowEdit, 
  onRowDelete,
  onCellEdit,
  onColumnAdd,
  onColumnEdit,
  onColumnDelete,
  multiSelect = false,
  selectedRows = [],
  onSelectionChange,
  virtualScrolling = true,
  stickyHeader = true
}) => {
  // 實作邏輯基於現有的 NotionTable 但針對 Web 最佳化
  // 使用 TanStack Table 作為底層引擎
  // 保持 Notion 風格的 UI 設計
  
  return (
    <div className="notion-table-container">
      {/* 工具列 */}
      <NotionTableToolbar 
        onColumnAdd={onColumnAdd}
        selectedCount={selectedRows.length}
        totalCount={data.length}
      />
      
      {/* 表格主體 */}
      <div className="notion-table-wrapper">
        <TanStackNotionTable
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          onCellEdit={onCellEdit}
          virtualScrolling={virtualScrolling}
          stickyHeader={stickyHeader}
          multiSelect={multiSelect}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
        />
      </div>
      
      {/* 載入狀態 */}
      {loading && <TableLoadingOverlay />}
      
      {/* 錯誤狀態 */}
      {error && <TableErrorState message={error} />}
      
      {/* 空狀態 */}
      {!loading && !error && data.length === 0 && (
        <TableEmptyState message={emptyMessage} />
      )}
    </div>
  );
};
```

### Chart 元件（基於 Recharts）
```typescript
// components/charts/BaseChart.tsx
interface BaseChartProps {
  data: any[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  className?: string;
}

interface BarChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  width = 400,
  height = 300,
  color = WebDesignSystem.colors.primary,
  horizontal = false,
  title,
  subtitle,
  loading = false,
  error,
  className = ''
}) => {
  if (loading) {
    return <ChartSkeleton width={width} height={height} />;
  }
  
  if (error) {
    return <ChartError message={error} />;
  }
  
  const ChartComponent = horizontal ? RechartsBarChart : RechartsBarChart;
  const layout = horizontal ? 'horizontal' : 'vertical';
  
  return (
    <Card className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          layout={layout}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey={xKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              boxShadow: WebDesignSystem.shadows.md
            }}
          />
          <Bar dataKey={yKey} fill={color} radius={[2, 2, 0, 0]} />
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
};
```

### OrganizationChart 元件（基於 ReactFlow）
```typescript
// components/org-chart/OrganizationChart.tsx
interface OrgNode {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  level: number;
  parentId?: string;
  teamId: string;
}

interface OrganizationChartProps {
  nodes: OrgNode[];
  editable?: boolean;
  onNodeClick?: (node: OrgNode) => void;
  onNodeMove?: (nodeId: string, newParentId: string) => void;
  onNodeEdit?: (node: OrgNode) => void;
  direction?: 'top-bottom' | 'left-right';
  className?: string;
}

export const OrganizationChart: React.FC<OrganizationChartProps> = ({
  nodes,
  editable = false,
  onNodeClick,
  onNodeMove,
  onNodeEdit,
  direction = 'top-bottom',
  className = ''
}) => {
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    return convertToFlowElements(nodes, direction);
  }, [nodes, direction]);
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // 處理節點變化，支援拖拽重新組織
    if (editable && onNodeMove) {
      // 實作拖拽邏輯
    }
  }, [editable, onNodeMove]);
  
  return (
    <Card className={className} padding="none">
      <div className="h-96 w-full">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          nodeTypes={{ orgNode: OrgNodeComponent }}
          edgeTypes={{ orgEdge: OrgEdgeComponent }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={editable}
          nodesConnectable={false}
          elementsSelectable={editable}
        >
          <Background color="#F3F4F6" gap={16} />
          <Controls />
          {editable && <MiniMap />}
        </ReactFlow>
      </div>
    </Card>
  );
};

// 組織節點元件
const OrgNodeComponent: React.FC<{ data: OrgNode }> = ({ data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-48">
      <div className="flex items-center space-x-3">
        {data.avatar ? (
          <img 
            src={data.avatar} 
            alt={data.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {data.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {data.name}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {data.role}
          </p>
        </div>
      </div>
    </div>
  );
};
```

### AIQueryInterface 元件
```typescript
// components/ai/AIQueryInterface.tsx
interface AIQueryInterfaceProps {
  onQuery?: (query: string) => void;
  loading?: boolean;
  error?: string;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export const AIQueryInterface: React.FC<AIQueryInterfaceProps> = ({
  onQuery,
  loading = false,
  error,
  suggestions = [],
  placeholder = '用自然語言描述你想看的數據...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onQuery) {
      onQuery(query.trim());
    }
  };
  
  return (
    <Card className={className}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI 數據查詢
          </h3>
          <p className="text-sm text-gray-600">
            用自然語言詢問，AI 將為您生成相應的圖表
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              error={error}
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={
                <Button
                  type="submit"
                  size="small"
                  disabled={!query.trim() || loading}
                  loading={loading}
                >
                  查詢
                </Button>
              }
              className="pr-20"
            />
          </div>
          
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">建議查詢：</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};
```

---

## 🔧 佈局和導航元件

### Layout 元件
```typescript
// components/layout/Layout.tsx
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar,
  header,
  breadcrumbs,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      {header && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          {header}
        </header>
      )}
      
      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            {sidebar}
          </aside>
        )}
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {breadcrumbs && (
            <div className="mb-6">
              {breadcrumbs}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
};
```

### Navigation 元件
```typescript
// components/navigation/Navigation.tsx
interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: NavigationItem[];
  active?: boolean;
}

interface NavigationProps {
  items: NavigationItem[];
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  onItemClick,
  className = ''
}) => {
  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item) => (
        <NavigationItem
          key={item.id}
          item={item}
          onClick={onItemClick}
        />
      ))}
    </nav>
  );
};

const NavigationItem: React.FC<{
  item: NavigationItem;
  onClick?: (item: NavigationItem) => void;
  level?: number;
}> = ({ item, onClick, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  
  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick(item);
    }
  };
  
  const baseClasses = [
    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
    'hover:bg-gray-100',
    item.active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
  ];
  
  const paddingLeft = level * 16 + 12;
  
  return (
    <div>
      <button
        className={baseClasses.join(' ')}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
      >
        {item.icon && (
          <span className="mr-3 flex-shrink-0">
            {item.icon}
          </span>
        )}
        
        <span className="flex-1 text-left">
          {item.label}
        </span>
        
        {hasChildren && (
          <ChevronRight 
            className={`ml-2 w-4 h-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>
      
      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.children!.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 📱 響應式設計

### 斷點系統
```typescript
// utils/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    ...windowSize,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isWide: windowSize.width >= 1280
  };
};
```

---

## 🧪 元件測試策略

### 單元測試模板
```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
  
  test('applies variant classes correctly', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toHaveClass('bg-gray-100');
  });
});
```

### Storybook 設定
```typescript
// .storybook/main.ts
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  }
};

// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: '基礎按鈕元件，支援多種變體和尺寸'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'text']
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large']
    }
  }
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const AllVariants = () => (
  <div className="space-x-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="text">Text</Button>
  </div>
);
```

---

## 📦 元件庫結構

```
src/
├── components/
│   ├── ui/                    # 基礎 UI 元件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   └── index.ts
│   ├── forms/                 # 表單元件
│   │   ├── FormField.tsx
│   │   ├── FormGroup.tsx
│   │   └── FormValidation.tsx
│   ├── layout/                # 佈局元件
│   │   ├── Layout.tsx
│   │   ├── Container.tsx
│   │   ├── Grid.tsx
│   │   └── Stack.tsx
│   ├── navigation/            # 導航元件
│   │   ├── Navigation.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── Tabs.tsx
│   │   └── Pagination.tsx
│   ├── table/                 # 表格元件
│   │   ├── NotionTable.tsx
│   │   ├── DataTable.tsx
│   │   ├── TableFilters.tsx
│   │   └── TableExport.tsx
│   ├── charts/                # 圖表元件
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   └── ChartContainer.tsx
│   ├── org-chart/             # 組織圖元件
│   │   ├── OrganizationChart.tsx
│   │   ├── OrgNode.tsx
│   │   └── OrgEdge.tsx
│   └── ai/                    # AI 相關元件
│       ├── AIQueryInterface.tsx
│       ├── QuerySuggestions.tsx
│       └── ResultDisplay.tsx
├── hooks/                     # 自定義 hooks
│   ├── useResponsive.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useTable.ts
├── utils/                     # 工具函數
│   ├── cn.ts                  # className 合併工具
│   ├── format.ts              # 格式化工具
│   └── validation.ts          # 驗證工具
└── styles/                    # 樣式文件
    ├── globals.css
    ├── components.css
    └── utilities.css
```

---

## 🚀 使用範例

### Dashboard 頁面範例
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <Layout
      header={<DashboardHeader />}
      sidebar={<DashboardSidebar />}
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} />}
    >
      <div className="space-y-6">
        {/* AI 查詢介面 */}
        <AIQueryInterface
          onQuery={handleAIQuery}
          suggestions={querySuggestions}
        />
        
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="總客戶數"
            value={stats.totalCustomers}
            change={stats.customerGrowth}
            icon={<Users />}
          />
          {/* 更多統計卡片... */}
        </div>
        
        {/* 圖表區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            data={salesData}
            xKey="month"
            yKey="revenue"
            title="月收入趨勢"
          />
          <PieChart
            data={customerSegments}
            dataKey="value"
            nameKey="segment"
            title="客戶分布"
          />
        </div>
      </div>
    </Layout>
  );
}
```

---

## 📝 下一步行動

### 開發順序
1. **Phase 1** - 基礎 UI 元件 (Button, Input, Card)
2. **Phase 2** - 佈局和導航元件
3. **Phase 3** - NotionTable 元件（核心功能）
4. **Phase 4** - 圖表元件（AI 分析）
5. **Phase 5** - 組織圖元件（人事管理）
6. **Phase 6** - AI 查詢元件

### 準備工作
- ✅ 元件庫規格已完成
- ⏳ 建立 Storybook 環境
- ⏳ 設定測試框架
- ⏳ 建立設計 tokens

---

*最後更新：2025-01-18*  
*版本：v1.0*  
*基於現有 Adaptive Architecture 和 DesignSystem*