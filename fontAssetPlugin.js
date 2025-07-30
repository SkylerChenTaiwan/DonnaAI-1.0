/**
 * Metro Asset Plugin for Font Files
 * 處理字體檔案在 Web 平台的載入問題
 * 避免 OTS parsing error
 */

const path = require('path');

/**
 * Metro asset plugin 必須是一個函數
 * @param {Object} asset - Metro 提供的資源資訊
 * @returns {Promise<Object>} - 轉換後的資源
 */
module.exports = async function fontAssetPlugin(asset) {
  // 檢查是否為字體檔案
  const fontExtensions = ['ttf', 'otf', 'woff', 'woff2', 'eot'];
  const ext = asset.type;
  
  if (!fontExtensions.includes(ext)) {
    // 非字體檔案，返回原始資源
    return asset;
  }

  // 對於字體檔案，修改處理方式
  // 避免 Metro 嘗試解析字體檔案內容
  const modifiedAsset = {
    ...asset,
    // 將內容設為空，避免解析錯誤
    // 實際的字體檔案會透過 URL 載入
    __packager_asset: true,
    // 設定檔案路徑資訊
    fileSystemLocation: asset.fileSystemLocation || path.dirname(asset.files[0]),
    httpServerLocation: asset.httpServerLocation || '/assets',
    // 確保有正確的縮放資訊
    scales: asset.scales || [1],
    // 保留原始檔案資訊
    files: asset.files,
    hash: asset.hash,
    name: asset.name,
    type: asset.type,
  };

  return modifiedAsset;
};