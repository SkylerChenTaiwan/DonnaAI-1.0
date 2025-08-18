# DonnaAI 元件庫型別系統指南

## 📋 目錄

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [品牌型別系統](#品牌型別系統)
4. [設計 Tokens](#設計-tokens)
5. [基礎元件型別](#基礎元件型別)
6. [專業元件型別](#專業元件型別)
7. [表單和驗證](#表單和驗證)
8. [進階型別模式](#進階型別模式)
9. [型別安全最佳實踐](#型別安全最佳實踐)
10. [與現有系統整合](#與現有系統整合)

## 概述

DonnaAI 元件庫採用嚴格的 TypeScript 型別系統，確保開發時的型別安全和優秀的開發體驗。本指南提供完整的型別系統文檔和使用範例。

### 型別系統特點

- ✅ **100% 型別覆蓋率** - 所有元件和 API 都有完整的型別定義
- ✅ **品牌型別** - 使用品牌型別確保 ID 的型別安全
- ✅ **嚴格模式** - 啟用所有 TypeScript 嚴格檢查
- ✅ **型別推導** - 智慧型別推導減少樣板程式碼
- ✅ **執行時驗證** - 提供型別守衛函數進行執行時檢查

## 核心概念

### 型別檔案結構

```
docs/types/
├── component-library-types.ts  # 主要型別定義
├── type-tests.ts               # 型別測試
└── TYPE-SYSTEM-GUIDE.md       # 本文檔
```

### 引入型別

```typescript
// 引入特定型別
import type { ButtonProps, InputProps, ChartProps } from '@/docs/types/component-library-types';

// 引入工具型別
import type { UserId, OrganizationId, DeepReadonly } from '@/docs/types/component-library-types';

// 引入型別守衛
import { isUserId, isValidEmail, assertDefined } from '@/docs/types/component-library-types';
```

## 品牌型別系統

品牌型別用於區分語義上不同但結構相同的型別，防止誤用。

### 定義和使用

```typescript
// 品牌型別定義
type Brand<K, T> = K & { __brand: T };

// 預定義的品牌型別
type UserId = Brand<string, 'UserId'>;
type OrganizationId = Brand<string, 'OrganizationId'>;

// 使用範例
function getUser(userId: UserId) {
  // userId 必須是 UserId 型別，不能是普通 string
}

// 型別轉換
const id = 'user_123';
const userId = toUserId(id); // 轉換為 UserId

// 型別守衛
if (isUserId(id)) {
  getUser(id); // 型別安全
}
```

### 建立自定義品牌型別

```typescript
// 定義新的品牌型別
type ProductId = Brand<string, 'ProductId'>;
type OrderId = Brand<string, 'OrderId'>;

// 建立型別守衛
const isProductId = (value: any): value is ProductId => {
  return typeof value === 'string' && value.startsWith('prod_');
};

// 建立轉換函數
const toProductId = (value: string): ProductId => {
  if (!value.startsWith('prod_')) {
    throw new Error('Invalid product ID format');
  }
  return value as ProductId;
};
```

## 設計 Tokens

設計 Tokens 提供一致的設計系統變數。

### 顏色系統

```typescript
// 使用顏色 tokens
const styles = {
  backgroundColor: theme.colors.primary[500],
  color: theme.colors.neutral[900],
  borderColor: theme.colors.semantic.error,
};

// 自定義主題顏色
const customTheme: Partial<ColorTokens> = {
  primary: {
    500: '#custom-color',
    // ... 其他色階
  },
};
```

### 間距系統

```typescript
// 使用間距 tokens
const spacing: SpacingScale = 16;
const margin: SpacingToken = '16px';

// 響應式間距
const responsiveSpacing: ResponsiveValue<SpacingScale> = {
  xs: 8,
  md: 16,
  lg: 24,
};
```

### 字體系統

```typescript
// 使用字體 tokens
const heading = {
  fontFamily: theme.typography.fontFamily.sans,
  fontSize: theme.typography.fontSize['2xl'],
  fontWeight: theme.typography.fontWeight.bold,
  lineHeight: theme.typography.lineHeight.tight,
};
```

## 基礎元件型別

### Button 元件

```typescript
// 完整的 Button 使用範例
const MyButton: React.FC = () => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked');
  };

  return (
    <Button
      variant="solid"
      size="md"
      colorScheme="primary"
      isLoading={false}
      leftIcon={<IconPlus />}
      onClick={handleClick}
      aria-label="Add new item"
    >
      Add Item
    </Button>
  );
};

// 自定義 Button 元件
interface CustomButtonProps extends ButtonProps {
  customProp?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ customProp, ...props }) => {
  return <Button {...props} />;
};
```

### Input 元件

```typescript
// Input 與驗證
const EmailInput: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const validateEmail = (value: string) => {
    if (!isValidEmail(value)) {
      return 'Please enter a valid email';
    }
    return true;
  };

  return (
    <Input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
      isInvalid={!!error}
      errorMessage={error}
      validation={{
        required: true,
        validate: validateEmail,
      }}
      leftElement={<IconMail />}
      aria-label="Email address"
    />
  );
};
```

### Modal 元件

```typescript
// Modal 使用範例
const ConfirmDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        placement="center"
        closeOnOverlayClick={true}
        motionPreset="scale"
      >
        <ModalHeader>Confirm Action</ModalHeader>
        <ModalBody>
          Are you sure you want to proceed?
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="solid" colorScheme="primary">
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
```

## 專業元件型別

### NotionTable 元件

```typescript
// 定義表格資料型別
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  status: 'active' | 'inactive';
}

// 配置表格列
const columns: TableColumn<UserData>[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'text',
    isSortable: true,
    isFilterable: true,
    validation: {
      required: true,
      minLength: 2,
    },
  },
  {
    id: 'email',
    name: 'Email',
    type: 'email',
    validation: {
      required: true,
      custom: (value) => isValidEmail(value) || 'Invalid email',
    },
  },
  {
    id: 'role',
    name: 'Role',
    type: 'select',
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
      { value: 'guest', label: 'Guest' },
    ],
    isEditable: true,
  },
  {
    id: 'status',
    name: 'Status',
    type: 'select',
    render: (value, row) => (
      <Badge color={value === 'active' ? 'green' : 'gray'}>
        {value}
      </Badge>
    ),
  },
];

// 使用 NotionTable
const UserTable: React.FC = () => {
  const [data, setData] = useState<UserData[]>([]);

  const handleCellEdit = (rowId: string, columnId: string, value: any) => {
    setData(prev => prev.map(row => 
      row.id === rowId ? { ...row, [columnId]: value } : row
    ));
  };

  return (
    <NotionTable
      tableId={'table_users' as TableId}
      columns={columns}
      data={data}
      onCellEdit={handleCellEdit}
      onRowAdd={(row) => setData([...data, row])}
      onRowDelete={(rowId) => setData(data.filter(r => r.id !== rowId))}
      showToolbar={true}
      enableVirtualization={data.length > 100}
    />
  );
};
```

### Chart 元件

```typescript
// 圖表資料準備
const salesData: ChartSeries[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    data: [
      { x: 'Jan', y: 45000 },
      { x: 'Feb', y: 52000 },
      { x: 'Mar', y: 48000 },
      { x: 'Apr', y: 61000 },
      { x: 'May', y: 55000 },
      { x: 'Jun', y: 67000 },
    ],
    color: '#3b82f6',
    smooth: true,
  },
  {
    id: 'profit',
    name: 'Profit',
    data: [
      { x: 'Jan', y: 12000 },
      { x: 'Feb', y: 15000 },
      { x: 'Mar', y: 13000 },
      { x: 'Apr', y: 18000 },
      { x: 'May', y: 16000 },
      { x: 'Jun', y: 22000 },
    ],
    color: '#10b981',
    smooth: true,
  },
];

// 使用圖表元件
const SalesChart: React.FC = () => {
  return (
    <Chart
      type="line"
      series={salesData}
      width="100%"
      height={400}
      title="Monthly Sales Performance"
      xAxis={{
        type: 'category',
        label: 'Month',
      }}
      yAxis={{
        type: 'value',
        label: 'Amount ($)',
        tickFormat: (value) => `$${(value / 1000).toFixed(0)}k`,
      }}
      legend={{
        show: true,
        position: 'top',
        align: 'end',
      }}
      tooltip={{
        show: true,
        formatter: (params) => {
          return `${params.seriesName}: $${params.value.toLocaleString()}`;
        },
      }}
      animation={true}
      animationDuration={500}
      onDataClick={(data, seriesId) => {
        console.log(`Clicked ${seriesId}: ${data.x} = ${data.y}`);
      }}
    />
  );
};
```

### AI Query Interface

```typescript
// AI 對話介面配置
const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const userId = 'user_123' as UserId;
  
  const context: AIContext = {
    sessionId: 'session_' + Date.now(),
    userId,
    contextType: 'data-analysis',
    activeDataSources: [
      { id: 'db_1', type: 'database', name: 'Sales Database' },
      { id: 'file_1', type: 'file', name: 'Q2 Report.xlsx' },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  };

  const handleSendMessage = async (message: string): Promise<AIMessage> => {
    const newMessage: AIMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // 呼叫 AI API
    const response = await callAIAPI(message, context);
    
    const aiResponse: AIMessage = {
      id: 'msg_' + (Date.now() + 1),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      tokens: response.tokens,
      metadata: {
        confidence: response.confidence,
        processingTime: response.processingTime,
      },
    };
    
    setMessages(prev => [...prev, aiResponse]);
    return aiResponse;
  };

  return (
    <AIQueryInterface
      context={context}
      messages={messages}
      onSendMessage={handleSendMessage}
      enableVoiceInput={true}
      enableFileUpload={true}
      suggestedQueries={[
        'Show me sales trends for Q2',
        'Compare revenue by region',
        'What are the top performing products?',
      ]}
      placeholder="Ask me about your data..."
      maxMessageLength={1000}
      showTypingIndicator={true}
    />
  );
};
```

## 表單和驗證

### 動態表單建立

```typescript
// 定義表單欄位
const registrationFields: FormField[] = [
  {
    id: 'username',
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Choose a username',
    validation: [
      { type: 'required', message: 'Username is required' },
      { type: 'minLength', value: 3, message: 'At least 3 characters' },
      { type: 'maxLength', value: 20, message: 'Maximum 20 characters' },
      {
        type: 'custom',
        message: 'Username already taken',
        validator: async (value) => {
          const available = await checkUsernameAvailability(value);
          return available;
        },
      },
    ],
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    type: 'email',
    validation: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Invalid email format' },
    ],
  },
  {
    id: 'password',
    name: 'password',
    label: 'Password',
    type: 'password',
    validation: [
      { type: 'required', message: 'Password is required' },
      { type: 'minLength', value: 8, message: 'At least 8 characters' },
      {
        type: 'pattern',
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Must contain uppercase, lowercase, and number',
      },
    ],
  },
  {
    id: 'confirmPassword',
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    dependencies: [
      {
        field: 'password',
        condition: (value) => !!value,
        action: 'enable',
      },
    ],
    validation: [
      { type: 'required', message: 'Please confirm password' },
      {
        type: 'custom',
        message: 'Passwords do not match',
        validator: (value, formData) => value === formData.password,
      },
    ],
  },
  {
    id: 'acceptTerms',
    name: 'acceptTerms',
    label: 'I accept the terms and conditions',
    type: 'checkbox',
    validation: [
      {
        type: 'custom',
        message: 'You must accept the terms',
        validator: (value) => value === true,
      },
    ],
  },
];

// 使用動態表單
const RegistrationForm: React.FC = () => {
  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Form submitted:', values);
    // 處理註冊邏輯
  };

  const handleValidate = async (values: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    // 自定義驗證邏輯
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    }
    
    return errors;
  };

  return (
    <Form
      formId={'form_registration' as FormId}
      fields={registrationFields}
      onSubmit={handleSubmit}
      onValidate={handleValidate}
      layout="vertical"
      columns={1}
      showRequiredIndicator={true}
      showErrorSummary={true}
      submitOnEnter={false}
    />
  );
};
```

## 進階型別模式

### 條件型別

```typescript
// 根據條件改變 Props 要求
type FileInputProps<Multiple extends boolean = false> = {
  multiple?: Multiple;
  onChange: Multiple extends true
    ? (files: File[]) => void
    : (file: File) => void;
};

// 使用範例
const SingleFileInput: React.FC<FileInputProps<false>> = ({ onChange }) => {
  // onChange 接受單個 File
  return <input type="file" onChange={(e) => onChange(e.target.files![0])} />;
};

const MultiFileInput: React.FC<FileInputProps<true>> = ({ onChange }) => {
  // onChange 接受 File[]
  return <input type="file" multiple onChange={(e) => onChange(Array.from(e.target.files!))} />;
};
```

### 互斥屬性

```typescript
// 定義互斥的 Props
type IconButtonProps = 
  | { icon: React.ReactNode; label?: never; 'aria-label': string }
  | { icon?: never; label: string; 'aria-label'?: never };

// 使用範例
const IconButton1: React.FC<IconButtonProps> = ({ icon, 'aria-label': ariaLabel }) => {
  // 有 icon 時必須有 aria-label
  return <button aria-label={ariaLabel}>{icon}</button>;
};

const IconButton2: React.FC<IconButtonProps> = ({ label }) => {
  // 有 label 時不需要 aria-label
  return <button>{label}</button>;
};
```

### 映射型別

```typescript
// 為每個狀態建立樣式
type StatusStyles = {
  [K in 'success' | 'warning' | 'error' | 'info']: {
    backgroundColor: string;
    color: string;
    icon: React.ComponentType;
  };
};

const statusStyles: StatusStyles = {
  success: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    icon: CheckIcon,
  },
  warning: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    icon: AlertIcon,
  },
  error: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    icon: ErrorIcon,
  },
  info: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    icon: InfoIcon,
  },
};
```

## 型別安全最佳實踐

### 1. 避免使用 any

```typescript
// ❌ 錯誤：使用 any
function processData(data: any) {
  return data.value; // 沒有型別檢查
}

// ✅ 正確：使用泛型或具體型別
function processData<T extends { value: unknown }>(data: T) {
  return data.value; // 有型別檢查
}

// ✅ 正確：使用 unknown 並縮小型別
function processUnknownData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value;
  }
  throw new Error('Invalid data structure');
}
```

### 2. 使用 const assertions

```typescript
// ❌ 錯誤：型別推導為 string[]
const colors = ['red', 'green', 'blue'];

// ✅ 正確：使用 const assertion 獲得精確型別
const colors = ['red', 'green', 'blue'] as const;
// 型別: readonly ['red', 'green', 'blue']

// 建立聯合型別
type Color = typeof colors[number]; // 'red' | 'green' | 'blue'
```

### 3. 使用型別守衛

```typescript
// 定義型別守衛
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// 使用型別守衛
function handleError(error: unknown) {
  if (isError(error)) {
    console.error(error.message); // 型別安全
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 4. 使用 Discriminated Unions

```typescript
// 定義判別聯合
type Result<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'loading' };

// 使用判別聯合
function handleResult<T>(result: Result<T>) {
  switch (result.status) {
    case 'success':
      console.log('Data:', result.data); // 型別安全
      break;
    case 'error':
      console.error('Error:', result.error.message); // 型別安全
      break;
    case 'loading':
      console.log('Loading...');
      break;
    default:
      assertNever(result); // 確保處理所有情況
  }
}
```

### 5. 使用 Utility Types

```typescript
// 使用內建工具型別
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};

// Partial - 所有屬性變為可選
type UpdateUser = Partial<User>;

// Omit - 排除特定屬性
type PublicUser = Omit<User, 'password'>;

// Pick - 選擇特定屬性
type UserCredentials = Pick<User, 'email' | 'password'>;

// Required - 所有屬性變為必需
type CompleteUser = Required<User>;

// Readonly - 所有屬性變為只讀
type ImmutableUser = Readonly<User>;
```

## 與現有系統整合

### 整合檢查清單

1. **檢查 TypeScript 配置**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "strictBindCallApply": true,
       "strictPropertyInitialization": true,
       "noImplicitThis": true,
       "alwaysStrict": true
     }
   }
   ```

2. **驗證與現有型別相容性**
   ```typescript
   // 測試與現有型別的相容性
   import { User as ExistingUser } from '@/src/types';
   import { UserId as NewUserId } from '@/docs/types/component-library-types';
   
   // 確保型別可以協同工作
   type CompatibleUser = ExistingUser & {
     id: NewUserId;
   };
   ```

3. **漸進式遷移策略**
   ```typescript
   // 階段 1：建立型別別名
   export type LegacyButtonProps = any; // 現有型別
   export type NewButtonProps = ButtonProps; // 新型別
   
   // 階段 2：逐步替換
   export type ButtonProps = NewButtonProps;
   
   // 階段 3：移除舊型別
   // 刪除 LegacyButtonProps
   ```

### 型別檢查腳本

```bash
# 執行型別檢查
npm run type-check

# 生成型別覆蓋率報告
npm run type-coverage

# 檢查未使用的匯出
npm run check-exports
```

### package.json 配置

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --detail",
    "check-exports": "ts-prune",
    "lint:types": "tsc --noEmit && type-coverage --at-least 95"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "type-coverage": "^2.0.0",
    "ts-prune": "^0.10.0"
  }
}
```

## 疑難排解

### 常見型別錯誤

1. **Type 'X' is not assignable to type 'Y'**
   ```typescript
   // 問題：型別不匹配
   const userId: UserId = 'regular_string'; // ❌ 錯誤
   
   // 解決：使用正確的型別轉換
   const userId = toUserId('user_123'); // ✅ 正確
   ```

2. **Property does not exist on type**
   ```typescript
   // 問題：屬性不存在
   if (data.nonExistent) { } // ❌ 錯誤
   
   // 解決：使用型別守衛或縮小型別
   if ('nonExistent' in data) { } // ✅ 正確
   ```

3. **Excessive stack depth comparing types**
   ```typescript
   // 問題：過度複雜的型別
   type InfiniteNested<T> = T | InfiniteNested<T[]>; // ❌ 錯誤
   
   // 解決：限制遞迴深度
   type LimitedNested<T, D extends number = 5> = D extends 0 
     ? T 
     : T | LimitedNested<T[], Decrement<D>>; // ✅ 正確
   ```

## 總結

DonnaAI 元件庫型別系統提供：

- 🎯 **完整的型別安全** - 從編譯時到執行時
- 🚀 **優秀的開發體驗** - IntelliSense 和自動完成
- 📚 **豐富的文檔** - 詳細的使用範例
- 🔧 **靈活的擴展性** - 易於新增自定義型別
- ✅ **嚴格的品質保證** - 型別測試和驗證

遵循本指南的最佳實踐，確保程式碼的型別安全和可維護性。