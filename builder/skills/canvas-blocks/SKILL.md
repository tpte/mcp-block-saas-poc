# Canvas Blocks（畫布與 Block）

## 核心訊息

使用者看到的後台 = **Canvas 上的 Block**（表格、圖表、按鈕…）。  
Agent 用 `canvas:compose` 說明；用 MCP 模組工具 **RENDER** 真實資料 Block。

## 對話指引

1. 問：首頁最想先看到什麼？（例：本月請假、現金流、待處理工單）
2. 建議從 **一個主 Block + 一個提醒 Block** 開始，避免首屏過滿。
3. 若要固定版面：說明 manifest 的 `ui.defaultCanvasLayout`（stack / grid）與 `canvasMergeMode`。
4. Block 模板（`GET /api/blocks/templates`）可新增空白元件；進階 props 需 member 以上權限。

## 與客製化的關係

細節（文案、欄位、配色）優先透過對話 + compose / 模組工具調整；  
只有在使用者要「整包還原」時才用 workspace 模板，不要用模板取代對話。
