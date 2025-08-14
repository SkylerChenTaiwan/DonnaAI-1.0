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
    
    /* 只在 notion-view 內的元素才套用 Notion 樣式 */
    .notion-view .notion-database-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 96px;
      overflow: auto;
      box-sizing: border-box;
      background-color: #fbfbfa;
    }
    
    /* 這裡可以添加其他 Notion 特定樣式 */
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