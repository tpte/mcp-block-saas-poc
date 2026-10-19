import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  applyBuilderTemplate,
  fetchBuilderSetupContext,
  fetchBuilderTemplates,
  type BuilderSetupContext,
  type BuilderTemplateMeta,
} from '../../mcp/client'
import { DataSourcePlanForm } from './DataSourcePlanForm'
import { ModuleQuickPick } from './ModuleQuickPick'
import { BuilderSkillsPanel } from './BuilderSkillsPanel'

type Props = {
  open: boolean
  onToggle: () => void
  canManageManifest: boolean
  onAskAgent: (prompt: string) => void
  onApplied: () => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
}

const STARTER_PROMPTS = [
  '我想在 MATRIX 做自己的公司後台，不懂程式，請用 Skills 一步步帶我（先講資料要存哪）。',
  '幫我看看這個工作區還缺什麼，並建議要先啟用哪些模組。',
  '我想做類似 HIYEN 的後台，但不要一次全開，先從最小可用開始。',
]

export function BuilderHubPanel({
  open,
  onToggle,
  canManageManifest,
  onAskAgent,
  onApplied,
  onFlash,
}: Props) {
  const [ctx, setCtx] = useState<BuilderSetupContext | null>(null)
  const [templates, setTemplates] = useState<BuilderTemplateMeta[]>([])
  const [busy, setBusy] = useState(false)

  function reloadContext() {
    void fetchBuilderSetupContext().then((d) => setCtx(d.context))
  }

  useEffect(() => {
    if (!open) return
    reloadContext()
    void fetchBuilderTemplates().then((d) => setTemplates(d.templates))
  }, [open])

  async function restoreTemplate(templateId: string) {
    if (!canManageManifest) {
      onFlash('需要 admin 以上才能還原模板')
      return
    }
    setBusy(true)
    try {
      await applyBuilderTemplate(templateId, true)
      onFlash('已還原模板，可繼續跟 Agent 微調', 'ok')
      onApplied()
      reloadContext()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '還原失敗')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <section className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2">
        <button type="button" className="text-xs font-medium text-[var(--muted)]" onClick={onToggle}>
          ▸ 打造後台（Skills 引導 · 模板還原）
        </button>
      </section>
    )
  }

  return (
    <section className="max-h-[min(42vh,420px)] shrink-0 overflow-y-auto border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted)]">打造後台 · Agent + Skills</p>
        <button type="button" className="text-xs text-[var(--muted)]" onClick={onToggle}>
          ▾ 收合
        </button>
      </div>
      <p className="mb-2 text-[11px] text-[var(--muted)]">
        引導內容來自 <code className="text-[10px]">builder/skills</code> 與 RAG，不是寫死精靈。細節跟 Agent 共創；下方模板僅供還原起步。
      </p>
      {ctx ? (
        <div className="mb-3 rounded border border-[var(--line)] bg-[var(--bg)]/50 p-2 text-[11px]">
          <p>
            <span className="text-[var(--muted)]">模組</span> {ctx.enabledModuleCount} ·{' '}
            <span className="text-[var(--muted)]">資料源</span> {ctx.dataSourceCount}
          </p>
          {ctx.gaps.length ? (
            <ul className="mt-1 list-disc pl-4 text-amber-800 dark:text-amber-200">
              {ctx.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-emerald-700 dark:text-emerald-300">基礎設定齊全，可深化客製。</p>
          )}
        </div>
      ) : null}
      <div className="mb-3 space-y-2">
        <DataSourcePlanForm
          canManage={canManageManifest}
          existing={ctx?.dataSources ?? []}
          messages={ctx?.dataSourceMessages}
          onSaved={() => {
            reloadContext()
            onApplied()
          }}
          onFlash={onFlash}
          onAskAgent={onAskAgent}
        />
        <ModuleQuickPick
          canManage={canManageManifest}
          catalogOptions={ctx?.catalogOptions ?? []}
          enabledIds={ctx?.enabledCatalogIds ?? []}
          onSaved={() => {
            reloadContext()
            onApplied()
          }}
          onFlash={onFlash}
          onAskAgent={onAskAgent}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((p) => (
          <Button key={p} type="button" size="sm" variant="outline" className="h-auto whitespace-normal text-left text-[11px]" onClick={() => onAskAgent(p)}>
            {p.slice(0, 36)}…
          </Button>
        ))}
      </div>
      <BuilderSkillsPanel onAskAgent={onAskAgent} />
      <p className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">還原模板</p>
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--line)] px-2 py-1.5 text-xs">
            <div>
              <p className="font-medium">{t.label}</p>
              <p className="text-[10px] text-[var(--muted)]">{t.description}</p>
            </div>
            <Button type="button" size="sm" disabled={busy || !canManageManifest} onClick={() => void restoreTemplate(t.id)}>
              還原
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
