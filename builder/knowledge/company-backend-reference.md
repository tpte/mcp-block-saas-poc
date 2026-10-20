# 多模組公司後台參考（非綁死實作）

MATRIX 的「營運後台範例」工作區代表常見的多模組公司後台，典型包含：

- **人力**：請假表、核准流程（hr 模組）
- **財務**：現金流、發票列表（finance 模組）
- **營運**：工單、庫存、銷售管道（support / inventory / sales）
- **檢視**：週 KPI、渠道組成（analytics）

使用者若要自己做公司營運後台：

1. 不必複製全部模組；先選與其業務最相關的 2～3 塊。
2. 先建立資料源計畫（哪怕尚未連線）。
3. 用 `company-starter` 模板還原「常見模組組合」，再逐項關閉或改名。

此文件供 RAG 檢索，Agent 應轉成使用者產業的語言，不要逐字背誦。

## Cockpit 固定格（manifest）

`ui.spaceProfile` 可設 `cockpit`；`ui.cockpit` 定義左右固定格，每格指定 MCP `tool`（與快捷操作相同）：

```json
"cockpit": {
  "left": [{ "id": "kpi-week", "label": "本週 KPI", "tool": "analytics:kpi_week", "locked": true }],
  "right": [{ "id": "cashflow", "label": "現金流", "tool": "finance:get_cashflow", "locked": true }]
}
```

中欄仍由對話與 Agent 更新主畫布；需開 Studio 可呼叫 `workspace:navigate`。
