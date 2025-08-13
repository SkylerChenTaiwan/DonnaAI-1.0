/**
 * 欄位關聯服務
 * 管理跨資料庫欄位關聯的 CRUD 操作
 * 支援雙向關聯自動建立
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { 
  FieldRelation, 
  DatabaseType, 
  RelationType,
  RelationValidation 
} from '@/types/import';

/**
 * 關聯快取
 * 減少重複查詢
 */
const relationCache = new Map<string, {
  relations: FieldRelation[];
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5分鐘快取

/**
 * 生成唯一 ID
 */
function generateId(): string {
  const db = getFirebaseDb();
  return doc(collection(db, 'field_relations')).id;
}

/**
 * 建立欄位關聯
 * 自動處理雙向關聯
 */
export async function createFieldRelation(
  relation: Omit<FieldRelation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ forward: string; reverse?: string }> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const relationIds = { forward: '', reverse: '' };

  try {
    // 建立正向關聯
    const forwardId = generateId();
    const forwardRef = doc(db, 'field_relations', forwardId);
    const forwardRelation: FieldRelation = {
      ...relation,
      id: forwardId,
      createdAt: serverTimestamp() as Timestamp };
    batch.set(forwardRef, forwardRelation);
    relationIds.forward = forwardId;

    // 如果需要雙向關聯，自動建立反向關聯
    if (relation.bidirectional) {
      const reverseId = generateId();
      const reverseRef = doc(db, 'field_relations', reverseId);
      
      // 反轉關聯類型
      let reverseRelationType: RelationType = relation.relationType;
      if (relation.relationType === 'one-to-many') {
        reverseRelationType = 'many-to-one' as RelationType;
      } else if (relation.relationType === 'many-to-one' as RelationType) {
        reverseRelationType = 'one-to-many';
      }

      const reverseRelation: FieldRelation = {
        id: reverseId,
        sourceDatabase: relation.targetDatabase as DatabaseType,
        sourceField: relation.targetField,
        targetDatabase: relation.sourceDatabase,
        targetField: relation.sourceField,
        relationType: reverseRelationType,
        bidirectional: true,
        createdAt: serverTimestamp() as Timestamp,
        organizationId: relation.organizationId,
        createdBy: relation.createdBy,
        description: relation.description ? 
          `反向關聯: ${relation.description}` : 
          `${relation.targetDatabase}.${relation.targetField} -> ${relation.sourceDatabase}.${relation.sourceField}`
      };
      
      batch.set(reverseRef, reverseRelation);
      relationIds.reverse = reverseId;
    }

    await batch.commit();

    // 清除快取
    clearCache(relation.organizationId);

    console.log('✅ 建立欄位關聯成功', relationIds);
    return relationIds;

  } catch (error) {
    console.error('❌ 建立欄位關聯失敗:', error);
    throw error;
  }
}

/**
 * 取得組織的所有欄位關聯
 */
export async function getFieldRelations(
  organizationId: string,
  database?: DatabaseType
): Promise<FieldRelation[]> {
  const db = getFirebaseDb();
  // 檢查快取
  const cacheKey = `${organizationId}-${database || 'all'}`;
  const cached = relationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.relations;
  }

  try {
    let q = query(
      collection(db, 'field_relations'),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc')
    );

    // 如果指定資料庫，過濾相關關聯
    if (database) {
      // 注意：Firestore 不支援 OR 查詢，需要分兩次查詢
      const sourceQuery = query(
        collection(db, 'field_relations'),
        where('organizationId', '==', organizationId),
        where('sourceDatabase', '==', database)
      );
      
      const targetQuery = query(
        collection(db, 'field_relations'),
        where('organizationId', '==', organizationId),
        where('targetDatabase', '==', database)
      );

      const [sourceSnapshot, targetSnapshot] = await Promise.all([
        getDocs(sourceQuery),
        getDocs(targetQuery)
      ]);

      const relationsMap = new Map<string, FieldRelation>();
      
      sourceSnapshot.forEach(doc => {
        relationsMap.set(doc.id, doc.data() as FieldRelation);
      });
      
      targetSnapshot.forEach(doc => {
        relationsMap.set(doc.id, doc.data() as FieldRelation);
      });

      const relations = Array.from(relationsMap.values());
      
      // 更新快取
      relationCache.set(cacheKey, {
        relations,
        timestamp: Date.now()
      });

      return relations;
    }

    const snapshot = await getDocs(q);
    const relations = snapshot.docs.map(doc => doc.data() as FieldRelation);

    // 更新快取
    relationCache.set(cacheKey, {
      relations,
      timestamp: Date.now()
    });

    return relations;

  } catch (error) {
    console.error('❌ 取得欄位關聯失敗:', error);
    throw error;
  }
}

/**
 * 取得特定欄位的所有關聯
 */
export async function getFieldRelationsByField(
  organizationId: string,
  database: DatabaseType,
  field: string
): Promise<FieldRelation[]> {
  const db = getFirebaseDb();
  try {
    const [sourceRelations, targetRelations] = await Promise.all([
      // 作為來源欄位的關聯
      getDocs(query(
        collection(db, 'field_relations'),
        where('organizationId', '==', organizationId),
        where('sourceDatabase', '==', database),
        where('sourceField', '==', field)
      )),
      // 作為目標欄位的關聯
      getDocs(query(
        collection(db, 'field_relations'),
        where('organizationId', '==', organizationId),
        where('targetDatabase', '==', database),
        where('targetField', '==', field)
      ))
    ]);

    const relations: FieldRelation[] = [];
    
    sourceRelations.forEach(doc => {
      relations.push(doc.data() as FieldRelation);
    });
    
    targetRelations.forEach(doc => {
      relations.push(doc.data() as FieldRelation);
    });

    return relations;

  } catch (error) {
    console.error('❌ 取得欄位關聯失敗:', error);
    throw error;
  }
}

/**
 * 更新欄位關聯
 */
export async function updateFieldRelation(
  relationId: string,
  updates: Partial<FieldRelation>
): Promise<void> {
  const db = getFirebaseDb();
  try {
    const relationRef = doc(db, 'field_relations', relationId);
    
    // 取得現有關聯
    const relationDoc = await getDoc(relationRef);
    if (!relationDoc.exists()) {
      throw new Error('關聯不存在');
    }

    const currentRelation = relationDoc.data() as FieldRelation;
    
    // 更新關聯
    await updateDoc(relationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // 清除快取
    clearCache(currentRelation.organizationId);

    console.log('✅ 更新欄位關聯成功');

  } catch (error) {
    console.error('❌ 更新欄位關聯失敗:', error);
    throw error;
  }
}

/**
 * 刪除欄位關聯
 * 如果是雙向關聯，需要同時刪除反向關聯
 */
export async function deleteFieldRelation(
  relationId: string,
  organizationId: string
): Promise<void> {
  const db = getFirebaseDb();
  try {
    const relationRef = doc(db, 'field_relations', relationId);
    const relationDoc = await getDoc(relationRef);
    
    if (!relationDoc.exists()) {
      throw new Error('關聯不存在');
    }

    const relation = relationDoc.data() as FieldRelation;
    const batch = writeBatch(db);

    // 刪除主關聯
    batch.delete(relationRef);

    // 如果是雙向關聯，找出並刪除反向關聯
    if (relation.bidirectional) {
      const reverseQuery = query(
        collection(db, 'field_relations'),
        where('organizationId', '==', organizationId),
        where('sourceDatabase', '==', relation.targetDatabase),
        where('sourceField', '==', relation.targetField),
        where('targetDatabase', '==', relation.sourceDatabase),
        where('targetField', '==', relation.sourceField),
        limit(1)
      );

      const reverseSnapshot = await getDocs(reverseQuery);
      if (!reverseSnapshot.empty) {
        const reverseRef = reverseSnapshot.docs[0].ref;
        batch.delete(reverseRef);
      }
    }

    await batch.commit();

    // 清除快取
    clearCache(organizationId);

    console.log('✅ 刪除欄位關聯成功');

  } catch (error) {
    console.error('❌ 刪除欄位關聯失敗:', error);
    throw error;
  }
}

/**
 * 驗證關聯是否有效
 * 檢查循環引用、類型匹配等
 */
export async function validateFieldRelation(
  relation: Omit<FieldRelation, 'id' | 'createdAt'>
): Promise<RelationValidation> {
  const db = getFirebaseDb();
  const validation: RelationValidation = {
    relation: { ...relation, id: '', createdAt: Timestamp.now() },
    isValid: true,
    issues: [],
    affectedRows: []
  };

  try {
    // 檢查是否已存在相同關聯
    const existingQuery = query(
      collection(db, 'field_relations'),
      where('organizationId', '==', relation.organizationId),
      where('sourceDatabase', '==', relation.sourceDatabase),
      where('sourceField', '==', relation.sourceField),
      where('targetDatabase', '==', relation.targetDatabase),
      where('targetField', '==', relation.targetField),
      limit(1)
    );

    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      validation.issues.push({
        type: 'duplicate',
        message: '此關聯已存在',
        severity: 'error'
      });
      validation.isValid = false;
    }

    // 檢查循環引用
    if (relation.sourceDatabase === relation.targetDatabase && 
        relation.sourceField === relation.targetField) {
      validation.issues.push({
        type: 'circular',
        message: '不能建立欄位到自身的關聯',
        severity: 'error'
      });
      validation.isValid = false;
    }

    // 檢查間接循環引用（需要更複雜的圖遍歷，這裡簡化處理）
    const allRelations = await getFieldRelations(relation.organizationId);
    if (detectCircularReference(relation, allRelations)) {
      validation.issues.push({
        type: 'circular',
        message: '偵測到循環引用',
        severity: 'warning'
      });
    }

    return validation;

  } catch (error) {
    console.error('❌ 驗證關聯失敗:', error);
    validation.isValid = false;
    validation.issues.push({
      type: 'missing_target',
      message: '驗證過程發生錯誤',
      severity: 'error'
    });
    return validation;
  }
}

/**
 * 偵測循環引用
 */
function detectCircularReference(
  newRelation: Omit<FieldRelation, 'id' | 'createdAt'>,
  existingRelations: FieldRelation[]
): boolean {
  // 建立關聯圖
  const graph = new Map<string, Set<string>>();
  
  // 加入現有關聯
  existingRelations.forEach(rel => {
    const sourceKey = `${rel.sourceDatabase}.${rel.sourceField}`;
    const targetKey = `${rel.targetDatabase}.${rel.targetField}`;
    
    if (!graph.has(sourceKey)) {
      graph.set(sourceKey, new Set());
    }
    graph.get(sourceKey)!.add(targetKey);
  });

  // 加入新關聯
  const newSourceKey = `${newRelation.sourceDatabase}.${newRelation.sourceField}`;
  const newTargetKey = `${newRelation.targetDatabase}.${newRelation.targetField}`;
  
  if (!graph.has(newSourceKey)) {
    graph.set(newSourceKey, new Set());
  }
  graph.get(newSourceKey)!.add(newTargetKey);

  // DFS 檢查循環
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // 檢查所有節點
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 批量建立關聯
 */
export async function createFieldRelationsBatch(
  relations: Array<Omit<FieldRelation, 'id' | 'createdAt'>>
): Promise<string[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const relationIds: string[] = [];

  try {
    for (const relation of relations) {
      // 驗證關聯
      const validation = await validateFieldRelation(relation);
      if (!validation.isValid) {
        console.warn('⚠️ 跳過無效關聯:', validation.issues);
        continue;
      }

      // 建立關聯
      const id = generateId();
      const ref = doc(db, 'field_relations', id);
      const fullRelation: FieldRelation = {
        ...relation,
        id,
        createdAt: serverTimestamp() as Timestamp
      };
      
      batch.set(ref, fullRelation);
      relationIds.push(id);

      // 處理雙向關聯
      if (relation.bidirectional) {
        const reverseId = generateId();
        const reverseRef = doc(db, 'field_relations', reverseId);
        const reverseRelation: FieldRelation = {
          ...fullRelation,
          id: reverseId,
          sourceDatabase: relation.targetDatabase as DatabaseType,
          sourceField: relation.targetField,
          targetDatabase: relation.sourceDatabase,
          targetField: relation.sourceField
        };
        
        batch.set(reverseRef, reverseRelation);
        relationIds.push(reverseId);
      }
    }

    await batch.commit();

    // 清除快取
    if (relations.length > 0) {
      clearCache(relations[0].organizationId);
    }

    console.log(`✅ 批量建立 ${relationIds.length} 個關聯成功`);
    return relationIds;

  } catch (error) {
    console.error('❌ 批量建立關聯失敗:', error);
    throw error;
  }
}

/**
 * 清除快取
 */
function clearCache(organizationId?: string): void {
  if (organizationId) {
    // 清除特定組織的快取
    Array.from(relationCache.keys())
      .filter(key => key.startsWith(organizationId))
      .forEach(key => relationCache.delete(key));
  } else {
    // 清除所有快取
    relationCache.clear();
  }
}

/**
 * 取得關聯統計
 */
export async function getRelationStatistics(
  organizationId: string
): Promise<{
  totalRelations: number;
  byDatabase: Record<DatabaseType, number>;
  byType: Record<RelationType, number>;
  bidirectionalCount: number;
}> {
  try {
    const relations = await getFieldRelations(organizationId);
    
    const stats = {
      totalRelations: relations.length,
      byDatabase: {} as Record<DatabaseType, number>,
      byType: {} as Record<RelationType, number>,
      bidirectionalCount: 0
    };

    // 統計各資料庫的關聯數
    const databases: DatabaseType[] = ['customers', 'records', 'tasks', 'users'];
    databases.forEach(db => {
      stats.byDatabase[db] = relations.filter(
        r => r.sourceDatabase === db || r.targetDatabase === db
      ).length;
    });

    // 統計各類型的關聯數
    const types: RelationType[] = ['one-to-one', 'one-to-many', 'many-to-many'];
    types.forEach(type => {
      stats.byType[type] = relations.filter(r => r.relationType === type).length;
    });

    // 統計雙向關聯數
    stats.bidirectionalCount = relations.filter(r => r.bidirectional).length;

    return stats;

  } catch (error) {
    console.error('❌ 取得關聯統計失敗:', error);
    throw error;
  }
}