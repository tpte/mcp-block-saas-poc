# Modules Enable（啟用後台模組）

## 核心訊息

模組 = manifest 裡 `modules.enabledCatalogIds` 的 MCP 工具集合（HR、財務、銷售…）。  
啟用模組 **之前** 應先確認資料源（見 data-source skill），否則先說明「目前會是示範資料」。

## 對話指引

1. 依使用者描述的業務，對照可用 catalog（invoke `builder:get_setup_context` 會列出目前已啟用與可選）。
2. 不要一次開全部；建議 2～4 個與第一版 MVP 最相關的模組。
3. 每選一個模組，用一句話說「這模組在畫布上通常長怎樣、適合什麼情境」。
4. 用 confirm block：「要啟用 hr:get_leave、finance:get_cashflow 嗎？」確認後再 `builder:update_manifest`。

## 常見組合（僅作靈感，非預設）

| 情境 | 可考慮模組 |
|------|------------|
| 小型公司後台 | hr:*, finance:*, support:* |
| 電商營運 | inventory:*, sales:*, analytics:* |
| 個人駕駛艙 | analytics:* + 少量 hr |

## 還原模板

若使用者說「跟 HIYEN 一樣起步」，用 `builder:apply_template` 的 `hiyen-starter`，再一起微調。
