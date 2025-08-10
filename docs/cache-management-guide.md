# 快取管理指南

## 開發環境快取問題處理

### 問題識別
當您看到以下情況時，可能是快取問題：
- 修復的錯誤仍然出現
- 控制台顯示舊的錯誤訊息
- JS 檔案名稱與最新建置不符

### 快速解決方案

#### 1. 開發時避免快取
在開發環境中，始終使用無快取模式：
- Chrome: 開發者工具 → Network → 勾選 "Disable cache"
- Firefox: 開發者工具 → Network → 勾選 "Disable Cache"

#### 2. 完全重建專案
```bash
# 清理所有快取
rm -rf dist-web .expo node_modules/.cache

# 重新建置
npm run web:build

# 驗證新建置
ls -la dist-web/_expo/static/js/web/
```

#### 3. 瀏覽器快取清除
- **強制重新整理**: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
- **完全清除**: 設定 → 清除瀏覽資料 → 快取的圖片和檔案

### 部署時的快取策略

#### 1. 檔案版本控制
確保建置系統產生唯一的檔案名稱（已由 Expo 處理）

#### 2. HTTP 標頭設定
```nginx
# nginx 設定範例
location ~* \.(js|css)$ {
    # 開發環境：不快取
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    
    # 生產環境：長期快取（因為檔名包含 hash）
    # add_header Cache-Control "public, max-age=31536000, immutable";
}
```

#### 3. Service Worker 更新
如果使用 Service Worker，確保正確處理更新：
```javascript
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```

## 故障排除檢查清單

- [ ] 檢查瀏覽器載入的 JS 檔案名稱
- [ ] 確認 dist-web 目錄只有最新建置
- [ ] 驗證程式碼修改在建置檔案中
- [ ] 清除瀏覽器快取
- [ ] 使用無痕/隱私模式測試
- [ ] 檢查 CDN 快取（如果使用）

## 相關文件
- [開發檢查清單](/docs/development-checklist.md)
- [建置和部署指南](/docs/build-deployment.md)