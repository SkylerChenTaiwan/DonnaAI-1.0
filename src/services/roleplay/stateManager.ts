/**
 * 狀態機管理器
 * 管理客戶心理狀態的轉換和追蹤
 */

import {
  StateType,
  CustomerState,
  StateTransition,
  CustomerPersona,
  CompressedDialogue
} from '../../types/roleplay';

// 定義所有可能的客戶狀態
export const CUSTOMER_STATES: Record<StateType, CustomerState> = {
  [StateType.INITIAL]: {
    id: StateType.INITIAL,
    name: '初始接觸',
    description: '客戶剛開始接觸，還不了解產品',
    behaviors: {
      openness: 5,
      patience: 7,
      trust: 3,
      defensiveness: 5
    },
    responsePatterns: [
      '我們目前沒有特別需要',
      '可以簡單介紹一下嗎？',
      '你們是做什麼的？',
      '我們已經有供應商了'
    ],
    transitions: [
      {
        toState: StateType.INTERESTED,
        condition: '業務提到客戶痛點或展示價值',
        triggers: ['解決', '幫助', '提升', '改善', '節省'],
        probability: 0.6
      },
      {
        toState: StateType.SKEPTICAL,
        condition: '客戶表現出懷疑',
        triggers: ['真的嗎', '聽起來太好', '其他人也這麼說'],
        probability: 0.3
      },
      {
        toState: StateType.LOST,
        condition: '客戶明確拒絕',
        triggers: ['不需要', '沒興趣', '請不要再聯絡'],
        probability: 0.1
      }
    ],
    hiddenThoughts: [
      '又是推銷的...',
      '看看他要說什麼吧',
      '希望不要浪費太多時間'
    ]
  },

  [StateType.INTERESTED]: {
    id: StateType.INTERESTED,
    name: '產生興趣',
    description: '客戶對產品表現出興趣，願意了解更多',
    behaviors: {
      openness: 7,
      patience: 8,
      trust: 5,
      defensiveness: 3
    },
    responsePatterns: [
      '聽起來不錯，可以多說一些嗎？',
      '這個功能是怎麼運作的？',
      '其他客戶的使用經驗如何？',
      '你們和競爭對手有什麼不同？'
    ],
    transitions: [
      {
        toState: StateType.TECHNICAL_REVIEW,
        condition: '開始深入了解技術細節',
        triggers: ['技術', '整合', '安全性', '架構'],
        probability: 0.4
      },
      {
        toState: StateType.PRICE_SHOCK,
        condition: '討論到價格',
        triggers: ['多少錢', '費用', '預算', '價格'],
        probability: 0.3
      },
      {
        toState: StateType.SKEPTICAL,
        condition: '產生疑慮',
        triggers: ['但是', '可是', '我擔心', '不確定'],
        probability: 0.2
      },
      {
        toState: StateType.INTERNAL_DISCUSSION,
        condition: '需要內部討論',
        triggers: ['討論一下', '開會', '主管', '團隊'],
        probability: 0.1
      }
    ],
    hiddenThoughts: [
      '這個可能真的有用',
      '但不知道老闆會不會同意',
      '價格應該不便宜吧'
    ]
  },

  [StateType.SKEPTICAL]: {
    id: StateType.SKEPTICAL,
    name: '懷疑觀望',
    description: '客戶有疑慮，需要更多證據和保證',
    behaviors: {
      openness: 4,
      patience: 5,
      trust: 3,
      defensiveness: 7
    },
    responsePatterns: [
      '我們之前也試過類似的...',
      '這真的有你說的那麼好嗎？',
      '有什麼證據可以證明？',
      '如果沒效果怎麼辦？'
    ],
    transitions: [
      {
        toState: StateType.INTERESTED,
        condition: '疑慮被解決',
        triggers: ['案例', '保證', '試用', '數據'],
        probability: 0.5
      },
      {
        toState: StateType.OBJECTION,
        condition: '提出具體反對意見',
        triggers: ['不適合', '太複雜', '沒必要', '不相信'],
        probability: 0.3
      },
      {
        toState: StateType.LOST,
        condition: '失去信任',
        triggers: ['算了', '不用了', '謝謝'],
        probability: 0.2
      }
    ],
    hiddenThoughts: [
      '聽起來太誇大了',
      '銷售都這樣說',
      '需要更多證據'
    ]
  },

  [StateType.PRICE_SHOCK]: {
    id: StateType.PRICE_SHOCK,
    name: '價格震驚',
    description: '客戶對價格感到驚訝，需要價值論證',
    behaviors: {
      openness: 3,
      patience: 4,
      trust: 4,
      defensiveness: 8
    },
    responsePatterns: [
      '這個價格超出我們預算',
      '太貴了吧！',
      '其他方案都沒這麼貴',
      '這個價格包含什麼？'
    ],
    transitions: [
      {
        toState: StateType.NEGOTIATING,
        condition: '開始討價還價',
        triggers: ['折扣', '優惠', '便宜一點', '預算'],
        probability: 0.5
      },
      {
        toState: StateType.INTERESTED,
        condition: '理解價值後接受',
        triggers: ['ROI', '值得', '投資', '長期'],
        probability: 0.3
      },
      {
        toState: StateType.LOST,
        condition: '價格無法接受',
        triggers: ['太貴', '負擔不起', '超出預算太多'],
        probability: 0.2
      }
    ],
    hiddenThoughts: [
      '怎麼這麼貴！',
      '老闆一定不會同意',
      '看能不能談到更低'
    ]
  },

  [StateType.NEGOTIATING]: {
    id: StateType.NEGOTIATING,
    name: '討價還價',
    description: '客戶試圖獲得更好的條件',
    behaviors: {
      openness: 6,
      patience: 6,
      trust: 5,
      defensiveness: 5
    },
    responsePatterns: [
      '如果我們買多一點有優惠嗎？',
      '競爭對手給我們更好的價格',
      '能不能分期付款？',
      '首次合作有什麼優惠？'
    ],
    transitions: [
      {
        toState: StateType.READY_TO_BUY,
        condition: '談判達成協議',
        triggers: ['可以', '成交', '同意', '就這樣'],
        probability: 0.6
      },
      {
        toState: StateType.INTERNAL_DISCUSSION,
        condition: '需要內部確認',
        triggers: ['確認', '討論', '請示', '考慮'],
        probability: 0.3
      },
      {
        toState: StateType.LOST,
        condition: '談判破裂',
        triggers: ['不行', '太堅持', '沒誠意'],
        probability: 0.1
      }
    ],
    hiddenThoughts: [
      '看能談到什麼程度',
      '不能顯得太急',
      '這個價格還可以接受'
    ]
  },

  [StateType.TECHNICAL_REVIEW]: {
    id: StateType.TECHNICAL_REVIEW,
    name: '技術評估',
    description: '深入了解技術細節和整合可能性',
    behaviors: {
      openness: 8,
      patience: 9,
      trust: 6,
      defensiveness: 2
    },
    responsePatterns: [
      '能否與我們現有系統整合？',
      '資料安全性如何保證？',
      'API 文檔可以先看看嗎？',
      '實施需要多長時間？'
    ],
    transitions: [
      {
        toState: StateType.READY_TO_BUY,
        condition: '技術滿足需求',
        triggers: ['沒問題', '可以', '符合', '滿意'],
        probability: 0.5
      },
      {
        toState: StateType.INTERNAL_DISCUSSION,
        condition: '需要技術團隊確認',
        triggers: ['工程師', 'IT', '技術團隊', '確認'],
        probability: 0.3
      },
      {
        toState: StateType.OBJECTION,
        condition: '發現技術障礙',
        triggers: ['不相容', '太複雜', '做不到', '困難'],
        probability: 0.2
      }
    ],
    hiddenThoughts: [
      '看起來技術上可行',
      '需要評估實施難度',
      '整合可能有些挑戰'
    ]
  },

  [StateType.INTERNAL_DISCUSSION]: {
    id: StateType.INTERNAL_DISCUSSION,
    name: '內部討論',
    description: '客戶需要內部協調和決策',
    behaviors: {
      openness: 5,
      patience: 7,
      trust: 6,
      defensiveness: 4
    },
    responsePatterns: [
      '我需要和團隊討論一下',
      '下週開會後再聯絡你',
      '我會把資料轉給相關同事',
      '需要一些時間內部評估'
    ],
    transitions: [
      {
        toState: StateType.READY_TO_BUY,
        condition: '內部同意採購',
        triggers: ['同意', '通過', '批准', '可以進行'],
        probability: 0.4
      },
      {
        toState: StateType.NEGOTIATING,
        condition: '內部要求更好條件',
        triggers: ['但是', '條件', '要求', '希望'],
        probability: 0.3
      },
      {
        toState: StateType.OBJECTION,
        condition: '內部有反對意見',
        triggers: ['反對', '不同意', '擔心', '問題'],
        probability: 0.2
      },
      {
        toState: StateType.LOST,
        condition: '內部決定不採購',
        triggers: ['決定不', '暫時不', '放棄'],
        probability: 0.1
      }
    ],
    hiddenThoughts: [
      '老闆會怎麼說呢',
      '財務應該會有意見',
      '希望能說服大家'
    ]
  },

  [StateType.READY_TO_BUY]: {
    id: StateType.READY_TO_BUY,
    name: '準備購買',
    description: '客戶已經決定購買，討論具體細節',
    behaviors: {
      openness: 9,
      patience: 8,
      trust: 8,
      defensiveness: 1
    },
    responsePatterns: [
      '接下來要怎麼進行？',
      '合約什麼時候可以準備好？',
      '付款方式有哪些選擇？',
      '什麼時候可以開始使用？'
    ],
    transitions: [
      {
        toState: StateType.CLOSING,
        condition: '進入成交流程',
        triggers: ['簽約', '付款', '開始', '合約'],
        probability: 0.8
      },
      {
        toState: StateType.OBJECTION,
        condition: '最後關頭的疑慮',
        triggers: ['等等', '再想想', '擔心', '不確定'],
        probability: 0.2
      }
    ],
    hiddenThoughts: [
      '希望這個決定是對的',
      '期待看到成效',
      '終於要解決這個問題了'
    ]
  },

  [StateType.OBJECTION]: {
    id: StateType.OBJECTION,
    name: '提出異議',
    description: '客戶有具體的反對理由或擔憂',
    behaviors: {
      openness: 3,
      patience: 4,
      trust: 3,
      defensiveness: 9
    },
    responsePatterns: [
      '我們擔心實施會很困難',
      '之前的供應商也這麼說，但是...',
      '這個對我們來說風險太大',
      '我不認為這能解決我們的問題'
    ],
    transitions: [
      {
        toState: StateType.INTERESTED,
        condition: '異議被成功處理',
        triggers: ['原來如此', '這樣的話', '明白了', '有道理'],
        probability: 0.4
      },
      {
        toState: StateType.SKEPTICAL,
        condition: '仍有疑慮',
        triggers: ['還是', '但是', '不太相信', '再看看'],
        probability: 0.3
      },
      {
        toState: StateType.LOST,
        condition: '堅持反對',
        triggers: ['不行', '不要', '沒辦法', '謝謝再聯絡'],
        probability: 0.3
      }
    ],
    hiddenThoughts: [
      '這個風險太大了',
      '他們能理解我的擔憂嗎',
      '可能不是好時機'
    ]
  },

  [StateType.CLOSING]: {
    id: StateType.CLOSING,
    name: '成交階段',
    description: '正在完成交易的最後步驟',
    behaviors: {
      openness: 8,
      patience: 9,
      trust: 9,
      defensiveness: 2
    },
    responsePatterns: [
      '請把合約發給我',
      '我們的採購流程需要這些文件',
      '開始實施的時間表是？',
      '培訓計畫是怎樣的？'
    ],
    transitions: [
      {
        toState: StateType.WON,
        condition: '成功成交',
        triggers: ['簽了', '完成', '付款', '成交'],
        probability: 0.9
      },
      {
        toState: StateType.OBJECTION,
        condition: '最後一刻的問題',
        triggers: ['等等', '問題', '修改', '擔心'],
        probability: 0.1
      }
    ],
    hiddenThoughts: [
      '希望一切順利',
      '期待合作愉快',
      '這應該是正確的決定'
    ]
  },

  [StateType.LOST]: {
    id: StateType.LOST,
    name: '失去興趣',
    description: '客戶決定不繼續，交易失敗',
    behaviors: {
      openness: 1,
      patience: 2,
      trust: 2,
      defensiveness: 10
    },
    responsePatterns: [
      '謝謝，我們暫時不需要',
      '以後有需要再聯絡你',
      '我們決定維持現狀',
      '不適合我們'
    ],
    transitions: [],  // 終止狀態，沒有轉換
    hiddenThoughts: [
      '終於結束了',
      '浪費時間',
      '還是不要改變好了'
    ]
  },

  [StateType.WON]: {
    id: StateType.WON,
    name: '成功成交',
    description: '交易成功完成',
    behaviors: {
      openness: 10,
      patience: 10,
      trust: 10,
      defensiveness: 0
    },
    responsePatterns: [
      '很高興合作',
      '期待開始使用',
      '謝謝你的協助',
      '希望能達到預期效果'
    ],
    transitions: [],  // 終止狀態，沒有轉換
    hiddenThoughts: [
      '希望這是個好決定',
      '期待看到成果',
      '團隊應該會很高興'
    ]
  }
};

/**
 * 狀態機管理器類別
 */
export class StateManager {
  private currentState: StateType;
  private stateHistory: Array<{
    state: StateType;
    timestamp: Date;
    reason?: string;
  }> = [];
  private emotionalMetrics = {
    trust: 5,
    interest: 5,
    frustration: 0,
    excitement: 0
  };

  constructor(initialState: StateType = StateType.INITIAL) {
    this.currentState = initialState;
    this.recordStateChange(initialState, '對話開始');
  }

  /**
   * 獲取當前狀態
   */
  getState(): StateType {
    return this.currentState;
  }

  /**
   * 獲取當前狀態詳細資訊
   */
  getCurrentStateInfo(): CustomerState {
    return CUSTOMER_STATES[this.currentState];
  }

  /**
   * 獲取情緒指標
   */
  getEmotionalMetrics() {
    return { ...this.emotionalMetrics };
  }

  /**
   * 獲取狀態歷史
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * 檢查是否可以轉換到指定狀態
   */
  canTransitionTo(targetState: StateType): boolean {
    const currentStateInfo = this.getCurrentStateInfo();
    return currentStateInfo.transitions.some(t => t.toState === targetState);
  }

  /**
   * 執行狀態轉換
   */
  transitionTo(newState: StateType, reason: string): boolean {
    if (!this.canTransitionTo(newState)) {
      console.warn(`無法從 ${this.currentState} 轉換到 ${newState}`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;
    this.recordStateChange(newState, reason);
    this.updateEmotionalMetrics(oldState, newState);
    
    return true;
  }

  /**
   * 根據觸發詞分析可能的狀態轉換
   */
  analyzePossibleTransitions(userInput: string): StateTransition[] {
    const currentStateInfo = this.getCurrentStateInfo();
    const possibleTransitions: StateTransition[] = [];

    for (const transition of currentStateInfo.transitions) {
      const hasMatchingTrigger = transition.triggers.some(trigger => 
        userInput.toLowerCase().includes(trigger.toLowerCase())
      );
      
      if (hasMatchingTrigger) {
        possibleTransitions.push(transition);
      }
    }

    // 按機率排序
    return possibleTransitions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * 更新情緒指標
   */
  private updateEmotionalMetrics(oldState: StateType, newState: StateType) {
    const newStateInfo = CUSTOMER_STATES[newState];
    
    // 根據狀態轉換調整情緒
    if (this.isPositiveTransition(oldState, newState)) {
      this.emotionalMetrics.trust = Math.min(10, this.emotionalMetrics.trust + 1);
      this.emotionalMetrics.interest = Math.min(10, this.emotionalMetrics.interest + 1);
      this.emotionalMetrics.excitement = Math.min(10, this.emotionalMetrics.excitement + 1);
      this.emotionalMetrics.frustration = Math.max(0, this.emotionalMetrics.frustration - 1);
    } else if (this.isNegativeTransition(oldState, newState)) {
      this.emotionalMetrics.trust = Math.max(0, this.emotionalMetrics.trust - 1);
      this.emotionalMetrics.interest = Math.max(0, this.emotionalMetrics.interest - 1);
      this.emotionalMetrics.frustration = Math.min(10, this.emotionalMetrics.frustration + 1);
      this.emotionalMetrics.excitement = Math.max(0, this.emotionalMetrics.excitement - 1);
    }

    // 同步行為指標
    this.emotionalMetrics.trust = Math.round(
      (this.emotionalMetrics.trust + newStateInfo.behaviors.trust) / 2
    );
  }

  /**
   * 判斷是否為正向轉換
   */
  private isPositiveTransition(oldState: StateType, newState: StateType): boolean {
    const positiveTransitions = [
      [StateType.INITIAL, StateType.INTERESTED],
      [StateType.INTERESTED, StateType.TECHNICAL_REVIEW],
      [StateType.SKEPTICAL, StateType.INTERESTED],
      [StateType.PRICE_SHOCK, StateType.NEGOTIATING],
      [StateType.NEGOTIATING, StateType.READY_TO_BUY],
      [StateType.TECHNICAL_REVIEW, StateType.READY_TO_BUY],
      [StateType.READY_TO_BUY, StateType.CLOSING],
      [StateType.CLOSING, StateType.WON]
    ];

    return positiveTransitions.some(
      ([from, to]) => from === oldState && to === newState
    );
  }

  /**
   * 判斷是否為負向轉換
   */
  private isNegativeTransition(oldState: StateType, newState: StateType): boolean {
    return newState === StateType.LOST || 
           newState === StateType.OBJECTION ||
           (oldState === StateType.INTERESTED && newState === StateType.SKEPTICAL);
  }

  /**
   * 記錄狀態變更
   */
  private recordStateChange(state: StateType, reason: string) {
    this.stateHistory.push({
      state,
      timestamp: new Date(),
      reason
    });
  }

  /**
   * 重置狀態機
   */
  reset(initialState: StateType = StateType.INITIAL) {
    this.currentState = initialState;
    this.stateHistory = [];
    this.emotionalMetrics = {
      trust: 5,
      interest: 5,
      frustration: 0,
      excitement: 0
    };
    this.recordStateChange(initialState, '對話重新開始');
  }

  /**
   * 獲取建議的回應策略
   */
  getSuggestedStrategy(): string {
    const stateInfo = this.getCurrentStateInfo();
    const metrics = this.getEmotionalMetrics();

    // 根據當前狀態和情緒指標提供策略建議
    if (metrics.frustration > 7) {
      return '客戶情緒不佳，建議：緩和氣氛，展現理解，避免強勢推銷';
    }

    if (metrics.trust < 3) {
      return '信任度偏低，建議：提供案例證明，展現專業，建立信任';
    }

    if (metrics.interest > 7) {
      return '客戶興趣高，建議：把握機會深入介紹，引導至下一步';
    }

    // 狀態特定策略
    switch (this.currentState) {
      case StateType.INITIAL:
        return '建立關係，了解需求，避免急於推銷';
      case StateType.INTERESTED:
        return '深入了解痛點，展示價值，建立信任';
      case StateType.SKEPTICAL:
        return '提供證據和案例，耐心解釋，消除疑慮';
      case StateType.PRICE_SHOCK:
        return '強調價值和投資回報，提供彈性方案';
      case StateType.NEGOTIATING:
        return '保持彈性但有原則，創造雙贏局面';
      case StateType.TECHNICAL_REVIEW:
        return '提供詳細技術資訊，展現專業能力';
      case StateType.READY_TO_BUY:
        return '簡化流程，消除最後疑慮，促成成交';
      case StateType.OBJECTION:
        return '傾聽理解，針對性回應，不要爭辯';
      case StateType.CLOSING:
        return '確保流程順暢，提供支援，維持熱情';
      default:
        return '保持專業，了解客戶需求';
    }
  }
}