/**
 * 客戶原型定義
 * 定義不同類型的客戶角色，用於業務訓練
 */

import { CustomerPersona, StateType } from '../../types/roleplay';

/**
 * 預定義的客戶原型庫
 * 涵蓋不同產業、職位、個性的典型客戶
 */
export const CUSTOMER_PERSONAS: CustomerPersona[] = [
  // 1. 謹慎型中小企業老闆
  {
    id: 'cautious-sme-owner',
    name: '陳老闆',
    profile: {
      industry: '傳統製造業',
      companySize: '50-100人',
      position: '總經理/老闆',
      personality: {
        optimistic: 4,
        analytical: 7,
        decisive: 5,
        skeptical: 8,
        friendly: 6,
        professional: 7,
        priceConscious: 9,
        innovative: 3
      },
      painPoints: [
        '成本控制壓力大',
        '人力管理困難',
        '數位轉型落後',
        '競爭對手價格戰'
      ],
      budget: {
        range: { min: 50000, max: 200000 },
        flexibility: 3,
        decisionPower: true,
        approvalProcess: '自己決定，但會諮詢財務'
      },
      decisionProcess: '非常謹慎，需要多次確認效益，重視投資回報率'
    },
    triggers: {
      positive: ['節省成本', '提高效率', '競爭對手在用', '有試用期'],
      negative: ['太貴', '太複雜', '沒時間', '風險太高']
    },
    initialState: StateType.SKEPTICAL,
    difficulty: 8
  },

  // 2. 創新型科技公司主管
  {
    id: 'innovative-tech-manager',
    name: '林經理',
    profile: {
      industry: '軟體科技業',
      companySize: '100-500人',
      position: '技術部門主管',
      personality: {
        optimistic: 8,
        analytical: 9,
        decisive: 7,
        skeptical: 5,
        friendly: 7,
        professional: 8,
        priceConscious: 5,
        innovative: 9
      },
      painPoints: [
        '團隊協作效率',
        '技術債累積',
        '人才流失',
        '專案管理混亂'
      ],
      budget: {
        range: { min: 100000, max: 500000 },
        flexibility: 7,
        decisionPower: false,
        approvalProcess: '需要向 CTO 和採購部門申請'
      },
      decisionProcess: '重視技術規格和整合性，會做詳細的技術評估'
    },
    triggers: {
      positive: ['API 完善', '可擴展', '安全性高', '技術支援好'],
      negative: ['技術過時', '整合困難', '文檔不全', '封閉系統']
    },
    initialState: StateType.INTERESTED,
    difficulty: 6
  },

  // 3. 衝動型新創創辦人
  {
    id: 'impulsive-startup-founder',
    name: '張執行長',
    profile: {
      industry: '電商新創',
      companySize: '10-50人',
      position: '創辦人/CEO',
      personality: {
        optimistic: 9,
        analytical: 5,
        decisive: 9,
        skeptical: 3,
        friendly: 8,
        professional: 6,
        priceConscious: 6,
        innovative: 10
      },
      painPoints: [
        '快速成長需求',
        '資金壓力',
        '市場競爭激烈',
        '營運效率低'
      ],
      budget: {
        range: { min: 30000, max: 150000 },
        flexibility: 8,
        decisionPower: true,
        approvalProcess: '自己決定，偶爾諮詢共同創辦人'
      },
      decisionProcess: '決策快速，看重能否快速上線和市場優勢'
    },
    triggers: {
      positive: ['快速導入', '彈性客製', '成長潛力', '競爭優勢'],
      negative: ['太慢', '太死板', '大公司作風', '長期合約']
    },
    initialState: StateType.INTERESTED,
    difficulty: 4
  },

  // 4. 保守型金融業主管
  {
    id: 'conservative-finance-director',
    name: '王協理',
    profile: {
      industry: '金融保險業',
      companySize: '500-1000人',
      position: '業務協理',
      personality: {
        optimistic: 5,
        analytical: 8,
        decisive: 6,
        skeptical: 7,
        friendly: 5,
        professional: 9,
        priceConscious: 6,
        innovative: 4
      },
      painPoints: [
        '法規合規要求',
        '資料安全疑慮',
        '流程僵化',
        '客戶服務品質'
      ],
      budget: {
        range: { min: 200000, max: 1000000 },
        flexibility: 4,
        decisionPower: false,
        approvalProcess: '需要法務、資安、採購、高層多方審核'
      },
      decisionProcess: '極度謹慎，重視安全性和合規性，決策流程冗長'
    },
    triggers: {
      positive: ['符合法規', '資安認證', '大企業案例', '穩定可靠'],
      negative: ['資安風險', '新創公司', '沒有認證', '國外服務']
    },
    initialState: StateType.SKEPTICAL,
    difficulty: 9
  },

  // 5. 友善型人資主管
  {
    id: 'friendly-hr-manager',
    name: '李經理',
    profile: {
      industry: '零售服務業',
      companySize: '200-500人',
      position: '人資經理',
      personality: {
        optimistic: 7,
        analytical: 6,
        decisive: 6,
        skeptical: 4,
        friendly: 9,
        professional: 7,
        priceConscious: 7,
        innovative: 6
      },
      painPoints: [
        '員工流動率高',
        '招募困難',
        '培訓成本高',
        '績效管理不易'
      ],
      budget: {
        range: { min: 80000, max: 300000 },
        flexibility: 6,
        decisionPower: false,
        approvalProcess: '需要總經理和財務主管核准'
      },
      decisionProcess: '重視員工體驗和易用性，會考慮員工接受度'
    },
    triggers: {
      positive: ['提升員工滿意度', '簡化流程', '有培訓支援', '介面友善'],
      negative: ['太複雜', '員工抗拒', '沒有中文', '客服不好']
    },
    initialState: StateType.INTERESTED,
    difficulty: 5
  },

  // 6. 精明型採購經理
  {
    id: 'shrewd-procurement-manager',
    name: '黃經理',
    profile: {
      industry: '大型連鎖零售',
      companySize: '1000人以上',
      position: '採購經理',
      personality: {
        optimistic: 5,
        analytical: 8,
        decisive: 7,
        skeptical: 6,
        friendly: 5,
        professional: 8,
        priceConscious: 10,
        innovative: 5
      },
      painPoints: [
        '供應商管理複雜',
        '成本壓力極大',
        '庫存控制',
        '採購流程效率'
      ],
      budget: {
        range: { min: 100000, max: 500000 },
        flexibility: 5,
        decisionPower: true,
        approvalProcess: '在預算內可自行決定'
      },
      decisionProcess: '極度重視性價比，會詳細比較多家廠商'
    },
    triggers: {
      positive: ['最佳價格', '量大優惠', '付款條件好', '附加價值多'],
      negative: ['價格不透明', '沒有彈性', '隱藏成本', '綁約']
    },
    initialState: StateType.NEGOTIATING,
    difficulty: 7
  },

  // 7. 技術導向IT總監
  {
    id: 'technical-it-director',
    name: '周總監',
    profile: {
      industry: '電信業',
      companySize: '1000人以上',
      position: 'IT總監',
      personality: {
        optimistic: 6,
        analytical: 10,
        decisive: 7,
        skeptical: 7,
        friendly: 4,
        professional: 9,
        priceConscious: 6,
        innovative: 8
      },
      painPoints: [
        '系統整合複雜',
        '維運成本高',
        '資安威脅',
        '技術更新快速'
      ],
      budget: {
        range: { min: 500000, max: 2000000 },
        flexibility: 6,
        decisionPower: true,
        approvalProcess: '大案需要向CIO報告'
      },
      decisionProcess: '深度技術評估，重視架構和未來擴展性'
    },
    triggers: {
      positive: ['技術領先', '架構完善', '開源支援', '社群活躍'],
      negative: ['技術落後', '封閉架構', '廠商綁定', '支援不足']
    },
    initialState: StateType.TECHNICAL_REVIEW,
    difficulty: 8
  },

  // 8. 關係型業務副總
  {
    id: 'relationship-sales-vp',
    name: '劉副總',
    profile: {
      industry: '廣告行銷業',
      companySize: '100-200人',
      position: '業務副總',
      personality: {
        optimistic: 8,
        analytical: 5,
        decisive: 8,
        skeptical: 4,
        friendly: 10,
        professional: 7,
        priceConscious: 5,
        innovative: 7
      },
      painPoints: [
        '客戶關係管理',
        '業績壓力大',
        '團隊效率低',
        '競爭對手多'
      ],
      budget: {
        range: { min: 150000, max: 600000 },
        flexibility: 8,
        decisionPower: true,
        approvalProcess: '可自行決定，大案知會老闆'
      },
      decisionProcess: '重視關係和信任，喜歡與人互動的採購過程'
    },
    triggers: {
      positive: ['建立夥伴關係', '共同成長', '客製服務', '專屬窗口'],
      negative: ['太制式', '沒人情味', '只談價格', '服務態度差']
    },
    initialState: StateType.INTERESTED,
    difficulty: 3
  },

  // 9. 忙碌型診所院長
  {
    id: 'busy-clinic-director',
    name: '許院長',
    profile: {
      industry: '醫療診所',
      companySize: '10-30人',
      position: '診所院長',
      personality: {
        optimistic: 6,
        analytical: 7,
        decisive: 8,
        skeptical: 5,
        friendly: 7,
        professional: 9,
        priceConscious: 7,
        innovative: 5
      },
      painPoints: [
        '時間極度有限',
        '病患管理繁雜',
        '醫療記錄整理',
        '人員排班困難'
      ],
      budget: {
        range: { min: 50000, max: 200000 },
        flexibility: 5,
        decisionPower: true,
        approvalProcess: '自行決定，可能諮詢會計'
      },
      decisionProcess: '時間寶貴，需要快速了解價值，偏好簡單明瞭'
    },
    triggers: {
      positive: ['節省時間', '操作簡單', '立即見效', '不需培訓'],
      negative: ['太花時間', '操作複雜', '需要培訓', '干擾看診']
    },
    initialState: StateType.INITIAL,
    difficulty: 6
  },

  // 10. 年輕型教育機構主任
  {
    id: 'young-education-director',
    name: '蔡主任',
    profile: {
      industry: '教育培訓業',
      companySize: '30-80人',
      position: '教務主任',
      personality: {
        optimistic: 8,
        analytical: 6,
        decisive: 6,
        skeptical: 3,
        friendly: 8,
        professional: 7,
        priceConscious: 8,
        innovative: 8
      },
      painPoints: [
        '學生管理困難',
        '家長溝通頻繁',
        '課程安排複雜',
        '行政工作繁重'
      ],
      budget: {
        range: { min: 30000, max: 150000 },
        flexibility: 7,
        decisionPower: false,
        approvalProcess: '需要校長和董事會同意'
      },
      decisionProcess: '開放嘗試新事物，重視教育成效和學生體驗'
    },
    triggers: {
      positive: ['提升教學品質', '學生喜歡', '家長滿意', '減輕負擔'],
      negative: ['影響教學', '學生不會用', '家長反彈', '太商業化']
    },
    initialState: StateType.INTERESTED,
    difficulty: 4
  }
];

/**
 * 根據條件獲取客戶原型
 */
export function getPersonaById(id: string): CustomerPersona | undefined {
  return CUSTOMER_PERSONAS.find(persona => persona.id === id);
}

/**
 * 根據產業獲取客戶原型列表
 */
export function getPersonasByIndustry(industry: string): CustomerPersona[] {
  return CUSTOMER_PERSONAS.filter(
    persona => persona.profile.industry.includes(industry)
  );
}

/**
 * 根據難度獲取客戶原型列表
 */
export function getPersonasByDifficulty(
  minDifficulty: number,
  maxDifficulty: number
): CustomerPersona[] {
  return CUSTOMER_PERSONAS.filter(
    persona => persona.difficulty >= minDifficulty && 
               persona.difficulty <= maxDifficulty
  );
}

/**
 * 隨機獲取客戶原型
 */
export function getRandomPersona(
  options?: {
    difficulty?: { min: number; max: number };
    excludeIds?: string[];
  }
): CustomerPersona {
  let filtered = [...CUSTOMER_PERSONAS];

  if (options?.difficulty) {
    filtered = filtered.filter(
      p => p.difficulty >= options.difficulty!.min && 
           p.difficulty <= options.difficulty!.max
    );
  }

  if (options?.excludeIds) {
    filtered = filtered.filter(
      p => !options.excludeIds!.includes(p.id)
    );
  }

  if (filtered.length === 0) {
    throw new Error('沒有符合條件的客戶原型');
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * 生成客戶原型的個性描述
 */
export function generatePersonalityDescription(
  persona: CustomerPersona
): string {
  const traits = persona.profile.personality;
  const descriptions: string[] = [];

  // 樂觀程度
  if (traits.optimistic >= 7) {
    descriptions.push('樂觀積極');
  } else if (traits.optimistic <= 3) {
    descriptions.push('較為悲觀');
  }

  // 分析傾向
  if (traits.analytical >= 8) {
    descriptions.push('理性分析');
  } else if (traits.analytical <= 4) {
    descriptions.push('憑感覺決定');
  }

  // 決策速度
  if (traits.decisive >= 8) {
    descriptions.push('決策果斷');
  } else if (traits.decisive <= 4) {
    descriptions.push('優柔寡斷');
  }

  // 懷疑程度
  if (traits.skeptical >= 7) {
    descriptions.push('充滿懷疑');
  } else if (traits.skeptical <= 3) {
    descriptions.push('容易相信');
  }

  // 價格敏感度
  if (traits.priceConscious >= 8) {
    descriptions.push('極度在意價格');
  } else if (traits.priceConscious <= 4) {
    descriptions.push('價格不是首要考量');
  }

  return descriptions.join('、');
}

/**
 * 獲取客戶原型的主要關注點
 */
export function getPersonaFocusPoints(persona: CustomerPersona): string[] {
  const focusPoints: string[] = [];
  const traits = persona.profile.personality;

  if (traits.priceConscious >= 8) {
    focusPoints.push('價格和成本效益');
  }

  if (traits.analytical >= 8) {
    focusPoints.push('詳細規格和數據');
  }

  if (traits.innovative >= 8) {
    focusPoints.push('創新功能和技術');
  }

  if (traits.professional >= 8) {
    focusPoints.push('專業度和可靠性');
  }

  if (traits.skeptical >= 7) {
    focusPoints.push('風險和保障');
  }

  // 加入痛點相關
  if (persona.profile.painPoints.some(p => p.includes('成本'))) {
    focusPoints.push('降低成本');
  }

  if (persona.profile.painPoints.some(p => p.includes('效率'))) {
    focusPoints.push('提升效率');
  }

  return Array.from(new Set(focusPoints)); // 去重
}

/**
 * 生成初始對話開場白
 */
export function generatePersonaGreeting(persona: CustomerPersona): string {
  const greetings: Record<string, string[]> = {
    'cautious-sme-owner': [
      '你好，我們公司最近很忙，有什麼事嗎？',
      '請問有什麼事？我時間不多。',
      '又是推銷的嗎？我們暫時不需要什麼新東西。'
    ],
    'innovative-tech-manager': [
      '嗨，請問你們是做什麼的？',
      '有什麼新的解決方案嗎？說來聽聽。',
      '我們正在評估一些新工具，你們的產品有什麼特色？'
    ],
    'impulsive-startup-founder': [
      'Hey! 什麼事？要快點說喔，我等下有會議。',
      '喔？有什麼能幫助我們快速成長的嗎？',
      '說重點，我們需要的是能立即見效的東西。'
    ],
    'conservative-finance-director': [
      '您好，請問貴公司是？',
      '請先提供貴公司的基本資料和相關認證。',
      '我們有既定的採購流程，請問你們了解我們的產業嗎？'
    ],
    'friendly-hr-manager': [
      '您好！很高興認識您，請問怎麼稱呼？',
      '歡迎歡迎！最近天氣真好，您是來介紹什麼的呢？',
      '您好，請坐請坐，要喝點什麼嗎？'
    ],
    'shrewd-procurement-manager': [
      '直接說吧，你們的產品價格如何？',
      '我時間寶貴，請直接告訴我你們比其他供應商好在哪。',
      '先說價格範圍，不合適就不用浪費彼此時間了。'
    ],
    'technical-it-director': [
      '請問你們的技術架構是什麼？',
      '有技術文檔可以先看看嗎？',
      '你們的解決方案是基於什麼技術堆疊？'
    ],
    'relationship-sales-vp': [
      '哇，很高興見到你！最近生意如何？',
      '歡迎歡迎！來，我們聊聊，不急著談公事。',
      '太好了，正想找人聊聊最近的市場狀況呢！'
    ],
    'busy-clinic-director': [
      '不好意思，我只有10分鐘，請長話短說。',
      '我馬上要看診了，有什麼事請快說。',
      '現在是看診時間，真的有必要現在談嗎？'
    ],
    'young-education-director': [
      '您好！是來介紹教育相關的產品嗎？',
      '太好了，我們正在找能幫助學生的新工具！',
      '歡迎！希望你們有什麼有趣的東西可以分享。'
    ]
  };

  const personaGreetings = greetings[persona.id] || [
    '您好，請問有什麼事嗎？',
    '什麼事？'
  ];

  return personaGreetings[Math.floor(Math.random() * personaGreetings.length)];
}

/**
 * 根據訓練進度推薦合適的客戶原型
 */
export function recommendPersona(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  completedPersonaIds: string[]
): CustomerPersona {
  const difficultyRange = {
    beginner: { min: 1, max: 4 },
    intermediate: { min: 4, max: 7 },
    advanced: { min: 7, max: 10 }
  };

  return getRandomPersona({
    difficulty: difficultyRange[userLevel],
    excludeIds: completedPersonaIds
  });
}

/**
 * 生成客戶原型摘要（用於顯示）
 */
export function generatePersonaSummary(persona: CustomerPersona): {
  title: string;
  tags: string[];
  description: string;
  difficulty: string;
} {
  const difficultyLabels = {
    1: '非常簡單',
    2: '非常簡單',
    3: '簡單',
    4: '簡單',
    5: '中等',
    6: '中等',
    7: '困難',
    8: '困難',
    9: '非常困難',
    10: '非常困難'
  };

  return {
    title: `${persona.name} - ${persona.profile.position}`,
    tags: [
      persona.profile.industry,
      persona.profile.companySize,
      `預算 ${persona.profile.budget.range.min / 10000}-${persona.profile.budget.range.max / 10000}萬`
    ],
    description: generatePersonalityDescription(persona),
    difficulty: difficultyLabels[persona.difficulty as keyof typeof difficultyLabels] || '中等'
  };
}