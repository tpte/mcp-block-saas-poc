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
  canvasLoading?: boolean
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
  /** 空畫布時額外操作提示 */
  opsHints?: string
  /** Cockpit 主格：較精簡的空狀態，不撐滿半個視窗 */
  emptyVariant?: 'default' | 'cockpit'
  /** 區塊撐滿主格剩餘高度 */
  fill?: boolean
}

const widthClass = {
  md: 'max-w-3xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
} as const

export function BlockCanvas({
  canvas,
  canvasLoading = false,
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
  opsHints,
  emptyVariant = 'default',
  fill = false,
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
    const cockpitEmpty = emptyVariant === 'cockpit'
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-4 py-6 text-center md:px-6',
          cockpitEmpty ? 'min-h-[min(28vh,240px)]' : 'min-h-[min(52vh,420px)] py-8',
        )}
      >
        <p className={cn('font-semibold tracking-tight', cockpitEmpty ? 'text-lg' : 'text-2xl')}>
          {canvasLoading ? '載入畫布…' : cockpitEmpty ? 'Agent 主畫布' : '這個工作區還沒有畫面'}
        </p>
        {canvasLoading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">從工作區讀取已儲存的版面。</p>
        ) : cockpitEmpty ? (
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            左右為固定摘要；完整圖表與表格會出現在這裡。在下方跟 Agent 說要看什麼，或用 ⌘K 執行模組。
          </p>
        ) : (
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            在下方告訴 Agent 你想看什麼，它會把結果畫在這裡。
          </p>
        )}
        {!canvasLoading && opsHints && !cockpitEmpty ? (
          <p className="mt-3 max-w-md text-xs text-[var(--muted)]">{opsHints}</p>
        ) : null}
        {!canvasLoading && platform.suggestionsEnabled && platform.composerPosition === 'bottom' && !cockpitEmpty ? (
          <p className="mt-4 text-xs text-[var(--muted)]">點下方建議，或直接輸入。</p>
        ) : null}
        {!canvasLoading && platform.suggestionsEnabled && platform.composerPosition !== 'bottom' && !cockpitEmpty ? (
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
          fill && 'h-full',
          layout === 'grid' && 'grid items-stretch md:grid-cols-2',
          layout !== 'grid' && 'flex flex-col',
          fill && layout === 'grid' && 'min-h-full',
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
