export type ExternalTool = {
  name: string
  description: string
}

export type ExternalMcp = {
  name: string
  description: string
  listTools: () => ExternalTool[]
  /** readOnly=true（訪客）時，寫入類 tool 只回傳模擬結果，不改共享狀態。 */
  callTool: (tool: string, args: Record<string, unknown>, opts?: { readOnly?: boolean }) => unknown | Promise<unknown>
}

const notes = [
  { id: 1, title: '客戶訪廠', body: '下週三 10:00' },
  { id: 2, title: '報價', body: '海灣醫療待回覆' },
]

export const sampleNotesMcp: ExternalMcp = {
  name: 'notes',
  description: '示範用外部 MCP，不知道 Super MCP 的 Block schema。',
  listTools: () => [
    { name: 'notes:list', description: '列出記事' },
    { name: 'notes:add', description: '新增一則記事' },
  ],
  callTool(tool, args, opts) {
    if (tool === 'notes:add') {
      const row = {
        id: Date.now(),
        title: String(args.title ?? '未命名').slice(0, 80),
        body: String(args.body ?? '').slice(0, 500),
      }
      if (opts?.readOnly) return [row, ...notes].map((r) => ({ ...r }))
      notes.unshift(row)
    }
    if (tool === 'notes:list' || tool === 'notes:add') return notes.map((row) => ({ ...row }))
    throw new Error(`notes MCP 沒有 ${tool}`)
  },
}
