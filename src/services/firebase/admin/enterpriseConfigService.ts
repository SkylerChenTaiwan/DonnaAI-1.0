/**
 * 企業配置服務
 * 管理企業的工具、功能和設定
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { EnterpriseConfig, ToolConfig } from '@/types/admin';

/**
 * 獲取企業配置
 */
export const getEnterpriseConfig = async (orgId: string): Promise<EnterpriseConfig | null> => {
  try {
    const db = getFirebaseDb();
    const configsRef = collection(db, 'enterprise_configs');
    const q = query(configsRef, where('organizationId', '==', orgId));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as EnterpriseConfig;
  } catch (error) {
    console.error('獲取企業配置失敗:', error);
    throw error;
  }
};

/**
 * 更新企業配置
 */
export const updateEnterpriseConfig = async (
  configId: string,
  updates: Partial<EnterpriseConfig>
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, 'enterprise_configs', configId);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // 移除不應更新的欄位
    delete updateData.id;
    delete updateData.organizationId;
    delete updateData.createdAt;

    await updateDoc(configRef, updateData);
  } catch (error) {
    console.error('更新企業配置失敗:', error);
    throw error;
  }
};

/**
 * 啟用/停用工具
 */
export const toggleTool = async (
  configId: string,
  toolId: string,
  enabled: boolean
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, 'enterprise_configs', configId);
    
    const configDoc = await getDoc(configRef);
    if (!configDoc.exists()) {
      throw new Error('企業配置不存在');
    }

    const config = configDoc.data() as EnterpriseConfig;
    const tools = config.enabledTools || [];
    
    // 更新工具狀態
    const updatedTools = tools.map(tool => 
      tool.id === toolId ? { ...tool, enabled } : tool
    );

    await updateDoc(configRef, {
      enabledTools: updatedTools,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('切換工具狀態失敗:', error);
    throw error;
  }
};

/**
 * 新增工具配置
 */
export const addToolConfig = async (
  configId: string,
  tool: ToolConfig
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, 'enterprise_configs', configId);
    
    const configDoc = await getDoc(configRef);
    if (!configDoc.exists()) {
      throw new Error('企業配置不存在');
    }

    const config = configDoc.data() as EnterpriseConfig;
    const tools = config.enabledTools || [];
    
    // 檢查工具是否已存在
    if (tools.some(t => t.id === tool.id)) {
      throw new Error('工具已存在');
    }

    await updateDoc(configRef, {
      enabledTools: [...tools, tool],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('新增工具配置失敗:', error);
    throw error;
  }
};

/**
 * 更新訂閱詳情
 */
export const updateSubscriptionDetails = async (
  configId: string,
  subscriptionUpdates: Partial<EnterpriseConfig['subscriptionDetails']>
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, 'enterprise_configs', configId);

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // 更新訂閱欄位
    Object.entries(subscriptionUpdates).forEach(([key, value]) => {
      updateData[`subscriptionDetails.${key}`] = value;
    });

    await updateDoc(configRef, updateData);
  } catch (error) {
    console.error('更新訂閱詳情失敗:', error);
    throw error;
  }
};

/**
 * 更新自訂設定
 */
export const updateCustomSettings = async (
  configId: string,
  settings: Partial<EnterpriseConfig['customSettings']>
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const configRef = doc(db, 'enterprise_configs', configId);

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // 更新設定欄位
    Object.entries(settings).forEach(([key, value]) => {
      updateData[`customSettings.${key}`] = value;
    });

    await updateDoc(configRef, updateData);
  } catch (error) {
    console.error('更新自訂設定失敗:', error);
    throw error;
  }
};

/**
 * 檢查工具使用量是否超過限制
 */
export const checkToolUsageLimit = async (
  configId: string,
  toolId: string,
  currentUsage: number
): Promise<boolean> => {
  try {
    const config = await getEnterpriseConfig(configId);
    if (!config) {
      return false;
    }

    const tool = config.enabledTools.find(t => t.id === toolId);
    if (!tool || !tool.enabled) {
      return false;
    }

    if (!tool.usageLimit || tool.usageLimit === -1) {
      return true; // 無限制
    }

    return currentUsage < tool.usageLimit;
  } catch (error) {
    console.error('檢查工具使用限制失敗:', error);
    return false;
  }
};

/**
 * 獲取可用工具列表
 */
export const getAvailableTools = async (orgId: string): Promise<ToolConfig[]> => {
  try {
    const config = await getEnterpriseConfig(orgId);
    if (!config) {
      return [];
    }

    return config.enabledTools.filter(tool => tool.enabled);
  } catch (error) {
    console.error('獲取可用工具失敗:', error);
    return [];
  }
};