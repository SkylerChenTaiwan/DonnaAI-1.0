#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 要處理的檔案
const files = [
  'src/components/superadmin/onboarding/steps/BillingPlanStep.tsx',
  'src/components/superadmin/onboarding/steps/UserImportStep.tsx',
  'src/components/superadmin/onboarding/steps/WelcomeSetupStep.tsx',
];

// 圖標映射
const iconMappings = {
  'check-circle': 'checkmark-circle',
  'info-outline': 'information-circle-outline',
  'cloud-upload': 'cloud-upload-outline',
  'file-upload': 'document-outline',
  'group': 'people-outline',
  'person-add': 'person-add-outline',
  'email': 'mail-outline',
  'send': 'send-outline',
  'visibility': 'eye-outline',
  'visibility-off': 'eye-off-outline',
  'error-outline': 'alert-circle-outline',
  'warning': 'warning-outline',
  'person': 'person-outline',
  'business': 'business-outline',
  'settings': 'settings-outline',
  'payment': 'card-outline',
  'credit-card': 'card-outline',
  'arrow-drop-down': 'chevron-down',
  'expand-more': 'chevron-down',
  'chevron-right': 'chevron-forward',
  'chevron-left': 'chevron-back',
  'close': 'close',
  'add': 'add',
  'remove': 'remove',
  'check': 'checkmark',
  'clear': 'close-circle',
  'save': 'save-outline',
  'refresh': 'refresh-outline',
  'download': 'download-outline',
  'upload': 'upload-outline',
  'folder': 'folder-outline',
  'description': 'document-text-outline',
  'lock': 'lock-closed-outline',
  'vpn-key': 'key-outline',
};

files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 檔案不存在: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 替換 import
  if (content.includes("import { MaterialIcons }")) {
    content = content.replace(
      "import { MaterialIcons } from '@expo/vector-icons';",
      "import { Ionicons } from '@expo/vector-icons';"
    );
    changed = true;
  }
  
  // 替換元件使用
  content = content.replace(/<MaterialIcons/g, '<Ionicons');
  
  // 替換圖標名稱
  Object.entries(iconMappings).forEach(([old, newIcon]) => {
    const regex = new RegExp(`name="${old}"`, 'g');
    if (content.includes(`name="${old}"`)) {
      content = content.replace(regex, `name="${newIcon}"`);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 更新: ${path.basename(file)}`);
  } else {
    console.log(`⏭️  跳過: ${path.basename(file)} (無需更新)`);
  }
});

console.log('\n完成！');