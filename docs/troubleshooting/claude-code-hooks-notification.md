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

## 常見問題

### Q: 為什麼直接執行腳本可以，但 hooks 不觸發？
A: 通常是設定格式錯誤或 Claude Code 未重新載入設定。

### Q: 可以使用哪些事件？
A: 根據官方文檔，目前支援：
- `PostToolUse` - 工具使用後觸發
- 其他事件可能因版本而異

### Q: 如何調試 hooks？
A: 
1. 檢查 `~/.claude/logs/` 目錄是否有錯誤日誌
2. 確認通知腳本有執行權限：`chmod +x ~/.claude/hooks/*.sh`
3. 使用完整路徑而非相對路徑或 `~`

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