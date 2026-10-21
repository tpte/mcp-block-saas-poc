# MATRIX 交付

## Cloud Agent 交付（PR 流程）

任務可驗收後，**不要只改本機**；由 agent 在 **feature 分支**完成並以 **Pull Request** 交付：

1. `npm run build`、`npm run lint`、本機 `npm run verify:all`（見下方「建置與驗收」）通過。
2. **Commit**（勿含 `.env`、`.data`、密鑰）。
3. **Push 分支**到 GitHub，開啟 **ready-for-review** PR（繁中標題與 body，格式見「Cursor Cloud specific instructions」）。
4. **禁止**：agent **不得** push `main`/`master`、**不得** merge PR、**不得**執行 `railway up`。
5. **部署**：PR merge 進 `main` 後，由 [`.github/workflows/railway-deploy.yml`](.github/workflows/railway-deploy.yml) 自動部署 Railway（需 repo secret `RAILWAY_TOKEN`；service `4f2f3df4-ca00-4fc6-a850-b1e9ebc233e4`，專案 `matrix-mcp`）。
6. **合併後驗收**（人工或下一輪 agent）：`curl -s https://matrix-mcp-production.up.railway.app/api/health` 含 `"ok":true`。

## 建置與驗收

| 指令 | 用途 |
|---|---|
| `npm run build` | `tsc -b` + Vite 建置 |
| `npm run lint` | `oxlint` |
| `npm run dev:all` | 同時啟動 Vite（web）與 API（`dev:server`） |
| `npm run dev:server` | 僅 API（預設 port **8787**） |
| `npm start` | 生產模式 API + 靜態 `dist/`（需先 `build`） |
| `npm run verify:all` | `verify:copy` → `verify:space` → `verify:cockpit` → `verify:chat` → `verify:builder` → `verify:spa` |
| `npm run verify:full` | `verify:all` + `verify:browser`（Playwright） |

本機跑 `verify:all` / `verify:full` 前需有 API 在 **8787** 監聽（例如另開終端 `npm run dev:server`，或 `npm run build && npm start`）。可選 `BASE_URL`（預設 `http://127.0.0.1:8787`；打生產可設 `https://matrix-mcp-production.up.railway.app`）。

Cloud Agent 環境：見 [`.cursor/environment.json`](.cursor/environment.json)（`npm ci` + Playwright Chromium）。Node 版本見 [`.nvmrc`](.nvmrc)（22）。

## 產品邊界

- 產品名與對外文案正本：**[`shared/product.ts`](shared/product.ts)**（MCP 營運工作台）。
- 範例工作區：**營運後台範例**（slug `company`，id `ws-company`）；**開發者工作台**（slug `personal`）。

## 常用

- 本機：`npm run dev:all`
- 本機 UI 開 http://localhost:5173（Vite 綁在 `::1`，`127.0.0.1:5173` 會連不上）。API：http://127.0.0.1:8787
- 生產：https://matrix-mcp-production.up.railway.app
- 驗收：`npm run verify:all`（copy、space、cockpit、chat、builder、SPA）；`verify:full` 含 Playwright；`BASE_URL` 可打 production

## Cursor Cloud specific instructions

These apply when you run as a Cursor Cloud Agent (isolated VM, working on a branch, handing off via pull request). Repo-specific sections of this file override these defaults where they conflict.

### Language
- Write PR titles, PR bodies, and commit messages in Traditional Chinese (Taiwan usage, zh-TW). Never Simplified Chinese.
- Keep code, identifiers, file names, commands, error messages, and product/technical terms in English (for example `AGENTS.md`, `middleware`, `Railway`). Do not invent Chinese translations for established names.
- Code comments follow the existing language of the file.

### Scope
- One PR = one focused, independently explainable change. Split unrelated work into separate PRs.
- Make the smallest diff that solves the task. Follow existing conventions; no drive-by refactors, renames, or dependency bumps.
- Do not add new test frameworks or large test suites unless asked; use the repo's existing build/lint/verify scripts.
- Do not create new docs/markdown unless asked. If research notes must be kept, put them in the repo's `notes/`.
- Large, cross-module, destructive, or irreversible changes (mass deletes, schema/data migrations, prod config): stop and describe the plan in the PR or final message instead of doing it.
- Scripts that touch real data or external systems: run in dry-run mode unless the task explicitly says to execute.

### Verify before opening a PR
- Run the repo's build, lint, and verification commands (see repo-specific sections) and fix failures you caused.
- Exhaust automated checks yourself (logs, scripts, headless browser, API calls). Do not hand back a manual test checklist.
- If a check cannot run in the cloud VM (missing secret, needs macOS/iOS, needs real hardware), say exactly which check, why, and what it would take. Never claim a check passed that you did not run.
- For browser/UI checks prefer deterministic evidence (DOM dump, HTTP response, test output) over screenshots alone.
- If you hit login, 2FA, captcha, or permission walls: stop and report the blocker; do not work around it.

### Git safety
- Never commit `.env*` (except `.env.example` with placeholder values), credentials, tokens, private keys, cookies/browser profiles, databases, or `.data/` style runtime state. Check `git status` and `git diff --staged` before every commit.
- Never paste secrets or personal data (ID numbers, addresses, phone numbers) into code, logs, commits, PR bodies, or comments.
- Never `git push --force` / `--force-with-lease` and never rewrite pushed history.
- Never use `--no-verify` or otherwise skip hooks. If a hook fails, fix the cause and make a new commit; do not amend to hide it.
- Never change `git config` (user, email, signing, remotes).
- Never push to `main`/`master` directly; push your branch and open a PR. Remote is GitHub only.

### PR body format (zh-TW)

```markdown
## 為什麼
<問題或目標，一到三句；連結 issue／需求>

## 變更
- <每點一個可獨立說明的變更，指向主要檔案>

## 驗證
| 檢查 | 指令 | 結果 |
|---|---|---|
| build | `npm run build` | 通過 |
| … | … | 通過／失敗／未執行（原因） |

## 風險與後續
<部署影響、需要人工確認或無法在 Cloud 驗證的項目；沒有就寫「無」>
```

### Reporting numbers
- Any performance, size, cost, or count claim must include the baseline and the measurement method: `bundle 412 KB → 371 KB（−10.0%，基準 main@abc1234，vite build）`.
- Prefer percentages with the baseline stated; keep absolute values alongside.
- Use tables for comparisons; do not generate charts or HTML diagrams unless asked.
