/**
 * 業務人員導入器
 * 處理舊系統業務人員資料的批量導入
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseDb } from '@/services/firebase/config';
import { LegacyUser, ImportError, ImportWarning } from '@/types/legacy-import';
import { User } from '@/types/entities/user';
import { mapLegacyUser } from './mapper';
import { resolveBusinessIdentifier } from './codeMapper';

export interface UserImportOptions {
  organizationId: string;
  teamId: string;
  skipExisting?: boolean;
  updateExisting?: boolean;
  defaultPassword?: string;
  onProgress?: (progress: UserImportProgress) => void;
  codeToName?: Map<string, string>;
  nameToCode?: Map<string, string>;
  codeToLevel?: Map<string, string>;
  supervisorMap?: Map<string, string[]>;
}

export interface UserImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentUser?: string;
  phase: 'preparing' | 'importing' | 'linking' | 'completed';
}

export interface UserImportResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  userMappings: Map<string, string>; // 業務帳號 -> userId 映射
  duration: number;
}

const DEFAULT_PASSWORD = 'DonnaAI2024!';

/**
 * 批量導入業務人員
 */
export async function importLegacyUsers(
  users: LegacyUser[],
  options: UserImportOptions
): Promise<UserImportResult> {
  const startTime = Date.now();
  const {
    organizationId,
    teamId,
    skipExisting = true,
    updateExisting = false,
    defaultPassword = DEFAULT_PASSWORD,
    onProgress,
    codeToName,
    nameToCode,
    codeToLevel,
    supervisorMap,
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const userMappings = new Map<string, string>();
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // 初始化進度
  const progress: UserImportProgress = {
    total: users.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    phase: 'preparing',
  };
  onProgress?.(progress);

  try {
    // 第一階段：準備和驗證
    progress.phase = 'preparing';
    onProgress?.(progress);

    // 檢查現有用戶
    const existingUsers = await getExistingUsers(organizationId);

    // 準備要建立的用戶清單
    const usersToCreate = [];
    const usersToUpdate = [];

    // 第二階段：準備用戶資料
    progress.phase = 'importing';
    onProgress?.(progress);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const row = i + 1;
      
      // 解析業務身份
      let businessName = user.業務帳號;
      let businessCode = '';
      
      if (codeToName && nameToCode && codeToLevel) {
        const identification = resolveBusinessIdentifier(
          user.業務帳號,
          codeToName,
          nameToCode,
          codeToLevel
        );
        
        businessName = identification.name || user.業務帳號;
        businessCode = identification.code;
        
        if (!identification.found) {
          warnings.push({
            type: 'users',
            row,
            field: '業務帳號',
            message: `找不到業務代碼對照: ${user.業務帳號}`,
            suggestion: '將使用原始輸入作為姓名',
          });
        }
      }

      // 檢查 Email
      if (!user.公司Gmail帳號) {
        errors.push({
          type: 'users',
          row,
          field: '公司Gmail帳號',
          message: '缺少電子郵件地址',
          data: user,
        });
        failureCount++;
        continue;
      }

      // 檢查是否已存在
      const existingUserId = existingUsers.get(user.公司Gmail帳號.toLowerCase());
      
      if (existingUserId) {
        if (skipExisting && !updateExisting) {
          warnings.push({
            type: 'users',
            row,
            field: '公司Gmail帳號',
            message: `用戶已存在: ${user.公司Gmail帳號}`,
            suggestion: '已跳過',
          });
          userMappings.set(user.業務帳號, existingUserId);
          skippedCount++;
          continue;
        } else if (updateExisting) {
          // 加入更新清單
          usersToUpdate.push({
            userId: existingUserId,
            user,
            businessName,
            businessCode,
            row,
          });
          continue;
        }
      }

      // 映射用戶資料
      const mappedUser = mapLegacyUser(
        user,
        organizationId,
        teamId,
        businessName,
        businessCode
      );

      // 加入建立清單
      usersToCreate.push({
        email: user.公司Gmail帳號!,
        name: mappedUser.name || businessName,
        businessName: businessName,
        businessCode: businessCode,
        role: mappedUser.role || 'salesperson',
        department: mappedUser.department || null,
        phone: mappedUser.phone || null,
        isActive: mappedUser.isActive !== false,
        supervisorId: null,
        customFields: (mappedUser as any).customFields || {},
        originalBusinessId: user.業務帳號,
        row,
      });
    }

    // 批量建立用戶（使用 Cloud Function）
    if (usersToCreate.length > 0) {
      progress.currentUser = '批量建立用戶...';
      onProgress?.(progress);

      const functions = getFunctions(undefined, 'asia-east1');
      const createUsersForImport = httpsCallable(functions, 'createUsersForImport');
      
      // 分批處理，每批 50 個
      const batchSize = 50;
      for (let i = 0; i < usersToCreate.length; i += batchSize) {
        const batch = usersToCreate.slice(i, Math.min(i + batchSize, usersToCreate.length));
        
        try {
          const result = await createUsersForImport({
            users: batch,
            organizationId,
            teamId,
            defaultPassword,
          });

          const response = result.data as any;
          
          if (response.success) {
            // 處理成功的用戶
            response.results?.forEach((userResult: any, index: number) => {
              const originalData = batch[index];
              if (userResult.success) {
                userMappings.set(originalData.originalBusinessId, userResult.uid);
                successCount++;
              } else {
                failureCount++;
                errors.push({
                  type: 'users',
                  row: originalData.row,
                  field: 'general',
                  message: userResult.error || '創建用戶失敗',
                  data: originalData,
                });
              }
            });
          } else {
            // 整批失敗
            batch.forEach(userData => {
              failureCount++;
              errors.push({
                type: 'users',
                row: userData.row,
                field: 'general',
                message: '批量建立失敗',
                data: userData,
              });
            });
          }
        } catch (error) {
          // 批量建立失敗
          batch.forEach(userData => {
            failureCount++;
            errors.push({
              type: 'users',
              row: userData.row,
              field: 'general',
              message: error instanceof Error ? error.message : '未知錯誤',
              data: userData,
            });
          });
        }

        // 更新進度
        progress.processed = Math.min(i + batchSize, usersToCreate.length);
        progress.succeeded = successCount;
        progress.failed = failureCount;
        progress.skipped = skippedCount;
        onProgress?.(progress);
      }
    }

    // 處理更新的用戶
    for (const updateData of usersToUpdate) {
      const success = await updateExistingUser(
        updateData.userId,
        updateData.user,
        organizationId,
        teamId,
        updateData.businessName,
        updateData.businessCode
      );
      
      if (success) {
        userMappings.set(updateData.user.業務帳號, updateData.userId);
        successCount++;
      } else {
        failureCount++;
        errors.push({
          type: 'users',
          row: updateData.row,
          field: 'general',
          message: '更新用戶失敗',
          data: updateData.user,
        });
      }
      
      progress.processed++;
      progress.succeeded = successCount;
      progress.failed = failureCount;
      onProgress?.(progress);
    }

    // 第三階段：建立主管關係
    if (supervisorMap && supervisorMap.size > 0) {
      progress.phase = 'linking';
      progress.currentUser = '建立主管關係';
      onProgress?.(progress);

      await linkSupervisorRelationships(userMappings, supervisorMap, codeToName);
    }

    // 完成
    progress.phase = 'completed';
    progress.currentUser = undefined;
    onProgress?.(progress);

    return {
      totalProcessed: users.length,
      successCount,
      failureCount,
      skippedCount,
      errors,
      warnings,
      userMappings,
      duration: Date.now() - startTime,
    };

  } catch (error) {
    console.error('批量導入用戶失敗:', error);
    throw new Error(`批量導入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 獲取現有用戶映射
 */
async function getExistingUsers(organizationId: string): Promise<Map<string, string>> {
  const db = getFirebaseDb();
  const existingMap = new Map<string, string>();

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {
      const data = doc.data() as User;
      if (data.email) {
        existingMap.set(data.email.toLowerCase(), doc.id);
      }
    });
  } catch (error) {
    console.error('獲取現有用戶失敗:', error);
  }

  return existingMap;
}


/**
 * 更新現有用戶
 */
async function updateExistingUser(
  userId: string,
  legacyUser: LegacyUser,
  organizationId: string,
  teamId: string,
  businessName: string,
  businessCode: string
): Promise<boolean> {
  const db = getFirebaseDb();

  try {
    const userRef = doc(db, 'users', userId);
    
    // 映射用戶資料
    const mappedUser = mapLegacyUser(
      legacyUser,
      organizationId,
      teamId,
      businessName,
      businessCode
    );

    // 更新資料（保留某些現有欄位）
    const updateData: Partial<User> = {
      name: mappedUser.name || businessName,
      phone: mappedUser.phone || undefined,
      updatedAt: Timestamp.now() as any,
    };

    // 添加到團隊（如果還不在團隊中）
    const currentUser = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
    if (!currentUser.empty) {
      const userData = currentUser.docs[0].data() as User;
      const teamIds = userData.teamIds || [];
      if (!teamIds.includes(teamId)) {
        updateData.teamIds = [...teamIds, teamId];
      }
    }

    // 合併自定義欄位
    if ((mappedUser as any).customFields) {
      updateData.customFields = {
        ...(currentUser.docs[0]?.data()?.customFields || {}),
        ...(mappedUser as any).customFields,
      };
    }

    await setDoc(userRef, updateData, { merge: true });
    return true;

  } catch (error) {
    console.error('更新用戶失敗:', error);
    return false;
  }
}

/**
 * 建立主管關係
 */
async function linkSupervisorRelationships(
  userMappings: Map<string, string>,
  supervisorMap: Map<string, string[]>,
  codeToName?: Map<string, string>
): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  let updateCount = 0;

  try {
    supervisorMap.forEach((supervisorCodes, subordinateCode) => {
      // 找出下屬的 userId
      let subordinateUserId: string | undefined;
      
      // 嘗試用代碼找
      const subordinateName = codeToName?.get(subordinateCode);
      if (subordinateName) {
        subordinateUserId = userMappings.get(subordinateName);
      }
      
      // 如果找不到，嘗試直接用代碼
      if (!subordinateUserId) {
        subordinateUserId = userMappings.get(subordinateCode);
      }

      if (subordinateUserId && supervisorCodes.length > 0) {
        // 找出主管的 userId（取第一個主管）
        let supervisorUserId: string | undefined;
        
        for (const supCode of supervisorCodes) {
          const supervisorName = codeToName?.get(supCode);
          if (supervisorName) {
            supervisorUserId = userMappings.get(supervisorName);
            if (supervisorUserId) break;
          }
        }

        if (supervisorUserId) {
          const userRef = doc(db, 'users', subordinateUserId);
          batch.update(userRef, {
            supervisorId: supervisorUserId,
            updatedAt: Timestamp.now(),
          });
          updateCount++;
        }
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`已建立 ${updateCount} 個主管關係`);
    }

  } catch (error) {
    console.error('建立主管關係失敗:', error);
  }
}

/**
 * 生成用戶導入報告
 */
export function generateUserImportReport(result: UserImportResult): string {
  const report: string[] = [
    '=== 業務人員導入報告 ===',
    `導入時間: ${new Date().toLocaleString()}`,
    `處理時長: ${(result.duration / 1000).toFixed(2)} 秒`,
    '',
    '統計結果:',
    `- 總處理數: ${result.totalProcessed}`,
    `- 成功導入: ${result.successCount}`,
    `- 導入失敗: ${result.failureCount}`,
    `- 跳過記錄: ${result.skippedCount}`,
    `- 成功率: ${((result.successCount / result.totalProcessed) * 100).toFixed(1)}%`,
    '',
  ];

  if (result.warnings.length > 0) {
    report.push('警告訊息:');
    const warningTypes = result.warnings.reduce((acc, warning) => {
      acc[warning.message] = (acc[warning.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(warningTypes).forEach(([message, count]) => {
      report.push(`- ${message}: ${count} 筆`);
    });
    report.push('');
  }

  if (result.errors.length > 0) {
    report.push('錯誤統計:');
    const errorTypes = result.errors.reduce((acc, error) => {
      const key = error.message.split(':')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorTypes).forEach(([type, count]) => {
      report.push(`- ${type}: ${count} 筆`);
    });

    if (result.errors.length <= 10) {
      report.push('');
      report.push('錯誤詳情（前 10 筆）:');
      result.errors.slice(0, 10).forEach((error, index) => {
        report.push(`${index + 1}. 第 ${error.row} 行: ${error.message}`);
      });
    }
  }

  report.push('');
  report.push('建議事項:');
  report.push('- 請通知成功導入的用戶其預設密碼');
  report.push('- 建議用戶首次登入後立即更改密碼');
  if (result.failureCount > 0) {
    report.push('- 請檢查失敗記錄的 Email 格式是否正確');
  }

  return report.join('\n');
}