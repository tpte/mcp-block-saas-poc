import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { createWorkspace } from '../../mcp/client'

type Props = {
  onCreated: (workspace: { id: string; slug: string; name: string }) => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 32)
}

export function WorkspaceCreateForm({ onCreated, onFlash }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="mt-3 space-y-2 rounded-lg border border-dashed border-[var(--line)] p-3"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = name.trim()
        const s = (slug.trim() || slugify(trimmed)).replace(/^-+|-+$/g, '')
        if (!trimmed || !s) {
          onFlash('請填工作區名稱', 'error')
          return
        }
        setBusy(true)
        void createWorkspace({ name: trimmed, slug: s })
          .then(({ workspace }) => {
            onFlash(`已建立「${workspace.name}」`, 'ok')
            setName('')
            setSlug('')
            onCreated(workspace)
            navigate(`/w/${workspace.slug}`)
          })
          .catch((err) => onFlash(err instanceof Error ? err.message : '建立失敗', 'error'))
          .finally(() => setBusy(false))
      }}
    >
      <p className="text-xs font-medium">建立新工作區</p>
      <input
        className="w-full rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm"
        placeholder="顯示名稱（例：我的團隊）"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value))
        }}
      />
      <input
        className="w-full rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm"
        placeholder="網址 slug（英文小寫）"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
      />
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? '建立中…' : '建立並開啟'}
      </Button>
    </form>
  )
}
