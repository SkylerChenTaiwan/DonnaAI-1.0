/**
 * 全域樣式清理函數
 */
if (typeof window !== 'undefined') {
  // Web 環境
  window.__cleanStyle = function(style) {
    if (!style) return style;
    
    if (Array.isArray(style)) {
      return style.map(window.__cleanStyle);
    }
    
    if (typeof style === 'object') {
      const cleaned = {};
      for (const key in style) {
        if (key === 'shadowOffset' || 
            key === 'shadowColor' ||
            key === 'shadowOpacity' ||
            key === 'shadowRadius' ||
            key === 'elevation') {
          continue;
        }
        if (key === 'transform' && Array.isArray(style[key])) {
          continue;
        }
        cleaned[key] = style[key];
      }
      return cleaned;
    }
    
    return style;
  };
} else {
  // Native 環境
  global.__cleanStyle = function(style) {
    return style;
  };
}
