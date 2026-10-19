# MATRIX 打造名詞（RAG）

## 產品定位

MATRIX 是 MCP 營運工作台：開發者用 manifest／Workbench／直連 invoke；團隊用「打造後台」與模板上線公司模組。**營運後台範例**工作區（slug `company`）是多模組公司後台的參考，不是客戶品牌。

## 工作區（Workspace）

租戶邊界。每個工作區有獨立 manifest、資料目錄與成員。

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
