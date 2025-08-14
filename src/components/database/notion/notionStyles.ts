/**
 * Notion 樣式定義
 * 使用 JavaScript 對象而非 CSS 檔案，避免全域污染
 */

export const notionStyles = {
  // 只在 notion-view 容器內生效的樣式
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0 96px',
    overflow: 'auto',
    boxSizing: 'border-box' as const,
    backgroundColor: '#fbfbfa'
  },
  
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '13px',
    lineHeight: 1.2,
    color: 'rgb(55, 53, 47)',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#fbfbfa'
  },
  
  // 其他樣式...
};

// 在元件掛載時注入樣式
export function injectNotionStyles() {
  if (typeof window === 'undefined') return;
  
  const styleId = 'notion-scoped-styles';
  
  // 如果已存在則不重複注入
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  
  // 只注入必要的、限定範圍的樣式
  style.textContent = `
    /* Notion 樣式 - 僅在 .notion-view 容器內生效 */
    .notion-view {
      position: relative;
      width: 100%;
      height: 100%;
      isolation: isolate;
    }
    
    /* 確保這些樣式只影響 Notion 元件 */
    .notion-view .notion-database-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 96px;
      overflow: auto;
      box-sizing: border-box;
      background-color: #fbfbfa;
    }
    
    /* 其他 Notion 特定樣式... */
  `;
  
  document.head.appendChild(style);
}

// 清理樣式
export function cleanupNotionStyles() {
  if (typeof window === 'undefined') return;
  
  const style = document.getElementById('notion-scoped-styles');
  if (style) {
    style.remove();
  }
}