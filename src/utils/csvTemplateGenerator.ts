/**
 * CSV 範本生成器
 * 根據動態欄位定義生成 CSV 範本檔案
 */

import { FieldConfig, FieldType } from '@/types/fieldDefinitions';

/**
 * 生成 CSV 範本範例值
 */
function generateExampleValue(field: FieldConfig): string {
  switch (field.type) {
    case 'text':
      if (field.key === 'name') return '張小明';
      if (field.key === 'company') return '台積電';
      return '範例文字';
      
    case 'number':
      return '123';
      
    case 'date':
      return '2025-01-01';
      
    case 'datetime':
      return '2025-01-01 10:00';
      
    case 'email':
      return 'example@email.com';
      
    case 'phone':
      return '0912-345-678';
      
    case 'url':
      return 'https://example.com';
      
    case 'boolean':
      return 'true';
      
    case 'select':
    case 'multiselect':
      // 使用第一個選項作為範例
      return field.options?.[0]?.value || '選項1';
      
    case 'tags':
      return '標籤1;標籤2';
      
    case 'textarea':
      return '範例說明文字';
      
    default:
      return '';
  }
}

/**
 * 轉義 CSV 欄位值
 * 處理包含逗號、換行或引號的特殊字符
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // 將引號替換為雙引號，並用引號包圍整個值
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 生成 CSV 範本
 * @param fields 欄位定義陣列
 * @param includeExample 是否包含範例資料行
 * @returns CSV 內容字串
 */
export function generateCSVTemplate(
  fields: FieldConfig[], 
  includeExample: boolean = true
): string {
  // 過濾出可見欄位並排序
  const visibleFields = fields
    .filter(field => field.visible)
    .sort((a, b) => a.order - b.order);
  
  // 生成標題行
  const headers = visibleFields.map(field => escapeCSVField(field.label));
  
  // 生成欄位說明行（可選）
  const descriptions = visibleFields.map(field => {
    let desc = field.description || '';
    if (field.required) {
      desc = desc ? `${desc} (必填)` : '必填';
    }
    if (field.type === 'select' && field.options) {
      const optionValues = field.options.map(opt => opt.value).join('、');
      desc = desc ? `${desc} [選項: ${optionValues}]` : `選項: ${optionValues}`;
    }
    return escapeCSVField(desc);
  });
  
  // 生成範例資料行
  const exampleData = visibleFields.map(field => 
    escapeCSVField(generateExampleValue(field))
  );
  
  // 組合 CSV 內容
  const csvLines = [headers.join(',')];
  
  // 加入欄位說明行作為第二行
  if (descriptions.some(desc => desc !== '')) {
    csvLines.push(descriptions.join(','));
  }
  
  // 加入範例資料
  if (includeExample) {
    csvLines.push(exampleData.join(','));
  }
  
  return csvLines.join('\n');
}

/**
 * 生成帶 BOM 的 CSV Blob
 * BOM 確保 Excel 正確識別 UTF-8 編碼
 * @param fields 欄位定義陣列
 * @param includeExample 是否包含範例資料行
 * @returns Blob 物件
 */
export function generateCSVBlob(
  fields: FieldConfig[], 
  includeExample: boolean = true
): Blob {
  const csvContent = generateCSVTemplate(fields, includeExample);
  
  // UTF-8 BOM
  const BOM = '\uFEFF';
  const fullContent = BOM + csvContent;
  
  return new Blob([fullContent], { 
    type: 'text/csv;charset=utf-8' 
  });
}

/**
 * 下載 CSV 範本檔案
 * @param fields 欄位定義陣列
 * @param filename 檔案名稱
 * @param includeExample 是否包含範例資料行
 */
export function downloadCSVTemplate(
  fields: FieldConfig[],
  filename: string = 'template.csv',
  includeExample: boolean = true
): void {
  const blob = generateCSVBlob(fields, includeExample);
  
  // 建立下載連結
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // 觸發下載
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成欄位映射說明
 * 用於顯示 CSV 欄位對應關係
 * @param fields 欄位定義陣列
 * @returns 映射說明陣列
 */
export function generateFieldMapping(fields: FieldConfig[]): Array<{
  csvHeader: string;
  fieldKey: string;
  fieldType: FieldType;
  required: boolean;
  description?: string;
}> {
  return fields
    .filter(field => field.visible)
    .sort((a, b) => a.order - b.order)
    .map(field => ({
      csvHeader: field.label,
      fieldKey: field.key,
      fieldType: field.type,
      required: field.required,
      description: field.description
    }));
}

/**
 * 驗證 CSV 標題是否匹配欄位定義
 * @param csvHeaders CSV 檔案的標題行
 * @param fields 欄位定義陣列
 * @returns 驗證結果
 */
export function validateCSVHeaders(
  csvHeaders: string[],
  fields: FieldConfig[]
): {
  isValid: boolean;
  missingRequired: string[];
  unmatchedHeaders: string[];
  matchedFields: Map<string, FieldConfig>;
} {
  const visibleFields = fields.filter(field => field.visible);
  const requiredFields = visibleFields.filter(field => field.required);
  
  // 建立標題到欄位的映射
  const headerToField = new Map<string, FieldConfig>();
  const matchedFields = new Map<string, FieldConfig>();
  
  visibleFields.forEach(field => {
    headerToField.set(field.label, field);
  });
  
  // 檢查匹配的標題
  const unmatchedHeaders: string[] = [];
  csvHeaders.forEach((header, index) => {
    const field = headerToField.get(header);
    if (field) {
      matchedFields.set(header, field);
    } else {
      unmatchedHeaders.push(header);
    }
  });
  
  // 檢查缺少的必填欄位
  const missingRequired = requiredFields
    .filter(field => !csvHeaders.includes(field.label))
    .map(field => field.label);
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    unmatchedHeaders,
    matchedFields
  };
}