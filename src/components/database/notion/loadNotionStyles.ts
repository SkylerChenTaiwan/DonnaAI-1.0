/**
 * 動態載入 Notion 樣式
 * 只在使用 Notion 元件時載入，避免影響其他頁面
 */

let notionStylesLoaded = false;

export function loadNotionStyles() {
  // 只在 Web 平台且尚未載入時執行
  if (typeof window === 'undefined' || notionStylesLoaded) {
    return;
  }

  // 檢查是否已經存在
  const existingNotionStyle = document.getElementById('notion-database-styles');
  if (existingNotionStyle) {
    notionStylesLoaded = true;
    return;
  }

  // 創建 style 元素
  const styleElement = document.createElement('style');
  styleElement.id = 'notion-database-styles';
  
  // 添加包裝樣式，確保只在 .notion-view 容器內生效
  styleElement.textContent = `
    /* Notion 樣式只在 .notion-view 容器內生效 */
    .notion-view {
      position: relative;
      width: 100%;
      height: 100%;
      isolation: isolate;
    }
    
    /* 重要：以下樣式只影響 .notion-view 內的元素 */
    .notion-view .notion-database-wrapper {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      padding: 0 96px !important;
      overflow: auto !important;
      box-sizing: border-box !important;
      background-color: #fbfbfa !important;
    }
    
    .notion-view .notion-database-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-size: 13px !important;
      line-height: 1.2 !important;
      color: rgb(55, 53, 47) !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      background: #fbfbfa !important;
    }
    
    .notion-view .notion-database-header {
      padding: 40px 0 0 0;
      margin-bottom: 8px;
    }
    
    .notion-view .notion-database-title {
      font-size: 40px;
      font-weight: 700;
      line-height: 1.2;
      color: rgb(55, 53, 47);
      margin: 0;
      padding: 3px 2px;
    }
    
    /* 其他 Notion 特定樣式... */
  `;
  
  document.head.appendChild(styleElement);
  notionStylesLoaded = true;
}

export function unloadNotionStyles() {
  if (typeof window === 'undefined') {
    return;
  }
  
  const styleElement = document.getElementById('notion-database-styles');
  if (styleElement) {
    styleElement.remove();
    notionStylesLoaded = false;
  }
}