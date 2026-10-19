# MCP Block SaaS MVP

Agent-driven SaaS demo: **6 MCP modules**, **9 Block types**, and **OpenRouter** (`deepseek/deepseek-v4.1-flash-1017` pinned to **Together**).

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
