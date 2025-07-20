#!/bin/bash

# 測試 Claude Code 通知功能
echo "測試 Claude Code 通知功能..."
echo ""

# 測試 1: 短暫延遲後的鈴聲
echo "測試 1: 3 秒後發出提示音"
sleep 3
echo -e "\a"  # 發出終端機鈴聲
echo "✅ 測試 1 完成"
echo ""

# 測試 2: 長時間任務完成通知
echo "測試 2: 模擬長時間任務（5秒）"
echo "開始處理..."
sleep 5
echo -e "\a"  # 任務完成時的鈴聲
echo "✅ 測試 2 完成 - 長時間任務已結束"
echo ""

echo "所有測試完成！"
echo ""
echo "📌 Claude Code 通知設定說明："
echo "- 已啟用終端機鈴聲通知 (terminal_bell)"
echo "- 閒置超過 60 秒會自動提醒"
echo "- 長時間命令完成時會發出提示音"
echo "- 需要權限確認時會發出提示音"