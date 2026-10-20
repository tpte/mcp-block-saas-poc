#!/usr/bin/env node
/**
 * 瀏覽器煙測：首頁文案、工作區設定 ↔ 工作區、開發者起步清單、Dock 切工作區、/me。
 * 生產環境（guest 模式）會自動拿到訪客沙盒，流程相同。
 * 需：npm i -D playwright && npx playwright install chromium
 * Usage: BASE_URL=https://matrix-mcp-production.up.railway.app npm run verify:browser
 */
const base = (process.env.BASE_URL ?? 'https://matrix-mcp-production.up.railway.app').replace(/\/$/, '')

let chromium
try {
  ({ chromium } = await import('playwright'))
} catch {
  console.log('SKIP', 'verify-browser', 'playwright not installed (npm i -D playwright && npx playwright install chromium)')
  process.exit(0)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
let failed = 0

async function step(name, fn) {
  try {
    await fn()
    console.log('OK', name)
  } catch (err) {
    console.error('FAIL', name, err.message)
    failed += 1
  }
}

await step('home-copy', async () => {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '把你的 MCP 工具，變成每天點得到的營運面板' }).waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: '開啟開發者工作台' }).waitFor()
  await page.getByRole('button', { name: '看營運後台範例' }).waitFor()
})

await step('studio-load', async () => {
  await page.goto(`${base}/w/personal/studio`, { waitUntil: 'domcontentloaded' })
  await page.getByText('工作區設定', { exact: true }).first().waitFor({ timeout: 20000 })
})

await step('studio-to-space', async () => {
  await page.getByRole('link', { name: /回到工作區/ }).click()
  await page.waitForURL(/\/w\/personal\/?$/, { timeout: 15000 })
  await page.getByRole('navigation', { name: '工作區' }).waitFor()
})

await step('space-composer', async () => {
  await page.getByRole('textbox', { name: /跟 Agent|你想看/ }).waitFor({ timeout: 10000 })
})

await step('dev-checklist', async () => {
  const list = page.getByRole('region', { name: '開發者工作台起步清單' })
  await list.getByText('① 掛一個 MCP server').waitFor({ timeout: 10000 })
  await list.getByText('③ 釘成模組並看到 manifest Diff').waitFor()
})

await step('dock-switch-company', async () => {
  const dock = page.getByRole('navigation', { name: '工作區' })
  await dock.getByRole('button', { name: /營運後台/ }).first().click()
  await page.waitForURL(/\/w\/company\/?$/, { timeout: 15000 })
  // 切換工作區期間 Dock 會鎖住；等請求結束再進下一步。
  await page.waitForLoadState('networkidle')
})

await step('dock-back-personal', async () => {
  const dock = page.getByRole('navigation', { name: '工作區' })
  await dock.getByRole('button', { name: /開發者工作台/ }).first().click()
  await page.waitForURL(/\/w\/personal\/?$/, { timeout: 15000 })
})

await step('me-page', async () => {
  await page.getByRole('button', { name: '我' }).click()
  await page.waitForURL(/\/me\/?$/, { timeout: 10000 })
  await page.getByRole('heading', { name: '我' }).waitFor()
})

await step('me-to-space', async () => {
  await page.getByRole('link', { name: /回到最近的工作區/ }).click()
  await page.waitForURL(/\/w\//, { timeout: 10000 })
})

await browser.close()
if (failed) process.exit(1)
