import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { saveBuilderModules } from '../../mcp/client'

type Props = {
  canManage: boolean
  availableIds: string[]
  enabledIds: string[]
  onSaved: () => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
  onAskAgent: (prompt: string) => void
}

export function ModuleQuickPick({
  canManage,
  availableIds,
  enabledIds,
  onSaved,
  onFlash,
  onAskAgent,
}: Props) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(enabledIds))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPicked(new Set(enabledIds))
  }, [enabledIds.join('|')])

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setBusy(true)
    try {
      await saveBuilderModules([...picked])
      onFlash('已更新啟用模組', 'ok')
      onSaved()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '無法儲存模組')
    } finally {
      setBusy(false)
    }
  }

  if (availableIds.length === 0) return null

  return (
    <div className="rounded border border-[var(--line)] bg-[var(--bg)]/40 p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium">啟用模組（勾選後仍建議跟 Agent 確認順序）</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() => onAskAgent('請用 modules-enable skill：依我剛描述的業務，建議先開哪 2～3 個模組？')}
        >
          請 Agent 建議
        </Button>
      </div>
      <ul className="mb-2 max-h-28 space-y-0.5 overflow-y-auto text-[10px]">
        {availableIds.map((id) => (
          <li key={id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[var(--line)]/30">
              <input
                type="checkbox"
                checked={picked.has(id)}
                disabled={!canManage}
                onChange={() => toggle(id)}
              />
              <span className="font-mono">{id}</span>
            </label>
          </li>
        ))}
      </ul>
      <Button type="button" size="sm" disabled={!canManage || busy} onClick={() => void save()}>
        儲存模組
      </Button>
    </div>
  )
}
