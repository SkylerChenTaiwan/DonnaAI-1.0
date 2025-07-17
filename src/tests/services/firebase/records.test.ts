/**
 * 紀錄服務單元測試
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  createRecord,
  updateRecord,
  deleteRecord,
  getRecord,
  getRecords,
  getRecordsByCustomer,
  uploadAudioFile,
  updateRecordStatus
} from '../../../services/firebase/records';
import { RecordDoc } from '../../../types/record';
import * as permissionsService from '../../../services/firebase/permissions';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('firebase/storage');
vi.mock('../../../services/firebase/config', () => ({
  db: {},
  storage: {}
}));
vi.mock('../../../services/firebase/permissions');

describe('Records Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRecord', () => {
    it('應該成功建立紀錄', async () => {
      // Arrange
      (setDoc as Mock).mockResolvedValue(undefined);

      const recordData: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        type: 'meeting',
        title: '產品討論會議',
        customerIds: ['customer123'],
        participantIds: ['user1', 'user2'],
        scheduledAt: Timestamp.now(),
        duration: 60,
        location: '會議室 A',
        content: '討論新產品功能',
        status: 'draft',
        teamId: 'team123',
        organizationId: 'org123'
      };

      // Act
      const result = await createRecord(recordData, 'user123');

      // Assert
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...recordData,
        id: expect.stringMatching(/^record_/),
        createdBy: 'user123',
        createdAt: expect.any(Timestamp),
        updatedAt: expect.any(Timestamp)
      });
    });

    it('應該驗證必填欄位', async () => {
      // Arrange
      const recordData = {
        content: '測試內容'
      } as any;

      // Act & Assert
      await expect(createRecord(recordData, 'user123'))
        .rejects.toThrow('紀錄類型和標題為必填欄位');
    });
  });

  describe('uploadAudioFile', () => {
    it('應該成功上傳音訊檔案', async () => {
      // Arrange
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' });
      const mockDownloadURL = 'https://storage.example.com/audio/test.mp3';
      
      (ref as Mock).mockReturnValue('mockRef');
      (uploadBytes as Mock).mockResolvedValue({ ref: 'mockRef' });
      (getDownloadURL as Mock).mockResolvedValue(mockDownloadURL);

      vi.mocked(permissionsService.canEditRecord).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        data: () => ({ organizationId: 'org123' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      (updateDoc as Mock).mockResolvedValue(undefined);

      // Act
      const result = await uploadAudioFile('record123', mockFile, 'user123');

      // Assert
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      expect(result).toBe(mockDownloadURL);
    });

    it('應該驗證檔案類型', async () => {
      // Arrange
      const mockFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

      // Act & Assert
      await expect(uploadAudioFile('record123', mockFile, 'user123'))
        .rejects.toThrow('請上傳音訊檔案');
    });

    it('應該檢查權限', async () => {
      // Arrange
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' });
      vi.mocked(permissionsService.canEditRecord).mockResolvedValue(false);

      // Act & Assert
      await expect(uploadAudioFile('record123', mockFile, 'user123'))
        .rejects.toThrow('您沒有權限編輯此紀錄');
    });
  });

  describe('getRecord', () => {
    it('應該獲取紀錄資料', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewRecord).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        id: 'record123',
        data: () => ({
          type: 'meeting',
          title: '測試會議',
          content: '會議內容',
          status: 'completed'
        })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);

      // Act
      const result = await getRecord('record123', 'user123');

      // Assert
      expect(result).toMatchObject({
        id: 'record123',
        type: 'meeting',
        title: '測試會議',
        content: '會議內容',
        status: 'completed'
      });
    });

    it('應該拒絕沒有權限的查看', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewRecord).mockResolvedValue(false);

      // Act & Assert
      await expect(getRecord('record123', 'user123'))
        .rejects.toThrow('您沒有權限查看此紀錄');
    });
  });

  describe('getRecords', () => {
    it('應該獲取紀錄列表並應用過濾條件', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'record1',
          data: () => ({
            type: 'meeting',
            title: '會議1',
            status: 'completed',
            scheduledAt: Timestamp.fromDate(new Date('2024-01-15'))
          })
        },
        {
          id: 'record2',
          data: () => ({
            type: 'call',
            title: '通話紀錄',
            status: 'draft',
            scheduledAt: Timestamp.fromDate(new Date('2024-01-20'))
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      vi.mocked(permissionsService.canViewRecord).mockResolvedValue(true);

      // Act
      const result = await getRecords('user123', {
        teamId: 'team123',
        type: 'meeting',
        status: 'completed',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
        limitCount: 10
      });

      // Assert
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('teamId', '==', 'team123');
      expect(where).toHaveBeenCalledWith('type', '==', 'meeting');
      expect(where).toHaveBeenCalledWith('status', '==', 'completed');
      expect(limit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(2); // 假設兩個都有權限
    });

    it('應該處理空的過濾條件', async () => {
      // Arrange
      const mockQuerySnapshot = {
        docs: []
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await getRecords('user123');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getRecordsByCustomer', () => {
    it('應該獲取特定客戶的紀錄', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'record1',
          data: () => ({
            type: 'meeting',
            title: '客戶會議1',
            customerIds: ['customer123', 'customer456']
          })
        },
        {
          id: 'record2',
          data: () => ({
            type: 'call',
            title: '客戶通話',
            customerIds: ['customer123']
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      vi.mocked(permissionsService.canViewRecord).mockResolvedValue(true);

      // Act
      const result = await getRecordsByCustomer('customer123', 'user123', 5);

      // Assert
      expect(where).toHaveBeenCalledWith('customerIds', 'array-contains', 'customer123');
      expect(limit).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateRecordStatus', () => {
    it('應該更新紀錄狀態', async () => {
      // Arrange
      vi.mocked(permissionsService.canEditRecord).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        data: () => ({ status: 'draft' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      (updateDoc as Mock).mockResolvedValue(undefined);

      // Act
      await updateRecordStatus('record123', 'processing', 'user123');

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'processing',
          updatedAt: expect.anything()
        })
      );
    });

    it('應該記錄完成資訊', async () => {
      // Arrange
      vi.mocked(permissionsService.canEditRecord).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        data: () => ({ status: 'processing' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      (updateDoc as Mock).mockResolvedValue(undefined);

      // Act
      await updateRecordStatus('record123', 'completed', 'user123');

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.anything(),
          completedBy: 'user123'
        })
      );
    });
  });

  describe('deleteRecord', () => {
    it('應該允許建立者刪除紀錄', async () => {
      // Arrange
      const mockDoc = {
        exists: () => true,
        data: () => ({ createdBy: 'user123' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      (deleteDoc as Mock).mockResolvedValue(undefined);

      // Act
      await deleteRecord('record123', 'user123');

      // Assert
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('應該允許管理員刪除紀錄', async () => {
      // Arrange
      const mockDoc = {
        exists: () => true,
        data: () => ({ createdBy: 'otherUser' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      vi.mocked(permissionsService.isOrgAdmin).mockResolvedValue(true);
      (deleteDoc as Mock).mockResolvedValue(undefined);

      // Act
      await deleteRecord('record123', 'admin123');

      // Assert
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('應該拒絕非建立者和非管理員刪除', async () => {
      // Arrange
      const mockDoc = {
        exists: () => true,
        data: () => ({ createdBy: 'otherUser' })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      vi.mocked(permissionsService.isOrgAdmin).mockResolvedValue(false);

      // Act & Assert
      await expect(deleteRecord('record123', 'user123'))
        .rejects.toThrow('只有建立者或管理員可以刪除紀錄');
    });
  });
});