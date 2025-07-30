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
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
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
    const auth = getAuth();

    // 第二階段：導入用戶
    progress.phase = 'importing';
    onProgress?.(progress);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const row = i + 1;
      progress.currentUser = user.業務帳號;
      
      try {
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
            // 更新現有用戶
            const success = await updateExistingUser(
              existingUserId,
              user,
              organizationId,
              teamId,
              businessName,
              businessCode
            );
            
            if (success) {
              userMappings.set(user.業務帳號, existingUserId);
              successCount++;
            } else {
              failureCount++;
              errors.push({
                type: 'users',
                row,
                field: 'general',
                message: '更新用戶失敗',
                data: user,
              });
            }
            continue;
          }
        }

        // 創建新用戶
        const userId = await createNewUser(
          user,
          organizationId,
          teamId,
          defaultPassword,
          businessName,
          businessCode
        );
        
        if (userId) {
          userMappings.set(user.業務帳號, userId);
          successCount++;
        } else {
          failureCount++;
          errors.push({
            type: 'users',
            row,
            field: 'general',
            message: '創建用戶失敗',
            data: user,
          });
        }

      } catch (error) {
        failureCount++;
        errors.push({
          type: 'users',
          row,
          field: 'general',
          message: error instanceof Error ? error.message : '未知錯誤',
          data: user,
        });
      }

      // 更新進度
      progress.processed++;
      progress.succeeded = successCount;
      progress.failed = failureCount;
      progress.skipped = skippedCount;
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
 * 創建新用戶
 */
async function createNewUser(
  legacyUser: LegacyUser,
  organizationId: string,
  teamId: string,
  password: string,
  businessName: string,
  businessCode: string
): Promise<string | null> {
  const auth = getAuth();
  const db = getFirebaseDb();

  try {
    // 檢查 Auth 中是否已存在
    const signInMethods = await fetchSignInMethodsForEmail(auth, legacyUser.公司Gmail帳號!);
    
    let uid: string;
    
    if (signInMethods.length > 0) {
      // Auth 帳戶已存在，但 Firestore 中沒有，可能是之前導入失敗
      // 獲取現有 Auth 用戶的 UID（需要管理員權限）
      console.warn(`Auth 帳戶已存在但 Firestore 中沒有: ${legacyUser.公司Gmail帳號}`);
      return null; // 暫時跳過，需要管理員工具處理
    } else {
      // 創建新的 Auth 帳戶
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        legacyUser.公司Gmail帳號!,
        password
      );
      uid = userCredential.user.uid;
    }

    // 映射用戶資料
    const mappedUser = mapLegacyUser(
      legacyUser,
      organizationId,
      teamId,
      businessName,
      businessCode
    );

    // 創建 Firestore 文檔
    const userData: User = {
      id: uid,
      uid,
      email: legacyUser.公司Gmail帳號!,
      name: mappedUser.name || businessName,
      role: mappedUser.role || 'salesperson',
      organizationId,
      teamIds: [teamId],
      department: mappedUser.department || null,
      phone: mappedUser.phone || null,
      isActive: mappedUser.isActive !== false,
      createdAt: new Date(),
      lastLoginAt: null,
      supervisorId: null,
      personalGoals: {},
      ...((mappedUser as any).customFields ? { customFields: (mappedUser as any).customFields } : {}),
    };

    await setDoc(doc(db, 'users', uid), userData);

    return uid;

  } catch (error) {
    console.error('創建用戶失敗:', error);
    
    // 處理特定錯誤
    if (error instanceof Error) {
      if (error.message.includes('auth/email-already-in-use')) {
        console.warn('Email 已被使用:', legacyUser.公司Gmail帳號);
      } else if (error.message.includes('auth/invalid-email')) {
        console.error('無效的 Email 格式:', legacyUser.公司Gmail帳號);
      } else if (error.message.includes('auth/weak-password')) {
        console.error('密碼太弱');
      }
    }
    
    return null;
  }
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