/**
 * ESLint Plugin for Adaptive Architecture
 * 檢查是否正確使用 Adaptive Components 和 Platform 適配器
 */

module.exports = {
  meta: {
    name: 'eslint-plugin-adaptive',
    version: '1.0.0',
  },
  
  rules: {
    // 禁止直接使用 Platform.OS
    'no-direct-platform-os': {
      meta: {
        type: 'problem',
        docs: {
          description: '禁止直接使用 Platform.OS，應使用 PlatformAdapter',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [{
          type: 'object',
          properties: {
            allowedFiles: {
              type: 'array',
              items: { type: 'string' },
              description: '允許使用 Platform.OS 的文件列表'
            }
          },
          additionalProperties: false
        }]
      },
      
      create(context) {
        const allowedFiles = context.options[0]?.allowedFiles || [
          'PlatformAdapter.ts',
          'WebStyleAdapter.ts', 
          'NativeStyleAdapter.ts'
        ];
        
        const filename = context.getFilename();
        const isAllowed = allowedFiles.some(pattern => 
          filename.includes(pattern) || filename.match(new RegExp(pattern))
        );
        
        if (isAllowed) return {};
        
        return {
          MemberExpression(node) {
            if (
              node.object && 
              node.object.name === 'Platform' && 
              node.property && 
              node.property.name === 'OS'
            ) {
              context.report({
                node,
                message: '不應直接使用 Platform.OS，請使用 PlatformAdapter.getInstance().isWeb 或類似方法',
                fix(fixer) {
                  return fixer.replaceText(
                    node, 
                    'PlatformAdapter.getInstance().isWeb'
                  );
                }
              });
            }
          },
          
          ImportDeclaration(node) {
            if (node.source.value === 'react-native') {
              const platformSpecifier = node.specifiers.find(spec => 
                spec.imported && spec.imported.name === 'Platform'
              );
              
              if (platformSpecifier) {
                context.report({
                  node: platformSpecifier,
                  message: '不應直接匯入 Platform，請使用 PlatformAdapter',
                });
              }
            }
          }
        };
      }
    },

    // 禁止直接使用原生 React Native 元件
    'prefer-adaptive-components': {
      meta: {
        type: 'suggestion',
        docs: {
          description: '建議使用 Adaptive 元件而非原生 RN 元件',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [{
          type: 'object',
          properties: {
            strictMode: {
              type: 'boolean',
              description: '嚴格模式 - 禁止使用原生元件'
            }
          }
        }]
      },
      
      create(context) {
        const strictMode = context.options[0]?.strictMode || false;
        
        const componentMapping = {
          'View': 'AdaptiveView',
          'Text': 'AdaptiveText', 
          'TouchableOpacity': 'AdaptiveButton',
          'TextInput': 'AdaptiveInput',
          'Image': 'AdaptiveImage',
          'Modal': 'AdaptiveModal',
        };
        
        const severity = strictMode ? 'error' : 'warning';
        
        return {
          ImportDeclaration(node) {
            if (node.source.value === 'react-native') {
              node.specifiers.forEach(spec => {
                if (spec.imported && componentMapping[spec.imported.name]) {
                  const message = `建議使用 ${componentMapping[spec.imported.name]} 替代 ${spec.imported.name}`;
                  
                  context.report({
                    node: spec,
                    message,
                    severity,
                    fix(fixer) {
                      const adaptiveImport = `import { ${componentMapping[spec.imported.name]} } from '@components/adaptive/core';`;
                      return [
                        fixer.insertTextBefore(node, adaptiveImport + '\n'),
                        fixer.remove(spec)
                      ];
                    }
                  });
                }
              });
            }
          },
          
          JSXOpeningElement(node) {
            const componentName = node.name.name;
            if (componentMapping[componentName]) {
              context.report({
                node,
                message: `建議使用 ${componentMapping[componentName]} 替代 ${componentName}`,
                severity,
                fix(fixer) {
                  return fixer.replaceText(node.name, componentMapping[componentName]);
                }
              });
            }
          }
        };
      }
    },

    // 檢查設計系統使用率
    'enforce-design-system': {
      meta: {
        type: 'suggestion',
        docs: {
          description: '強制使用設計系統 tokens',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [{
          type: 'object',
          properties: {
            checkColors: { type: 'boolean', default: true },
            checkSpacing: { type: 'boolean', default: true },
            checkTypography: { type: 'boolean', default: true }
          }
        }]
      },
      
      create(context) {
        const options = context.options[0] || {};
        const { checkColors = true, checkSpacing = true, checkTypography = true } = options;
        
        // 硬編碼顏色檢查
        const hardcodedColorRegex = /#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)/;
        
        // 硬編碼間距檢查
        const hardcodedSpacingProps = [
          'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
          'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
        ];
        
        return {
          Property(node) {
            if (!node.key || !node.value) return;
            
            const propertyName = node.key.name || node.key.value;
            const propertyValue = node.value.value;
            
            // 檢查硬編碼顏色
            if (checkColors && (propertyName === 'color' || propertyName === 'backgroundColor')) {
              if (typeof propertyValue === 'string' && hardcodedColorRegex.test(propertyValue)) {
                context.report({
                  node: node.value,
                  message: `避免使用硬編碼顏色 "${propertyValue}"，請使用 DesignSystem.colors`,
                });
              }
            }
            
            // 檢查硬編碼間距
            if (checkSpacing && hardcodedSpacingProps.includes(propertyName)) {
              if (typeof propertyValue === 'number' && ![0, '0'].includes(propertyValue)) {
                context.report({
                  node: node.value,
                  message: `避免使用硬編碼間距 "${propertyValue}"，請使用 DesignSystem.spacing`,
                });
              }
            }
            
            // 檢查硬編碼字體大小
            if (checkTypography && propertyName === 'fontSize') {
              if (typeof propertyValue === 'number') {
                context.report({
                  node: node.value,
                  message: `避免使用硬編碼字體大小 "${propertyValue}"，請使用 DesignSystem.typography`,
                });
              }
            }
          }
        };
      }
    },

    // 檢查 Web 特有程式碼未正確處理
    'check-web-specific-code': {
      meta: {
        type: 'problem',
        docs: {
          description: '檢查 Web 特有程式碼是否正確處理平台差異',
          category: 'Best Practices',
          recommended: true,
        }
      },
      
      create(context) {
        const webSpecificAPIs = [
          'document', 'window', 'localStorage', 'sessionStorage',
          'fetch', 'XMLHttpRequest', 'addEventListener', 'removeEventListener'
        ];
        
        const webSpecificProps = [
          'className', 'onClick', 'onMouseEnter', 'onMouseLeave',
          'onKeyDown', 'onKeyUp', 'tabIndex', 'role', 'aria-label'
        ];
        
        return {
          Identifier(node) {
            if (webSpecificAPIs.includes(node.name)) {
              // 檢查是否在平台檢查內
              let current = node.parent;
              let hasPlatformCheck = false;
              
              while (current && current.type !== 'Program') {
                if (current.type === 'IfStatement' && current.test) {
                  const testSource = context.getSourceCode().getText(current.test);
                  if (testSource.includes('isWeb') || testSource.includes('Platform.OS')) {
                    hasPlatformCheck = true;
                    break;
                  }
                }
                current = current.parent;
              }
              
              if (!hasPlatformCheck) {
                context.report({
                  node,
                  message: `Web 特有 API "${node.name}" 應該包裝在平台檢查中`,
                });
              }
            }
          },
          
          JSXAttribute(node) {
            if (webSpecificProps.includes(node.name.name)) {
              // 檢查是否在 Web 元件或條件渲染中
              let current = node.parent;
              let isInWebComponent = false;
              
              while (current && current.type !== 'Program') {
                if (current.type === 'JSXOpeningElement') {
                  const componentName = current.name.name;
                  if (componentName && componentName.includes('Web')) {
                    isInWebComponent = true;
                    break;
                  }
                }
                current = current.parent;
              }
              
              if (!isInWebComponent) {
                context.report({
                  node,
                  message: `Web 特有屬性 "${node.name.name}" 應該在 Web 特定元件中使用`,
                });
              }
            }
          }
        };
      }
    },

    // 檢查是否缺少跨平台屬性
    'require-cross-platform-props': {
      meta: {
        type: 'suggestion',
        docs: {
          description: '檢查是否提供跨平台等效屬性',
          category: 'Best Practices',
          recommended: true,
        }
      },
      
      create(context) {
        const crossPlatformMappings = {
          'onClick': 'onPress',
          'onMouseEnter': 'onPressIn', 
          'onMouseLeave': 'onPressOut',
          'className': 'style',
          'htmlFor': 'accessibilityLabel'
        };
        
        return {
          JSXOpeningElement(node) {
            const componentName = node.name.name;
            
            // 只檢查 Adaptive 元件
            if (!componentName || !componentName.startsWith('Adaptive')) {
              return;
            }
            
            const attributes = node.attributes || [];
            const attributeNames = attributes
              .filter(attr => attr.type === 'JSXAttribute')
              .map(attr => attr.name.name);
            
            // 檢查是否有 Web 屬性但沒有對應的跨平台屬性
            attributeNames.forEach(attrName => {
              const crossPlatformEquiv = crossPlatformMappings[attrName];
              
              if (crossPlatformEquiv && !attributeNames.includes(crossPlatformEquiv)) {
                context.report({
                  node,
                  message: `使用 "${attrName}" 時建議同時提供跨平台屬性 "${crossPlatformEquiv}"`,
                });
              }
            });
          }
        };
      }
    }
  },
  
  configs: {
    recommended: {
      plugins: ['adaptive'],
      rules: {
        'adaptive/no-direct-platform-os': 'error',
        'adaptive/prefer-adaptive-components': 'warn',
        'adaptive/enforce-design-system': 'warn',
        'adaptive/check-web-specific-code': 'error',
        'adaptive/require-cross-platform-props': 'warn',
      }
    },
    
    strict: {
      plugins: ['adaptive'],
      rules: {
        'adaptive/no-direct-platform-os': 'error',
        'adaptive/prefer-adaptive-components': ['error', { strictMode: true }],
        'adaptive/enforce-design-system': 'error',
        'adaptive/check-web-specific-code': 'error', 
        'adaptive/require-cross-platform-props': 'error',
      }
    }
  }
};