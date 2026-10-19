# MATRIX 打造名詞（RAG）

## 工作區（Workspace）

租戶邊界。HIYEN 是範例 tenant 名稱，產品名 MATRIX ≠ HIYEN MATRIX 品牌。

## Manifest

`manifest.json` 描述：啟用哪些模組、資料源、UI 主題、Git 綁定、部署紀錄。是「後台長相與能力」的單一真相來源。

## 模組（Catalog Module）

對應 MCP tool 前綴，例如 `hr:get_leave`。在側欄「模組」出現，點擊會更新 Canvas。

## 資料源（Data Source）

manifest.dataSources 的一筆：type（postgres/supabase/sqlite/http_api）、label、secretRef。連線 secret 只在 server，不在瀏覽器。

## 模板（Workspace Template）

少數預設 manifest 快照，供「還原起步狀態」。客製細節仍靠 Agent 對話與 Skills，不是寫死 wizard。

## Skills

`builder/skills/*/SKILL.md` 給 Agent 讀的互動劇本；內容可迭代，不需改前端流程程式。
