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

// AI RolePlay HTML 內容
const aiRoleplayHTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AI 業務訓練</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #F5F5F5;
            color: #1A1A1A;
            height: 100vh;
            overflow: hidden;
        }
        
        /* 固定頂部導航 */
        .app-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #FFFFFF;
            border-bottom: 1px solid #E5E7EB;
            display: flex;
            align-items: center;
            padding: 0 16px;
            z-index: 100;
        }
        
        .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: transparent;
            border: none;
            color: #2C2C2C;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            border-radius: 6px;
            -webkit-appearance: none;
        }
        
        .back-button:active {
            background: rgba(0, 0, 0, 0.05);
        }
        
        .header-title {
            flex: 1;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            color: #1A1A1A;
            margin-right: 80px; /* 平衡返回按鈕寬度 */
        }
        
        .container {
            height: 100vh;
            padding-top: 60px; /* 預留 header 空間 */
            display: flex;
            flex-direction: column;
        }
        
        /* 頁面切換 */
        .page {
            display: none;
            flex: 1;
            overflow: hidden;
        }
        
        .page.active {
            display: flex;
            flex-direction: column;
        }
        
        /* 客戶選擇頁面 */
        .persona-selection {
            padding: 16px;
            overflow-y: auto;
            height: 100%;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1A1A1A;
        }
        
        .persona-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
        }
        
        .persona-card {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            border: 1px solid #E5E7EB;
        }
        
        .persona-card:active {
            transform: scale(0.98);
        }
        
        .persona-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .persona-icon {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-right: 12px;
            background-color: #F7F7F7;
        }
        
        .persona-info {
            flex: 1;
        }
        
        .persona-name {
            font-size: 16px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 2px;
        }
        
        .persona-type {
            font-size: 12px;
            color: #666666;
        }
        
        .persona-description {
            font-size: 14px;
            color: #666666;
            line-height: 1.4;
        }
        
        /* 對話頁面 */
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #FFFFFF;
        }
        
        .chat-header {
            background: #FAFAFA;
            padding: 12px 16px;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .customer-info {
            display: flex;
            align-items: center;
        }
        
        .customer-avatar {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-right: 12px;
            background-color: #F7F7F7;
        }
        
        .customer-details {
            flex: 1;
        }
        
        .customer-name {
            font-size: 16px;
            font-weight: 600;
            color: #1A1A1A;
        }
        
        .customer-state {
            font-size: 12px;
            color: #666666;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .pause-button,
        .end-button {
            padding: 6px 12px;
            background: #F7F7F7;
            color: #2C2C2C;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }
        
        .pause-button:active,
        .end-button:active {
            background: #ECECEC;
        }
        
        .end-button {
            background: #2C2C2C;
            color: #FFFFFF;
            border: none;
        }
        
        /* 隱藏指標顯示 */
        .metrics-bar {
            display: none;
        }
        
        /* AI 教練區域 */
        .coach-section {
            background: #FAFAFA;
            border-top: 1px solid #E5E7EB;
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.3s ease;
        }
        
        .coach-section.expanded {
            max-height: 200px;
        }
        
        .coach-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            background: #F7F7F7;
            border-top: 1px solid #E5E7EB;
            cursor: pointer;
            font-size: 14px;
            color: #666666;
            gap: 8px;
        }
        
        .coach-toggle:active {
            background: #ECECEC;
        }
        
        .coach-content {
            padding: 16px;
            height: 150px;
            overflow-y: auto;
        }
        
        .coach-message {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #1A1A1A;
        }
        
        /* 對話區域 */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #FFFFFF;
        }
        
        .message {
            margin-bottom: 16px;
            display: flex;
            align-items: flex-end;
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-bubble {
            max-width: 75%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 15px;
            line-height: 1.4;
            word-wrap: break-word;
        }
        
        .message.customer .message-bubble {
            background: #F7F7F7;
            color: #1A1A1A;
            border-bottom-left-radius: 4px;
        }
        
        .message.user .message-bubble {
            background: #2C2C2C;
            color: #FFFFFF;
            border-bottom-right-radius: 4px;
        }
        
        .message-time {
            font-size: 11px;
            color: #999999;
            margin: 0 8px;
        }
        
        /* 提示訊息 */
        .hint-message {
            background: #FAFAFA;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 14px;
            color: #666666;
        }
        
        .hint-label {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        /* 輸入區域 */
        .input-container {
            background: #FAFAFA;
            border-top: 1px solid #E5E7EB;
            padding: 12px 16px;
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .input-wrapper {
            flex: 1;
            background: #FFFFFF;
            border: 1px solid #D1D5DB;
            border-radius: 20px;
            display: flex;
            align-items: center;
            padding: 8px 16px;
        }
        
        .message-input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 16px;
            resize: none;
            max-height: 100px;
            line-height: 1.4;
            color: #1A1A1A;
            /* 移除 transition 避免白色區塊 */
        }
        
        .message-input::placeholder {
            color: #999999;
        }
        
        .send-button {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            background: #2C2C2C;
            color: #FFFFFF;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        
        .send-button:disabled {
            background: #D1D5DB;
            cursor: not-allowed;
        }
        
        .send-button:active:not(:disabled) {
            background: #1C1C1C;
        }
        
        /* 載入動畫 */
        .loading {
            display: flex;
            justify-content: center;
            padding: 20px;
        }
        
        .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #E5E7EB;
            border-top-color: #2C2C2C;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* 狀態變化提示 */
        .state-change-toast {
            position: fixed;
            top: 80px; /* 在 header 下方 */
            left: 50%;
            transform: translateX(-50%);
            background: #2C2C2C;
            color: #FFFFFF;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
        }
        
        .state-change-toast.show {
            opacity: 0.9;
        }
        
        /* 訓練報告 */
        .report-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 200;
        }
        
        .report-overlay.show {
            display: flex;
        }
        
        .report-container {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 16px;
        }
        
        .report-section {
            margin-bottom: 20px;
        }
        
        .report-section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 8px;
        }
        
        .report-metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .report-metric-label {
            color: #666666;
        }
        
        .report-metric-value {
            font-weight: 600;
            color: #1A1A1A;
        }
        
        .report-suggestions {
            background: #FAFAFA;
            border-radius: 8px;
            padding: 12px;
        }
        
        .report-suggestion {
            font-size: 14px;
            color: #666666;
            margin-bottom: 8px;
            padding-left: 16px;
            position: relative;
        }
        
        .report-suggestion:before {
            content: '•';
            position: absolute;
            left: 0;
        }
        
        .report-close {
            width: 100%;
            padding: 12px;
            background: #2C2C2C;
            color: #FFFFFF;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 16px;
        }
        
        .report-close:active {
            background: #1C1C1C;
        }
    </style>
</head>
<body>
    <!-- 固定頂部導航 -->
    <div class="app-header">
        <button class="back-button" onclick="handleBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            返回
        </button>
        <h1 class="header-title">AI 業務訓練</h1>
    </div>
    
    <div class="container">
        <!-- 客戶選擇頁面 -->
        <div id="personaSelectionPage" class="page active">
            <div class="persona-selection">
                <h2 class="section-title">選擇訓練對象</h2>
                <div id="personaGrid" class="persona-grid">
                    <!-- 動態載入客戶原型 -->
                </div>
            </div>
        </div>
        
        <!-- 對話頁面 -->
        <div id="chatPage" class="page">
            <div class="chat-container">
                <!-- 客戶資訊標題 -->
                <div class="chat-header">
                    <div class="customer-info">
                        <div id="customerAvatar" class="customer-avatar"></div>
                        <div class="customer-details">
                            <div id="customerName" class="customer-name"></div>
                            <div id="customerState" class="customer-state"></div>
                        </div>
                        <div class="action-buttons">
                            <button class="pause-button" onclick="pauseSession()">暫停</button>
                            <button class="end-button" onclick="endSession()">結束訓練</button>
                        </div>
                    </div>
                </div>
                
                <!-- 隱藏的效能指標（內部使用） -->
                <div class="metrics-bar">
                    <div class="metric-item">
                        <div class="metric-label">信任度</div>
                        <div id="trustValue" class="metric-value">5</div>
                        <div class="metric-bar">
                            <div id="trustBar" class="metric-fill" style="width: 50%"></div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">興趣度</div>
                        <div id="interestValue" class="metric-value">5</div>
                        <div class="metric-bar">
                            <div id="interestBar" class="metric-fill" style="width: 50%"></div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">對話輪數</div>
                        <div id="turnCount" class="metric-value">0</div>
                    </div>
                </div>
                
                <!-- 對話訊息區域 -->
                <div id="messagesContainer" class="messages-container"></div>
                
                <!-- AI 教練區域 -->
                <div class="coach-toggle" onclick="toggleCoach()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                    </svg>
                    <span>AI 教練建議</span>
                    <svg id="coachArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" style="transform: rotate(180deg); transition: transform 0.3s;">
                        <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                    </svg>
                </div>
                
                <div id="coachSection" class="coach-section">
                    <div class="coach-content" id="coachContent">
                        <div class="coach-message">點擊獲取 AI 教練的建議...</div>
                    </div>
                </div>
                
                <!-- 輸入區域 -->
                <div class="input-container">
                    <div class="input-wrapper">
                        <textarea 
                            id="messageInput" 
                            class="message-input" 
                            placeholder="輸入訊息..." 
                            rows="1"
                        ></textarea>
                    </div>
                    <button id="sendButton" class="send-button" onclick="sendMessage()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M3 20V4L22 12L3 20V4ZM5 17L16.85 12L5 7V10.5L11 12L5 13.5V17Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 狀態變化提示 -->
    <div id="stateChangeToast" class="state-change-toast"></div>
    
    <!-- 訓練報告 -->
    <div id="reportOverlay" class="report-overlay">
        <div class="report-container">
            <h2 class="report-title">訓練報告</h2>
            <div id="reportContent">
                <!-- 動態生成報告內容 -->
            </div>
            <button class="report-close" onclick="closeReport()">關閉</button>
        </div>
    </div>
    
    <script>
        // 全域狀態管理
        let state = {
            sessionActive: false,
            sessionId: null,
            currentPersona: null,
            messages: [],
            metrics: { trust: 5, interest: 5, turnCount: 0 },
            pendingCallbacks: new Map(),
            sessionStartTime: null,
            stateChanges: 0
        };
        
        // 客戶原型資料（使用灰階設計）
        const customerPersonas = [
            {
                id: 'cautious-sme-owner',
                name: '謹慎型中小企業主',
                icon: '🏢',
                color: '#666666',
                description: '經營傳統產業，對新技術持保留態度，重視投資報酬率',
                type: '中小企業'
            },
            {
                id: 'tech-savvy-manager',
                name: '科技導向經理人',
                icon: '💻',
                color: '#666666',
                description: '熟悉科技產品，追求創新，但預算有限',
                type: '科技業'
            },
            {
                id: 'relationship-buyer',
                name: '關係型採購主管',
                icon: '🤝',
                color: '#666666',
                description: '重視長期合作關係，決策謹慎，需要建立信任',
                type: '製造業'
            },
            {
                id: 'price-sensitive-retailer',
                name: '價格敏感零售商',
                icon: '🏪',
                color: '#999999',
                description: '極度重視價格，經常比價，利潤微薄',
                type: '零售業'
            },
            {
                id: 'busy-executive',
                name: '忙碌高階主管',
                icon: '⏱️',
                color: '#999999',
                description: '時間寶貴，要求效率，只關注核心價值',
                type: '大型企業'
            }
        ];
        
        // 返回按鈕處理
        function handleBack() {
            if (window.DonnaAI) {
                window.DonnaAI.navigateBack();
            } else {
                console.log('返回主應用');
            }
        }
        
        // 初始化
        window.onDonnaAIReady = function() {
            console.log('AI RolePlay WebApp 已就緒');
            checkSavedSession();
            loadPersonas();
        };
        
        // 檢查保存的會話
        function checkSavedSession() {
            if (window.DonnaAI) {
                window.DonnaAI.getData('current_session', (data) => {
                    if (data) {
                        // 顯示恢復提示
                        if (confirm('發現未完成的訓練，是否要繼續？')) {
                            restoreSession(data);
                        } else {
                            // 清除保存的會話
                            window.DonnaAI.saveData('current_session', null);
                        }
                    }
                });
            }
        }
        
        // 恢復會話
        function restoreSession(sessionData) {
            state.sessionId = sessionData.sessionId;
            state.currentPersona = customerPersonas.find(p => p.id === sessionData.personaId);
            state.messages = sessionData.messages;
            state.metrics = sessionData.metrics;
            state.sessionActive = true;
            
            // 切換到對話頁面
            showPage('chatPage');
            updateCustomerInfo(state.currentPersona);
            
            // 重新顯示訊息
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';
            state.messages.forEach(msg => {
                addMessage(msg.sender, msg.content, msg.hint, false);
            });
            
            // 恢復會話
            if (window.DonnaAI) {
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'resumeSession',
                    data: { sessionId: state.sessionId }
                });
            }
        }
        
        // 暫停會話
        function pauseSession() {
            if (!state.sessionActive) return;
            
            const sessionData = {
                sessionId: state.sessionId,
                personaId: state.currentPersona.id,
                messages: state.messages,
                currentState: document.getElementById('customerState').textContent,
                metrics: state.metrics,
                pausedAt: new Date().toISOString()
            };
            
            if (window.DonnaAI) {
                window.DonnaAI.saveData('current_session', sessionData);
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'pauseSession'
                });
            }
            
            alert('訓練已暫停，您可以隨時返回繼續');
            handleBack();
        }
        
        // AI 教練切換
        function toggleCoach() {
            const coachSection = document.getElementById('coachSection');
            const arrow = document.getElementById('coachArrow');
            
            if (coachSection.classList.contains('expanded')) {
                coachSection.classList.remove('expanded');
                arrow.style.transform = 'rotate(180deg)';
            } else {
                coachSection.classList.add('expanded');
                arrow.style.transform = 'rotate(0deg)';
                requestCoachAdvice();
            }
        }
        
        // 請求 AI 教練建議
        function requestCoachAdvice() {
            const recentMessages = state.messages.slice(-3);
            const callbackId = generateCallbackId();
            
            state.pendingCallbacks.set(callbackId, (data) => {
                if (data.advice) {
                    displayCoachAdvice(data.advice);
                }
            });
            
            if (window.DonnaAI) {
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'getCoachAdvice',
                    data: {
                        recentMessages,
                        currentState: document.getElementById('customerState').textContent,
                        metrics: state.metrics
                    },
                    callbackId
                });
            } else {
                // 開發模式模擬
                setTimeout(() => {
                    displayCoachAdvice({
                        type: 'suggestion',
                        content: '試著詢問客戶目前面臨的具體挑戰，這樣可以更好地了解他們的需求。'
                    });
                }, 500);
            }
        }
        
        // 顯示教練建議
        function displayCoachAdvice(advice) {
            const coachContent = document.getElementById('coachContent');
            const adviceDiv = document.createElement('div');
            adviceDiv.className = 'coach-message';
            adviceDiv.textContent = advice.content || advice;
            coachContent.innerHTML = '';
            coachContent.appendChild(adviceDiv);
        }
        
        // 生成回調 ID
        function generateCallbackId() {
            return \`callback_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        }
        
        // 載入客戶原型
        function loadPersonas() {
            const grid = document.getElementById('personaGrid');
            
            // 暫時使用硬編碼資料，實際應透過 Native Bridge 載入
            customerPersonas.forEach(persona => {
                const card = createPersonaCard(persona);
                grid.appendChild(card);
            });
        }
        
        // 建立客戶原型卡片
        function createPersonaCard(persona) {
            const card = document.createElement('div');
            card.className = 'persona-card';
            card.onclick = () => startSession(persona.id);
            
            card.innerHTML = \`
                <div class="persona-header">
                    <div class="persona-icon">
                        \${persona.icon}
                    </div>
                    <div class="persona-info">
                        <div class="persona-name">\${persona.name}</div>
                        <div class="persona-type">\${persona.type}</div>
                    </div>
                </div>
                <div class="persona-description">\${persona.description}</div>
            \`;
            
            return card;
        }
        
        // 開始訓練會話
        function startSession(personaId) {
            const persona = customerPersonas.find(p => p.id === personaId);
            if (!persona) return;
            
            state.currentPersona = persona;
            state.sessionActive = true;
            state.sessionId = \`session_\${Date.now()}\`;
            state.messages = [];
            state.metrics = { trust: 5, interest: 5, turnCount: 0 };
            state.sessionStartTime = new Date();
            state.stateChanges = 0;
            
            // 更新 UI
            updateCustomerInfo(persona);
            showPage('chatPage');
            
            // 透過 Native Bridge 開始會話
            const callbackId = generateCallbackId();
            state.pendingCallbacks.set(callbackId, (data) => {
                if (data.greeting) {
                    addMessage('customer', data.greeting);
                }
            });
            
            if (window.DonnaAI) {
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'startSession',
                    data: { personaId },
                    callbackId
                });
            } else {
                // 開發模式模擬
                setTimeout(() => {
                    addMessage('customer', '您好，我聽說您們有新的解決方案？不過我得先說，我們目前的系統運作得還不錯。');
                }, 500);
            }
        }
        
        // 更新客戶資訊顯示
        function updateCustomerInfo(persona) {
            document.getElementById('customerAvatar').textContent = persona.icon;
            document.getElementById('customerName').textContent = persona.name;
            document.getElementById('customerState').textContent = '狀態：初次接觸';
        }
        
        // 切換頁面
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
        }
        
        // 新增訊息到對話
        function addMessage(sender, content, hint, shouldSave = true) {
            const container = document.getElementById('messagesContainer');
            const messageId = \`msg_\${Date.now()}\`;
            
            // 如果有提示，先顯示提示
            if (hint) {
                const hintDiv = document.createElement('div');
                hintDiv.className = 'hint-message';
                hintDiv.innerHTML = \`
                    <div class="hint-label">💡 提示</div>
                    <div>\${hint}</div>
                \`;
                container.appendChild(hintDiv);
            }
            
            // 建立訊息元素
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            messageDiv.id = messageId;
            
            const time = new Date().toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.innerHTML = \`
                <span class="message-time">\${time}</span>
                <div class="message-bubble">\${content}</div>
            \`;
            
            container.appendChild(messageDiv);
            
            // 儲存到狀態
            if (shouldSave) {
                state.messages.push({
                    id: messageId,
                    sender,
                    content,
                    timestamp: new Date().toISOString(),
                    hint
                });
            }
            
            // 捲動到底部
            container.scrollTop = container.scrollHeight;
        }
        
        // 發送訊息
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            
            if (!content || !state.sessionActive) return;
            
            // 清空輸入框
            input.value = '';
            input.style.height = 'auto';
            
            // 顯示用戶訊息
            addMessage('user', content);
            
            // 顯示載入中
            showLoading(true);
            
            // 透過 Native Bridge 發送
            const callbackId = generateCallbackId();
            state.pendingCallbacks.set(callbackId, (data) => {
                showLoading(false);
                
                if (data.response) {
                    addMessage('customer', data.response, data.hint);
                }
                
                if (data.metrics) {
                    updateMetrics(data.metrics);
                }
                
                if (data.stateChange) {
                    state.stateChanges++;
                    showStateChange(data.stateChange);
                }
                
                // 檢查是否自動結束
                if (data.autoEnd) {
                    handleAutoEnd(data.outcome, data.report);
                }
            });
            
            if (window.DonnaAI) {
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'sendMessage',
                    data: { content },
                    callbackId
                });
            } else {
                // 開發模式模擬
                setTimeout(() => {
                    showLoading(false);
                    const responses = [
                        '這聽起來很有趣，但我需要更多細節。',
                        '我們之前試過類似的方案，但效果不太理想。',
                        '價格是我們主要的考量因素。',
                        '能否提供一些成功案例？'
                    ];
                    const response = responses[Math.floor(Math.random() * responses.length)];
                    addMessage('customer', response);
                    
                    // 模擬指標更新
                    const newMetrics = {
                        trust: Math.min(10, state.metrics.trust + (Math.random() > 0.5 ? 1 : 0)),
                        interest: Math.min(10, state.metrics.interest + (Math.random() > 0.5 ? 1 : -1)),
                        turnCount: state.metrics.turnCount + 1
                    };
                    updateMetrics(newMetrics);
                }, 1000);
            }
        }
        
        // 處理自動結束
        function handleAutoEnd(outcome, report) {
            state.sessionActive = false;
            
            // 清除保存的會話
            if (window.DonnaAI) {
                window.DonnaAI.saveData('current_session', null);
            }
            
            // 顯示訓練報告
            showTrainingReport(outcome, report);
        }
        
        // 顯示訓練報告
        function showTrainingReport(outcome, report) {
            const duration = state.sessionStartTime ? 
                Math.round((new Date() - state.sessionStartTime) / 1000 / 60) : 0;
            
            const reportContent = document.getElementById('reportContent');
            reportContent.innerHTML = \`
                <div class="report-section">
                    <h3 class="report-section-title">訓練結果</h3>
                    <div class="report-metric">
                        <span class="report-metric-label">結果</span>
                        <span class="report-metric-value">\${outcome === 'won' ? '成功成交 🎉' : '失去客戶 😔'}</span>
                    </div>
                    <div class="report-metric">
                        <span class="report-metric-label">訓練時長</span>
                        <span class="report-metric-value">\${duration} 分鐘</span>
                    </div>
                    <div class="report-metric">
                        <span class="report-metric-label">對話輪數</span>
                        <span class="report-metric-value">\${state.metrics.turnCount} 輪</span>
                    </div>
                    <div class="report-metric">
                        <span class="report-metric-label">狀態變化</span>
                        <span class="report-metric-value">\${state.stateChanges} 次</span>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3 class="report-section-title">最終指標</h3>
                    <div class="report-metric">
                        <span class="report-metric-label">信任度</span>
                        <span class="report-metric-value">\${state.metrics.trust}/10</span>
                    </div>
                    <div class="report-metric">
                        <span class="report-metric-label">興趣度</span>
                        <span class="report-metric-value">\${state.metrics.interest}/10</span>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3 class="report-section-title">改進建議</h3>
                    <div class="report-suggestions">
                        \${(report?.suggestions || [
                            '嘗試更早了解客戶的具體需求',
                            '在展示價值時使用更多實際案例',
                            '注意傾聽客戶的擔憂並適時回應'
                        ]).map(s => \`<div class="report-suggestion">\${s}</div>\`).join('')}
                    </div>
                </div>
            \`;
            
            document.getElementById('reportOverlay').classList.add('show');
        }
        
        // 關閉報告
        function closeReport() {
            document.getElementById('reportOverlay').classList.remove('show');
            // 返回選擇頁面
            showPage('personaSelectionPage');
            // 清空對話
            document.getElementById('messagesContainer').innerHTML = '';
            // 重置 AI 教練
            document.getElementById('coachContent').innerHTML = '<div class="coach-message">點擊獲取 AI 教練的建議...</div>';
        }
        
        // 顯示/隱藏載入動畫
        function showLoading(show) {
            const container = document.getElementById('messagesContainer');
            const loadingId = 'loading-indicator';
            
            if (show) {
                const loadingDiv = document.createElement('div');
                loadingDiv.id = loadingId;
                loadingDiv.className = 'loading';
                loadingDiv.innerHTML = '<div class="spinner"></div>';
                container.appendChild(loadingDiv);
                container.scrollTop = container.scrollHeight;
            } else {
                const loading = document.getElementById(loadingId);
                if (loading) loading.remove();
            }
        }
        
        // 更新效能指標（內部使用，不顯示）
        function updateMetrics(metrics) {
            state.metrics = metrics;
            
            // 更新隱藏的指標值
            document.getElementById('trustValue').textContent = metrics.trust;
            document.getElementById('trustBar').style.width = \`\${metrics.trust * 10}%\`;
            document.getElementById('interestValue').textContent = metrics.interest;
            document.getElementById('interestBar').style.width = \`\${metrics.interest * 10}%\`;
            document.getElementById('turnCount').textContent = metrics.turnCount;
        }
        
        // 顯示狀態變化
        function showStateChange(stateChange) {
            document.getElementById('customerState').textContent = \`狀態：\${stateChange}\`;
            
            const toast = document.getElementById('stateChangeToast');
            toast.textContent = \`客戶狀態變化：\${stateChange}\`;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        // 結束會話
        function endSession() {
            if (!confirm('確定要結束這次訓練嗎？')) return;
            
            state.sessionActive = false;
            
            // 生成簡單報告
            const outcome = state.metrics.trust >= 7 && state.metrics.interest >= 7 ? 'won' : 'lost';
            
            // 通知後端
            if (window.DonnaAI) {
                window.DonnaAI.sendMessage('roleplay', {
                    action: 'endSession'
                });
                // 清除保存的會話
                window.DonnaAI.saveData('current_session', null);
            }
            
            // 顯示報告
            showTrainingReport(outcome, null);
        }
        
        // 處理 Native Bridge 回調
        window.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'roleplayCallback' && message.callbackId) {
                    const callback = state.pendingCallbacks.get(message.callbackId);
                    if (callback) {
                        callback(message.data);
                        state.pendingCallbacks.delete(message.callbackId);
                    }
                } else if (message.type === 'saveDataCallback' || message.type === 'getDataCallback') {
                    // 處理儲存/讀取回調
                    console.log('Data callback:', message);
                }
            } catch (error) {
                console.error('處理回調錯誤:', error);
            }
        });
        
        // 自動調整輸入框高度
        document.getElementById('messageInput').addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        
        // Enter 發送訊息（Shift+Enter 換行）
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // 模擬 DonnaAI 物件（開發模式）
        if (!window.DonnaAI) {
            window.DonnaAI = {
                sendMessage: function(type, data) {
                    console.log('Native Bridge:', type, data);
                },
                saveData: function(key, value) {
                    localStorage.setItem(key, JSON.stringify(value));
                },
                getData: function(key, callback) {
                    const value = localStorage.getItem(key);
                    callback(value ? JSON.parse(value) : null);
                },
                navigateBack: function() {
                    console.log('Navigate back');
                }
            };
            
            // 自動觸發準備完成
            setTimeout(() => {
                if (window.onDonnaAIReady) {
                    window.onDonnaAIReady();
                }
            }, 100);
        }
    </script>
</body>
</html>`;

// WebApp 集合
const webApps: Record<string, string> = {
  calculator: calculatorHTML,
  'ai-roleplay': aiRoleplayHTML,
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