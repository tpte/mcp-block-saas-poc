import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { fetchWorkbenchFile } from '../../mcp/client'

type Props = {
  slug: string
  canvas: ReactNode
}

export function IdeSpaceView({ slug, canvas }: Props) {
  const [manifestText, setManifestText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    void fetchWorkbenchFile('manifest.json')
      .then((d) => setManifestText(d.content ?? ''))
      .catch(() => {
        setManifestText('')
        setError('無法載入 manifest.json')
      })
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="mx-auto grid h-full min-h-[50vh] max-w-6xl grid-cols-1 gap-3 lg:grid-cols-2">
      <section className="flex min-h-0 flex-col rounded-xl border border-[var(--line)] bg-[var(--card)]/40">
        <p className="border-b border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
          IDE · manifest.json
        </p>
        {loading ? (
          <p className="p-3 text-xs text-[var(--muted)]">載入 manifest…</p>
        ) : error ? (
          <p className="p-3 text-xs text-amber-800 dark:text-amber-200">{error}</p>
        ) : (
          <textarea
            className="min-h-[240px] flex-1 resize-none bg-transparent p-3 font-mono text-xs text-[var(--fg)] outline-none"
            value={manifestText}
            readOnly
            spellCheck={false}
          />
        )}
      </section>
      <section className="min-h-0 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 p-2">
        <p className="mb-2 px-1 text-xs font-medium text-[var(--muted)]">Agent Block 預覽</p>
        {canvas}
      </section>
    </div>
  )
}
