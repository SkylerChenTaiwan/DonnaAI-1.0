/**
 * Babel 插件 - 編譯時清理樣式
 */
module.exports = function() {
  return {
    visitor: {
      JSXAttribute(path) {
        if (path.node.name.name === 'style') {
          // 包裝 style 屬性
          const value = path.node.value;
          if (value && value.expression) {
            const wrappedExpression = {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: '__cleanStyle'
              },
              arguments: [value.expression]
            };
            value.expression = wrappedExpression;
          }
        }
      }
    }
  };
};
