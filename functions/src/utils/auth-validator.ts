/**
 * 認證驗證工具
 * 驗證 Cloud Functions 的用戶身份
 */

import { CallableRequest } from "firebase-functions/v2/https";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * 驗證用戶認證
 * @param request Cloud Function 請求
 * @returns 用戶 ID
 * @throws HttpsError 如果未認證
 */
export async function validateAuth(request: CallableRequest): Promise<string> {
  // 檢查是否有認證資訊
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "必須登入才能使用此功能"
    );
  }

  // 取得用戶 ID
  const userId = request.auth.uid;
  if (!userId) {
    throw new HttpsError(
      "unauthenticated",
      "無效的認證資訊"
    );
  }

  // 可以在這裡加入額外的驗證邏輯
  // 例如：檢查用戶是否被停用、是否有特定權限等

  return userId;
}

/**
 * 驗證用戶是否有特定角色
 * @param request Cloud Function 請求
 * @param requiredRole 必要的角色
 * @returns 用戶 ID
 * @throws HttpsError 如果沒有權限
 */
export async function validateRole(
  request: CallableRequest,
  requiredRole: string
): Promise<string> {
  const userId = await validateAuth(request);

  // 檢查自訂聲明中的角色
  const role = request.auth?.token?.role;
  if (!role || role !== requiredRole) {
    throw new HttpsError(
      "permission-denied",
      `需要 ${requiredRole} 權限才能執行此操作`
    );
  }

  return userId;
}

/**
 * 驗證用戶是否屬於特定組織
 * @param request Cloud Function 請求
 * @param organizationId 組織 ID
 * @returns 用戶 ID
 * @throws HttpsError 如果不屬於該組織
 */
export async function validateOrganization(
  request: CallableRequest,
  organizationId: string
): Promise<string> {
  const userId = await validateAuth(request);

  // 檢查自訂聲明中的組織 ID
  const userOrgId = request.auth?.token?.organizationId;
  if (!userOrgId || userOrgId !== organizationId) {
    throw new HttpsError(
      "permission-denied",
      "您沒有權限存取此組織的資源"
    );
  }

  return userId;
}