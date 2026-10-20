import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { fetchManifest, fetchWorkbenchFile, saveManifest, saveWorkbenchFile } from '../../mcp/client'
import type { WorkspaceManifest } from '../../../shared/workspaceManifest.ts'

type Props = {
  open: boolean
  onToggle: () => void
  embedded?: boolean
  canEdit: boolean
  onSaved: () => void
}

export function WorkbenchPanel({ open, onToggle, embedded = false, canEdit, onSaved }: Props) {
  const [text, setText] = useState('')
  const [diff, setDiff] = useState<{ type: string; text: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [gitRepo, setGitRepo] = useState('')

  useEffect(() => {
    if (!open) return
    void fetchWorkbenchFile('manifest.json').then((d) => setText(d.content ?? ''))
    void fetchManifest().then((d) => setGitRepo(d.manifest.git?.repo ?? ''))
  }, [open])

  async function save() {
    setBusy(true)
    try {
      await saveWorkbenchFile('manifest.json', text)
      const manifest = JSON.parse(text) as WorkspaceManifest
      const res = await saveManifest(manifest)
      setDiff(res.diff)
      onSaved()
    } catch (err) {
      setDiff([{ type: 'del', text: err instanceof Error ? err.message : '儲存失敗' }])
    } finally {
      setBusy(false)
    }
  }

  function bindGit() {
    try {
      const manifest = JSON.parse(text) as WorkspaceManifest
      manifest.git = { provider: 'github', repo: gitRepo.trim(), branch: 'main', lastSyncAt: new Date().toISOString() }
      setText(JSON.stringify(manifest, null, 2))
    } catch {
      /* invalid json */
    }
  }

  if (!open) {
    if (embedded) return null
    return (
      <section className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2">
        <button type="button" className="text-xs font-medium text-[var(--muted)]" onClick={onToggle}>
          ▸ 工作台（manifest / DIFF / Git）
        </button>
      </section>
    )
  }

  const shellClass = embedded
    ? 'max-h-[45vh] overflow-y-auto px-3 pb-3 pt-2'
    : 'max-h-[min(42vh,420px)] shrink-0 overflow-y-auto border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2'

  return (
    <section className={shellClass}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted)]">工作台 · manifest.json</p>
        <button type="button" className="text-xs text-[var(--muted)]" onClick={onToggle}>
          ▾ 收合
        </button>
      </div>
      {!canEdit ? (
        <p className="mb-2 text-[11px] text-amber-800 dark:text-amber-200">
          直接編輯 manifest 需要管理員 token；訪客可到「打造後台」勾選模組並預覽 manifest Diff。
        </p>
      ) : null}
      <div className="mb-2 flex flex-wrap gap-2">
        <input
          className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
          placeholder="GitHub org/repo（可選）"
          value={gitRepo}
          onChange={(e) => setGitRepo(e.target.value)}
          disabled={!canEdit}
        />
        <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => bindGit()}>
          綁定 Git
        </Button>
        <Button type="button" size="sm" disabled={!canEdit || busy} onClick={() => void save()}>
          儲存
        </Button>
      </div>
      <textarea
        className="h-40 w-full resize-y rounded border border-[var(--line)] bg-[var(--bg)] p-2 font-mono text-[11px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!canEdit}
        spellCheck={false}
      />
      {diff.length > 0 ? (
        <pre className="mt-2 max-h-24 overflow-auto rounded bg-[var(--bg)] p-2 text-[10px]">
          {diff.map((line, i) => (
            <div key={`${i}-${line.text}`} className={line.type === 'add' ? 'text-emerald-700' : line.type === 'del' ? 'text-red-600' : ''}>
              {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '} {line.text}
            </div>
          ))}
        </pre>
      ) : null}
    </section>
  )
}
