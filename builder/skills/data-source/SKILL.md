# Data Source（資料要存哪裡）

## 核心訊息（一定要跟使用者講清楚）

建立任何「模式／模組／後台功能」之前，先問：**資料要存在哪裡？**

- 沒有資料源，模組只能顯示示範假資料，無法變成真正可用的後台。
- MATRIX 在 manifest 裡用 `dataSources[]` 描述連線；密碼只存在 server 的 secret ref，不要叫使用者把密碼貼在聊天裡。

## 對話指引

1. 用白話解釋：「庫／資料庫就像 Excel 的雲端版，專門存你的訂單、員工、庫存。」
2. 問 3 選 1（或組合）：
   - 已有 **PostgreSQL / Supabase** → 建議 `postgres` 或 `supabase` 類型
   - 只有試用、資料很少 → 可先用 `sqlite`（PoC）
   - 資料在別的 **HTTP API** → `http_api`
3. 說明下一步：你會在 manifest 加一筆 **label + type + secretRef**；實際連線由管理員在 server 設定。
4. 若使用者還沒準備好資料庫：用 plan block 列出「準備建庫」檢查清單（帳號、區域、備份），不要假裝已連上。

## 寫入 manifest 時

- `id` 建議：`ds-primary`、`ds-orders` 等語意化
- `secretRef` 建議：`env:WORKSPACE_DS_PRIMARY` 格式，提醒他們找 admin 設環境變數
- 加完後建議看「工作區地圖」確認 DataSource 節點 health

## RAG 關鍵字

資料庫、庫、存資料、Supabase、Postgres、連線、schema
