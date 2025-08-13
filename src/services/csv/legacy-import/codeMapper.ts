/**
 * 業務代碼對照服務
 * 處理業務代碼和姓名之間的雙向映射
 */

import { BusinessCodeMapping, BusinessIdentification } from '@/types/legacy-import';

/**
 * 建立業務代碼映射表
 * 從代碼對照資料建立雙向查詢的 Map 結構
 */
export function buildCodeMappings(mappingData: BusinessCodeMapping[]): {
  codeToName: Map<string, string>;
  nameToCode: Map<string, string>;
  codeToLevel: Map<string, string>;
  supervisorMap: Map<string, string[]>;
} {
  const codeToName = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  const codeToLevel = new Map<string, string>();
  const supervisorMap = new Map<string, string[]>();

  mappingData.forEach(mapping => {
    // 建立代碼到姓名的映射
    const normalizedCode = normalizeBusinessCode(mapping.顧問代碼);
    codeToName.set(normalizedCode, mapping.業務名稱);
    
    // 建立姓名到代碼的映射
    nameToCode.set(mapping.業務名稱, normalizedCode);
    
    // 建立代碼到職級的映射
    codeToLevel.set(normalizedCode, mapping.職級);
    
    // 處理主管清單
    if (mapping.主管清單) {
      const supervisorCodes = mapping.主管清單
        .split(/[,，]/) // 支援中英文逗號
        .map(code => normalizeBusinessCode(code.trim()))
        .filter(code => code.length > 0);
      
      if (supervisorCodes.length > 0) {
        supervisorMap.set(normalizedCode, supervisorCodes);
      }
    }
  });

  return {
    codeToName,
    nameToCode,
    codeToLevel,
    supervisorMap };
}

/**
 * 智能解析業務識別符
 * 自動判斷輸入是代碼還是姓名，並返回標準化的結果
 */
export function resolveBusinessIdentifier(
  input: string,
  codeToName: Map<string, string>,
  nameToCode: Map<string, string>,
  codeToLevel: Map<string, string>
): BusinessIdentification {
  // 清理輸入
  const cleanInput = input.trim();
  
  // 空值處理
  if (!cleanInput) {
    return {
      name: '',
      code: '',
      found: false,
      source: 'manual' };
  }

  // 嘗試作為代碼查找
  const normalizedCode = normalizeBusinessCode(cleanInput);
  if (codeToName.has(normalizedCode)) {
    return {
      name: codeToName.get(normalizedCode)!,
      code: normalizedCode,
      level: codeToLevel.get(normalizedCode),
      found: true,
      source: 'code' };
  }

  // 嘗試作為姓名查找
  if (nameToCode.has(cleanInput)) {
    const code = nameToCode.get(cleanInput)!;
    return {
      name: cleanInput,
      code,
      level: codeToLevel.get(code),
      found: true,
      source: 'name' };
  }

  // 嘗試模糊匹配姓名（忽略大小寫）
  for (const [name, code] of nameToCode.entries()) {
    if (name.toLowerCase() === cleanInput.toLowerCase()) {
      return {
        name,
        code,
        level: codeToLevel.get(code),
        found: true,
        source: 'name' };
    }
  }

  // 找不到對應資料，返回原始輸入
  // 如果看起來像代碼（純數字），保留在代碼欄位
  const isLikelyCode = /^\d+$/.test(cleanInput);
  
  return {
    name: isLikelyCode ? '' : cleanInput,
    code: isLikelyCode ? normalizedCode : '',
    found: false,
    source: 'manual' };
}

/**
 * 正規化業務代碼
 * 移除前導零，確保一致性
 */
export function normalizeBusinessCode(code: string): string {
  if (!code) return '';
  
  // 移除所有空白字符
  const trimmed = code.trim();
  
  // 如果是純數字，移除前導零
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10).toString();
  }
  
  // 非純數字代碼，直接返回
  return trimmed;
}

/**
 * 獲取業務人員的完整層級資訊
 * 包含主管資訊
 */
export function getBusinessHierarchy(
  code: string,
  supervisorMap: Map<string, string[]>,
  codeToName: Map<string, string>
): {
  supervisors: Array<{ code: string; name: string }>;
  subordinates: Array<{ code: string; name: string }>;
} {
  const normalizedCode = normalizeBusinessCode(code);
  const supervisors: Array<{ code: string; name: string }> = [];
  const subordinates: Array<{ code: string; name: string }> = [];

  // 獲取主管
  const supervisorCodes = supervisorMap.get(normalizedCode) || [];
  supervisorCodes.forEach(supCode => {
    const name = codeToName.get(supCode);
    if (name) {
      supervisors.push({ code: supCode, name });
    }
  });

  // 獲取下屬
  supervisorMap.forEach((supCodes, subCode) => {
    if (supCodes.includes(normalizedCode)) {
      const name = codeToName.get(subCode);
      if (name) {
        subordinates.push({ code: subCode, name });
      }
    }
  });

  return { supervisors, subordinates };
}

/**
 * 批量解析業務識別符
 * 處理大量資料時的優化版本
 */
export function batchResolveBusinessIdentifiers(
  inputs: string[],
  codeToName: Map<string, string>,
  nameToCode: Map<string, string>,
  codeToLevel: Map<string, string>
): BusinessIdentification[] {
  return inputs.map(input => 
    resolveBusinessIdentifier(input, codeToName, nameToCode, codeToLevel)
  );
}

/**
 * 驗證代碼映射的完整性
 * 檢查是否有循環引用或缺失的主管
 */
export function validateCodeMappings(
  mappingData: BusinessCodeMapping[],
  supervisorMap: Map<string, string[]>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allCodes = new Set(mappingData.map(m => normalizeBusinessCode(m.顧問代碼)));

  // 檢查主管代碼是否存在
  supervisorMap.forEach((supervisorCodes, code) => {
    supervisorCodes.forEach(supCode => {
      if (!allCodes.has(supCode)) {
        warnings.push(`業務代碼 ${code} 的主管代碼 ${supCode} 不存在於對照表中`);
      }
    });
  });

  // 檢查循環引用
  const checkCycles = (code: string, visited: Set<string>, path: string[]): boolean => {
    if (visited.has(code)) {
      if (path.includes(code)) {
        errors.push(`發現循環主管關係: ${path.join(' -> ')} -> ${code}`);
        return true;
      }
      return false;
    }

    visited.add(code);
    path.push(code);

    const supervisors = supervisorMap.get(code) || [];
    for (const supCode of supervisors) {
      if (checkCycles(supCode, visited, [...path])) {
        return true;
      }
    }

    return false;
  };

  // 檢查每個代碼的循環引用
  allCodes.forEach(code => {
    checkCycles(code, new Set(), []);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings };
}

/**
 * 產生代碼映射報告
 * 用於驗證和除錯
 */
export function generateMappingReport(
  mappingData: BusinessCodeMapping[],
  codeToName: Map<string, string>,
  nameToCode: Map<string, string>,
  supervisorMap: Map<string, string[]>
): string {
  const report: string[] = [
    '=== 業務代碼對照報告 ===',
    `總筆數: ${mappingData.length}`,
    '',
    '職級分布:',
  ];

  // 統計職級分布
  const levelCount = new Map<string, number>();
  mappingData.forEach(m => {
    const count = levelCount.get(m.職級) || 0;
    levelCount.set(m.職級, count + 1);
  });

  Array.from(levelCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([level, count]) => {
      report.push(`  ${level}: ${count} 人`);
    });

  // 統計主管關係
  let totalSupervisors = 0;
  let maxSubordinates = 0;
  let maxSubordinatesName = '';

  supervisorMap.forEach((_, code) => {
    totalSupervisors++;
    const subordinates = Array.from(supervisorMap.entries())
      .filter(([_, sups]) => sups.includes(code)).length;
    
    if (subordinates > maxSubordinates) {
      maxSubordinates = subordinates;
      maxSubordinatesName = codeToName.get(code) || code;
    }
  });

  report.push('');
  report.push('組織結構統計:');
  report.push(`  有主管的人數: ${totalSupervisors}`);
  report.push(`  最多下屬的主管: ${maxSubordinatesName} (${maxSubordinates} 人)`);

  // 檢查資料品質
  const validation = validateCodeMappings(mappingData, supervisorMap);
  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    report.push('');
    report.push('資料品質問題:');
    validation.errors.forEach(error => report.push(`  錯誤: ${error}`));
    validation.warnings.forEach(warning => report.push(`  警告: ${warning}`));
  }

  return report.join('\n');
}