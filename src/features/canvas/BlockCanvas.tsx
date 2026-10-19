import { useMemo, useState } from 'react'
import { BlockShell } from '../../blocks/BlockShell'
import { renderBlock } from '../../blocks/registry'
import { cn } from '../../lib/utils'
import type { PlatformConfig } from '../../mcp/client'
import type { BlockAction, CanvasPage, UiBlock } from '../../types/ui'
import { BlockDetailOverlay } from './BlockDetailOverlay'
import { sortBlocks } from './sortBlocks'

type Props = {
  canvas: CanvasPage
  platform: PlatformConfig
  suggestions: string[]
  busy?: boolean
  onAction: (action: BlockAction) => void
  onSuggest: (text: string) => void
  focusedBlockId?: string | null
  onFocusBlock?: (blockId: string) => void
  expandedBlock?: UiBlock | null
  onExpandBlock?: (block: UiBlock | null) => void
  onAddTemplate?: (templateId: string) => void
  onSaveBlockProps?: (blockId: string, props: Record<string, unknown>) => void
  onDeleteBlock?: (blockId: string) => void
}

const widthClass = {
  md: 'max-w-3xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
} as const

export function BlockCanvas({
  canvas,
  platform,
  suggestions,
  busy = false,
  onAction,
  onSuggest,
  focusedBlockId,
  onFocusBlock,
  expandedBlock,
  onExpandBlock,
  onAddTemplate,
  onSaveBlockProps,
  onDeleteBlock,
}: Props) {
  const [localExpanded, setLocalExpanded] = useState<UiBlock | null>(null)
  const overlayBlock = expandedBlock ?? localExpanded

  const blocks = useMemo(
    () => sortBlocks(canvas.blocks, platform.layoutPreferences),
    [canvas.blocks, platform.layoutPreferences],
  )

  const layout =
    canvas.blocks.length > 0 && canvas.layout === 'stack' && platform.layoutPreferences.defaultCanvasLayout !== 'stack'
      ? platform.layoutPreferences.defaultCanvasLayout
      : canvas.layout

  if (canvas.blocks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl font-semibold tracking-tight">{platform.title}</p>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          {platform.subtitle}。說你想看什麼，或用 ⌘K／左側模組直達 MCP。
        </p>
        {platform.suggestionsEnabled ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {suggestions.map((text, index) => (
              <button
                key={`${index}-${text}`}
                type="button"
                disabled={busy}
                onClick={() => onSuggest(text)}
                className="cursor-pointer rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      {onAddTemplate ? (
        <div className="mx-auto mb-3 flex max-w-6xl flex-wrap gap-2">
          {['title', 'points', 'document', 'confirm'].map((id) => (
            <button
              key={id}
              type="button"
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:bg-[var(--line)]/40"
              onClick={() => onAddTemplate(id)}
            >
              + {id}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={cn(
          'mx-auto w-full',
          widthClass[platform.canvasMaxWidth],
          platform.density === 'compact' ? 'gap-2' : 'gap-4',
          layout === 'grid' && 'grid items-start md:grid-cols-2',
          layout !== 'grid' && 'flex flex-col',
        )}
      >
        {blocks.map((block) => (
          <BlockShell
            key={block.blockId}
            block={block}
            focused={focusedBlockId === block.blockId}
            onFocusBlock={() => onFocusBlock?.(block.blockId)}
            onExpand={() => {
              onExpandBlock?.(block)
              setLocalExpanded(block)
            }}
          >
            {renderBlock(block, onAction)}
          </BlockShell>
        ))}
      </div>
      <BlockDetailOverlay
        block={overlayBlock}
        editable={Boolean(onSaveBlockProps)}
        onSaveProps={
          overlayBlock && onSaveBlockProps
            ? (props) => onSaveBlockProps(overlayBlock.blockId, props)
            : undefined
        }
        onDelete={
          overlayBlock && onDeleteBlock
            ? () => {
                onDeleteBlock(overlayBlock.blockId)
                onExpandBlock?.(null)
                setLocalExpanded(null)
              }
            : undefined
        }
        onClose={() => {
          onExpandBlock?.(null)
          setLocalExpanded(null)
        }}
        onAction={onAction}
      />
    </>
  )
}
