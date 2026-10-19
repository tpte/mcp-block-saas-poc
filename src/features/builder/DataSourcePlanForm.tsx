import { useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  addBuilderDataSource,
  previewBuilderManifest,
  quickBuilderSqlite,
  type BuilderDataSourceSummary,
} from '../../mcp/client'
import { ManifestDiffPreview } from './ManifestDiffPreview'

const TYPES = [
  { value: 'postgres', label: 'PostgreSQL（正式環境常用）' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'sqlite', label: 'SQLite（試用／少量資料）' },
  { value: 'http_api', label: 'HTTP API（資料在別的系统）' },
] as const

type Props = {
  canManage: boolean
  existing: BuilderDataSourceSummary[]
  messages?: string[]
  onSaved: () => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
  onAskAgent: (prompt: string) => void
}

export function DataSourcePlanForm({ canManage, existing, messages = [], onSaved, onFlash, onAskAgent }: Props) {
  const [label, setLabel] = useState('主要業務資料庫')
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('postgres')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ summary: string; diff: { type: string; text: string }[] } | null>(null)

  async function runPreview() {
    if (!label.trim()) return
    try {
      const res = await previewBuilderManifest({ dataSource: { label, type } })
      setPreview(res)
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '無法預覽')
    }
  }

  async function submit() {
    setBusy(true)
    try {
      await addBuilderDataSource({ label, type })
      onFlash('已把資料源加入 manifest 計畫（連線需 admin 在 server 設 secret）', 'ok')
      setLabel('')
      setPreview(null)
      onSaved()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '無法新增')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded border border-[var(--line)] bg-[var(--bg)]/40 p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium">資料源計畫（先規劃要「存資料的庫」）</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() =>
            onAskAgent(
              '請用 data-source skill 白話解釋：為什麼做後台前要先有資料源？我該選 Postgres 還是 SQLite？',
            )
          }
        >
          請 Agent 解釋
        </Button>
      </div>
      {existing.length > 0 ? (
        <ul className="mb-2 space-y-1 text-[10px]">
          {existing.map((d, i) => (
            <li key={d.id} className="text-[var(--muted)]">
              {messages[i] ?? `${d.label} · ${d.type} · ${d.secretRef}`}
              {d.health ? (
                <span
                  className={
                    d.health === 'healthy'
                      ? ' ml-1 text-emerald-600'
                      : d.health === 'unknown'
                        ? ' ml-1 text-amber-600'
                        : ' ml-1 text-red-600'
                  }
                >
                  ({d.health})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-[10px] text-amber-800 dark:text-amber-200">尚未規劃資料源 — 模組多半仍是示範資料。</p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[8rem] flex-1 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs"
          placeholder="例如：訂單與客戶資料庫"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={!canManage}
        />
        <select
          className="rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          disabled={!canManage}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canManage || busy}
          onClick={() => {
            setBusy(true)
            void quickBuilderSqlite(label.trim() || '本機業務資料庫')
              .then((r) => {
                onFlash(r.message, 'ok')
                setPreview(null)
                onSaved()
              })
              .catch((err) => onFlash(err instanceof Error ? err.message : '建立失敗'))
              .finally(() => setBusy(false))
          }}
        >
          一鍵本機 SQLite
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!canManage || !label.trim()} onClick={() => void runPreview()}>
          預覽
        </Button>
        <Button type="button" size="sm" disabled={!canManage || busy || !label.trim()} onClick={() => void submit()}>
          加入計畫
        </Button>
      </div>
      {preview ? <ManifestDiffPreview summary={preview.summary} diff={preview.diff} /> : null}
      {!canManage ? (
        <p className="mt-1 text-[10px] text-[var(--muted)]">你目前身份無法寫入；可請 Agent 說明後找 admin 加入。</p>
      ) : null}
    </div>
  )
}
