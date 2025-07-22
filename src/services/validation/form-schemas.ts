/**
 * 表格驗證模式 - 使用 Zod 進行數據驗證
 */

import { z } from 'zod';

// 客戶輸入模式
export const CustomerFormSchema = z.object({
  name: z.string().min(1, "客戶姓名為必填"),
  company: z.string().optional(), 
  email: z.string().email("請輸入有效的電子郵件地址").optional().or(z.literal("")),
  phone: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type CustomerFormData = z.infer<typeof CustomerFormSchema>;

// 紀錄輸入模式
export const RecordFormSchema = z.object({
  title: z.string().min(1, "紀錄標題為必填"),
  content: z.string().min(1, "紀錄內容為必填"),
  type: z.enum(['meeting', 'call', 'note', 'todo', 'idea', 'other']).default('note'),
  customerId: z.string().optional(),
  customerIds: z.array(z.string()).default([]),
  participantIds: z.array(z.string()).default([]),
  scheduledAt: z.string().optional(),
  dueDate: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'pending', 'in_progress', 'completed', 'archived']).default('draft'),
  tags: z.array(z.string()).default([]),
  audioUri: z.string().optional(),
  processingPreference: z.enum(['immediate', 'edit_first', 'manual']).default('immediate')
});

export type RecordFormData = z.infer<typeof RecordFormSchema>;

// 任務輸入模式
export const TaskFormSchema = z.object({
  title: z.string().min(1, "任務標題為必填"),
  dueDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  customerId: z.string().optional(),
  priority: z.enum(['低', '中', '高']).default('中'),
  status: z.enum(['待處理', '進行中', '已完成', '已取消']).default('待處理'),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type TaskFormData = z.infer<typeof TaskFormSchema>;

// CSV上傳數據模式
export const CSVImportSchema = z.object({
  data: z.array(CustomerFormSchema),
  duplicates: z.array(z.object({
    row: z.number(),
    existing: CustomerFormSchema,
    new: CustomerFormSchema
  })),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string(),
    error: z.string()
  }))
});

export type CSVImportData = z.infer<typeof CSVImportSchema>;

// 語音輸入模式
export const VoiceInputSchema = z.object({
  audioUri: z.string(),
  duration: z.number(),
  transcription: z.string().optional(),
  extractedData: z.record(z.any()).optional()
});

export type VoiceInputData = z.infer<typeof VoiceInputSchema>;

// 表格欄位配置模式
export const FormFieldConfigSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'multiselect', 'date', 'switch', 'tags']),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  validation: z.any().optional()
});

export type FormFieldConfig = z.infer<typeof FormFieldConfigSchema>;

// 多步驟表格配置模式
export const MultiStepFormConfigSchema = z.object({
  title: z.string(),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    fields: z.array(FormFieldConfigSchema)
  })),
  onSubmit: z.function().args(z.any()).returns(z.void()),
  onCancel: z.function().returns(z.void()).optional()
});

export type MultiStepFormConfig = z.infer<typeof MultiStepFormConfigSchema>;

// 驗證錯誤格式
export interface ValidationError {
  field: string;
  message: string;
}

// 通用驗證函數
export const validateFormData = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { success: false, errors };
    }
    return { 
      success: false, 
      errors: [{ field: 'unknown', message: '未知的驗證錯誤' }]
    };
  }
};