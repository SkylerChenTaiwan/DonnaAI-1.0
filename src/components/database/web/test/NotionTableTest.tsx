/**
 * Notion 資料庫組件測試檔案
 * 用於測試重新設計的 TanStackNotionTable 組件
 */

import React, { useState } from 'react';
import { TanStackNotionTable } from '../TanStackNotionTable';

// 測試資料
const mockCustomers = [
  {
    id: '1',
    name: '張三',
    company: 'ABC 公司',
    phone: '0912-345-678',
    tags: '重要客戶,潛在合作'
  },
  {
    id: '2',
    name: '李四',
    company: 'XYZ 企業',
    phone: '0987-654-321',
    tags: '新客戶'
  },
  {
    id: '3',
    name: '王五',
    company: 'DEF 集團',
    phone: '0923-456-789',
    tags: '長期合作'
  }
];

const mockColumns = [
  { key: 'name', title: '姓名', sortable: true, filterable: true },
  { key: 'company', title: '公司', sortable: true, filterable: true },
  { key: 'phone', title: '電話', sortable: true, filterable: true },
  { key: 'tags', title: '標籤', sortable: true, filterable: true },
];

export const NotionTableTest: React.FC = () => {
  const [data, setData] = useState(mockCustomers);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleAddRow = async (rowData?: Record<string, any>) => {
    setLoading(true);
    
    // 模擬 API 調用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (rowData) {
      const newItem = {
        id: Date.now().toString(),
        ...rowData
      };
      setData(prev => [...prev, newItem]);
    }
    
    setLoading(false);
  };

  const handleUpdateCell = async (rowId: string, columnKey: string, value: any) => {
    console.log('更新儲存格:', { rowId, columnKey, value });
    
    // 模擬 API 調用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setData(prev => prev.map(item => 
      item.id === rowId 
        ? { ...item, [columnKey]: value }
        : item
    ));
  };

  const handleRowPress = (item: any) => {
    console.log('點選行:', item);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // 模擬重新載入
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRefreshing(false);
  };

  const handleSort = (columnKey: string) => {
    console.log('排序:', columnKey);
    // 這裡可以實作排序邏輯
  };

  return (
    <div style={{ width: '100%', height: '600px', padding: '20px' }}>
      <h2>Notion 資料庫組件測試</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMultiSelectMode(!multiSelectMode)}
          style={{ marginRight: '10px' }}
        >
          {multiSelectMode ? '取消多選' : '啟用多選'}
        </button>
        <button 
          onClick={() => setData([])}
          style={{ marginRight: '10px' }}
        >
          清空資料 (測試空狀態)
        </button>
        <button 
          onClick={() => setData(mockCustomers)}
        >
          重置測試資料
        </button>
      </div>

      <div style={{ 
        border: '1px solid #e9e9e7', 
        borderRadius: '6px',
        height: '500px',
        overflow: 'hidden'
      }}>
        <TanStackNotionTable
          data={data}
          columns={mockColumns}
          onAddRow={handleAddRow}
          onUpdateCell={handleUpdateCell}
          onRowPress={handleRowPress}
          multiSelectMode={multiSelectMode}
          selectedItems={selectedItems}
          onSelect={setSelectedItems}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          loading={loading}
          onSort={handleSort}
        />
      </div>
      
      {selectedItems.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f7f6f3' }}>
          已選擇項目: {selectedItems.join(', ')}
        </div>
      )}
    </div>
  );
};

export default NotionTableTest;