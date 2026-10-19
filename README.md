# Super MCP

整頁智能畫布 + 對話框。外殼（深色、對話框位置、下一句預測數量、標題、畫布寬度）由 `platform:patch` MCP 客製，跟業務資料同一條 Agent 路徑。預設預測 3 句，可說「預測改成 5 個」或「關掉預測提示」。

OpenRouter：`deepseek/deepseek-v4.1-flash-1017`，釘 **Together**。

## Stack

- Frontend: Vite + React + TypeScript + Tailwind v4 + Recharts
- Backend: Hono (Node) — OpenRouter proxy + mock MCP handlers
- Shared UI schema: [`shared/ui.ts`](shared/ui.ts)

## Setup

```bash
cd ~/Projects/mcp-block-saas-poc
cp .env.example .env
# Set OPENROUTER_API_KEY (or rely on ~/.hermes/.env at server startup)
npm install
npm run dev:all
```

- Web: http://localhost:5173  
- API: http://127.0.0.1:8787/api/health  

Stop: `Ctrl+C` in the terminal running `dev:all`.

## Flow

1. Sidebar picks a module → deterministic MCP tool → Block Canvas.
2. Chat sends natural language → OpenRouter tool-calling → same MCP tools → UI `RENDER` / `UPDATE_DATA`.
3. Block buttons (e.g. 核准全選) call `/api/mcp/invoke` without LLM latency.

## Modules

HR, Finance, Sales, Inventory, Support, Analytics — see [`server/mcp/handlers.ts`](server/mcp/handlers.ts).

## Source

Architecture concept from [Gemini share](https://share.gemini.google/fsckAbVh3XMG).
