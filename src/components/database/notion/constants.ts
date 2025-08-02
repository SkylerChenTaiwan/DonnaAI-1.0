/**
 * Notion 資料庫元件常數定義
 * 基於 docs/notion-behavior-study/notion-measurements.json
 */

export const NotionColors = {
  // Text colors
  text: {
    default: '#37352F',
    gray: '#787774',
    lightGray: '#A4A4A2',
    brown: '#64473A',
    orange: '#D9730D',
    yellow: '#DFAB01',
    green: '#0F7B6C',
    blue: '#0B6E99',
    purple: '#6940A5',
    pink: '#AD1A72',
    red: '#E03E3E',
  },
  
  // Background colors
  background: {
    default: '#FFFFFF',
    gray: '#F7F6F3',
    brown: '#F4EEEE',
    orange: '#FBECDD',
    yellow: '#FBF3DB',
    green: '#EDF3EC',
    blue: '#E7F3F8',
    purple: '#F6F3F9',
    pink: '#FAF1F5',
    red: '#FDEBEC',
  },
  
  // Interactive states
  interactive: {
    hover: '#F7F6F3',
    selected: '#E9E9E7',
    selectedBorder: '#0A84FF',
    focus: '#0A84FF',
    disabled: '#E1E1DB',
  },
  
  // UI elements
  ui: {
    border: '#E9E9E7',
    divider: '#F0F0F0',
    shadow: 'rgba(15, 15, 15, 0.1)',
    scrollbar: '#D3D1CB',
    link: '#0B6E99',
  },
} as const;

export const NotionSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 32,
  },
  
  header: {
    height: 37,
    paddingHorizontal: 8,
  },
  
  row: {
    height: 37,
    gap: 0,
  },
} as const;

export const NotionTypography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  
  fontSize: {
    xs: 11,
    sm: 12,
    body: 14,
    md: 16,
    lg: 18,
    xl: 20,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.2,
    body: 1.5,
    relaxed: 1.75,
  },
} as const;

export const NotionAnimations = {
  duration: {
    instant: 0,
    fast: 100,
    normal: 150,
    slow: 300,
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  transitions: {
    background: `background-color 150ms ease`,
    border: `border-color 150ms ease`,
    opacity: `opacity 150ms ease`,
    transform: `transform 150ms ease`,
  },
} as const;

export const NotionInteractive = {
  borderRadius: {
    sm: 3,
    md: 4,
    lg: 6,
    full: 9999,
  },
  
  focusRing: {
    width: 2,
    color: '#0A84FF',
    offset: 0,
  },
  
  hover: {
    opacity: 0.8,
    scale: 1.0,
  },
} as const;

export const NotionTable = {
  header: {
    background: '#FFFFFF',
    borderBottom: '1px solid rgba(227, 226, 224, 0.5)',
    fontWeight: '400',
    fontSize: 14,
    color: 'rgba(55, 53, 47, 0.65)',
    textTransform: 'none' as const,
  },
  
  cell: {
    background: '#FFFFFF',
    backgroundHover: 'rgba(55, 53, 47, 0.03)',
    backgroundSelected: 'rgba(35, 131, 226, 0.12)',
    border: '1px solid rgba(55, 53, 47, 0.04)',
    padding: '4px 8px',
    fontSize: 14,
    color: '#37352F',
  },
  
  row: {
    backgroundEven: 'transparent',
    backgroundOdd: 'transparent',
    backgroundHover: 'rgba(251, 251, 250, 0.5)',
    height: 37,
  },
} as const;

export const NotionEditor = {
  outline: {
    width: 2,
    color: '#0A84FF',
    style: 'solid' as const,
  },
  background: '#FFFFFF',
  fontSize: 14,
  padding: '2px 4px',
  borderRadius: 0,
} as const;

// Default configuration values
export const NOTION_DEFAULTS = {
  ROW_HEIGHT: 37,
  HEADER_HEIGHT: 37,
  OVERSCAN_COUNT: 5,
  DEBOUNCE_DELAY: 500,
  MIN_COLUMN_WIDTH: 50,
  DEFAULT_COLUMN_WIDTH: 180,
  MAX_COLUMN_WIDTH: 600,
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NAVIGATE_UP: 'ArrowUp',
  NAVIGATE_DOWN: 'ArrowDown',
  NAVIGATE_LEFT: 'ArrowLeft',
  NAVIGATE_RIGHT: 'ArrowRight',
  NAVIGATE_NEXT: 'Tab',
  NAVIGATE_PREVIOUS: 'Shift+Tab',
  ENTER_EDIT: 'F2',
  CONFIRM_EDIT: 'Enter',
  CANCEL_EDIT: 'Escape',
  SELECT_ALL: 'Ctrl+A',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  DELETE: 'Delete',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;