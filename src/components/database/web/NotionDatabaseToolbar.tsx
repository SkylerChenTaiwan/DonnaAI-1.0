import React from 'react';
import { NotionTokens } from './design-tokens/NotionTokens';

interface NotionDatabaseToolbarProps {
  onAddRow: () => void;
  onViewSettings: () => void;
  viewCount: number;
  selectedCount: number;
}

export const NotionDatabaseToolbar: React.FC<NotionDatabaseToolbarProps> = ({
  onAddRow,
  onViewSettings,
  viewCount,
  selectedCount,
}) => {
  return (
    <div className="notion-database-toolbar">
      <div className="notion-toolbar-left">
        <div className="notion-view-info">
          {viewCount} 項目
          {selectedCount > 0 && ` • ${selectedCount} 已選取`}
        </div>
      </div>
      
      <div className="notion-toolbar-right">
        <button 
          className="notion-button" 
          onClick={onViewSettings}
          title="檢視設定"
        >
          <span>⚙️</span>
          檢視
        </button>
        
        <button 
          className="notion-button notion-button-primary" 
          onClick={onAddRow}
          title="新增列"
        >
          <span>+</span>
          新增
        </button>
      </div>
    </div>
  );
};