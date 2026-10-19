import { useMemo, useState } from 'react'
import { flattenUi, renderBlock } from './blocks/registry'
import { invokeMcpTool, runAgentIntent } from './mcp/mockMcp'
import type { BlockAction, UiBlock } from './types/ui'

const MODULES = [
  { id: 'hr', label: '員工 HR', tool: 'hr:get_leave' },
  { id: 'finance', label: '財務 Finance', tool: 'finance:get_cashflow' },
  { id: 'sales', label: '業務 Sales', tool: 'sales:pipeline' },
]

const SAMPLE_PROMPT = '幫我看這個月的員工請假狀況，並把超過 3 天的標記出來'

export default function App() {
  const [blocks, setBlocks] = useState<UiBlock[]>([])
  const [input, setInput] = useState(SAMPLE_PROMPT)
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const architecture = useMemo(
    () => [
      { title: 'MCP Servers', desc: '員工 / 財務 / 業務模組，暴露 Tools + Resources' },
      { title: 'Orchestrator Agent', desc: '理解意圖、調用 MCP、決定 UI Block 組合' },
      { title: 'Dynamic UI', desc: 'Block Registry 即時渲染 + UPDATE_DATA patch' },
    ],
    [],
  )

  async function applyAgentMessage(message: string) {
    setBusy(true)
    setLog((prev) => [`Agent ← ${message}`, ...prev].slice(0, 8))
    const response = await runAgentIntent(message)
    if (response.action === 'RENDER') {
      setBlocks(flattenUi(response.ui))
      setLog((prev) => [`MCP → RENDER (${flattenUi(response.ui).length} blocks)`, ...prev].slice(0, 8))
    }
    setBusy(false)
  }

  async function handleBlockAction(action: BlockAction) {
    setBusy(true)
    setLog((prev) => [`Action → ${action.mcpTool}`, ...prev].slice(0, 8))
    const response = await invokeMcpTool(action.mcpTool, action.payload)
    if (response.action === 'UPDATE_DATA') {
      setBlocks((prev) =>
        prev.map((block) =>
          block.blockId === response.targetBlockId
            ? { ...block, props: { ...block.props, ...response.patch } }
            : block,
        ),
      )
      setLog((prev) => [`MCP → UPDATE_DATA ${response.targetBlockId}`, ...prev].slice(0, 8))
    } else {
      setBlocks(flattenUi(response.ui))
      setLog((prev) => [`MCP → RENDER`, ...prev].slice(0, 8))
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">MCP SaaS 架構藍圖 · PoC</p>
            <h1 className="text-xl font-semibold">Agent 驅動 · Block Registry 動態 UI</h1>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            shadcn Block Schema（mock MCP）
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">模組（MCP Servers）</h2>
            <ul className="mt-3 space-y-2">
              {MODULES.map((mod) => (
                <li key={mod.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void invokeMcpTool(mod.tool).then((res) => {
                      if (res.action === 'RENDER') setBlocks(flattenUi(res.ui))
                    })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    {mod.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">三層架構</h2>
            <ol className="mt-3 space-y-3">
              {architecture.map((layer, index) => (
                <li key={layer.title} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Layer {index + 1}</p>
                  <p className="text-sm font-semibold">{layer.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{layer.desc}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="agent-input" className="text-sm font-semibold text-slate-700">
              與 Orchestrator Agent 對話
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="agent-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
                placeholder="輸入自然語言指令…"
              />
              <button
                type="button"
                disabled={busy || !input.trim()}
                onClick={() => void applyAgentMessage(input.trim())}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {busy ? 'Agent 思考中…' : '送出指令'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Gemini 分享範例：MCP 回傳 <code className="rounded bg-slate-100 px-1">ShadcnDataTableBlock</code> +{' '}
              <code className="rounded bg-slate-100 px-1">UPDATE_DATA</code> patch。
            </p>
          </section>

          <section className="space-y-4">
            {blocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                送出指令或點選左側模組，Agent 會透過 MCP 渲染 Block UI。
              </div>
            ) : (
              blocks.map((block) => renderBlock(block, (action) => void handleBlockAction(action)))
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100 shadow-sm">
            <h2 className="text-sm font-semibold">Event Log（Agent ↔ MCP ↔ UI）</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
              {log.length === 0 ? <li>—</li> : log.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
