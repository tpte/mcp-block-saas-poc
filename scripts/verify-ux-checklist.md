# MATRIX UX 手動驗收（Goal 測試）

Production: https://matrix-mcp-production.up.railway.app

## 必測互動

1. **工作區切換**：個人 → HIYEN → Agent 下拉只剩 HIYEN Copilot，模組側欄重新載入。
2. **打造後台**：展開 → 一鍵 SQLite → Flash 成功 → 資料源列表有 healthy 說明。
3. **模組快選**：取消幾項 → 預覽變更 → 儲存 → 側欄模組數量改變。
4. **Skills**：展開目錄 →「請 Agent 用這個」→ 畫布只出短 Skill 摘要，非全文 markdown。
5. **建議 pill**：缺資料源時優先出「資料要存哪」類句子（非僅 HR 假資料）。
6. **聊天**：點「顯示本月財務現金流」→ Canvas 出表格（OpenRouter 或離線 MCP）。

API：`npm run verify:builder`
