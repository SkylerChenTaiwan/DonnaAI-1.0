const fs = require('fs');
const path = require('path');

class AIVisualAnalyzer {
  async analyzeScreenshots() {
    const screenshotDir = 'tests/screenshots';
    const screenshots = fs.readdirSync(screenshotDir)
      .filter(f => f.endsWith('.png'))
      .sort();
    
    console.log('🤖 AI 視覺分析開始...\n');
    console.log('找到以下截圖檔案：');
    screenshots.forEach(s => console.log(`  - ${s}`));
    
    // 產生分析指令給 AI
    const analysisPrompt = `
請使用 Read 工具查看以下截圖並分析：

${screenshots.map(s => `Read: tests/screenshots/${s}`).join('\n')}

分析重點：
1. 文字是否清晰可見？
2. 背景和文字的對比度是否足夠？
3. 下拉選單是否正常顯示？
4. 按鈕是否有明確的視覺狀態？
5. 是否有任何 UI 元素重疊或錯位？

請提供每張截圖的問題清單。
    `;
    
    console.log('\n📋 分析指令：');
    console.log(analysisPrompt);
    
    // 儲存分析請求
    fs.writeFileSync('tests/screenshots/analysis-request.txt', analysisPrompt);
    console.log('\n✅ 分析請求已儲存至: tests/screenshots/analysis-request.txt');
    console.log('請在 Claude 中執行上述 Read 指令來查看截圖');
  }
  
  async compareBeforeAfter() {
    // 比對修改前後的截圖
    const pairs = [
      ['stage1-before-fix.png', 'stage1-after-fix.png'],
      ['dropdown-before.png', 'dropdown-after.png'],
      ['contrast-before.png', 'contrast-after.png']
    ];
    
    const comparisonReport = [];
    
    for (const [before, after] of pairs) {
      if (fs.existsSync(`tests/screenshots/${before}`) && 
          fs.existsSync(`tests/screenshots/${after}`)) {
        comparisonReport.push({
          before,
          after,
          prompt: `
比較這兩張截圖的差異：
1. Read: tests/screenshots/${before}
2. Read: tests/screenshots/${after}

請指出：
- 對比度改善
- 可讀性提升
- 互動元素的變化
- 任何視覺問題的修復
          `
        });
      }
    }
    
    return comparisonReport;
  }
}

module.exports = AIVisualAnalyzer;