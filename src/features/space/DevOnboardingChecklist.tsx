import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'

type StepId = 'mount' | 'invoke' | 'pin'
type Progress = Record<StepId, boolean> & { dismissed?: boolean }

const EMPTY: Progress = { mount: false, invoke: false, pin: false }

function storageKey(workspaceId: string) {
  return `matrix-dev-checklist-${workspaceId}`
}

function load(workspaceId: string): Progress {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

type Props = {
  workspaceId: string
  onShowMounts: () => void
  onOpenPalette: () => void
  onOpenModulePick: () => void
}

/** 開發者工作台第一次造訪：三步清單（本輪只有 UI 與本機進度，不含「新增 MCP Server」表單）。 */
export function DevOnboardingChecklist({ workspaceId, onShowMounts, onOpenPalette, onOpenModulePick }: Props) {
  const [progress, setProgress] = useState<Progress>(() => load(workspaceId))

  useEffect(() => {
    setProgress(load(workspaceId))
  }, [workspaceId])

  const update = (patch: Partial<Progress>) => {
    setProgress((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(storageKey(workspaceId), JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    const onInvoked = (event: Event) => {
      const tool = (event as CustomEvent<{ tool?: string }>).detail?.tool ?? ''
      if (tool === 'bridge:list') update({ mount: true })
      else if (tool) update({ invoke: true })
    }
    window.addEventListener('matrix:tool-invoked', onInvoked)
    return () => window.removeEventListener('matrix:tool-invoked', onInvoked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  if (progress.dismissed) return null
  const doneCount = [progress.mount, progress.invoke, progress.pin].filter(Boolean).length

  const steps: { id: StepId; label: string; hint: string; action: string; run: () => void }[] = [
    {
      id: 'mount',
      label: '① 掛一個 MCP server',
      hint: '用 MCP_STDIO_SERVERS 掛 stdio MCP；內建的 notes 已經掛好，可以先看 Bridge 列表。',
      action: '看已掛載的 MCP',
      run: () => {
        update({ mount: true })
        onShowMounts()
      },
    },
    {
      id: 'invoke',
      label: '② ⌘K 執行其中一個 tool',
      hint: '命令盤直接呼叫 tool，不經 LLM。試試「本週 KPI」。',
      action: '開啟 ⌘K',
      run: onOpenPalette,
    },
    {
      id: 'pin',
      label: '③ 釘成模組並看到 manifest Diff',
      hint: '勾選要常駐的模組，預覽 manifest.json 的變更。',
      action: '去釘模組',
      run: () => {
        update({ pin: true })
        onOpenModulePick()
      },
    },
  ]

  return (
    <section
      aria-label="開發者工作台起步清單"
      className="mx-auto mb-4 w-full max-w-3xl rounded-xl border border-[var(--line)] bg-[var(--card)]/60 p-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">三步上手開發者工作台</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">已完成 {doneCount} / 3</p>
        </div>
        <button
          type="button"
          className="text-xs text-[var(--muted)] hover:text-[var(--fg)]"
          onClick={() => update({ dismissed: true })}
        >
          隱藏
        </button>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => {
          const done = progress[step.id]
          return (
            <li
              key={step.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                  {done ? '✓ ' : ''}
                  {step.label}
                </p>
                <p className="text-xs text-[var(--muted)]">{step.hint}</p>
              </div>
              <Button type="button" size="sm" variant={done ? 'ghost' : 'outline'} className="text-xs" onClick={step.run}>
                {step.action}
              </Button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
