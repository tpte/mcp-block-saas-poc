# 本機 SQLite 快速起步（免 env）

適合：非工程使用者、PoC、先規劃流程再換 Postgres。

1. 在「打造後台」按 **一鍵建立本機 SQLite**，或表單選 SQLite 類型後加入計畫。
2. secretRef 會是 `builtin:workspace-sqlite`；MATRIX 會在 `.data/storage/{工作區}/datasources/` 建立檔案。
3. 工作區地圖上 DataSource 應顯示 healthy。
4. 模組（HR、財務）在 PoC 仍可能用記憶體示範資料；SQLite 代表「你已準備好存真資料」的承諾，下一步與 Agent 規劃表單／匯入。
5. 上線前再換 Postgres：新增 postgres 資料源 + admin 設 env，不必刪 SQLite 計畫。

Agent 應說明這是**起步**而非完整 ERP 連線。
