# MCP Block SaaS PoC

Minimal proof-of-concept for the **MCP SaaS 架構藍圖** Gemini share: Agent-driven orchestration, mock MCP servers, and a **shadcn-style Block Registry** that renders strict JSON UI payloads (`RENDER` / `UPDATE_DATA`).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- In-browser mock MCP (no real LLM or MCP transport)

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Demo flow

1. Send the sample HR leave prompt (pre-filled).
2. See `ShadcnDataTableBlock` rendered from MCP JSON.
3. Click **核准全選** → `hr:approve_all` returns `UPDATE_DATA` patch.
4. Try **財務 Finance** module for stacked blocks.

## Source

Concept and JSON examples from [Gemini share](https://share.gemini.google/fsckAbVh3XMG) (Oct 19, 2026).
