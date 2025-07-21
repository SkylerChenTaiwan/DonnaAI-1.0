# Claude Code Hooks 通知設定故障排除

## 問題描述
Claude Code 的 hooks 功能無法正常觸發通知，即使通知腳本本身可以正常運作。

## 問題原因
Claude Code 的 `settings.json` 格式與官方文檔不符。舊版格式使用陣列結構，但實際上需要使用巢狀物件結構。

## 解決方案

### 1. 檢查通知腳本是否正常
```bash
# 直接測試通知腳本
~/.claude/hooks/claude-notify-multi.sh test 'Test' 'Testing notification'
```

如果收到通知，表示腳本本身沒問題，問題出在 hooks 設定。

### 2. 檢查設定檔位置
```bash
ls -la ~/.claude/settings.json
```

確認設定檔存在於正確位置。

### 3. 修正 settings.json 格式

**錯誤格式（陣列式）：**
```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": {
        "tool_name": "Write"
      },
      "command": "~/.claude/hooks/claude-notify-multi.sh success 'File Created' 'New file created'"
    }
  ]
}
```

**正確格式（巢狀物件）：**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/skyler/.claude/hooks/claude-notify-multi.sh success 'File Created' 'New file created successfully'"
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/skyler/.claude/hooks/claude-notify-multi.sh success 'File Edited' 'File modification completed'"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/skyler/.claude/hooks/claude-notify-multi.sh info 'Command Executed' 'Bash command completed'"
          }
        ]
      }
    ]
  }
}
```

### 關鍵差異：
1. **結構**：使用 `"hooks": { "PostToolUse": [...] }` 而非 `"hooks": [...]`
2. **Matcher**：直接使用工具名稱字串，如 `"matcher": "Write"`
3. **命令路徑**：使用完整路徑 `/Users/skyler/...` 而非 `~`
4. **Hook 類型**：需要指定 `"type": "command"`

### 4. 重啟 Claude Code
修改設定後需要重啟 Claude Code 才能生效。

### 5. 驗證設定
建立測試檔案來確認 hooks 是否正常運作：
```bash
# 在 Claude Code 中執行
# Write 工具會觸發通知
```

## Hook 輸入格式

Claude Code 的 hooks 通過 **stdin** 接收 JSON 格式的輸入，而非環境變數。輸入包含：
- `session_id` - 會話 ID
- `transcript_path` - 對話記錄路徑
- `cwd` - 當前工作目錄
- `tool_name` - 工具名稱（如 Write、Bash、Edit）
- `tool_input` - 工具的輸入參數（JSON 物件）

### 智能通知腳本範例
```bash
#!/bin/bash
# 從 stdin 讀取 JSON
JSON_INPUT=$(cat)

# 使用 Python 解析 JSON
TOOL_NAME=$(echo "$JSON_INPUT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('tool_name', ''))")

# 根據工具類型決定是否通知
case "$TOOL_NAME" in
  "Write")
    FILE_PATH=$(echo "$JSON_INPUT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('tool_input', {}).get('file_path', ''))")
    if [[ "$FILE_PATH" =~ PRPs/.*\.md$ ]]; then
      # 發送通知
    fi
    ;;
esac
```

## 常見問題

### Q: 為什麼直接執行腳本可以，但 hooks 不觸發？
A: 
1. 設定格式錯誤
2. Claude Code 未重新載入設定（需要重啟）
3. Hook 腳本沒有正確處理 stdin 輸入

### Q: 可以使用哪些事件？
A: 根據官方文檔，支援：
- `PreToolUse` - 工具使用前
- `PostToolUse` - 工具使用後
- `Notification` - 權限請求或閒置通知
- `UserPromptSubmit` - 用戶提交提示前
- `Stop` - 主代理完成時
- `SubagentStop` - 子代理完成時
- `PreCompact` - 上下文壓縮前

### Q: 如何調試 hooks？
A: 
1. 使用 `claude --debug` 啟動以查看詳細的 hook 執行資訊
2. 檢查腳本權限：`chmod +x ~/.claude/hooks/*.sh`
3. 測試腳本是否能正確解析 JSON 輸入
4. 使用完整路徑而非相對路徑或 `~`

## 備用方案
如果 hooks 持續無法運作，可以：
1. 向 Claude Code 團隊回報：https://github.com/anthropics/claude-code/issues
2. 使用終端別名快速執行通知：
   ```bash
   # 在 ~/.zshrc 或 ~/.bashrc 中加入
   alias claude-done='~/.claude/hooks/claude-notify-multi.sh task-complete "任務完成" "Claude 已完成請求的任務"'
   ```

## 參考資料
- [Claude Code Hooks 文檔](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Code Settings 文檔](https://docs.anthropic.com/en/docs/claude-code/settings)