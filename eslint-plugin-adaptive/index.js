/**
 * ESLint 外掛：強制使用 Adaptive 元件
 * 自動偵測並修復不當的 React Native 元件使用
 */

module.exports = {
  rules: {
    'use-adaptive-components': {
      meta: {
        type: 'problem',
        docs: {
          description: '強制使用 Adaptive 元件替代 React Native 原生元件',
          category: 'Best Practices',
          recommended: true
        },
        fixable: 'code',
        schema: [],
        messages: {
          useAdaptive: '使用 Adaptive{{componentName}} 替代 {{componentName}}',
          useAdaptiveImport: '從 "@/components/adaptive" import Adaptive{{componentName}}'
        }
      },
      create(context) {
        const componentMapping = {
          'Switch': 'AdaptiveSwitch',
          'Picker': 'AdaptiveSelect',
          'Modal': 'AdaptiveModal',
          'TextInput': 'AdaptiveInput',
          'Button': 'AdaptiveButton'
        };

        return {
          ImportDeclaration(node) {
            // 檢查 react-native imports
            if (node.source.value === 'react-native') {
              const problematicImports = node.specifiers.filter(spec => 
                spec.type === 'ImportSpecifier' &&
                Object.keys(componentMapping).includes(spec.imported.name)
              );
              
              problematicImports.forEach(spec => {
                context.report({
                  node: spec,
                  messageId: 'useAdaptiveImport',
                  data: {
                    componentName: spec.imported.name
                  },
                  fix(fixer) {
                    const adaptiveName = componentMapping[spec.imported.name];
                    
                    // 如果只有這一個 import，替換整個 import statement
                    if (node.specifiers.length === 1) {
                      return fixer.replaceText(
                        node,
                        `import { ${adaptiveName} } from '@/components/adaptive';`
                      );
                    }
                    
                    // 否則只移除這個 specifier
                    const fixes = [];
                    const start = spec.range[0];
                    const end = spec.range[1];
                    
                    // 檢查是否需要移除逗號
                    const sourceCode = context.getSourceCode();
                    const tokenAfter = sourceCode.getTokenAfter(spec);
                    const tokenBefore = sourceCode.getTokenBefore(spec);
                    
                    if (tokenAfter && tokenAfter.value === ',') {
                      fixes.push(fixer.removeRange([start, tokenAfter.range[1]]));
                    } else if (tokenBefore && tokenBefore.value === ',') {
                      fixes.push(fixer.removeRange([tokenBefore.range[0], end]));
                    } else {
                      fixes.push(fixer.remove(spec));
                    }
                    
                    // 加入新的 import
                    fixes.push(
                      fixer.insertTextAfter(
                        node,
                        `\nimport { ${adaptiveName} } from '@/components/adaptive';`
                      )
                    );
                    
                    return fixes;
                  }
                });
              });
            }
            
            // 檢查 @react-native-picker/picker
            if (node.source.value === '@react-native-picker/picker') {
              context.report({
                node,
                messageId: 'useAdaptive',
                data: {
                  componentName: 'Select'
                },
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `import { AdaptiveSelect } from '@/components/adaptive';`
                  );
                }
              });
            }
          },
          
          JSXOpeningElement(node) {
            // 檢查 JSX 使用
            const elementName = node.name.name;
            if (Object.keys(componentMapping).includes(elementName)) {
              context.report({
                node,
                messageId: 'useAdaptive',
                data: {
                  componentName: elementName
                },
                fix(fixer) {
                  const adaptiveName = componentMapping[elementName];
                  return fixer.replaceText(node.name, adaptiveName);
                }
              });
            }
          },
          
          JSXClosingElement(node) {
            // 檢查 JSX 關閉標籤
            if (node.name) {
              const elementName = node.name.name;
              if (Object.keys(componentMapping).includes(elementName)) {
                const adaptiveName = componentMapping[elementName];
                context.report({
                  node,
                  messageId: 'useAdaptive',
                  data: {
                    componentName: elementName
                  },
                  fix(fixer) {
                    return fixer.replaceText(node.name, adaptiveName);
                  }
                });
              }
            }
          }
        };
      }
    },
    
    'check-adaptive-availability': {
      meta: {
        type: 'suggestion',
        docs: {
          description: '檢查是否有可用的 Adaptive 元件',
          category: 'Best Practices',
          recommended: true
        },
        schema: [],
        messages: {
          checkAdaptive: '考慮使用 Adaptive 元件以確保跨平台相容性'
        }
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            // 提示開發者檢查是否有 Adaptive 版本
            if (node.source.value === 'react-native') {
              const uiComponents = ['ScrollView', 'FlatList', 'SectionList', 'TouchableOpacity', 'TouchableHighlight'];
              const hasUIComponent = node.specifiers.some(spec => 
                spec.type === 'ImportSpecifier' &&
                uiComponents.includes(spec.imported.name)
              );
              
              if (hasUIComponent) {
                context.report({
                  node,
                  messageId: 'checkAdaptive'
                });
              }
            }
          }
        };
      }
    }
  }
};