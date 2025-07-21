# 前端頁面設計規範 - Design Specification

## 🎨 設計系統基礎

### 色彩系統
```yaml
Primary Colors:
  - primary: "#1A1A1A"          # 深灰黑（主要互動元素、選中狀態）
  - accent: "#FF5C00"           # 橘色（極少使用，只用於關鍵 CTA）
  - primary-hover: "#333333"    # 深灰 hover 狀態
  - primary-pressed: "#000000"  # 純黑按下狀態

Background Colors:
  - background: "#F5F5F5"       # 淺灰白（主背景）
  - card-background: "#FFFFFF"  # 純白（卡片背景）
  - section-background: "#F0F0F0" # 區塊背景（低對比灰）

Text Colors:
  - text-primary: "#1A1A1A"     # 深灰黑（主要文字）
  - text-secondary: "#666666"   # 中灰（次要文字）
  - text-tertiary: "#999999"    # 淺灰（輔助文字）

Status Colors:
  - success: "#22C55E"          # 綠色（成功）
  - warning: "#F59E0B"          # 黃橙色（警告）
  - error: "#EF4444"            # 紅色（錯誤）
  - info: "#6B7280"             # 中性灰（資訊）

Border Colors:
  - border-light: "#E5E7EB"     # 淺灰邊框
  - border-medium: "#D1D5DB"    # 中灰邊框
  - border-dark: "#9CA3AF"      # 深灰邊框
```

### 字體系統
```yaml
Font Family:
  - primary: "San Francisco" (iOS) / "Roboto" (Android)
  - monospace: "SF Mono" (iOS) / "Roboto Mono" (Android)

Font Sizes:
  - xs: 12px        # 小標籤、輔助文字
  - sm: 14px        # 正文、按鈕文字
  - md: 16px        # 預設文字大小
  - lg: 18px        # 卡片標題
  - xl: 20px        # 頁面標題
  - 2xl: 24px       # 大標題
  - 3xl: 30px       # 主要標題

Font Weights:
  - normal: 400     # 正文
  - medium: 500     # 強調文字
  - semibold: 600   # 按鈕、標題
  - bold: 700       # 重要標題
```

### 間距系統
```yaml
Spacing Scale:
  - xs: 4px         # 極小間距
  - sm: 8px         # 小間距
  - md: 12px        # 中等間距
  - lg: 16px        # 大間距
  - xl: 24px        # 超大間距
  - 2xl: 32px       # 區塊間距
  - 3xl: 48px       # 頁面間距

Padding Standards:
  - card-padding: 16px
  - screen-padding: 24px
  - section-padding: 16px
  - button-padding: "12px 16px"
```

### 圓角與陰影
```yaml
Border Radius:
  - xs: 4px         # 小元素
  - sm: 8px         # 按鈕、輸入框
  - md: 12px        # 卡片
  - lg: 16px        # 大卡片
  - xl: 24px        # 特殊元素
  - full: 50%       # 圓形

Shadow Levels:
  - level-1: "0 1px 2px rgba(0,0,0,0.05)"    # 輕微陰影
  - level-2: "0 2px 4px rgba(0,0,0,0.1)"     # 卡片陰影
  - level-3: "0 4px 8px rgba(0,0,0,0.15)"    # 浮動陰影
  - level-4: "0 8px 16px rgba(0,0,0,0.2)"    # 強陰影
```

## 📱 頁面佈局規範

### 底部導航欄
```yaml
Dimensions:
  - height: 88px (包含安全區域)
  - icon-size: 24px
  - font-size: 12px
  - padding: "8px 0"

Visual Design:
  - background: "#FFFFFF"
  - border-top: "1px solid #E5E5EA"
  - active-color: "#1A1A1A"
  - inactive-color: "#999999"
  
Tab Items:
  1. 首頁 (analytics icon)
  2. 資料庫 (people icon)
  3. 新增 (add-circle icon) - 特殊樣式
  4. 小工具 (build icon)
  5. 設定 (person icon)

Special Tab (新增按鈕):
  - background: "#FF5C00"
  - color: "#FFFFFF"
  - border-radius: 20px
  - size: 40px x 40px
  - position: center, slightly elevated
```

### 彈出氣球設計
```yaml
Overlay:
  - background: "rgba(0,0,0,0.3)"
  - animation: fade-in 200ms

Bubble Container:
  - background: "#FFFFFF"
  - border-radius: 16px
  - padding: 16px
  - shadow: level-4
  - position: center-bottom, 120px from bottom
  - width: 280px

Action Items:
  - height: 56px each
  - padding: 12px 16px
  - border-radius: 8px
  - gap: 8px between items
  - hover: background "#F2F2F7"

Action Item Layout:
  - icon: 24px, left aligned
  - title: 16px semibold, "#1C1C1E"
  - subtitle: 14px regular, "#8E8E93"
  - chevron: 16px, right aligned
```

### 首頁設計
```yaml
Header Section:
  - padding: 24px
  - background: "#FFFFFF"
  - border-bottom: "1px solid #E5E5EA"

Welcome Text:
  - font-size: 24px
  - font-weight: 700
  - color: "#1C1C1E"
  - margin-bottom: 4px

Mode Toggle:
  - position: top-right
  - size: 44px x 24px
  - background: "#E5E7EB" (off), "#1A1A1A" (on)
  - thumb: 20px circle, "#FFFFFF"
  - animation: 200ms ease

Stats Cards:
  - layout: 4 cards in row
  - gap: 12px
  - padding: 16px
  - background: "#FFFFFF"
  - border-radius: 12px
  - shadow: level-1

Stat Card Content:
  - value: 24px bold, colored by type
  - label: 12px regular, "#8E8E93"
  - alignment: center

Quick Actions Grid:
  - layout: 2 columns
  - gap: 12px
  - padding: 16px

Action Card:
  - width: 47% (responsive)
  - padding: 16px
  - background: "#FFFFFF"
  - border-radius: 12px
  - shadow: level-1
  - alignment: center

Action Card Content:
  - icon: 48px circle, colored background (15% opacity)
  - title: 14px semibold, margin-top: 12px
  - subtitle: 12px regular, "#8E8E93"
```

### 資料庫頁面設計
```yaml
Tab Navigation:
  - height: 44px
  - background: "#FFFFFF"
  - border-bottom: "1px solid #E5E5EA"

Tab Item:
  - padding: 12px 16px
  - font-size: 16px
  - font-weight: 500
  - active: "#FF5C00" text + bottom border
  - inactive: "#7A7A7A" text

Search Bar:
  - height: 44px
  - margin: 16px
  - background: "#E1DFDB"
  - border-radius: 8px
  - padding: 12px 16px
  - icon: search, 20px, left
  - placeholder: "搜尋..."

Filter Button:
  - position: right of search
  - size: 44px x 44px
  - background: "#E1DFDB"
  - border-radius: 8px
  - icon: filter, 20px

Table Header:
  - height: 44px
  - background: "#ECE9E3"
  - border-bottom: "1px solid #E3E1DC"
  - padding: 12px 16px
  - font-size: 14px
  - font-weight: 600

Table Row:
  - height: 60px
  - padding: 12px 16px
  - border-bottom: "1px solid #E3E1DC"
  - background: "#F7F6F3"
  - press-state: "#E1DFDB"

Selection Checkbox:
  - size: 20px
  - position: left margin
  - color: "#FF5C00"
  - border-radius: 4px

Bulk Actions Bar:
  - height: 60px
  - background: "#FF5C00"
  - position: bottom, above tab bar
  - padding: 12px 16px
  - slide-up animation
```

### 小工具頁面設計
```yaml
Search Section:
  - padding: 16px
  - background: "#FFFFFF"

Tool Grid:
  - layout: 2 columns
  - gap: 16px
  - padding: 16px

Tool Card:
  - aspect-ratio: 1:1.2
  - background: "#FFFFFF"
  - border-radius: 12px
  - shadow: level-1
  - padding: 16px

Tool Card Content:
  - cover: 80px x 80px, top center
  - title: 16px semibold, margin-top: 12px
  - description: 14px regular, "#8E8E93"
  - badge: coming soon, top-right corner
```

### 設定頁面設計
```yaml
Section Header:
  - padding: 24px 16px 8px
  - font-size: 14px
  - font-weight: 600
  - color: "#8E8E93"
  - text-transform: uppercase

Setting Item:
  - height: 56px
  - padding: 12px 16px
  - background: "#FFFFFF"
  - border-bottom: "1px solid #F2F2F7"

Setting Item Layout:
  - icon: 24px, left, colored circle background
  - title: 16px regular, main text
  - subtitle: 14px, "#8E8E93", below title
  - control: switch/chevron, right aligned

Toggle Switch:
  - size: 44px x 24px
  - track: "#E5E7EB" (off), "#1A1A1A" (on)
  - thumb: 20px circle, "#FFFFFF"
```

## 🎯 互動設計規範

### 按鈕狀態
```yaml
Default State:
  - background: defined by variant
  - text: defined by variant
  - shadow: none

Hover State (Web):
  - opacity: 0.8
  - transition: 150ms ease

Pressed State:
  - opacity: 0.6
  - scale: 0.98
  - transition: 100ms ease

Disabled State:
  - background: "#F2F2F7"
  - text: "#8E8E93"
  - opacity: 0.6
```

### 動畫規範
```yaml
Page Transitions:
  - duration: 300ms
  - easing: ease-in-out
  - type: slide-horizontal

Modal Animations:
  - enter: slide-up 250ms + fade-in
  - exit: slide-down 200ms + fade-out
  - backdrop: fade 200ms

List Animations:
  - item-enter: slide-up 150ms staggered
  - item-exit: slide-right 200ms + fade-out
  - reorder: 300ms ease-in-out

Loading States:
  - spinner: 1s linear infinite
  - skeleton: shimmer 1.5s ease-in-out infinite
```

### 手勢支援
```yaml
Touch Targets:
  - minimum: 44px x 44px
  - recommended: 48px x 48px
  - spacing: 8px minimum between targets

Gestures:
  - tap: primary action
  - long-press: context menu (200ms delay)
  - swipe-left: delete/archive (table rows)
  - swipe-right: mark complete (tasks)
  - pull-to-refresh: refresh data
  - pinch-to-zoom: not supported
```

## 📐 響應式設計

### 斷點系統
```yaml
Mobile Portrait: 320px - 480px
Mobile Landscape: 481px - 768px
Tablet Portrait: 769px - 1024px
Tablet Landscape: 1025px+
```

### 適配規則
```yaml
Navigation:
  - mobile: bottom tabs
  - tablet: side navigation (landscape)

Grid Layout:
  - mobile: 1-2 columns
  - tablet: 2-4 columns

Typography:
  - mobile: base sizes
  - tablet: +2px for each level

Spacing:
  - mobile: base values
  - tablet: +4px for margins, +8px for padding
```

## 🎭 狀態設計

### 載入狀態
```yaml
Page Loading:
  - skeleton screens with shimmer
  - maintain layout structure
  - 200ms delay before showing

Button Loading:
  - spinner replaces text
  - maintain button size
  - disable interaction

List Loading:
  - skeleton items (3-5)
  - shimmer animation
  - progressive loading
```

### 空狀態
```yaml
Empty List:
  - icon: 64px, centered
  - title: 18px semibold
  - description: 14px regular
  - action: primary button
  - illustration: optional

No Search Results:
  - search icon
  - "找不到相關結果"
  - "試試其他關鍵字"
  - clear filters button
```

### 錯誤狀態
```yaml
Network Error:
  - wifi-slash icon
  - "網路連線問題"
  - retry button
  - background: light red

Server Error:
  - alert-triangle icon
  - "伺服器暫時無法回應"
  - retry button
  - contact support link
```

## 📝 範例截圖需求

請提供以下頁面的設計稿或詳細描述：

1. **底部導航欄** - 顯示5個圖示和特殊的+號按鈕
2. **彈出氣球** - 顯示3個動作選項的浮動選單
3. **首頁** - 包含模式切換、統計卡片、快速操作
4. **資料庫頁面** - 顯示表格、搜尋欄、篩選功能
5. **小工具頁面** - 顯示工具卡片網格佈局
6. **設定頁面** - 顯示設定項目列表和切換開關

## 🔍 設計檢查清單

完成設計規範後，請確認：

- [ ] 所有顏色都有明確定義
- [ ] 字體大小和粗細都有規範
- [ ] 間距使用統一的scale系統
- [ ] 圓角和陰影有一致的層級
- [ ] 互動狀態都有明確設計
- [ ] 響應式行為有定義
- [ ] 動畫效果有時間和緩動規範
- [ ] 載入和錯誤狀態有設計
- [ ] 可訪問性需求有考慮
- [ ] 所有頁面都有完整的視覺規範

---

**請基於這個格式，提供詳細的設計規範，特別是具體的視覺效果描述和頁面佈局細節。有了完整的設計規範，我就能精確實作出符合預期的UI效果。**