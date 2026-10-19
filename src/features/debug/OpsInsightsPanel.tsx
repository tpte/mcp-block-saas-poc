import { useEffect, useState } from 'react'
import type { OpLogSummary } from '../../../shared/opsLog.ts'
import { fetchOpsSummary } from '../../mcp/client'

type Props = {
  refreshKey: number
  defaultOpen?: boolean
}

export function OpsInsightsPanel({ refreshKey, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [summary, setSummary] = useState<OpLogSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchOpsSummary()
      .then((data) => {
        if (!cancelled) {
          setSummary(data.summary)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '載入失敗')
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (error) {
    return (
      <section className="border-t border-[var(--line)] bg-[var(--card)]/20 px-4 py-2 text-xs text-red-600">
        操作紀錄：{error}
      </section>
    )
  }

  if (!summary || summary.total === 0) return null

  return (
    <section className="border-t border-[var(--line)] bg-[var(--card)]/20 px-4 py-2">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--muted)]"
        onClick={() => setOpen((v) => !v)}
      >
        操作紀錄 · 品質摘要（{summary.total} 筆）
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2 text-xs text-[var(--muted)]">
          <p>
            對話 {summary.userMessages} · 回覆 {summary.assistantReplies} · 工具 {summary.toolInvokes} ·
            異常 {summary.errors} · 👍 {summary.feedbackHelpful} · 👎 {summary.feedbackWrong} · ◑{' '}
            {summary.feedbackPartial}
          </p>
          {summary.topFailedTools.length > 0 ? (
            <p>
              常失敗工具：
              {summary.topFailedTools.map((t) => `${t.tool}(${t.count})`).join('、')}
            </p>
          ) : null}
          {summary.recentErrors.length > 0 ? (
            <ul className="max-h-24 space-y-1 overflow-y-auto">
              {summary.recentErrors.map((e) => (
                <li key={e.id} className="text-red-600/90">
                  {e.ts.slice(0, 19)} · {e.kind} · {e.output?.error ?? e.input?.tool ?? '—'}
                </li>
              ))}
            </ul>
          ) : null}
          {summary.recentWrongFeedback.length > 0 ? (
            <ul className="max-h-20 space-y-1 overflow-y-auto">
              {summary.recentWrongFeedback.map((e) => (
                <li key={e.id}>
                  {e.ts.slice(0, 19)} · 使用者標記不正確
                  {e.feedback?.comment ? `：${e.feedback.comment}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-[10px] opacity-80">持久化：.data/ops/&lt;workspaceId&gt;.jsonl（可匯出分析）</p>
        </div>
      ) : null}
    </section>
  )
}
