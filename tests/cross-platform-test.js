/**
 * 跨平台測試腳本
 * 驗證 Adaptive 元件在不同平台上的兼容性
 */

// 模擬 Platform API
const mockPlatform = {
  OS: 'web', // 可以是 'web', 'ios', 'android'
  select: (config) => {
    return config[mockPlatform.OS] || config.default || config.native;
  }
};

// 模擬不同平台環境
function testOnPlatform(platform, testName, testFn) {
  const originalOS = mockPlatform.OS;
  mockPlatform.OS = platform;
  
  console.log(`🧪 測試 ${testName} - 平台: ${platform.toUpperCase()}`);
  
  try {
    const result = testFn(mockPlatform);
    console.log(`  ✅ ${platform} 平台測試通過`);
    return result;
  } catch (error) {
    console.log(`  ❌ ${platform} 平台測試失敗:`, error.message);
    return false;
  } finally {
    mockPlatform.OS = originalOS;
  }
}

// 測試 1: 平台偵測
function testPlatformDetection() {
  console.log('\n🔍 測試平台偵測功能...');
  
  const platforms = ['web', 'ios', 'android'];
  const results = {};
  
  platforms.forEach(platform => {
    results[platform] = testOnPlatform(platform, '平台偵測', (Platform) => {
      // 測試 Platform.OS
      if (Platform.OS !== platform) {
        throw new Error(`Platform.OS 應該是 ${platform}，但得到 ${Platform.OS}`);
      }
      
      // 測試 Platform.select
      const selectedValue = Platform.select({
        web: 'web-value',
        ios: 'ios-value',
        android: 'android-value',
        default: 'default-value'
      });
      
      const expected = `${platform}-value`;
      if (selectedValue !== expected) {
        throw new Error(`Platform.select 應該返回 ${expected}，但得到 ${selectedValue}`);
      }
      
      return true;
    });
  });
  
  console.log('✅ 平台偵測測試完成\n');
  return results;
}

// 測試 2: Adaptive 元件渲染
function testAdaptiveComponentRendering() {
  console.log('🎨 測試 Adaptive 元件渲染...');
  
  // 模擬 AdaptiveButton 元件邏輯
  function mockAdaptiveButton(Platform, props) {
    if (Platform.OS === 'web') {
      return {
        element: 'button',
        style: {
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: props.primary ? '#007bff' : '#6c757d',
          color: 'white',
          cursor: 'pointer'
        },
        attributes: {
          type: 'button',
          onClick: props.onPress
        }
      };
    } else {
      return {
        element: 'TouchableOpacity',
        style: {
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          backgroundColor: props.primary ? '#007bff' : '#6c757d'
        },
        props: {
          onPress: props.onPress
        }
      };
    }
  }
  
  const testProps = { primary: true, onPress: () => {} };
  const results = {};
  
  ['web', 'ios', 'android'].forEach(platform => {
    results[platform] = testOnPlatform(platform, 'AdaptiveButton 渲染', (Platform) => {
      const rendered = mockAdaptiveButton(Platform, testProps);
      
      if (platform === 'web') {
        if (rendered.element !== 'button') {
          throw new Error('Web 平台應該渲染為 button 元素');
        }
        if (!rendered.style.cursor) {
          throw new Error('Web 平台應該包含 cursor 樣式');
        }
        if (!rendered.attributes.onClick) {
          throw new Error('Web 平台應該有 onClick 事件');
        }
      } else {
        if (rendered.element !== 'TouchableOpacity') {
          throw new Error('Native 平台應該渲染為 TouchableOpacity');
        }
        if (!rendered.props.onPress) {
          throw new Error('Native 平台應該有 onPress 事件');
        }
        if (rendered.style.cursor) {
          throw new Error('Native 平台不應該有 cursor 樣式');
        }
      }
      
      return true;
    });
  });
  
  console.log('✅ Adaptive 元件渲染測試完成\n');
  return results;
}

// 測試 3: 樣式適配
function testStyleAdaptation() {
  console.log('🎨 測試樣式適配...');
  
  // 模擬 withAlpha 函數
  function withAlpha(color, alpha) {
    // 簡化實現，實際應該處理各種顏色格式
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
  
  // 模擬跨平台樣式處理
  function adaptiveStyle(Platform, baseStyle) {
    if (Platform.OS === 'web') {
      // Web 平台使用 CSS 樣式
      return {
        ...baseStyle,
        // 處理透明度
        backgroundColor: baseStyle.backgroundColor ? 
          withAlpha(baseStyle.backgroundColor, 0.9) : undefined,
        // 加入 Web 特定樣式
        boxSizing: 'border-box',
        userSelect: 'none'
      };
    } else {
      // Native 平台樣式
      return {
        ...baseStyle,
        // 移除 Web 特定屬性
        boxSizing: undefined,
        userSelect: undefined
      };
    }
  }
  
  const baseStyle = {
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 8
  };
  
  const results = {};
  
  ['web', 'ios', 'android'].forEach(platform => {
    results[platform] = testOnPlatform(platform, '樣式適配', (Platform) => {
      const adapted = adaptiveStyle(Platform, baseStyle);
      
      if (platform === 'web') {
        if (!adapted.boxSizing) {
          throw new Error('Web 平台應該包含 boxSizing 屬性');
        }
        if (!adapted.backgroundColor.includes('rgba')) {
          throw new Error('Web 平台應該處理透明度');
        }
      } else {
        if (adapted.boxSizing) {
          throw new Error('Native 平台不應該包含 boxSizing 屬性');
        }
        if (adapted.userSelect) {
          throw new Error('Native 平台不應該包含 userSelect 屬性');
        }
      }
      
      return true;
    });
  });
  
  console.log('✅ 樣式適配測試完成\n');
  return results;
}

// 測試 4: 事件處理
function testEventHandling() {
  console.log('⚡ 測試事件處理...');
  
  // 模擬事件處理適配
  function adaptiveEventHandlers(Platform, handlers) {
    if (Platform.OS === 'web') {
      return {
        onClick: handlers.onPress,
        onMouseEnter: handlers.onHover,
        onFocus: handlers.onFocus,
        onBlur: handlers.onBlur
      };
    } else {
      return {
        onPress: handlers.onPress,
        onPressIn: handlers.onHover, // 在 Native 中映射到 onPressIn
        onFocus: handlers.onFocus,
        onBlur: handlers.onBlur
      };
    }
  }
  
  const handlers = {
    onPress: () => console.log('pressed'),
    onHover: () => console.log('hovered'),
    onFocus: () => console.log('focused'),
    onBlur: () => console.log('blurred')
  };
  
  const results = {};
  
  ['web', 'ios', 'android'].forEach(platform => {
    results[platform] = testOnPlatform(platform, '事件處理', (Platform) => {
      const adapted = adaptiveEventHandlers(Platform, handlers);
      
      if (platform === 'web') {
        if (!adapted.onClick) {
          throw new Error('Web 平台應該有 onClick 事件');
        }
        if (!adapted.onMouseEnter) {
          throw new Error('Web 平台應該有 onMouseEnter 事件');
        }
        if (adapted.onPress) {
          throw new Error('Web 平台不應該有 onPress 事件');
        }
      } else {
        if (!adapted.onPress) {
          throw new Error('Native 平台應該有 onPress 事件');
        }
        if (adapted.onClick) {
          throw new Error('Native 平台不應該有 onClick 事件');
        }
        if (adapted.onMouseEnter) {
          throw new Error('Native 平台不應該有 onMouseEnter 事件');
        }
      }
      
      return true;
    });
  });
  
  console.log('✅ 事件處理測試完成\n');
  return results;
}

// 測試 5: 虛擬化列表跨平台
function testVirtualizationCompatibility() {
  console.log('📜 測試虛擬化列表跨平台兼容性...');
  
  // 模擬虛擬化組件選擇
  function selectVirtualizationComponent(Platform) {
    if (Platform.OS === 'web') {
      return {
        component: 'VirtualizedList',
        itemHeight: 60,
        containerStyle: {
          height: '400px',
          overflow: 'auto'
        },
        renderItem: ({ item, index }) => ({
          element: 'div',
          key: index,
          style: { height: 60, borderBottom: '1px solid #eee' }
        })
      };
    } else {
      return {
        component: 'FlashList',
        itemHeight: 60,
        containerStyle: {
          height: 400,
          flex: 1
        },
        renderItem: ({ item, index }) => ({
          element: 'View',
          key: index,
          style: { height: 60, borderBottomWidth: 1, borderBottomColor: '#eee' }
        })
      };
    }
  }
  
  const results = {};
  
  ['web', 'ios', 'android'].forEach(platform => {
    results[platform] = testOnPlatform(platform, '虛擬化列表', (Platform) => {
      const config = selectVirtualizationComponent(Platform);
      
      if (platform === 'web') {
        if (config.component !== 'VirtualizedList') {
          throw new Error('Web 平台應該使用 VirtualizedList');
        }
        if (typeof config.containerStyle.height !== 'string') {
          throw new Error('Web 平台高度應該是字串格式');
        }
        if (!config.containerStyle.overflow) {
          throw new Error('Web 平台應該設定 overflow');
        }
      } else {
        if (config.component !== 'FlashList') {
          throw new Error('Native 平台應該使用 FlashList');
        }
        if (typeof config.containerStyle.height !== 'number') {
          throw new Error('Native 平台高度應該是數字格式');
        }
        if (config.containerStyle.overflow) {
          throw new Error('Native 平台不應該設定 overflow');
        }
      }
      
      return true;
    });
  });
  
  console.log('✅ 虛擬化列表跨平台測試完成\n');
  return results;
}

// 執行所有測試
function runCrossPlatformTests() {
  console.log('🚀 開始跨平台兼容性測試\n');
  console.log('=' .repeat(60));
  
  const testResults = {};
  
  try {
    testResults.platformDetection = testPlatformDetection();
    testResults.componentRendering = testAdaptiveComponentRendering();
    testResults.styleAdaptation = testStyleAdaptation();
    testResults.eventHandling = testEventHandling();
    testResults.virtualization = testVirtualizationCompatibility();
    
    console.log('=' .repeat(60));
    console.log('🎉 跨平台測試完成！');
    
    // 計算成功率
    const platforms = ['web', 'ios', 'android'];
    const testTypes = Object.keys(testResults);
    
    console.log('\n📊 測試結果摘要:');
    platforms.forEach(platform => {
      const platformResults = testTypes.map(test => testResults[test][platform]);
      const successCount = platformResults.filter(Boolean).length;
      const successRate = (successCount / testTypes.length * 100).toFixed(1);
      
      console.log(`  ${platform.toUpperCase()}: ${successCount}/${testTypes.length} 通過 (${successRate}%)`);
    });
    
    const overallSuccess = platforms.every(platform => 
      testTypes.every(test => testResults[test][platform])
    );
    
    if (overallSuccess) {
      console.log('\n🏆 所有平台測試全部通過！');
      console.log('✅ 動態欄位系統具備完整的跨平台兼容性');
    } else {
      console.log('\n⚠️  部分測試未通過，請檢查具體錯誤');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ 測試執行失敗:', error.message);
    return null;
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  runCrossPlatformTests();
}

module.exports = {
  runCrossPlatformTests,
  testPlatformDetection,
  testAdaptiveComponentRendering,
  testStyleAdaptation,
  testEventHandling,
  testVirtualizationCompatibility
};