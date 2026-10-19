import { useEffect, useRef, useState } from 'react'
import type { BlockTemplate } from '../../../shared/blockTemplates.ts'
import { renderBlock } from '../../blocks/registry'
import { Button } from '../../components/ui/button'
import { fetchBlockTemplates } from '../../mcp/client'
import type { BlockAction, UiBlock } from '../../types/ui.ts'

type Props = {
  block: UiBlock | null
  onClose: () => void
  onAction: (action: BlockAction) => void
  editable?: boolean
  onSaveProps?: (props: Record<string, unknown>) => void
  onDelete?: () => void
}

export function BlockDetailOverlay({ block, onClose, onAction, editable, onSaveProps, onDelete }: Props) {
  const [templates, setTemplates] = useState<BlockTemplate[]>([])
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!editable) return
    void fetchBlockTemplates().then((d) => setTemplates(d.templates))
  }, [editable])

  useEffect(() => {
    if (block) setDraft({ ...block.props })
  }, [block])
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!block) return
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [block, onClose])

  if (!block) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={block.props.title ?? 'Block 詳細'}
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl outline-none"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{block.props.title ?? block.component}</p>
          <div className="flex gap-2">
            {editable && onDelete ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onDelete()}>
                刪除 Block
              </Button>
            ) : null}
            {editable && onSaveProps ? (
              <Button type="button" size="sm" onClick={() => onSaveProps(draft)}>
                儲存編輯
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              關閉 (Esc)
            </Button>
          </div>
        </div>
        {editable ? (
          <div className="mb-4 space-y-2 rounded-lg border border-[var(--line)] p-3 text-xs">
            {(templates.find((t) => t.component === block.component)?.editableFields ?? []).map((field) => (
              <label key={String(field.key)} className="block">
                <span className="text-[var(--muted)]">{field.label}</span>
                {field.type === 'string' ? (
                  <input
                    className="mt-1 w-full rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1"
                    value={String(draft[field.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                  />
                ) : field.type === 'enum' ? (
                  <select
                    className="mt-1 w-full rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1"
                    value={String(draft[field.key] ?? field.options[0])}
                    onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                  >
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    className="mt-1 h-20 w-full rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1"
                    value={(draft[field.key] as string[] | undefined)?.join('\n') ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [field.key]: e.target.value.split('\n').filter(Boolean),
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </div>
        ) : null}
        <div className="[&_.recharts-responsive-container]:min-h-[320px]">
          {renderBlock({ ...block, props: { ...block.props, ...draft } as typeof block.props }, onAction)}
        </div>
      </div>
    </div>
  )
}
