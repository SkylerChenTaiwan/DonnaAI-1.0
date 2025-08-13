/**
 * 日期編輯器 - Notion 風格的日期選擇器
 */

import React, { useRef, useEffect, useState } from 'react';
import { EditorProps, EDITOR_STYLES } from './types';

// 簡化的日期格式化函數
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 解析日期字串
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// 月份名稱
const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

// 星期名稱
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export const DateEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  column,
  autoFocus = true,
  style }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const parsed = parseDate(value);
    return parsed || new Date();
  });
  const [viewDate, setViewDate] = useState<Date>(() => {
    const parsed = parseDate(value);
    return parsed || new Date();
  });

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 處理點擊外部關閉日曆
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(formatDate(selectedDate));
      onBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBlur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onChange(formatDate(selectedDate));
      onKeyDown(e);
    }
  };

  // 取得當月的所有日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // 填充前面的空白
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    onBlur();
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const calendarStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    background: 'white',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    padding: '8px',
    zIndex: 1000,
    minWidth: '280px' };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    padding: '0 4px' };

  const navButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '3px',
    color: 'rgba(55, 53, 47, 0.65)',
    fontSize: '14px' };

  const monthYearStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgb(55, 53, 47)' };

  const weekdayStyles: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(55, 53, 47, 0.5)',
    fontWeight: 500,
    textAlign: 'center',
    padding: '4px' };

  const dayStyles = (day: number | null): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: day ? 'pointer' : 'default',
    borderRadius: '3px',
    fontSize: '14px',
    color: day ? 'rgb(55, 53, 47)' : 'transparent',
    background: day && isSelected(day) ? 'rgb(35, 131, 226)' : 
                day && isToday(day) ? 'rgba(55, 53, 47, 0.08)' : 
                'transparent',
    color: day && isSelected(day) ? 'white' : 'rgb(55, 53, 47)',
    fontWeight: day && (isToday(day) || isSelected(day)) ? 500 : 400 });

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px' };

  return (
    <div ref={containerRef} style={{ ...EDITOR_STYLES.container, ...style, position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={formatDate(selectedDate)}
        onChange={() => {}} // 只讀
        onKeyDown={handleKeyDown}
        placeholder={column.placeholder || '選擇日期...'}
        style={EDITOR_STYLES.input}
        readOnly
      />
      
      {showCalendar && (
        <div style={calendarStyles}>
          {/* 月份導航 */}
          <div style={headerStyles}>
            <button
              style={navButtonStyles}
              onClick={() => changeMonth(-1)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              ‹
            </button>
            <span style={monthYearStyles}>
              {viewDate.getFullYear()}年 {MONTH_NAMES[viewDate.getMonth()]}
            </span>
            <button
              style={navButtonStyles}
              onClick={() => changeMonth(1)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              ›
            </button>
          </div>

          {/* 星期標題 */}
          <div style={gridStyles}>
            {WEEKDAY_NAMES.map(day => (
              <div key={day} style={weekdayStyles}>{day}</div>
            ))}
          </div>

          {/* 日期網格 */}
          <div style={gridStyles}>
            {getDaysInMonth(viewDate).map((day, index) => (
              <div
                key={index}
                style={dayStyles(day)}
                onClick={() => day && handleDateClick(day)}
                onMouseEnter={(e) => {
                  if (day && !isSelected(day)) {
                    e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (day && !isSelected(day) && !isToday(day)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 今天按鈕 */}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(55, 53, 47, 0.09)' }}>
            <button
              style={{
                ...navButtonStyles,
                width: '100%',
                padding: '6px',
                fontSize: '13px' }}
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setViewDate(today);
                onChange(formatDate(today));
                onBlur();
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
};