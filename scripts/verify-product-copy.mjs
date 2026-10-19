#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

const SKIP_FILES = [/legacyRoutes\.ts$/]

const SCAN_ROOTS = [
  join(root, 'src'),
  join(root, 'index.html'),
  join(root, 'shared', 'product.ts'),
  join(root, 'README.md'),
  join(root, 'builder'),
]

const RULES = [
  { name: 'HIYEN brand', re: /HIYEN/i },
  { name: 'hiyen slug', re: /hiyen/i },
  { name: 'PoC', re: /\bPoC\b|（PoC）/ },
  { name: 'Phase roadmap', re: /Phase\s*[123]/i },
  { name: 'deferred', re: /implementation deferred/i },
  { name: '試玩', re: /試玩/ },
  { name: '舊定位 駕駛艙', re: /駕駛艙/ },
  { name: 'HIYEN MATRIX', re: /HIYEN MATRIX/i },
  { name: 'not-equal disclaimer', re: /≠/ },
  { name: '非真實商用', re: /非真實商用/ },
]

function collectFiles(path) {
  const st = statSync(path)
  if (st.isFile()) return [path]
  const out = []
  for (const name of readdirSync(path)) {
    if (name === 'node_modules') continue
    const p = join(path, name)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...collectFiles(p))
    else if (/\.(tsx?|jsx?|html|md)$/.test(name) || name === 'product.ts') out.push(p)
  }
  return out
}

const files = [...new Set(SCAN_ROOTS.flatMap((p) => collectFiles(p)))]
const hits = []

for (const file of files) {
  if (SKIP_FILES.some((re) => re.test(file))) continue
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  for (const rule of RULES) {
    lines.forEach((line, i) => {
      if (!rule.re.test(line)) return
      hits.push({ file, line: i + 1, rule: rule.name, snippet: line.trim().slice(0, 120) })
    })
  }
}

if (hits.length) {
  console.error('verify-product-copy: failed\n')
  for (const h of hits) {
    console.error(`${h.file}:${h.line} [${h.rule}] ${h.snippet}`)
  }
  process.exit(1)
}

console.log(`verify-product-copy: ok (${files.length} files)`)
