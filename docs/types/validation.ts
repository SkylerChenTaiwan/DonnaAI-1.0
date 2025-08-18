/**
 * 資料驗證型別定義
 * 用於表單驗證、API 請求驗證等場景
 */

/**
 * 驗證結果
 */
export type ValidationResult<T = any> =
  | { valid: true; data: T; errors?: never }
  | { valid: false; data?: never; errors: ValidationErrors };

/**
 * 驗證錯誤
 */
export interface ValidationErrors {
  [field: string]: string | string[] | ValidationErrors;
}

/**
 * 驗證規則型別
 */
export interface ValidationRule<T = any> {
  // 基本驗證
  required?: boolean | { value: boolean; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  
  // 格式驗證
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | { value: boolean; message: string };
  url?: boolean | { value: boolean; message: string };
  date?: boolean | { value: boolean; message: string };
  number?: boolean | { value: boolean; message: string };
  integer?: boolean | { value: boolean; message: string };
  float?: boolean | { value: boolean; message: string };
  boolean?: boolean | { value: boolean; message: string };
  
  // 比較驗證
  equals?: any | { value: any; message: string };
  notEquals?: any | { value: any; message: string };
  oneOf?: any[] | { value: any[]; message: string };
  notOneOf?: any[] | { value: any[]; message: string };
  
  // 自訂驗證
  validate?: ValidateFunction<T> | Record<string, ValidateFunction<T>>;
  
  // 條件驗證
  when?: {
    field: string;
    is: any | ((value: any) => boolean);
    then?: ValidationRule<T>;
    otherwise?: ValidationRule<T>;
  };
  
  // 陣列驗證
  arrayMinLength?: number | { value: number; message: string };
  arrayMaxLength?: number | { value: number; message: string };
  arrayUnique?: boolean | { value: boolean; message: string };
  
  // 物件驗證
  shape?: ValidationSchema<T>;
  
  // 其他
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
  transform?: (value: T) => T;
}

/**
 * 驗證函數
 */
export type ValidateFunction<T = any> = (
  value: T,
  formData?: any
) => boolean | string | Promise<boolean | string>;

/**
 * 驗證模式
 */
export type ValidationSchema<T = any> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

/* ============================================
   驗證器類別
   ============================================ */

/**
 * 驗證器基礎類別
 */
export abstract class Validator<T = any> {
  protected schema: ValidationSchema<T>;
  protected errors: ValidationErrors = {};

  constructor(schema: ValidationSchema<T>) {
    this.schema = schema;
  }

  /**
   * 驗證資料
   */
  abstract validate(data: T): ValidationResult<T>;
  
  /**
   * 異步驗證資料
   */
  abstract validateAsync(data: T): Promise<ValidationResult<T>>;
  
  /**
   * 驗證單一欄位
   */
  abstract validateField(field: keyof T, value: any, data: T): ValidationResult<any>;
  
  /**
   * 取得錯誤訊息
   */
  getErrors(): ValidationErrors {
    return this.errors;
  }
  
  /**
   * 清除錯誤
   */
  clearErrors(): void {
    this.errors = {};
  }
  
  /**
   * 是否有錯誤
   */
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}

/* ============================================
   內建驗證器
   ============================================ */

/**
 * Email 驗證器
 */
export const emailValidator: ValidateFunction<string> = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) || 'Invalid email address';
};

/**
 * URL 驗證器
 */
export const urlValidator: ValidateFunction<string> = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return 'Invalid URL';
  }
};

/**
 * 電話號碼驗證器
 */
export const phoneValidator: ValidateFunction<string> = (value) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(value) || 'Invalid phone number';
};

/**
 * 信用卡號驗證器
 */
export const creditCardValidator: ValidateFunction<string> = (value) => {
  const cardRegex = /^[0-9]{13,19}$/;
  if (!cardRegex.test(value.replace(/\s/g, ''))) {
    return 'Invalid credit card number';
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  const digits = value.replace(/\s/g, '').split('').reverse();
  
  for (const digit of digits) {
    let n = parseInt(digit, 10);
    if (isEven) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    isEven = !isEven;
  }
  
  return sum % 10 === 0 || 'Invalid credit card number';
};

/**
 * 密碼強度驗證器
 */
export interface PasswordStrengthOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export const passwordStrengthValidator = (
  options: PasswordStrengthOptions = {}
): ValidateFunction<string> => {
  return (value) => {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
    } = options;
    
    if (value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    
    if (requireUppercase && !/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (requireLowercase && !/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (requireNumbers && !/\d/.test(value)) {
      return 'Password must contain at least one number';
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Password must contain at least one special character';
    }
    
    return true;
  };
};

/* ============================================
   表單驗證
   ============================================ */

/**
 * 表單欄位
 */
export interface FormField<T = any> {
  name: string;
  value: T;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
  validating?: boolean;
}

/**
 * 表單狀態
 */
export interface FormState<T = any> {
  values: T;
  errors: ValidationErrors;
  touched: Record<keyof T, boolean>;
  dirty: boolean;
  isValid: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
}

/**
 * 表單驗證配置
 */
export interface FormValidationConfig<T = any> {
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: Partial<T>;
  criteriaMode?: 'firstError' | 'all';
  shouldFocusError?: boolean;
  delayError?: number;
  resolver?: (values: T) => Promise<ValidationResult<T>>;
}

/* ============================================
   Zod 整合型別
   ============================================ */

/**
 * Zod Schema 型別（如果使用 Zod）
 */
export interface ZodSchema<T = any> {
  parse: (data: unknown) => T;
  parseAsync: (data: unknown) => Promise<T>;
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
  safeParseAsync: (data: unknown) => Promise<{ success: true; data: T } | { success: false; error: any }>;
}

/**
 * Zod 驗證器包裝
 */
export class ZodValidator<T> extends Validator<T> {
  private zodSchema: ZodSchema<T>;

  constructor(zodSchema: ZodSchema<T>) {
    super({});
    this.zodSchema = zodSchema;
  }

  validate(data: T): ValidationResult<T> {
    const result = this.zodSchema.safeParse(data);
    
    if (result.success) {
      return { valid: true, data: result.data };
    }
    
    return {
      valid: false,
      errors: this.formatZodErrors(result.error),
    };
  }

  async validateAsync(data: T): Promise<ValidationResult<T>> {
    const result = await this.zodSchema.safeParseAsync(data);
    
    if (result.success) {
      return { valid: true, data: result.data };
    }
    
    return {
      valid: false,
      errors: this.formatZodErrors(result.error),
    };
  }

  validateField(field: keyof T, value: any, data: T): ValidationResult<any> {
    // Zod 不支援單一欄位驗證，驗證整個物件
    const result = this.validate({ ...data, [field]: value });
    
    if (!result.valid && result.errors[field as string]) {
      return {
        valid: false,
        errors: { [field]: result.errors[field as string] },
      };
    }
    
    return { valid: true, data: value };
  }

  private formatZodErrors(error: any): ValidationErrors {
    const errors: ValidationErrors = {};
    
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      (errors[path] as string[]).push(issue.message);
    }
    
    return errors;
  }
}

/* ============================================
   驗證輔助函數
   ============================================ */

/**
 * 組合多個驗證器
 */
export function composeValidators<T>(
  ...validators: ValidateFunction<T>[]
): ValidateFunction<T> {
  return async (value, formData) => {
    for (const validator of validators) {
      const result = await validator(value, formData);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}

/**
 * 條件驗證
 */
export function conditionalValidator<T>(
  condition: (value: T, formData?: any) => boolean,
  validator: ValidateFunction<T>
): ValidateFunction<T> {
  return (value, formData) => {
    if (condition(value, formData)) {
      return validator(value, formData);
    }
    return true;
  };
}

/**
 * 異步驗證去抖
 */
export function debounceValidator<T>(
  validator: ValidateFunction<T>,
  delay: number = 300
): ValidateFunction<T> {
  let timeoutId: NodeJS.Timeout;
  
  return (value, formData) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value, formData);
        resolve(result);
      }, delay);
    });
  };
}

/**
 * 快取驗證結果
 */
export function memoizeValidator<T>(
  validator: ValidateFunction<T>
): ValidateFunction<T> {
  const cache = new Map<string, boolean | string>();
  
  return async (value, formData) => {
    const key = JSON.stringify({ value, formData });
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = await validator(value, formData);
    cache.set(key, result);
    
    return result;
  };
}

/* ============================================
   驗證訊息
   ============================================ */

/**
 * 預設驗證訊息
 */
export const defaultMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  min: 'Value must be at least {min}',
  max: 'Value must be at most {max}',
  minLength: 'Must be at least {minLength} characters',
  maxLength: 'Must be at most {maxLength} characters',
  pattern: 'Invalid format',
  oneOf: 'Must be one of: {values}',
  notOneOf: 'Must not be one of: {values}',
  integer: 'Must be an integer',
  float: 'Must be a number',
  date: 'Must be a valid date',
  boolean: 'Must be true or false',
  arrayMinLength: 'Must have at least {min} items',
  arrayMaxLength: 'Must have at most {max} items',
  arrayUnique: 'Items must be unique',
};

/**
 * 格式化驗證訊息
 */
export function formatMessage(
  template: string,
  params: Record<string, any>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

/* ============================================
   型別防護
   ============================================ */

/**
 * 檢查是否為驗證錯誤
 */
export function isValidationError(value: any): value is ValidationErrors {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      v => typeof v === 'string' || Array.isArray(v) || isValidationError(v)
    )
  );
}

/**
 * 檢查是否為驗證結果
 */
export function isValidationResult<T>(value: any): value is ValidationResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'valid' in value &&
    typeof value.valid === 'boolean' &&
    (value.valid ? 'data' in value : 'errors' in value)
  );
}