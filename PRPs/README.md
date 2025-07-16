# DonnaAI PRP 管理

此目錄包含所有 DonnaAI 專案的 Product Requirements Prompts (PRP)。

## PRP 狀態追蹤

| 編號 | 檔案名稱 | 狀態 | 描述 | 執行日期 |
|------|----------|------|------|----------|
| 01v  | donnaai-foundation-setup.md | ✅ 已完成 | DonnaAI 基礎架構設置 - Expo + Firebase + 認證系統 | 2025-07-16 |
| 02   | database-functionality.md | 📋 待執行 | 資料庫功能實作 - 使用者、客戶、紀錄、任務資料庫 | - |

## 命名規則

### 新建 PRP
- 格式：`[編號]-[功能描述].md`
- 範例：`02-ai-meeting-transcription.md`
- 編號從 01 開始，按建立順序遞增

### 已執行 PRP
- 格式：`[編號]v-[功能描述].md`
- 範例：`01v-donnaai-foundation-setup.md`
- 在編號後加上 `v-` 表示已執行完成

## 下一個 PRP 編號

**下一個新建的 PRP 應使用編號：03**

## PRP 類型說明

- **基礎架構** - 專案設置、配置、開發環境
- **功能開發** - 新功能實作
- **整合** - 第三方服務整合
- **UI/UX** - 使用者介面改進
- **測試** - 測試相關功能
- **部署** - 部署和 DevOps

## 注意事項

1. 每個 PRP 都應該是自包含的，包含完整的實作指南
2. PRP 執行前應確認所有依賴已滿足
3. 執行完成後立即更新檔名和此 README
4. 保持 PRP 內容使用繁體中文，檔名使用英文