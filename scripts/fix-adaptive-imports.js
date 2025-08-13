#!/usr/bin/env node

/**
 * Fix AdaptiveButton import issues
 * Ensures all files using AdaptiveButton/AdaptiveInput have correct imports
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file uses AdaptiveButton or AdaptiveInput
  const usesAdaptiveButton = content.includes('<AdaptiveButton');
  const usesAdaptiveInput = content.includes('<AdaptiveInput');
  const usesAdaptiveModal = content.includes('<AdaptiveModal');
  
  if (!usesAdaptiveButton && !usesAdaptiveInput && !usesAdaptiveModal) {
    return false;
  }
  
  // Check current imports
  const hasAdaptiveImport = content.includes("from '@/components/adaptive'");
  
  if (hasAdaptiveImport) {
    // Fix existing import
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/components\/adaptive['"]/;
    const match = content.match(importRegex);
    
    if (match) {
      const imports = match[1].split(',').map(i => i.trim());
      const newImports = new Set(imports);
      
      // Replace old names with new ones
      if (newImports.has('Button')) {
        newImports.delete('Button');
        newImports.add('AdaptiveButton');
      }
      if (newImports.has('TextInput')) {
        newImports.delete('TextInput');
        newImports.add('AdaptiveInput');
      }
      if (newImports.has('Modal')) {
        newImports.delete('Modal');
        newImports.add('AdaptiveModal');
      }
      
      // Add missing imports
      if (usesAdaptiveButton && !newImports.has('AdaptiveButton')) {
        newImports.add('AdaptiveButton');
      }
      if (usesAdaptiveInput && !newImports.has('AdaptiveInput')) {
        newImports.add('AdaptiveInput');
      }
      if (usesAdaptiveModal && !newImports.has('AdaptiveModal')) {
        newImports.add('AdaptiveModal');
      }
      
      const newImportStr = `import {\n  ${Array.from(newImports).join(',\n  ')}\n} from '@/components/adaptive'`;
      content = content.replace(importRegex, newImportStr);
      modified = true;
    }
  } else {
    // Add new import
    const components = [];
    if (usesAdaptiveButton) components.push('AdaptiveButton');
    if (usesAdaptiveInput) components.push('AdaptiveInput');
    if (usesAdaptiveModal) components.push('AdaptiveModal');
    
    if (components.length > 0) {
      const newImport = `import { ${components.join(', ')} } from '@/components/adaptive';\n`;
      
      // Find where to insert (after last import)
      const lastImportMatch = content.match(/^import[^;]+;?\n/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        content = content.slice(0, lastImportIndex + lastImport.length) + 
                  newImport + 
                  content.slice(lastImportIndex + lastImport.length);
      } else {
        // Add at the beginning of file
        content = newImport + content;
      }
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const files = glob.sync('src/**/*.tsx', {
  ignore: ['src/**/*.test.tsx', 'src/**/*.spec.tsx', 'src/components/adaptive/**']
});

console.log(`🔍 Checking ${files.length} files...`);

let fixedCount = 0;
files.forEach(file => {
  if (fixImports(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);