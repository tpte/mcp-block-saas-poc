import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { previewBuilderManifest, saveBuilderModules, type BuilderCatalogOption } from '../../mcp/client'
import { ManifestDiffPreview } from './ManifestDiffPreview'

type Props = {
  canManage: boolean
  catalogOptions: BuilderCatalogOption[]
  enabledIds: string[]
  onSaved: () => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
  onAskAgent: (prompt: string) => void
}

export function ModuleQuickPick({
  canManage,
  catalogOptions,
  enabledIds,
  onSaved,
  onFlash,
  onAskAgent,
}: Props) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(enabledIds))
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ summary: string; diff: { type: string; text: string }[] } | null>(
    null,
  )

  useEffect(() => {
    setPicked(new Set(enabledIds))
    setPreview(null)
  }, [enabledIds.join('|')])

  const byGroup = catalogOptions.reduce<Map<string, BuilderCatalogOption[]>>((map, item) => {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
    return map
  }, new Map())

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPreview(null)
  }

  async function runPreview() {
    try {
      const res = await previewBuilderManifest({ enabledCatalogIds: [...picked] })
      setPreview(res)
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '無法預覽')
    }
  }

  async function save() {
    setBusy(true)
    try {
      await saveBuilderModules([...picked])
      onFlash('已更新啟用模組', 'ok')
      setPreview(null)
      onSaved()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '無法儲存模組')
    } finally {
      setBusy(false)
    }
  }

  if (catalogOptions.length === 0) return null

  return (
    <div className="rounded border border-[var(--line)] bg-[var(--bg)]/40 p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium">啟用模組（勾選 → 預覽 → 儲存）</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() =>
            onAskAgent('請先 read industry-discovery skill，問我 2 個問題釐清業務，再建議要開哪些模組。')
          }
        >
          請 Agent 訪談
        </Button>
      </div>
      <div className="mb-2 max-h-32 space-y-2 overflow-y-auto text-[10px]">
        {[...byGroup.entries()].map(([group, items]) => (
          <div key={group}>
            <p className="font-medium text-[var(--muted)]">{group}</p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-[var(--line)]/30">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={picked.has(item.id)}
                      disabled={!canManage}
                      onChange={() => toggle(item.id)}
                    />
                    <span>
                      <span className="block text-xs">{item.label}</span>
                      <span className="font-mono text-[9px] text-[var(--muted)]">{item.id}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {preview ? <ManifestDiffPreview summary={preview.summary} diff={preview.diff} /> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!canManage} onClick={() => void runPreview()}>
          預覽變更
        </Button>
        <Button type="button" size="sm" disabled={!canManage || busy} onClick={() => void save()}>
          儲存模組
        </Button>
      </div>
    </div>
  )
}
