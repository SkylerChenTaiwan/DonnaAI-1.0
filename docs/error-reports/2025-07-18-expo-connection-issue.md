# Expo Go 連接問題分析報告

## 問題描述
- **發生時間**: 2025-07-18 清晨 5:15
- **問題現象**: Expo Go 顯示 "Could not connect to the server" 錯誤
- **錯誤訊息**: Unknown error: Could not connect to the server. exp://localhost:8081

## 根本原因分析

### 1. Metro Bundler 啟動問題
- Metro bundler 雖然啟動，但本地端口 8081 無法正常監聽
- `curl -I http://localhost:8081` 連接失敗
- `lsof -i :8081` 無法找到監聽進程

### 2. 網路連接問題
- 本機 IP: 10.1.1.142
- Expo Go 嘗試連接 localhost:8081，但在行動設備上 localhost 指向設備本身
- 需要使用實際 IP 地址或 tunnel 模式

### 3. 可能的解決方案

#### 方案 A: 使用 LAN 模式
```bash
npx expo start --lan
```
**優點**: 直接使用區域網路 IP，速度快
**缺點**: 需要同網段，可能有防火牆問題

#### 方案 B: 使用 Tunnel 模式  
```bash
npx expo start --tunnel
```
**優點**: 穿透防火牆，任何網路都可用
**缺點**: 依賴外部服務，速度較慢

#### 方案 C: 手動指定主機
```bash
npx expo start --host 10.1.1.142
```
**優點**: 明確指定 IP，避免混淆
**缺點**: IP 變動時需要重新配置

### 4. 建議的修復步驟
1. 清除 Metro 快取
2. 安裝必要依賴 (@expo/ngrok)
3. 使用 tunnel 模式啟動
4. 如果成功，再嘗試 LAN 模式優化性能

## 影響評估
- **嚴重程度**: 高 - 影響開發流程
- **影響範圍**: 開發環境連接
- **緊急程度**: 中 - 可透過替代方案解決

## 預防措施
1. 建立 npm script 包含不同連接模式
2. 在 CLAUDE.md 中記錄常見問題解決方案
3. 設定開發環境檢查腳本