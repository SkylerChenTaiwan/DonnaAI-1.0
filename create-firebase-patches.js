const fs = require('fs');
const path = require('path');

console.log('\n🔧 正在移除 Firebase 套件的 exports 欄位...\n');

const firebasePackages = [
  'firebase',
  '@firebase/app',
  '@firebase/auth',
  '@firebase/firestore',
  '@firebase/functions',
  '@firebase/storage',
  '@firebase/analytics',
  '@firebase/app-check',
  '@firebase/app-compat',
  '@firebase/auth-compat',
  '@firebase/database',
  '@firebase/database-compat',
  '@firebase/firestore-compat',
  '@firebase/functions-compat',
  '@firebase/installations',
  '@firebase/installations-compat',
  '@firebase/messaging',
  '@firebase/messaging-compat',
  '@firebase/performance',
  '@firebase/performance-compat',
  '@firebase/remote-config',
  '@firebase/remote-config-compat',
  '@firebase/storage-compat',
  '@firebase/util',
  '@firebase/component',
  '@firebase/logger',
  '@firebase/webchannel-wrapper'
];

let modifiedCount = 0;

function removeExportsField(packagePath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.exports) {
      delete packageJson.exports;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

firebasePackages.forEach(pkg => {
  const packagePath = path.join(__dirname, 'node_modules', pkg, 'package.json');
  if (fs.existsSync(packagePath)) {
    if (removeExportsField(packagePath)) {
      console.log(`✅ 已移除 ${pkg} 的 exports 欄位`);
      modifiedCount++;
    }
  }
});

console.log(`\n總共修改了 ${modifiedCount} 個套件\n`);