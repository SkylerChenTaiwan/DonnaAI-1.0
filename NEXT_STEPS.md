# 🎯 下一步行動

## 1️⃣ 立即執行（在終端機）
```bash
# 登入 EAS
eas login

# 查看專案資訊
eas project:info
```

## 2️⃣ 收集資訊
打開 `docs/ios-production-checklist.md`，按照檢查清單收集：
- Firebase 配置（從 Firebase Console）
- EAS 專案 ID（從上面的命令）
- Apple 開發者資訊

## 3️⃣ 更新配置
1. 編輯 `scripts/update-eas-config.js`
2. 填入實際的配置值
3. 執行：`node scripts/update-eas-config.js`

## 4️⃣ 建立測試帳號
```bash
# 載入環境變數
export $(cat .env.production | grep -v '^#' | xargs)

# 執行腳本
npx ts-node scripts/prepare-review-account.ts
```

## 5️⃣ 開始建置
```bash
eas build --platform ios --profile production
```

---

需要幫助？請告訴我您在哪一步遇到問題！