/**
 * Notion 風格的內聯樣式定義
 * 用於替代全域 CSS，避免樣式污染
 */

export const notionStyles = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '4px 8px',
    border: '1px solid #e3e3e2',
    borderRadius: '3px',
    backgroundColor: '#ffffff',
    color: '#37352f',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '28px',
    userSelect: 'none' as const,
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  buttonPrimary: {
    backgroundColor: '#2383e2',
    borderColor: '#2383e2',
    color: '#ffffff',
    boxShadow: '0 1px 3px rgba(35, 131, 226, 0.3)',
  },
  buttonHover: {
    backgroundColor: '#f7f7f7',
    borderColor: '#d3d3d2',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
  },
  buttonPrimaryHover: {
    backgroundColor: '#0b7bc7',
    borderColor: '#0b7bc7',
    boxShadow: '0 3px 6px rgba(35, 131, 226, 0.4)',
  },
  buttonIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    width: '16px',
    height: '16px',
  },
  buttonText: {
    background: 'transparent',
    border: 'none',
    padding: '4px',
    color: '#37352f',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    border: '1px solid #e3e3e2',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    padding: '24px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
};