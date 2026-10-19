# MATRIX UX 手動驗收

Production: https://matrix-mcp-production.up.railway.app

## 路由

1. **MATRIX `/`**：極簡 Hero + 底部 **SPACE Dock**（無對話列表、無 Composer）。
2. **SPACE `/w/:slug`**：整頁 Block + Composer；MODULE 不在 UI 分頁。
3. **Studio `/w/:slug/studio`**：builder／manifest／資料源（僅該 SPACE）。
4. **`/me`**：個人設定、Demo 身份、工作區連結。

## Dock 切換（必測）

1. 在 `/w/ws-hiyen` 送一則對話 → 切 Dock 到個人 SPACE → 再切回 HIYEN：**對話仍在**（快取）。
2. 各 SPACE **canvas** 互不干擾；重新整理後 canvas 從 API 恢復。

## 版面

- HIYEN（`spaceProfile: admin`）：單欄 Block 堆疊。
- 若套用 **dev-ide** 模板：IDE 雙欄（manifest + Block 預覽）。

API：`npm run verify:all`；瀏覽器：`BASE_URL=… npm run verify:full`
