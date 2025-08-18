# DonnaAI Web 元件庫技術規格 v2.0

## 📋 專案概覽

**目標**: 建立企業級 Web 元件庫，提供一致性設計語言和高效開發體驗  
**版本**: 2.0  
**狀態**: PRP-121 完成規格撰寫階段  
**更新日期**: 2025-08-18  

### 🎯 設計目標

1. **統一設計系統** - 基於現有 Tailwind 設計系統擴展
2. **高效開發體驗** - TypeScript 嚴格型別、完整 API 設計
3. **企業級質量** - 完整測試覆蓋、Storybook 文檔
4. **效能優化** - 支持大數據量、響應式設計
5. **可擴展架構** - 模組化設計、未來技術整合

---

## 🎨 設計系統基礎分析

### 現有 Tailwind 設計系統評估 ✅

基於 `/web/tailwind.config.ts` 分析，現有設計系統已完整建立：

**顏色系統** (完整度: 100%)
- ✅ 主色調灰階系統 (primary 50-900)
- ✅ 語義化顏色 (background, text, border)
- ✅ 按鈕色彩系統 (primary/secondary with hover/pressed states)
- ✅ 狀態色彩 (success, warning, error, info)

**排版系統** (完整度: 95%)
- ✅ 字體系統 (Geist Sans/Mono)
- ✅ 字體大小階層 (xs-3xl)
- ✅ 行高系統
- ✅ 字重系統

**間距系統** (完整度: 100%)
- ✅ 語義化間距 (xs, sm, md, lg, xl, xxl)
- ✅ 響應式間距系統

**組件系統** (完整度: 80%)
- ✅ 圓角系統 (button, sm, md, lg, xl)
- ✅ 陰影系統 (sm, md, lg, xl)
- ✅ 動畫系統 (fade-in, slide-in, scale-in)

### 需要補強的設計系統

1. **元件變體系統** - 標準化各元件的 size/variant 規範
2. **狀態系統** - hover, focus, active, disabled 狀態標準化
3. **響應式工具類** - 更豐富的響應式工具類

---

## 🧩 元件架構設計

### 基礎架構層級

```typescript
// 基礎元件層 (Tier 1)
Button, Input, Select, Card, Modal, Badge, Avatar

// 組合元件層 (Tier 2)
FormField, DataTable, Navigation, Breadcrumb, Pagination

// 業務元件層 (Tier 3)
NotionTable, Chart, OrganizationChart, AIQueryInterface

// 佈局元件層 (Tier 4)
Layout, Container, Grid, Stack, AppLayout
```

### 元件優先級排序

| 優先級 | 元件類型 | 開發順序 | 預估工時 |
|--------|----------|----------|----------|
| P0 | Button, Input, Card | 第1週 | 16小時 |
| P0 | Modal, Select, Badge | 第2週 | 20小時 |
| P1 | FormField, DataTable | 第3週 | 24小時 |
| P1 | Navigation, Layout | 第4週 | 16小時 |
| P2 | NotionTable, Chart | 第5-6週 | 40小時 |
| P2 | AIQueryInterface | 第7週 | 16小時 |
| P3 | OrganizationChart | 第8週 | 20小時 |

---

## 🚀 Radix UI 整合技術方案

### 建議的 Radix UI 套件

```bash
# 需要安裝的 Radix 套件
npm install @radix-ui/react-dialog           # Modal 系統
npm install @radix-ui/react-select           # Select 元件
npm install @radix-ui/react-toast            # 通知系統
npm install @radix-ui/react-dropdown-menu    # 下拉選單
npm install @radix-ui/react-popover          # 彈出元件
npm install @radix-ui/react-tabs             # Tab 導航
npm install @radix-ui/react-accordion        # 折疊面板
npm install @radix-ui/react-checkbox         # 複選框
npm install @radix-ui/react-radio-group      # 單選框
npm install @radix-ui/react-slider           # 滑動條
npm install @radix-ui/react-switch           # 切換按鈕
npm install @radix-ui/react-tooltip          # 工具提示
npm install @radix-ui/react-progress         # 進度條
```

### Radix UI 包裝模式

```typescript
// components/ui/Modal.tsx - Radix 包裝範例
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
  maxWidth
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-modal animate-fade-in" />
        <Dialog.Content 
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-lg p-6 shadow-xl z-modal animate-scale-in',
            'focus:outline-none',
            maxWidth ? `max-w-[${maxWidth}]` : sizeClasses[size],
            'w-full mx-4',
            className
          )}
        >
          {title && (
            <Dialog.Title className="text-heading-2 mb-2">
              {title}
            </Dialog.Title>
          )}
          
          {description && (
            <Dialog.Description className="text-caption text-text-secondary mb-4">
              {description}
            </Dialog.Description>
          )}

          {children}

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100"
              aria-label="關閉"
            >
              <Icon name="x" size="sm" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
```

---

## 📝 元件 API 介面標準

### 標準化 Props 接口設計

```typescript
// 基礎元件 Props 標準
interface BaseComponentProps {
  className?: string;           // 自定義樣式
  'data-testid'?: string;      // 測試 ID
  'aria-label'?: string;       // 可訪問性
  'aria-describedby'?: string; // 可訪問性描述
}

// 尺寸變體標準
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 視覺變體標準
type ComponentVariant = 
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'text'
  | 'success' | 'warning' | 'error' | 'info';

// 狀態標準
interface ComponentState {
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}
```

### Button 元件完整 API

```typescript
interface ButtonProps extends BaseComponentProps, ComponentState {
  // 視覺屬性
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // 行為屬性
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  
  // 圖示支援
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  
  // 事件處理
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  
  // 內容
  children: React.ReactNode;
}

// 使用範例
<Button 
  variant="primary" 
  size="md"
  leftIcon={<Icon name="plus" />}
  loading={isSubmitting}
  onClick={handleSubmit}
  data-testid="submit-button"
>
  建立新項目
</Button>
```

### Input 元件完整 API

```typescript
interface InputProps extends BaseComponentProps, ComponentState {
  // 基本屬性
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  name?: string;
  id?: string;
  
  // 視覺屬性
  variant?: 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  
  // 內容屬性
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  
  // 驗證屬性
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  
  // 圖示支援
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  
  // 狀態
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  
  // 事件處理
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}
```

---

## 📊 專業元件設計

### NotionTable 元件 API

```typescript
interface NotionTableColumn {
  id: string;
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 
        'checkbox' | 'email' | 'phone' | 'url' | 'currency';
  
  // 顯示屬性
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  
  // 功能屬性
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  
  // 類型特定屬性
  options?: string[];        // select/multiselect
  format?: string;          // date/currency
  precision?: number;       // number/currency
  
  // 自定義渲染
  render?: (value: any, row: any) => React.ReactNode;
  renderEdit?: (value: any, row: any, onChange: (value: any) => void) => React.ReactNode;
}

interface NotionTableProps {
  // 數據
  data: any[];
  columns: NotionTableColumn[];
  
  // 狀態
  loading?: boolean;
  error?: string;
  
  // 功能配置
  selectable?: boolean;
  multiSelect?: boolean;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  
  // 性能配置
  virtualScrolling?: boolean;
  pageSize?: number;
  
  // 視覺配置
  stickyHeader?: boolean;
  stickyColumns?: string[];
  showRowNumbers?: boolean;
  showCheckboxes?: boolean;
  
  // 事件處理
  onRowClick?: (row: any, index: number) => void;
  onRowSelect?: (selectedRows: any[]) => void;
  onCellEdit?: (rowIndex: number, column: NotionTableColumn, newValue: any) => void;
  onSort?: (column: NotionTableColumn, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (searchTerm: string) => void;
  
  // 自定義擴展
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
}

// 使用範例
<NotionTable
  data={customers}
  columns={customerColumns}
  loading={isLoading}
  selectable
  multiSelect
  virtualScrolling
  stickyHeader
  onRowSelect={setSelectedCustomers}
  onCellEdit={handleCellEdit}
  toolbar={
    <div className="flex justify-between">
      <Button leftIcon={<Icon name="plus" />}>新增客戶</Button>
      <Button variant="outline" leftIcon={<Icon name="download" />}>
        匯出
      </Button>
    </div>
  }
/>
```

### Chart 元件設計 (基於 Recharts)

```typescript
// 需要安裝的圖表套件
// npm install recharts
// npm install @types/recharts

interface BaseChartProps {
  // 數據
  data: any[];
  
  // 尺寸
  width?: number;
  height?: number;
  aspectRatio?: number;
  
  // 標題
  title?: string;
  subtitle?: string;
  
  // 狀態
  loading?: boolean;
  error?: string;
  
  // 樣式
  colorScheme?: 'default' | 'success' | 'warning' | 'error' | 'info';
  colors?: string[];
  
  // 功能
  exportable?: boolean;
  interactive?: boolean;
  
  className?: string;
}

interface BarChartProps extends BaseChartProps {
  xAxisKey: string;
  yAxisKey: string;
  
  // Bar 特定屬性
  horizontal?: boolean;
  stacked?: boolean;
  grouped?: boolean;
  
  // 軸配置
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  
  // 格式化
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

// Chart 容器元件
export const Chart: React.FC<{
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  props: BaseChartProps;
}> = ({ type, props }) => {
  if (props.loading) {
    return <ChartSkeleton width={props.width} height={props.height} />;
  }
  
  if (props.error) {
    return <ChartError message={props.error} />;
  }
  
  const ChartComponent = {
    bar: BarChart,
    line: LineChart,
    pie: PieChart,
    area: AreaChart,
    scatter: ScatterChart
  }[type];
  
  return (
    <Card className={props.className}>
      {props.title && <ChartHeader title={props.title} subtitle={props.subtitle} />}
      <ChartComponent {...props} />
      {props.exportable && <ChartExportButton data={props.data} />}
    </Card>
  );
};
```

---

## 📱 響應式設計標準

### 斷點系統

基於現有 Tailwind 配置的響應式標準：

```typescript
// 響應式斷點 (已存在於 tailwind.config.ts)
const breakpoints = {
  xs: '475px',    // 小型手機
  sm: '640px',    // 大型手機
  md: '768px',    // 平板
  lg: '1024px',   // 小型筆電
  xl: '1280px',   // 大型螢幕
  '2xl': '1536px' // 超大螢幕
};

// 響應式工具 Hook
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
    isXs: windowSize.width < 475,
    isSm: windowSize.width >= 475 && windowSize.width < 640,
    isMd: windowSize.width >= 768 && windowSize.width < 1024,
    isLg: windowSize.width >= 1024 && windowSize.width < 1280,
    isXl: windowSize.width >= 1280,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024
  };
};
```

### 響應式元件設計模式

```typescript
// 響應式 Button
interface ResponsiveButtonProps extends ButtonProps {
  responsiveSize?: {
    xs?: ComponentSize;
    sm?: ComponentSize;
    md?: ComponentSize;
    lg?: ComponentSize;
    xl?: ComponentSize;
  };
}

// 響應式 Grid
interface ResponsiveGridProps {
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  children: React.ReactNode;
}

// 使用範例
<ResponsiveGrid 
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={{ xs: 'sm', md: 'md', lg: 'lg' }}
>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</ResponsiveGrid>
```

---

## 🧪 測試策略

### 測試框架設置

```bash
# 測試相關套件
npm install -D @testing-library/react
npm install -D @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D jest
npm install -D jest-environment-jsdom
npm install -D @storybook/react
npm install -D @storybook/addon-essentials
npm install -D @storybook/addon-a11y
npm install -D chromatic
```

### 元件測試模板

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  // 基本渲染測試
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  // 變體測試
  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'], 
    ['outline', 'border'],
    ['ghost', 'hover:bg-gray-100'],
    ['text', 'underline-offset-4']
  ])('applies %s variant classes correctly', (variant, expectedClass) => {
    render(<Button variant={variant as any}>Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedClass);
  });

  // 尺寸測試  
  it.each([
    ['xs', 'px-2 py-1 text-xs'],
    ['sm', 'px-3 py-1.5 text-sm'],
    ['md', 'px-4 py-2 text-sm'],
    ['lg', 'px-5 py-2.5 text-base'],
    ['xl', 'px-6 py-3 text-lg']
  ])('applies %s size classes correctly', (size, expectedClasses) => {
    render(<Button size={size as any}>Button</Button>);
    const button = screen.getByRole('button');
    expectedClasses.split(' ').forEach(cls => {
      expect(button).toHaveClass(cls);
    });
  });

  // 事件處理測試
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // 載入狀態測試
  it('shows loading state correctly', () => {
    render(<Button loading>Loading Button</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // 禁用狀態測試
  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  // 可訪問性測試
  it('has proper accessibility attributes', () => {
    render(
      <Button 
        aria-label="Custom label"
        aria-describedby="help-text"
        data-testid="test-button"
      >
        Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
    expect(button).toHaveAttribute('data-testid', 'test-button');
  });

  // 圖示支援測試
  it('renders with left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Button with icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
```

### Storybook 設定

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript'
  }
};

export default config;

// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: '通用按鈕元件，支援多種變體、尺寸和狀態。基於 Tailwind CSS 設計系統。'
      }
    },
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'text'],
      description: '按鈕的視覺變體'
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: '按鈕尺寸'
    },
    loading: {
      control: { type: 'boolean' },
      description: '載入狀態'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '禁用狀態'
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: '全寬度顯示'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本按鈕
export const Default: Story = {
  args: {
    children: '預設按鈕'
  }
};

// 所有變體
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="text">Text</Button>
    </div>
  )
};

// 所有尺寸
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  )
};

// 帶圖示的按鈕
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button leftIcon={<Icon name="plus" />}>新增項目</Button>
      <Button rightIcon={<Icon name="arrow-right" />}>繼續</Button>
      <Button 
        leftIcon={<Icon name="download" />} 
        rightIcon={<Icon name="chevron-down" />}
      >
        下載檔案
      </Button>
    </div>
  )
};

// 狀態示例
export const States: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button>Normal</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  )
};

// 互動測試
export const Interactive: Story = {
  args: {
    children: '點擊我'
  },
  play: async ({ canvasElement }) => {
    // Storybook 互動測試可以在這裡編寫
  }
};
```

---

## 📂 專案結構設計

### 完整目錄架構

```
web/
├── components/                    # React 元件
│   ├── ui/                       # 基礎 UI 元件 (Tier 1)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.test.tsx
│   │   │   ├── Input.stories.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Select/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Loading/
│   │   ├── Icon/                 # ✅ 已完成
│   │   └── index.ts              # 統一導出
│   │
│   ├── forms/                    # 表單元件 (Tier 2)
│   │   ├── FormField/
│   │   ├── FormGroup/
│   │   ├── FormValidation/
│   │   ├── FormBuilder/
│   │   └── index.ts
│   │
│   ├── data/                     # 數據顯示元件 (Tier 2)
│   │   ├── DataTable/
│   │   ├── NotionTable/          # 專業表格元件
│   │   ├── Pagination/
│   │   ├── Filter/
│   │   ├── Search/
│   │   └── index.ts
│   │
│   ├── charts/                   # 圖表元件 (Tier 3)
│   │   ├── BarChart/
│   │   ├── LineChart/
│   │   ├── PieChart/
│   │   ├── AreaChart/
│   │   ├── ChartContainer/
│   │   ├── ChartLegend/
│   │   └── index.ts
│   │
│   ├── navigation/               # 導航元件 (Tier 2)
│   │   ├── Navigation/
│   │   ├── Breadcrumb/
│   │   ├── Tabs/
│   │   ├── Sidebar/              # ✅ 已完成
│   │   └── index.ts
│   │
│   ├── layout/                   # 佈局元件 (Tier 4)
│   │   ├── Layout/
│   │   ├── Container/
│   │   ├── Grid/
│   │   ├── Stack/
│   │   ├── AppLayout/            # ✅ 已完成
│   │   ├── Header/               # ✅ 已完成
│   │   └── index.ts
│   │
│   ├── business/                 # 業務特定元件 (Tier 3)
│   │   ├── CustomerCard/
│   │   ├── OrganizationChart/
│   │   ├── AIQueryInterface/
│   │   ├── TeamSelector/
│   │   ├── RolePermissions/
│   │   └── index.ts
│   │
│   └── examples/                 # 元件使用範例
│       ├── DashboardExample/
│       ├── FormExample/
│       └── TableExample/
│
├── hooks/                        # 自定義 Hooks
│   ├── useResponsive.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useTable.ts
│   ├── useForm.ts
│   └── index.ts
│
├── lib/                          # 工具函式庫
│   ├── utils.ts                  # cn() 等工具函數
│   ├── constants.ts              # 常數定義
│   ├── validation.ts             # 驗證規則
│   ├── formatters.ts             # 格式化函數
│   └── types.ts                  # 共用型別
│
├── styles/                       # 樣式文件
│   ├── globals.css
│   ├── components.css            # 元件特定樣式
│   └── utilities.css             # 工具類樣式
│
├── stories/                      # Storybook 故事
│   ├── Introduction.stories.mdx
│   ├── DesignSystem.stories.mdx
│   └── ComponentGuide.stories.mdx
│
└── __tests__/                    # 全域測試
    ├── setup.ts                  # 測試設定
    ├── utils.ts                  # 測試工具
    └── integration/              # 整合測試
```

---

## ⚡ 效能優化策略

### 程式碼分割策略

```typescript
// 動態載入重型元件
const NotionTable = dynamic(
  () => import('@/components/data/NotionTable'),
  { 
    loading: () => <TableSkeleton />,
    ssr: false // 表格元件無需 SSR
  }
);

const OrganizationChart = dynamic(
  () => import('@/components/business/OrganizationChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

// 圖表套件按需載入
const ChartComponents = {
  bar: dynamic(() => import('@/components/charts/BarChart')),
  line: dynamic(() => import('@/components/charts/LineChart')),
  pie: dynamic(() => import('@/components/charts/PieChart'))
};
```

### 虛擬化支援

```typescript
// components/data/VirtualizedTable.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps {
  data: any[];
  itemHeight: number;
  height: number;
  renderRow: (props: { index: number; style: React.CSSProperties }) => React.ReactElement;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  itemHeight,
  height,
  renderRow
}) => {
  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={itemHeight}
      overscanCount={5} // 預載入 5 行
    >
      {renderRow}
    </List>
  );
};
```

### 快取策略

```typescript
// hooks/useCache.ts
import { useMemo } from 'react';

export const useMemoizedData = <T>(
  data: T[],
  dependencies: any[]
) => {
  return useMemo(() => {
    // 數據處理邏輯
    return data.map(item => ({
      ...item,
      processed: true
    }));
  }, [data, ...dependencies]);
};

// 圖表數據快取
export const useChartDataCache = (rawData: any[], chartType: string) => {
  return useMemo(() => {
    return processChartData(rawData, chartType);
  }, [rawData, chartType]);
};
```

---

## 🔄 開發工作流程

### 開發階段規劃

#### 第一階段：基礎設施建立 (Week 1)
- [ ] 專案架構設定
- [ ] Storybook 環境建立  
- [ ] 測試環境配置
- [ ] CI/CD 管道設定

#### 第二階段：Tier 1 基礎元件 (Week 2-3)
- [ ] Button 元件完整實作
- [ ] Input 元件完整實作
- [ ] Card 元件完整實作  
- [ ] Modal 元件 (Radix UI 整合)
- [ ] Select 元件 (Radix UI 整合)

#### 第三階段：Tier 2 組合元件 (Week 4-5)
- [ ] FormField 元件
- [ ] DataTable 基礎版本
- [ ] Navigation 元件
- [ ] Layout 系統

#### 第四階段：Tier 3 專業元件 (Week 6-8)
- [ ] NotionTable 完整版本
- [ ] Chart 元件系列
- [ ] AIQueryInterface 元件
- [ ] OrganizationChart 元件

### 質量檢查清單

每個元件完成時需滿足：

**功能性 ✅**
- [ ] 所有 API 功能正常運作
- [ ] 響應式設計在所有斷點正確顯示
- [ ] 可訪問性標準符合 WCAG 2.1 AA
- [ ] TypeScript 類型完整無錯誤

**測試覆蓋 ✅**
- [ ] 單元測試覆蓋率 ≥ 90%
- [ ] 所有變體和尺寸都有測試
- [ ] 事件處理函數都有測試
- [ ] 錯誤邊界情況都有測試

**文檔完整 ✅**
- [ ] Storybook 故事包含所有使用案例
- [ ] API 文檔完整
- [ ] 使用範例清晰
- [ ] 設計指南說明

**效能標準 ✅**
- [ ] 元件載入時間 < 100ms
- [ ] 大數據集處理流暢 (1000+ 項目)
- [ ] 記憶體洩漏檢查通過
- [ ] Bundle 大小合理

---

## 🚀 未來擴展規劃

### 短期目標 (3 個月內)

1. **AI 增強功能**
   - 智能數據分析建議
   - 自動圖表生成
   - 語義化搜索介面

2. **高級交互功能**  
   - 拖拽重新排序
   - 即時協作編輯
   - 鍵盤快捷鍵支援

3. **企業級功能**
   - 主題系統 (多品牌支援)
   - 國際化 (i18n) 完整支援
   - 高級權限控制 UI

### 長期目標 (6-12 個月)

1. **效能極致優化**
   - Web Workers 支援大數據處理
   - Service Worker 離線支援
   - 預測性數據載入

2. **先進技術整合**
   - WebAssembly 高效能計算
   - WebGL 3D 數據視覺化
   - PWA 功能完整支援

3. **生態系統建設**
   - 元件庫 NPM 套件發布
   - 設計 Token 系統
   - 開發者工具和 CLI

---

## 📚 開發指南和最佳實踐

### 編碼規範

```typescript
// 1. 元件文件命名: PascalCase
// ✅ Button.tsx, NotionTable.tsx
// ❌ button.tsx, notionTable.tsx

// 2. 元件定義標準格式
interface ComponentProps extends BaseComponentProps {
  // Props 定義按邏輯分組
  // 1. 基本屬性
  // 2. 視覺屬性  
  // 3. 行為屬性
  // 4. 事件處理
  // 5. 內容
}

export const Component: React.FC<ComponentProps> = ({
  // 解構時按 Props 分組順序
}) => {
  // 1. Hooks 調用
  // 2. 狀態計算
  // 3. 事件處理函數
  // 4. 渲染邏輯
  
  return (
    // JSX 結構
  );
};

// 3. 默認導出 + 命名導出
export default Component;
```

### 樣式管理

```typescript
// 使用 cn() 工具合併樣式
import { cn } from '@/lib/utils';

const buttonClasses = cn(
  // 基礎樣式
  'inline-flex items-center justify-center',
  'font-medium transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  // 條件樣式
  variant === 'primary' && 'bg-primary text-white',
  size === 'lg' && 'px-6 py-3 text-lg',
  disabled && 'opacity-50 cursor-not-allowed',
  
  // 自定義樣式
  className
);

// CSS-in-JS 避免，優先使用 Tailwind
// 特殊情況使用 CSS Module 或 styled-components
```

### 可訪問性標準

```typescript
// 所有交互元件必須支援
<Button
  // 鍵盤導航
  tabIndex={0}
  
  // 螢幕閱讀器
  aria-label="描述按鈕功能"
  aria-describedby="additional-info"
  
  // 狀態指示
  aria-disabled={disabled}
  aria-expanded={isOpen}
  
  // 角色說明
  role="button"
  
  // 鍵盤事件
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.(e);
    }
  }}
>
  按鈕文字
</Button>
```

---

## 📊 成功指標

### 開發效率指標
- 新功能開發時間減少 40%
- 設計到開發交付周期縮短 50%  
- 程式碼復用率提升至 80%
- Bug 修復時間減少 60%

### 質量指標
- 元件測試覆蓋率 ≥ 90%
- 可訪問性合規率 100%
- 跨瀏覽器兼容性 98%
- 效能評分 ≥ 95 分

### 使用者體驗指標  
- 頁面載入時間 < 2 秒
- 互動響應時間 < 100ms
- 使用者滿意度 ≥ 4.5/5
- 支援需求減少 30%

---

**文件狀態**: ✅ 完成  
**下一步行動**: 開始第一階段基礎設施建立  
**負責人**: DonnaAI 開發團隊  
**審核狀態**: 待審核  
**預估完成時間**: 8 週  

---

*此規格文件將作為 Web 元件庫開發的完整指南，確保高質量、一致性和可擴展性的企業級元件庫建立。*