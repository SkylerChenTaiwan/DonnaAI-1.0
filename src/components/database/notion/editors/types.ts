/**
 * 編輯器共用類型定義
 */

export interface EditorProps {
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  column: {
    key: string;
    title: string;
    type: string;
    options?: any[];
    required?: boolean;
    placeholder?: string;
  };
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

export interface EditorState {
  isOpen: boolean;
  tempValue: any;
  error?: string;
}

export const EDITOR_STYLES = {
  container: {
    position: 'absolute' as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    border: '2px solid #0073E6',
    borderRadius: '3px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  input: {
    width: '100%',
    height: '100%',
    padding: '6px 8px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    color: '#37352f',
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: -1,
    right: -1,
    marginTop: 2,
    backgroundColor: '#ffffff',
    border: '1px solid rgba(227, 226, 224, 0.5)',
    borderRadius: '3px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    maxHeight: '300px',
    overflowY: 'auto' as const,
    zIndex: 1001,
  },
  option: {
    padding: '6px 12px',
    fontSize: '14px',
    color: '#37352f',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  optionHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  optionSelected: {
    backgroundColor: 'rgba(35, 131, 226, 0.08)',
    color: '#0073E6',
  },
};