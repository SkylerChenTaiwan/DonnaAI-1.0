/**
 * Icon 元件 - 預設匯出
 * Metro bundler 會根據平台自動選擇 .web.tsx 或 .native.tsx
 */

// 這個檔案只是為了 TypeScript 類型定義
// 實際的實現在 Icon.web.tsx 和 Icon.native.tsx

export { Icon } from './Icon.web';
export type { IconProps } from './Icon.web';