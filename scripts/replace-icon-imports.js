const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 找出所有需要替換的檔案
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    '**/node_modules/**',
    '**/*.native.tsx',
    '**/*.native.ts',
    '**/Icon.web.tsx',
    '**/Icon.native.tsx',
    '**/MaterialIcon.web.tsx',
    '**/MaterialIcon.native.tsx'
  ]
});

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // 替換 Ionicons 引用
  if (content.includes("import { Ionicons } from '@expo/vector-icons'")) {
    content = content.replace(
      /import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"]/g,
      "// Icon import removed - using platform-specific Icon component"
    );
    
    // 替換 Ionicons 使用
    content = content.replace(
      /<Ionicons\s+name=["']([^"']+)["']\s*([^/>]*)\s*\/>/g,
      '<Icon name="$1" $2 />'
    );
    
    // 確保有 Icon import
    if (!content.includes("import { Icon }") && content.includes("<Icon ")) {
      const importLine = "import { Icon } from '../components/common/Icon';\n";
      content = importLine + content;
    }
    
    modified = true;
  }

  // 替換 MaterialIcons 引用
  if (content.includes("import { MaterialIcons } from '@expo/vector-icons'")) {
    content = content.replace(
      /import\s*{\s*MaterialIcons\s*}\s*from\s*['"]@expo\/vector-icons['"]/g,
      "// MaterialIcon import removed - using platform-specific MaterialIcon component"
    );
    
    // 替換 MaterialIcons 使用
    content = content.replace(
      /<MaterialIcons\s+name=["']([^"']+)["']\s*([^/>]*)\s*\/>/g,
      '<MaterialIcon name="$1" $2 />'
    );
    
    // 確保有 MaterialIcon import
    if (!content.includes("import { MaterialIcon }") && content.includes("<MaterialIcon ")) {
      const importLine = "import { MaterialIcon } from '../components/common/MaterialIcon';\n";
      content = importLine + content;
    }
    
    modified = true;
  }

  // 處理 Ionicons.glyphMap 類型引用
  if (content.includes("Ionicons.glyphMap")) {
    content = content.replace(/keyof typeof Ionicons\.glyphMap/g, "string");
    modified = true;
  }

  if (modified) {
    // 修正 import 路徑
    const depth = file.split('/').length - 2; // 計算相對路徑深度
    const relativePath = '../'.repeat(depth) + 'components/common';
    
    content = content.replace(
      /import { Icon } from '..\/components\/common\/Icon'/g,
      `import { Icon } from '${relativePath}/Icon'`
    );
    content = content.replace(
      /import { MaterialIcon } from '..\/components\/common\/MaterialIcon'/g,
      `import { MaterialIcon } from '${relativePath}/MaterialIcon'`
    );

    fs.writeFileSync(file, content);
    console.log(`✅ 替換檔案: ${file}`);
    replacedCount++;
  }
});

console.log(`\n總共替換了 ${replacedCount} 個檔案`);