# 準備建庫檢查清單（RAG）

給非工程使用者，Agent 可逐項口語確認：

1. **資料放哪**：雲端 Postgres / Supabase / 先 SQLite 試做 / 已有 API
2. **誰管帳號**：公司 IT 或雲端主機管理員建立資料庫與備份
3. **MATRIX 只做計畫**：manifest 記 `label`、`type`、`secretRef`；密碼由 admin 在 Railway 設環境變數，不要貼在聊天
4. **連線後**：看工作區地圖 DataSource 健康狀態；模組才會逐步接真實資料（PoC 模組可能仍用示範 store）
5. **下一步**：資料源計畫完成後 → modules-enable skill 選 2～3 個模組
