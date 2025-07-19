#!/bin/bash
echo "修復 Firebase db 使用問題..."
find src/services/firebase -name "*.ts" -type f -exec sed -i '' 's/doc(db,/doc(getFirebaseDb(),/g' {} \;
find src/services/firebase -name "*.ts" -type f -exec sed -i '' 's/collection(db,/collection(getFirebaseDb(),/g' {} \;
echo "修復完成！"