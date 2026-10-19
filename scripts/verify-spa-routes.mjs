#!/usr/bin/env node
/**
 * SPA fallback：/me、SPACE、Studio 應回傳同一支 index（含 #root）。
 * 本機僅 API、未 SERVE_STATIC 時會 302 到 Vite → 自動 SKIP。
 */
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

const routes = ['/', '/me', '/w/personal', '/w/personal/studio', '/w/sample', '/w/hiyen/studio']

let failed = 0
let skipped = false

for (const route of routes) {
  try {
    const res = await fetch(`${base}${route}`, { redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      console.log('SKIP', 'spa-routes', 'dev UI proxy (no static dist on API)')
      skipped = true
      break
    }
    const text = await res.text()
    const ok = res.ok && text.includes('id="root"')
    if (!ok) {
      console.error('FAIL', 'spa-route', route, res.status)
      failed += 1
    } else {
      console.log('OK', 'spa-route', route)
    }
  } catch (err) {
    console.error('FAIL', 'spa-route', route, err.message)
    failed += 1
  }
}

if (skipped) process.exit(0)
if (failed) process.exit(1)
