/**
 * Web 平台專用進度指示器元件
 * 使用原生 HTML 元素和內聯樣式確保正確顯示
 */

import React from 'react';

interface ProgressIndicatorProps {
  currentStage: number;
  totalStages?: number;
  labels?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStage,
  totalStages = 4,
  labels = []
}) => {
  const stages = Array.from({ length: totalStages }, (_, i) => i + 1);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    marginBottom: '20px'
  };

  const itemStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  };

  const getCircleStyle = (stage: number): React.CSSProperties => {
    const isActive = stage <= currentStage;
    const isCurrent = stage === currentStage;
    
    return {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isActive ? '#2C2C2C' : '#FFFFFF',
      border: isCurrent ? '3px solid #2C2C2C' : '2px solid #666666',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
      cursor: 'default'
    };
  };

  const getNumberStyle = (stage: number): React.CSSProperties => {
    const isActive = stage <= currentStage;
    
    return {
      fontSize: '16px',
      fontWeight: '600',
      color: isActive ? '#FFFFFF' : '#1A1A1A',
      userSelect: 'none'
    };
  };

  const getLabelStyle = (stage: number): React.CSSProperties => {
    const isCurrent = stage === currentStage;
    
    return {
      fontSize: '12px',
      color: isCurrent ? '#1A1A1A' : '#999999',
      fontWeight: isCurrent ? '500' : '400',
      marginTop: '4px',
      textAlign: 'center'
    };
  };

  return (
    <div style={containerStyle}>
      {stages.map(stage => (
        <div key={stage} style={itemStyle}>
          <div style={getCircleStyle(stage)}>
            <span style={getNumberStyle(stage)}>
              {stage}
            </span>
          </div>
          {labels[stage - 1] && (
            <span style={getLabelStyle(stage)}>
              {labels[stage - 1]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;