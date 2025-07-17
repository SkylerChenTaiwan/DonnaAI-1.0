/**
 * 欄位解釋系統型別定義
 */

// 系統預設欄位解釋
export interface SystemFieldInterpretation {
  entityType: 'customer' | 'record' | 'task';
  fieldKey: string;
  fieldName: string;
  aiDescription: string;               // 給 AI 的欄位說明
  extractionHints: string[];           // 提取提示
  dataType: string;
  examples: string[];
}

// 預設客戶欄位解釋
export const CUSTOMER_FIELD_INTERPRETATIONS: SystemFieldInterpretation[] = [
  {
    entityType: 'customer',
    fieldKey: 'name',
    fieldName: '客戶姓名',
    aiDescription: '個人或公司的正式名稱',
    extractionHints: ['名字', '姓名', '客戶名稱', '公司名稱'],
    dataType: 'string',
    examples: ['王小明', '張總', 'ABC公司']
  },
  {
    entityType: 'customer',
    fieldKey: 'company',
    fieldName: '公司名稱',
    aiDescription: '客戶所屬的公司或組織名稱',
    extractionHints: ['公司', '企業', '組織', '機構'],
    dataType: 'string',
    examples: ['台積電', '鴻海科技', 'Google台灣']
  },
  {
    entityType: 'customer',
    fieldKey: 'jobTitle',
    fieldName: '職稱',
    aiDescription: '客戶在公司的職位或頭銜',
    extractionHints: ['職稱', '職位', '頭銜', '總經理', '經理', '主管'],
    dataType: 'string',
    examples: ['總經理', '業務經理', '技術總監', 'CTO']
  },
  {
    entityType: 'customer',
    fieldKey: 'department',
    fieldName: '部門',
    aiDescription: '客戶所屬的部門或單位',
    extractionHints: ['部門', '單位', '處', '組', '科'],
    dataType: 'string',
    examples: ['業務部', '資訊部', '人資部', '採購部']
  },
  {
    entityType: 'customer',
    fieldKey: 'phone',
    fieldName: '電話號碼',
    aiDescription: '客戶的聯絡電話，包含手機或市話',
    extractionHints: ['電話', '手機', '聯絡電話', '連絡電話', 'Tel'],
    dataType: 'string',
    examples: ['0912-345-678', '02-12345678', '+886-912345678']
  },
  {
    entityType: 'customer',
    fieldKey: 'email',
    fieldName: '電子郵件',
    aiDescription: '客戶的電子郵件地址',
    extractionHints: ['email', 'e-mail', '電子郵件', '郵件', 'mail'],
    dataType: 'string',
    examples: ['john@example.com', 'contact@company.com']
  },
  {
    entityType: 'customer',
    fieldKey: 'lastContactDate',
    fieldName: '最後聯絡日期',
    aiDescription: '上次與客戶聯繫的日期',
    extractionHints: ['上次聯絡', '最後聯絡', '上次見面', '上次會議'],
    dataType: 'date',
    examples: ['2024年1月15日', '昨天', '上週三']
  },
  {
    entityType: 'customer',
    fieldKey: 'nextFollowUpDate',
    fieldName: '下次跟進日期',
    aiDescription: '計劃下次聯繫客戶的日期',
    extractionHints: ['下次跟進', '下次聯絡', '再聯絡', '約定時間'],
    dataType: 'date',
    examples: ['下週一', '月底前', '兩週後']
  }
];

// 預設紀錄欄位解釋
export const RECORD_FIELD_INTERPRETATIONS: SystemFieldInterpretation[] = [
  {
    entityType: 'record',
    fieldKey: 'meetingPurpose',
    fieldName: '會議目的',
    aiDescription: '會議或對話的主要目的和議題',
    extractionHints: ['目的', '議題', '主題', '討論事項'],
    dataType: 'string',
    examples: ['產品介紹', '需求討論', '合約談判']
  },
  {
    entityType: 'record',
    fieldKey: 'keyDecisions',
    fieldName: '關鍵決定',
    aiDescription: '會議中做出的重要決定或結論',
    extractionHints: ['決定', '決議', '結論', '共識'],
    dataType: 'string[]',
    examples: ['同意採購方案', '延後到下季執行', '需要進一步評估']
  },
  {
    entityType: 'record',
    fieldKey: 'customerConcerns',
    fieldName: '客戶關注點',
    aiDescription: '客戶提出的疑慮、問題或關注事項',
    extractionHints: ['關注', '疑慮', '問題', '擔心', '在意'],
    dataType: 'string[]',
    examples: ['價格偏高', '交期問題', '售後服務']
  },
  {
    entityType: 'record',
    fieldKey: 'nextSteps',
    fieldName: '後續步驟',
    aiDescription: '會議後需要執行的行動項目',
    extractionHints: ['下一步', '後續', '待辦', '行動項目', 'action items'],
    dataType: 'string[]',
    examples: ['準備報價單', '安排產品展示', '提供技術規格']
  },
  {
    entityType: 'record',
    fieldKey: 'competitors',
    fieldName: '競爭對手',
    aiDescription: '客戶提到的競爭對手或替代方案',
    extractionHints: ['競爭對手', '競爭者', '其他廠商', '替代方案'],
    dataType: 'string[]',
    examples: ['A公司', 'B品牌', '現有供應商']
  }
];

// 欄位解釋處理配置
export interface FieldInterpretationConfig {
  enableAIInterpretation: boolean;     // 是否啟用 AI 解釋
  confidenceThreshold: number;         // 信心分數門檻（0-1）
  requireConfirmation: boolean;        // 是否需要使用者確認
  autoUpdateFields: boolean;           // 是否自動更新欄位
}

// 欄位解釋結果
export interface FieldInterpretationResult {
  fieldKey: string;
  interpretation: string;
  confidence: number;
  source: 'system' | 'ai' | 'user';
  timestamp: Date;
}