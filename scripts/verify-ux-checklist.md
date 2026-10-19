# MATRIX UX 手動驗收

Production: https://matrix-mcp-production.up.railway.app

## 路由

1. **主頁 /**：科技 AI Hero + 底部 Composer；無 builder／地圖／工作台。
2. **MODULE `/m/hr`**：側欄 MODULE 列表、Block 畫布、Composer；工具列僅此 MCP。
3. **Studio `/studio`**：打造後台、地圖、工作台、debug；可從 header「Studio」進入。

## 必測互動

1. **工作區切換**：個人 → HIYEN → Agent 下拉同步；MODULE 列表重載。
2. **MODULE 隔離**：在 HR 頁加 block／invoke，切 Finance 頁 canvas 不同。
3. **打造後台（Studio）**：SQLite、模組快選、Skills 摘要。
4. **聊天**：主頁或 MODULE 頁 Composer 可送訊。

API：`npm run verify:builder`（含 `/api/modules` 與 module canvas）
