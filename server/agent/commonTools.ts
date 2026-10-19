export async function webSearch(query: string): Promise<string> {
  const q = query.trim()
  if (!q) return '沒有搜尋關鍵字。'
  const [wiki, duck] = await Promise.all([wikiSearch(q), duckSearch(q)])
  const parts = [duck, wiki].filter(Boolean)
  return parts.length ? parts.join('\n\n') : `沒有查到跟「${q}」有關的公開摘要。`
}

async function wikiSearch(query: string): Promise<string> {
  const url = `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&format=json&srlimit=3&origin=*`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return ''
    const data = (await res.json()) as { query?: { search?: Array<{ title: string; snippet: string }> } }
    const rows = data.query?.search ?? []
    if (!rows.length) return ''
    return rows
      .map((row) => `${row.title}：${row.snippet.replace(/<[^>]+>/g, '')}`)
      .join('\n')
  } catch {
    return ''
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function duckSearch(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return ''
    const html = await res.text()
    const titles = [...html.matchAll(/class="result__a"[^>]*>(.*?)<\/a>/g)].map((m) => stripHtml(m[1] ?? ''))
    const snippets = [...html.matchAll(/class="result__snippet"[^>]*>(.*?)<\/(?:a|td|div)>/g)].map((m) =>
      stripHtml(m[1] ?? ''),
    )
    return titles
      .slice(0, 3)
      .map((title, i) => [title, snippets[i]].filter(Boolean).join('：'))
      .filter(Boolean)
      .join('\n')
  } catch {
    return ''
  }
}
