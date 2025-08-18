/**
 * @fileoverview 元件庫型別系統測試和驗證
 * @description 確保型別定義的正確性和一致性
 */

import type {
  // 品牌型別
  UserId,
  OrganizationId,
  ComponentId,
  
  // 基礎元件
  ButtonProps,
  InputProps,
  CardProps,
  ModalProps,
  SelectProps,
  
  // 專業元件
  NotionTableProps,
  ChartProps,
  OrganizationChartProps,
  AIQueryInterfaceProps,
  
  // 表單型別
  FormProps,
  FormField,
  ValidationRule,
  
  // 工具型別
  ConditionalProps,
  ExclusiveProps,
  DeepReadonly,
  DeepPartial,
  PropsOf,
  
  // 測試工具
  Expect,
  Equal,
  NotEqual,
} from './component-library-types';

// ============================================================================
// 品牌型別測試
// ============================================================================

/**
 * 測試品牌型別不能互相賦值
 */
type TestBrandTypes = {
  // 品牌型別應該與普通 string 不同
  test1: Expect<NotEqual<UserId, string>>;
  test2: Expect<NotEqual<OrganizationId, string>>;
  test3: Expect<NotEqual<ComponentId, string>>;
  
  // 不同品牌型別之間不能互相賦值
  test4: Expect<NotEqual<UserId, OrganizationId>>;
  test5: Expect<NotEqual<UserId, ComponentId>>;
  test6: Expect<NotEqual<OrganizationId, ComponentId>>;
};

// ============================================================================
// 基礎元件型別測試
// ============================================================================

/**
 * Button 元件型別測試
 */
type TestButtonProps = {
  // 必需屬性
  requiredChildren: Expect<Equal<ButtonProps['children'], React.ReactNode>>;
  
  // 可選屬性具有正確的型別
  optionalVariant: Expect<Equal<ButtonProps['variant'], 'solid' | 'outline' | 'ghost' | 'soft' | 'link' | undefined>>;
  optionalSize: Expect<Equal<ButtonProps['size'], 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>>;
  
  // 事件處理器型別正確
  clickHandler: Expect<Equal<
    ButtonProps['onClick'],
    ((event: React.MouseEvent<HTMLButtonElement>) => void) | undefined
  >>;
  
  // ARIA 屬性支援
  ariaLabel: Expect<Equal<ButtonProps['aria-label'], string | undefined>>;
  ariaPressed: Expect<Equal<ButtonProps['aria-pressed'], boolean | undefined>>;
};

/**
 * Input 元件型別測試
 */
type TestInputProps = {
  // 驗證規則型別
  validation: {
    required: Expect<Equal<InputProps['required'], boolean | undefined>>;
    minLength: Expect<Equal<InputProps['minLength'], number | undefined>>;
    pattern: Expect<Equal<InputProps['pattern'], string | undefined>>;
  };
  
  // 複合屬性
  addons: {
    leftAddon: Expect<Equal<InputProps['leftAddon'], React.ReactNode | undefined>>;
    rightElement: Expect<Equal<InputProps['rightElement'], React.ReactNode | undefined>>;
  };
  
  // 事件處理器
  events: {
    onChange: Expect<Equal<
      InputProps['onChange'],
      ((event: React.ChangeEvent<HTMLInputElement>) => void) | undefined
    >>;
  };
};

// ============================================================================
// 專業元件型別測試
// ============================================================================

/**
 * NotionTable 型別測試
 */
type TestNotionTableProps = {
  // 泛型支援
  genericData: NotionTableProps<{ id: string; name: string; age: number }>;
  
  // 回調函數型別
  callbacks: {
    onCellEdit: Expect<Equal<
      NotionTableProps['onCellEdit'],
      ((rowId: string, columnId: string, value: any) => void) | undefined
    >>;
    onRowAdd: Expect<Equal<
      NotionTableProps<{ id: string }>['onRowAdd'],
      ((row: { id: string }) => void) | undefined
    >>;
  };
};

/**
 * Chart 型別測試
 */
type TestChartProps = {
  // 必需屬性
  requiredType: Expect<Equal<
    ChartProps['type'],
    'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar' | 'heatmap' | 'treemap' | 'funnel' | 'gauge'
  >>;
  
  // 複雜物件型別
  axisConfig: {
    type: ChartProps['xAxis'] extends infer T
      ? T extends { type?: infer U }
        ? Expect<Equal<U, 'value' | 'category' | 'time' | 'log' | undefined>>
        : never
      : never;
  };
};

// ============================================================================
// 條件型別測試
// ============================================================================

/**
 * 測試條件型別行為
 */
type TestConditionalProps = {
  // 當條件為 true 時，屬性變為必需
  whenTrue: ConditionalProps<{ isMultiple?: true; value?: string[] }, 'isMultiple'>;
  testRequired: Expect<Equal<TestConditionalProps['whenTrue']['value'], string[]>>;
  
  // 當條件為 false 時，屬性保持可選
  whenFalse: ConditionalProps<{ isMultiple?: false; value?: string }, 'isMultiple'>;
  testOptional: Expect<Equal<TestConditionalProps['whenFalse']['value'], string | undefined>>;
};

/**
 * 測試互斥屬性型別
 */
type TestExclusiveProps = {
  // 只能有 leftIcon 或 rightIcon，不能同時存在
  iconProps: ExclusiveProps<
    { leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; label: string },
    'leftIcon',
    'rightIcon'
  >;
  
  // 驗證互斥性
  withLeft: { leftIcon: React.ReactNode; label: string };
  withRight: { rightIcon: React.ReactNode; label: string };
  // @ts-expect-error - 不能同時有兩個
  withBoth: { leftIcon: React.ReactNode; rightIcon: React.ReactNode; label: string };
};

// ============================================================================
// 工具型別測試
// ============================================================================

/**
 * 測試深度只讀型別
 */
type TestDeepReadonly = {
  original: {
    name: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: {
        email: boolean;
        push: boolean;
      };
    };
    tags: string[];
  };
  
  readonly: DeepReadonly<TestDeepReadonly['original']>;
  
  // 驗證所有層級都是只讀的
  test1: Expect<Equal<TestDeepReadonly['readonly']['name'], string>>;
  test2: Expect<Equal<TestDeepReadonly['readonly']['settings']['theme'], 'light' | 'dark'>>;
  test3: Expect<Equal<TestDeepReadonly['readonly']['tags'], readonly string[]>>;
};

/**
 * 測試深度部分型別
 */
type TestDeepPartial = {
  original: {
    id: string;
    profile: {
      name: string;
      age: number;
      address: {
        street: string;
        city: string;
      };
    };
  };
  
  partial: DeepPartial<TestDeepPartial['original']>;
  
  // 驗證所有層級都是可選的
  test1: Expect<Equal<TestDeepPartial['partial']['id'], string | undefined>>;
  test2: Expect<Equal<TestDeepPartial['partial']['profile'], DeepPartial<TestDeepPartial['original']['profile']> | undefined>>;
};

// ============================================================================
// 實際使用案例測試
// ============================================================================

/**
 * 測試實際元件組合
 */
const testButtonUsage: ButtonProps = {
  children: 'Click me',
  variant: 'solid',
  size: 'md',
  colorScheme: 'primary',
  onClick: (e) => console.log('clicked'),
  'aria-label': 'Submit form',
};

/**
 * 測試表單欄位定義
 */
const testFormField: FormField = {
  id: 'email',
  name: 'email',
  label: 'Email Address',
  type: 'email',
  placeholder: 'Enter your email',
  validation: [
    {
      type: 'required',
      message: 'Email is required',
    },
    {
      type: 'email',
      message: 'Please enter a valid email',
    },
  ],
  dependencies: [
    {
      field: 'subscribe',
      condition: (value) => value === true,
      action: 'show',
    },
  ],
};

/**
 * 測試圖表配置
 */
const testChartConfig: ChartProps = {
  type: 'line',
  series: [
    {
      id: 'sales',
      name: 'Sales',
      data: [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 120 },
        { x: 'Mar', y: 140 },
      ],
      color: '#3b82f6',
      smooth: true,
    },
  ],
  width: 800,
  height: 400,
  title: 'Monthly Sales',
  xAxis: {
    type: 'category',
    label: 'Month',
  },
  yAxis: {
    type: 'value',
    label: 'Revenue ($)',
    tickFormat: (value) => `$${value}k`,
  },
  tooltip: {
    show: true,
    formatter: (params) => `${params.name}: $${params.value}`,
  },
  animation: true,
  animationDuration: 500,
};

// ============================================================================
// 執行時型別檢查範例
// ============================================================================

/**
 * 型別守衛使用範例
 */
import { isUserId, isOrganizationId, isValidEmail } from './component-library-types';

function processUserId(id: string) {
  if (isUserId(id)) {
    // 在這裡 id 的型別是 UserId
    console.log('Processing user:', id);
  } else {
    throw new Error('Invalid user ID');
  }
}

function validateFormData(data: Record<string, any>) {
  const errors: Record<string, string> = {};
  
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (data.organizationId && !isOrganizationId(data.organizationId)) {
    errors.organizationId = 'Invalid organization ID';
  }
  
  return errors;
}

// ============================================================================
// 型別覆蓋率檢查
// ============================================================================

/**
 * 確保所有元件都有對應的型別定義
 */
type ComponentTypeCoverage = {
  // 基礎元件
  Button: ButtonProps;
  Input: InputProps;
  Card: CardProps;
  Modal: ModalProps;
  Select: SelectProps<any>;
  
  // 專業元件
  NotionTable: NotionTableProps<any>;
  Chart: ChartProps;
  OrganizationChart: OrganizationChartProps;
  AIQueryInterface: AIQueryInterfaceProps;
  
  // 表單系統
  Form: FormProps;
  FormField: FormField;
  ValidationRule: ValidationRule;
};

// ============================================================================
// 型別相容性矩陣
// ============================================================================

/**
 * 確保型別與現有系統相容
 */
type CompatibilityMatrix = {
  // 與 React 型別相容
  reactNode: Expect<Equal<ButtonProps['children'], React.ReactNode>>;
  reactElement: ButtonProps['leftIcon'] extends React.ReactNode ? true : false;
  
  // 與 TypeScript 內建型別相容
  htmlAttributes: ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> ? false : true;
  
  // 與專案現有型別相容
  existingTypes: {
    // 這裡應該匯入並測試與現有型別的相容性
    // import { User, Organization } from '../../src/types';
  };
};

// ============================================================================
// 效能考量
// ============================================================================

/**
 * 型別計算複雜度檢查
 * 確保型別不會導致過度的編譯時間
 */
type PerformanceCheck = {
  // 避免過深的遞迴
  maxDepth: DeepPartial<{
    a: { b: { c: { d: { e: string } } } }
  }>;
  
  // 避免過大的聯合型別
  reasonableUnion: ButtonProps['variant']; // 5 個選項是合理的
  
  // 避免過度的條件型別嵌套
  simpleConditional: ConditionalProps<InputProps, 'isMultiple'>;
};

// ============================================================================
// 文檔生成標記
// ============================================================================

/**
 * @example
 * ```typescript
 * // 使用 Button 元件
 * const MyButton: React.FC = () => (
 *   <Button
 *     variant="solid"
 *     size="md"
 *     colorScheme="primary"
 *     onClick={() => console.log('clicked')}
 *   >
 *     Click Me
 *   </Button>
 * );
 * ```
 */
export const ButtonExample = testButtonUsage;

/**
 * @example
 * ```typescript
 * // 使用型別守衛
 * function handleUserId(id: unknown) {
 *   if (isUserId(id)) {
 *     // id is UserId
 *     return processUser(id);
 *   }
 *   throw new Error('Invalid user ID');
 * }
 * ```
 */
export const TypeGuardExample = processUserId;

// 匯出測試結果型別供外部使用
export type {
  TestBrandTypes,
  TestButtonProps,
  TestInputProps,
  TestNotionTableProps,
  TestChartProps,
  TestConditionalProps,
  TestExclusiveProps,
  TestDeepReadonly,
  TestDeepPartial,
  ComponentTypeCoverage,
  CompatibilityMatrix,
  PerformanceCheck,
};