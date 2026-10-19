# MATRIX UX 手動驗收

Production: https://matrix-mcp-production.up.railway.app

## 路由

1. **MATRIX `/`**：Hero（副標 + tagline）+ 底部 **SPACE Dock**。
2. **SPACE `/w/:slug`**：常用捷徑（如現金流／請假）、模組 pill／側欄、快捷操作、打造後台、Studio + Block + Composer。
3. **Studio `?focus=builder`**：桌面分頁（打造後台／地圖／工作台）可切換。
3. **Studio `/w/:slug/studio`**：builder／manifest／資料源。
4. **`/me`**：個人設定、身份、工作區連結。

## Dock 切換（必測）

1. 在 `/w/company` 送一則對話 → 切 Dock 到開發者工作台 → 再切回營運後台範例：**對話仍在**（快取）。
2. 各 SPACE **canvas** 互不干擾；重新整理後 canvas 從 API 恢復。

## 版面

- 營運後台範例（`spaceProfile: admin`）：單欄 Block 堆疊。
- **dev-ide** 模板：IDE 雙欄（manifest + Block 預覽）。

API：`npm run verify:all`；瀏覽器：`BASE_URL=… npm run verify:full`
