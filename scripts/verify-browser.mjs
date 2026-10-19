#!/usr/bin/env node
/**
 * 瀏覽器煙測：Studio ↔ SPACE、Dock 切工作區、/me。
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

await step('studio-load', async () => {
  await page.goto(`${base}/w/personal/studio`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Studio', { exact: true }).first().waitFor({ timeout: 20000 })
})

await step('studio-to-space', async () => {
  await page.getByRole('link', { name: /回到工作區/ }).click()
  await page.waitForURL(/\/w\/personal\/?$/, { timeout: 15000 })
  await page.getByRole('navigation', { name: '工作區' }).waitFor()
})

await step('space-composer', async () => {
  await page.getByRole('textbox', { name: /跟 Agent|你想看/ }).waitFor({ timeout: 10000 })
})

await step('dock-switch-sample', async () => {
  const dock = page.getByRole('navigation', { name: '工作區' })
  await dock.getByRole('button', { name: /示範|Sample|ERP/i }).first().click()
  await page.waitForURL(/\/w\/sample-erp\/?$/, { timeout: 15000 })
})

await step('dock-back-personal', async () => {
  const dock = page.getByRole('navigation', { name: '工作區' })
  await dock.getByRole('button', { name: /個人|Alan|Personal/i }).first().click()
  await page.waitForURL(/\/w\/personal\/?$/, { timeout: 15000 })
})

await step('me-page', async () => {
  await page.getByRole('button', { name: '我' }).click()
  await page.waitForURL(/\/me\/?$/, { timeout: 10000 })
  await page.getByRole('heading', { name: '我' }).waitFor()
})

await step('me-to-space', async () => {
  await page.getByRole('link', { name: '回到最近的工作區' }).click()
  await page.waitForURL(/\/w\//, { timeout: 10000 })
})

await browser.close()
if (failed) process.exit(1)
