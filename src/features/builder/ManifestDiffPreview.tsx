type Line = { type: string; text: string }

type Props = {
  summary: string
  diff: Line[]
}

export function ManifestDiffPreview({ summary, diff }: Props) {
  if (!summary && diff.length === 0) return null
  return (
    <div className="rounded border border-dashed border-[var(--line)] bg-[var(--bg)]/60 p-2 text-[10px]">
      <p className="mb-1 font-medium text-[var(--muted)]">變更預覽</p>
      <p className="mb-1">{summary}</p>
      {diff.length > 0 ? (
        <pre className="max-h-24 overflow-auto font-mono">
          {diff.map((line, i) => (
            <div
              key={`${i}-${line.text}`}
              className={
                line.type === 'add'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : line.type === 'del'
                    ? 'text-red-600 dark:text-red-400'
                    : ''
              }
            >
              {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '} {line.text}
            </div>
          ))}
        </pre>
      ) : null}
    </div>
  )
}
