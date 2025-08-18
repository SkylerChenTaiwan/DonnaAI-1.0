# Web 平台開發指南 (Next.js + Radix UI)

> **重要更新**: 自 PRP-120 起，Web 平台已從 React Native Web 遷移至 Next.js + Radix UI 架構。

## 🏗️ 新 Web 架構概覽

### 技術棧
- **框架**: Next.js 14 + App Router
- **UI 元件**: Radix UI (無樣式、可存取)
- **樣式系統**: Tailwind CSS + CSS Variables
- **圖示**: Lucide React
- **文件**: Storybook
- **測試**: Vitest + Testing Library

### 架構原則
1. **分離關注點**: Web 和 Mobile 平台技術實作完全分離
2. **設計一致性**: 共享設計 tokens，確保視覺體驗一致
3. **專業品質**: 媲美 Notion、Linear 的專業 UI 質感

## 🎨 設計系統管理

### Design Tokens 統一
```typescript
// 在 Web 和 Mobile 之間共享的設計 tokens
const designTokens = {
  colors: {
    primary: '#000000',
    secondary: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  }
}
```

### Tailwind CSS 配置
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // 與 Mobile 版本一致的顏色系統
        'donna-primary': '#000000',
        'donna-secondary': '#6B7280',
        // ... 更多顏色定義
      },
      fontFamily: {
        'donna': ['Inter', 'sans-serif'],
      }
    }
  }
}
```

## 🧱 Web 元件開發標準

### 基礎元件結構
```typescript
// 基於 Radix UI + Tailwind 的元件範例
import * as RadixButton from '@radix-ui/react-button'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ComponentProps<typeof RadixButton.Root> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = ({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) => {
  return (
    <RadixButton.Root
      className={cn(
        // 基礎樣式
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus-visible:outline-none focus-visible:ring-2',
        // 變體樣式
        {
          'bg-donna-primary text-white hover:bg-opacity-90': variant === 'primary',
          'bg-donna-secondary text-white hover:bg-opacity-90': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost',
        },
        // 尺寸樣式
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
}
```

### 複雜元件範例
```typescript
// NotionTable 元件 (Web 專用)
import * as Table from '@radix-ui/react-table'
import { cn } from '@/lib/utils'

interface NotionTableProps {
  data: any[]
  columns: ColumnDef[]
  onEdit?: (row: any, field: string, value: any) => void
}

export const NotionTable = ({ data, columns, onEdit }: NotionTableProps) => {
  return (
    <div className="notion-table-container">
      <Table.Root className="w-full border-collapse">
        {/* Table 實作 */}
      </Table.Root>
    </div>
  )
}
```

## 📋 開發工作流程

### 1. 元件開發流程
```bash
# 1. 建立新元件
mkdir src/components/ui/new-component
cd src/components/ui/new-component

# 2. 建立檔案結構
touch index.tsx        # 主要元件
touch types.ts         # TypeScript 定義  
touch stories.tsx      # Storybook 故事
touch test.tsx         # 測試檔案
```

### 2. Storybook 開發
```typescript
// stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './index'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '按鈕',
  },
}
```

### 3. 測試標準
```typescript
// test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './index'

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>測試按鈕</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('測試按鈕')
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>點擊我</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## ✅ 品質標準

### 必須滿足的條件
- [ ] **無障礙性**: 符合 WCAG 2.1 AA 標準
- [ ] **響應式設計**: 支援所有主要斷點
- [ ] **TypeScript**: 完整的型別定義
- [ ] **測試覆蓋率**: >= 90%
- [ ] **效能**: 元件渲染時間 < 16ms
- [ ] **Storybook**: 完整的使用範例

### Agent 自動檢查
- **ui-visual-tester**: 視覺一致性檢查
- **interaction-tester**: 互動功能測試
- **typescript-type-guardian**: 型別安全檢查  
- **code-refactor-optimizer**: 程式碼品質審查

## 🔄 與 Mobile 版本的協作

### 設計 Tokens 同步
```typescript
// shared/design-tokens.ts
export const sharedTokens = {
  // Web 和 Mobile 共享的設計定義
  colors: {
    primary: '#000000',
    // ...
  }
}

// web/tailwind.config.js (Web 使用)
colors: sharedTokens.colors

// mobile/theme/colors.ts (Mobile 使用)  
export const colors = sharedTokens.colors
```

### 元件功能對應表
| 功能 | Mobile (React Native) | Web (Next.js) |
|------|----------------------|----------------|
| 按鈕 | AdaptiveButton | Radix Button + Tailwind |
| 輸入框 | AdaptiveInput | Radix Input + Tailwind |
| 模態框 | AdaptiveModal | Radix Dialog + Tailwind |
| 表格 | NotionTable (RN版) | NotionTable (Web版) |

## 📚 開發資源

### 文件連結
- **Next.js 文件**: https://nextjs.org/docs
- **Radix UI 文件**: https://radix-ui.com/docs
- **Tailwind CSS 文件**: https://tailwindcss.com/docs
- **Storybook 指南**: 本地 `/storybook-static/index.html`

### 專案內檔案
- **元件庫**: `/web/components/ui/`
- **設計系統**: `/web/styles/design-system.css`
- **Storybook**: `/web/.storybook/`
- **測試**: `/web/__tests__/components/`

## ⚠️ 重要注意事項

### 已廢棄的概念 (舊 React Native Web)
- ❌ `Platform.OS` 條件判斷
- ❌ 內聯樣式優先級問題
- ❌ AdaptiveXXX 元件系統
- ❌ React Native Web 樣式覆蓋問題

### 新的最佳實踐 (Next.js + Radix)
- ✅ Radix UI 無樣式元件基礎
- ✅ Tailwind CSS 實用類別樣式
- ✅ TypeScript 嚴格模式
- ✅ Storybook 驅動開發
- ✅ 完整的測試覆蓋

---

## 📝 快速檢查清單

### 開發新 Web 元件時
- [ ] 基於 Radix UI primitives
- [ ] 使用 Tailwind CSS 樣式
- [ ] 完整 TypeScript 定義
- [ ] Storybook 故事和文件
- [ ] 單元測試和互動測試
- [ ] 無障礙性檢查
- [ ] 響應式設計驗證
- [ ] 與 Mobile 版設計一致性確認