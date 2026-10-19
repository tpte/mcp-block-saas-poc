# Workspace Build（工作區打造總則）

## 何時使用

使用者想「做自己的後台」「像 HIYEN 那樣」「開公司系統」「客製化模組」，或剛建立新工作區時。

## 原則（MATRIX 產品宗旨）

- **客製化優先**：不要推銷唯一正解；用問答釐清他們的業務與資料。
- **模板只作還原點**：預設模板（如 HIYEN 入門、空白自訂）是可逆的起步，細節由使用者與 Agent 共創。
- **引導來自 Skills + RAG**：流程不要寫死在程式；先 `builder:read_skill` 讀子技能，必要時 `builder:search_knowledge` 查知識庫。
- **每一步都要人話**：用 `canvas:compose` 的 plan / confirm 呈現「我們現在要做什麼、為什麼」。

## 建議對話節奏（非硬性步驟）

1. 釐清：這後台主要服務誰？每天最常做的 2～3 件事？
2. 資料：業務資料要存在哪？→ 讀 **data-source** skill。
3. 能力：要開哪些模組（HR、財務…）？→ 讀 **modules-enable** skill。
4. 畫面：預設畫布與 Block → 讀 **canvas-blocks** skill。
5. 確認：用 confirm block 列出將變更的 manifest 摘要，再 `builder:update_manifest` 或請使用者同意後套用模板。

## 工具

- `builder:get_setup_context` — 目前 manifest 缺口與建議優先讀哪些 skill
- `builder:read_skill` — 讀完整 SKILL 內容
- `builder:search_knowledge` — RAG 查 MATRIX 打造知識
- `builder:apply_template` — 僅在使用者明確要還原某預設模板時
- `builder:update_manifest` — 在對話共識後寫入模組／資料源等（需 admin）
