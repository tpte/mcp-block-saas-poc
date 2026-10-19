# Agent 交付（MATRIX / HIYEN PoC）

## 做完就部署（使用者要求）

任務可驗收後，**不要只改本機**；由 agent 自行完成交付：

1. `npm run build` 通過。
2. **Commit**（勿含 `.env`、`.data`、密鑰）。
3. **Push** 到 GitHub；生產部署以 **`main`** 為準（feature 分支先 merge 再 push `main`）。
4. **部署 Railway**（擇一失敗則換另一）：
   - Push `main` 觸發 [`.github/workflows/railway-deploy.yml`](.github/workflows/railway-deploy.yml)（需 repo secret `RAILWAY_TOKEN`）。
   - 或本機：`railway up --detach --service 4f2f3df4-ca00-4fc6-a850-b1e9ebc233e4`（專案 `matrix-mcp`）。
5. 驗收：`curl -s https://matrix-mcp-production.up.railway.app/api/health` 含 `"ok":true`。

## 產品邊界

- 產品名 **MATRIX**（`shared/product.ts`），**≠ HIYEN MATRIX** 品牌。
- 工作區 **HIYEN** 是 tenant 名稱，非產品線。

## 常用

- 本機：`npm run dev:all`
- 生產：https://matrix-mcp-production.up.railway.app
- 驗收：`npm run verify:all`（chat + builder）；可设 `BASE_URL` 打 production
