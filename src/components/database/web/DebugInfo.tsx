import React from 'react';
import { Platform } from 'react-native';

export const DebugInfo: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'yellow',
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      border: '2px solid red'
    }}>
      <div>Platform: {Platform.OS}</div>
      <div>Component: TanStackNotionTableV3</div>
      <div>CSS: NotionDatabaseV4.css loaded</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};