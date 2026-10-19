# MATRIX

> **MCP 營運工作台 · 團隊後台可引導打造**  
> MATRIX 是 MCP 原生的營運工作台。開發者與小團隊用 manifest、Workbench 與直連 invoke 組裝日常操作；需要公司後台的團隊可用「打造後台」與模板，逐步上線模組與資料源。  
> 識別常數見 [`shared/product.ts`](shared/product.ts)。

整頁畫布就是 Agent 的回覆。`canvas:compose` 把回答拆成標題、重點、圖表、確認、Diff、文檔、Plan。對話框負責輸入；模組按鈕與命令盤走 `/api/mcp/invoke`，不經 LLM。

外部 MCP 掛在 Bridge 後面：外部只回 JSON，`bridge:call` 轉成 Block。內建 in-process `notes`；可選 `MCP_STDIO_SERVERS` 連 stdio MCP。

OpenRouter 預設模型見部署環境變數（例：`deepseek/deepseek-v4.1-flash-1017`）。

## 誰適合用

- **開發者／小團隊**：已有 MCP 或內建 tools，要 manifest、Block 畫布、Workbench、多 Agent 與 tool policy。
- **需要營運後台的團隊**：不懂程式也可透過「打造後台」、Skills 與 `company-starter` 模板，從資料源與 2～3 個模組起步。

## 能力

### 營運工作台

- **Workspace / User / Agent** 持久化於 `.data/platform.json`（本機可用 headers：`X-User-Id`、`X-Workspace-Id`、`X-Agent-Id`）。
- **多 Agent**：orchestrator／worker／personal，tool **Policy**；`agent:delegate` 調度 worker。
- **Run 樹**：`/api/runs/:runId/tree` + UI **Agent 拓撲**。
- **存儲**：`.data/storage/{workspaceId}`。

### 打造後台

- `builder/skills` + `builder/knowledge`（RAG）+ [`shared/workspaceTemplates.ts`](shared/workspaceTemplates.ts)。
- UI「打造後台」與 `builder:*` MCP 工具。驗收：`BASE_URL=https://matrix-mcp-production.up.railway.app npm run verify:builder`

### 多工作區

- 預設含 **開發者工作台**（`personal`）與 **營運後台範例**（`company`，slug `/w/company`）；另有 **模組範例**（`sample-erp`）。
- API：`/api/workspaces`、`/api/manifest`、`/api/resource-map`、`/api/workbench/*`、`/api/canvas/*`、邀請 `/api/workspaces/:id/invites`。
- UI：**工作區地圖**、**工作台**（manifest、DIFF、GitHub 綁定）、畫布 Block 編輯。

### 進階／擴充

- **Block 套件**：`POST /api/blocks/packages` → approve → compose（見 [`notes/BLOCK_SDK.md`](notes/BLOCK_SDK.md)）。
- **用量與方案**：企業方案與計費依部署需求設定；規格見 [`shared/billing.ts`](shared/billing.ts)（內部）。

## 開發者工作台

- **一切可客製**：`platform:patch`／自然語言改 theme、composer、模組入口、Tool Trace、block 排序、快捷鍵。
- **模組入口**：sidebar、pill、⌘K → `/api/mcp/invoke`。
- **鍵盤**：Block focus／放大（Enter）、Alt+↑↓、Meta+/、Meta+?。

## Stack

- Frontend: Vite + React + TypeScript + Tailwind v4 + Recharts
- Backend: Hono (Node) — OpenRouter proxy + MCP handlers + MCP SDK stdio
- Shared UI schema: [`shared/ui.ts`](shared/ui.ts)

## Setup（本機）

```bash
cd ~/Projects/mcp-block-saas-poc
cp .env.example .env
npm install
npm run dev:all
```

- Web: http://localhost:5173  
- API: http://127.0.0.1:8787/api/health  
- Catalog: http://127.0.0.1:8787/api/mcp/catalog  

## Deploy（Railway）

單一 service：Docker 建置 UI + 同一 process 提供 `/api/*` 與靜態 `dist/`。

1. [Railway](https://railway.com) 新建 Project → **Deploy from GitHub repo**（或 `railway up`）。
2. 使用 [`Dockerfile`](Dockerfile) / [`railway.toml`](railway.toml)。
3. **Variables**（至少）：`OPENROUTER_API_KEY`、`OPENROUTER_SITE_URL`；可選 `OPENROUTER_MODEL`、`MCP_STDIO_SERVERS`。
4. **持久化**：Volume 掛 `/app/.data`，`MATRIX_VOLUME_MOUNTED=true`。
5. 健康檢查：`GET /api/health`。

Push `main` 可觸發 [`.github/workflows/railway-deploy.yml`](.github/workflows/railway-deploy.yml)（需 `RAILWAY_TOKEN`）。

生產：https://matrix-mcp-production.up.railway.app

```bash
npm run build && npm start
npm run verify:all
```

## 操作紀錄與品質回饋

- `.data/ops/{workspaceId}.jsonl`；API：`/api/ops/summary`、`/api/ops/log`、`/api/ops/feedback`。
- UI 可對回覆標記品質；Tool Trace 顯示摘要。

## Flow

1. 模組列／⌘K／自然語言 → MCP tool → Block Canvas。
2. Chat → OpenRouter tool-calling → 同一套 MCP tools → `RENDER` / `UPDATE_DATA`.
3. Block 按鈕直連 `/api/mcp/invoke`（低延遲）。

## Modules

HR, Finance, Sales, Inventory, Support, Analytics — [`server/mcp/handlers.ts`](server/mcp/handlers.ts).

## stdio MCP（可選）

```env
MCP_STDIO_SERVERS=[{"name":"memory","command":"npx","args":["-y","@modelcontextprotocol/server-memory"]}]
```
