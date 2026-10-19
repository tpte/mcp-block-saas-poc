# MATRIX

> **產品名稱：MATRIX**（個人 MCP 駕駛艙）  
> **≠ HIYEN MATRIX** — 與 HIYEN MATRIX 為不同產品，無共用品牌或產品線關係。  
> 識別常數見 [`shared/product.ts`](shared/product.ts)。

整頁畫布就是 Agent 的回覆。`canvas:compose` 把回答拆成標題、重點、圖表、確認、Diff、文檔、Plan。對話框只負責輸入。

外部 MCP 掛在 Bridge 後面：外部只回 JSON，`bridge:call` 轉成 Block。內建 in-process `notes`；可選 `MCP_STDIO_SERVERS` 連真 stdio MCP。

OpenRouter：`deepseek/deepseek-v4.1-flash-1017`，優先 **Together**。

## 平台願景（Phase 1–3）

- **Workspace / User / Agent** 持久化於 `.data/platform.json`（dev headers：`X-User-Id`、`X-Workspace-Id`、`X-Agent-Id`）。
- **客製化後台**：`builder/skills`（Agent 可讀的 SKILL 引導）+ `builder/knowledge`（RAG）+ 少數 `shared/workspaceTemplates.ts` 還原模板；UI「打造後台」面板與 `builder:*` MCP 工具。
- **多 Agent**：orchestrator／worker／personal，tool **Policy** 強制；`agent:delegate` 調度 worker。
- **Run 樹**：`/api/runs/:runId/tree` + UI **Agent 拓撲**。
- **Block 市集**：`POST /api/blocks/packages` → approve → `compose` `kind: pkg`（見 [`notes/BLOCK_SDK.md`](notes/BLOCK_SDK.md)）。
- **存儲**：`.data/storage/{workspaceId}`；**計費規格**：[`shared/billing.ts`](shared/billing.ts)、[`notes/billing-spec.md`](notes/billing-spec.md)。

## 個人工作台

- **一切可客製**：`platform:patch`／自然語言改 theme、composer、模組入口開關、Tool Trace、block 排序策略、快捷鍵。
- **模組入口**（可並存）：左側 sidebar、頂部 pill、⌘K 命令盤 → 皆走 `/api/mcp/invoke`，不經 LLM。
- **鍵盤**：Block focus／放大（Enter）、block 間移動（Alt+↑↓）、Meta+/ 聚焦輸入、Meta+? 快捷鍵表。
- **智慧排序**：block 可帶 `presentation.priority`／`role`；`layoutPreferences.blockSort` 為 `importance` 時依 priority 重排。

## Stack

- Frontend: Vite + React + TypeScript + Tailwind v4 + Recharts
- Backend: Hono (Node) — OpenRouter proxy + MCP handlers + MCP SDK stdio
- Shared UI schema: [`shared/ui.ts`](shared/ui.ts)

## Setup（本機）

```bash
cd ~/Projects/mcp-block-saas-poc
cp .env.example .env
# Set OPENROUTER_API_KEY (or rely on ~/.hermes/.env at server startup)
npm install
npm run dev:all
```

- Web: http://localhost:5173  
- API: http://127.0.0.1:8787/api/health  
- Catalog: http://127.0.0.1:8787/api/mcp/catalog  

Stop: `Ctrl+C` in the terminal running `dev:all`.

## Deploy（Railway）

單一 service：Docker 建置 UI + 同一 process 提供 `/api/*` 與靜態 `dist/`。

1. [Railway](https://railway.com) 新建 Project → **Deploy from GitHub repo**（或 `railway up`）。
2. 使用 repo 根目錄的 [`Dockerfile`](Dockerfile) / [`railway.toml`](railway.toml)。
3. **Variables**（至少）：
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_SITE_URL` = `https://<你的 Railway 網域>`（未設時會嘗試 `RAILWAY_PUBLIC_DOMAIN`）
   - 可選：`OPENROUTER_MODEL`、`MCP_STDIO_SERVERS`（stdio 在 Railway 上需容器內可執行的 command）
4. **持久化**（建議）：掛 Volume 到 `/app/.data`，並設環境變數 `MATRIX_VOLUME_MOUNTED=true`（未設時 UI／health 會提示資料可能因 redeploy 遺失）。
5. 產生 Public Networking → 健康檢查：`GET /api/health`。

### Push 自動部署（GitHub → Railway）

**方式 A（推薦、零 workflow）**：Railway 專案 → **Settings → Connect GitHub repo**（`tpte/mcp-block-saas-poc`）→ 之後每次 **push** 到連線分支會自動 build／deploy。

**方式 B（本 repo 已含 Actions）**：[`/.github/workflows/railway-deploy.yml`](.github/workflows/railway-deploy.yml)

1. Railway → **Account Settings → Tokens** 建立 **Project Token**（scope：`matrix-mcp`）。
2. GitHub repo → **Settings → Secrets and variables → Actions** → 新增 **`RAILWAY_TOKEN`**。
3. 將變更 **merge 到 `main` 並 push**（或 Actions 頁 **Run workflow** 手動部署）。
4. CI 會先 `npm run build`，再以 Dockerfile 部署到 `matrix-mcp-production.up.railway.app`。

目前本機分支若為 feature 分支，需 **PR merge 進 `main`** 才會觸發自動部署（workflow 監聽 `main` / `master`）。

本機驗證 production 模式：

```bash
npm run build && npm start
# http://127.0.0.1:8787
```

## HIYEN 工作區（多租戶）

- 預設 seed 含 **HIYEN** 工作區（`ws-hiyen`）；Header **工作區** 下拉可切換。
- API：`/api/workspaces`、`/api/manifest`、`/api/resource-map`、`/api/workbench/*`、`/api/canvas/*`、邀請 `/api/workspaces/:id/invites`。
- UI：**工作區地圖**（資源綠燈）、**工作台**（編輯 `manifest.json`、DIFF、綁定 GitHub repo）、畫布 **+ title/points…** 新增 Block、放大後可編輯 props。
- `manifest.modules.enabledCatalogIds` 控制 sidebar 模組；`dataSources` 僅存 `secretRef`（不含明文密碼）。

## 操作紀錄與品質回饋

- 每則對話、MCP invoke、工具 trace 會寫入 **`.data/ops/{workspaceId}.jsonl`**（JSONL，可匯出做分析）。
- API：`GET /api/ops/summary`、`GET /api/ops/log`、`POST /api/ops/feedback`（`targetEntryId` + `helpful` / `wrong` / `partial`）。
- UI：左側對話列可對 Agent 回覆 👍／◑／👎；開啟 Tool Trace 時底部顯示**品質摘要**（異常、常失敗工具、標記不正確）。

## Flow

1. 依個人設定：左側模組列／頂部 pill／⌘K／自然語言 → MCP tool → Block Canvas。
2. Chat sends natural language → OpenRouter tool-calling → same MCP tools → UI `RENDER` / `UPDATE_DATA`.
3. Block buttons (e.g. 核准全選) call `/api/mcp/invoke` without LLM latency.

## Modules

HR, Finance, Sales, Inventory, Support, Analytics — see [`server/mcp/handlers.ts`](server/mcp/handlers.ts).

## stdio MCP（可選）

在 `.env` 設定：

```env
MCP_STDIO_SERVERS=[{"name":"memory","command":"npx","args":["-y","@modelcontextprotocol/server-memory"]}]
```

重啟 API 後 `bridge:list` 與命令盤會出現該 server 的 tools。

## Source

Architecture concept from [Gemini share](https://share.gemini.google/fsckAbVh3XMG).
