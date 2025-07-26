/**
 * WebApp 載入器
 * 管理和載入所有的 WebApp HTML 內容
 */

// 銷售計算器 HTML 內容
const calculatorHTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>銷售計算器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #F5F5F5;
            color: #000000;
            padding: 16px;
        }
        
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .card {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #000000;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            font-size: 14px;
            color: #8E8E93;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #E5E5EA;
            border-radius: 8px;
            font-size: 16px;
            background: #FFFFFF;
            transition: border-color 0.2s;
        }
        
        input:focus {
            outline: none;
            border-color: #007AFF;
        }
        
        .button {
            width: 100%;
            padding: 14px;
            background: #007AFF;
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .button:active {
            background: #0051D5;
        }
        
        .result {
            background: #F2F2F7;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }
        
        .result-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .result-item:last-child {
            margin-bottom: 0;
            padding-top: 8px;
            border-top: 1px solid #C7C7CC;
            font-weight: 600;
        }
        
        .result-label {
            color: #8E8E93;
        }
        
        .result-value {
            color: #000000;
            font-weight: 500;
        }
        
        .tabs {
            display: flex;
            margin-bottom: 20px;
            background: #F2F2F7;
            border-radius: 8px;
            padding: 4px;
        }
        
        .tab {
            flex: 1;
            padding: 8px;
            background: transparent;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #8E8E93;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .tab.active {
            background: #FFFFFF;
            color: #000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="tabs">
                <button class="tab active" data-tab="commission">佣金計算</button>
                <button class="tab" data-tab="discount">折扣計算</button>
                <button class="tab" data-tab="quote">報價計算</button>
            </div>
            
            <!-- 佣金計算 -->
            <div id="commission" class="tab-content active">
                <h2>佣金計算器</h2>
                <div class="form-group">
                    <label>銷售金額</label>
                    <input type="number" id="salesAmount" placeholder="輸入銷售金額">
                </div>
                <div class="form-group">
                    <label>佣金比例 (%)</label>
                    <input type="number" id="commissionRate" placeholder="輸入佣金比例" value="10">
                </div>
                <button class="button" onclick="calculateCommission()">計算佣金</button>
                <div id="commissionResult" class="result" style="display: none;"></div>
            </div>
            
            <!-- 折扣計算 -->
            <div id="discount" class="tab-content">
                <h2>折扣計算器</h2>
                <div class="form-group">
                    <label>原價</label>
                    <input type="number" id="originalPrice" placeholder="輸入原價">
                </div>
                <div class="form-group">
                    <label>折扣 (%)</label>
                    <input type="number" id="discountRate" placeholder="輸入折扣比例">
                </div>
                <button class="button" onclick="calculateDiscount()">計算折扣價</button>
                <div id="discountResult" class="result" style="display: none;"></div>
            </div>
            
            <!-- 報價計算 -->
            <div id="quote" class="tab-content">
                <h2>報價計算器</h2>
                <div class="form-group">
                    <label>成本價</label>
                    <input type="number" id="costPrice" placeholder="輸入成本價">
                </div>
                <div class="form-group">
                    <label>利潤率 (%)</label>
                    <input type="number" id="profitMargin" placeholder="輸入期望利潤率" value="30">
                </div>
                <div class="form-group">
                    <label>稅率 (%)</label>
                    <input type="number" id="taxRate" placeholder="輸入稅率" value="5">
                </div>
                <button class="button" onclick="calculateQuote()">計算報價</button>
                <div id="quoteResult" class="result" style="display: none;"></div>
            </div>
        </div>
    </div>
    
    <script>
        // 等待 DonnaAI 準備就緒
        window.onDonnaAIReady = function() {
            console.log('DonnaAI 已就緒', window.DonnaAI);
        };
        
        // Tab 切換
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // 更新 tab 狀態
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // 顯示對應內容
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabName).classList.add('active');
            });
        });
        
        // 格式化金額
        function formatCurrency(amount) {
            return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }
        
        // 佣金計算
        function calculateCommission() {
            const salesAmount = parseFloat(document.getElementById('salesAmount').value) || 0;
            const commissionRate = parseFloat(document.getElementById('commissionRate').value) || 0;
            
            if (salesAmount <= 0) {
                showToast('請輸入有效的銷售金額');
                return;
            }
            
            const commission = salesAmount * (commissionRate / 100);
            
            const resultHtml = \`
                <div class="result-item">
                    <span class="result-label">銷售金額</span>
                    <span class="result-value">\${formatCurrency(salesAmount)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">佣金比例</span>
                    <span class="result-value">\${commissionRate}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">佣金金額</span>
                    <span class="result-value">\${formatCurrency(commission)}</span>
                </div>
            \`;
            
            document.getElementById('commissionResult').innerHTML = resultHtml;
            document.getElementById('commissionResult').style.display = 'block';
            
            // 儲存計算記錄
            saveCalculation('commission', {
                salesAmount,
                commissionRate,
                commission,
                timestamp: new Date().toISOString()
            });
        }
        
        // 折扣計算
        function calculateDiscount() {
            const originalPrice = parseFloat(document.getElementById('originalPrice').value) || 0;
            const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;
            
            if (originalPrice <= 0) {
                showToast('請輸入有效的原價');
                return;
            }
            
            const discountAmount = originalPrice * (discountRate / 100);
            const finalPrice = originalPrice - discountAmount;
            
            const resultHtml = \`
                <div class="result-item">
                    <span class="result-label">原價</span>
                    <span class="result-value">\${formatCurrency(originalPrice)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">折扣</span>
                    <span class="result-value">\${discountRate}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">折扣金額</span>
                    <span class="result-value">\${formatCurrency(discountAmount)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">折扣後價格</span>
                    <span class="result-value">\${formatCurrency(finalPrice)}</span>
                </div>
            \`;
            
            document.getElementById('discountResult').innerHTML = resultHtml;
            document.getElementById('discountResult').style.display = 'block';
            
            saveCalculation('discount', {
                originalPrice,
                discountRate,
                discountAmount,
                finalPrice,
                timestamp: new Date().toISOString()
            });
        }
        
        // 報價計算
        function calculateQuote() {
            const costPrice = parseFloat(document.getElementById('costPrice').value) || 0;
            const profitMargin = parseFloat(document.getElementById('profitMargin').value) || 0;
            const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
            
            if (costPrice <= 0) {
                showToast('請輸入有效的成本價');
                return;
            }
            
            const profit = costPrice * (profitMargin / 100);
            const subtotal = costPrice + profit;
            const tax = subtotal * (taxRate / 100);
            const totalPrice = subtotal + tax;
            
            const resultHtml = \`
                <div class="result-item">
                    <span class="result-label">成本價</span>
                    <span class="result-value">\${formatCurrency(costPrice)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">利潤 (\${profitMargin}%)</span>
                    <span class="result-value">\${formatCurrency(profit)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">稅金 (\${taxRate}%)</span>
                    <span class="result-value">\${formatCurrency(tax)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">總報價</span>
                    <span class="result-value">\${formatCurrency(totalPrice)}</span>
                </div>
            \`;
            
            document.getElementById('quoteResult').innerHTML = resultHtml;
            document.getElementById('quoteResult').style.display = 'block';
            
            saveCalculation('quote', {
                costPrice,
                profitMargin,
                taxRate,
                profit,
                tax,
                totalPrice,
                timestamp: new Date().toISOString()
            });
        }
        
        // 顯示提示訊息
        function showToast(message) {
            if (window.DonnaAI) {
                window.DonnaAI.showToast(message);
            } else {
                alert(message);
            }
        }
        
        // 儲存計算記錄
        function saveCalculation(type, data) {
            if (window.DonnaAI) {
                window.DonnaAI.saveData(\`calculation_\${type}_\${Date.now()}\`, data);
            }
        }
    </script>
</body>
</html>`;

// WebApp 集合
const webApps: Record<string, string> = {
  calculator: calculatorHTML,
};

/**
 * 取得 WebApp HTML 內容
 * @param appName WebApp 名稱
 * @returns HTML 內容字串
 */
export function getWebAppHTML(appName: string): string | null {
  return webApps[appName] || null;
}

/**
 * 檢查 WebApp 是否存在
 * @param appName WebApp 名稱
 * @returns 是否存在
 */
export function hasWebApp(appName: string): boolean {
  return appName in webApps;
}