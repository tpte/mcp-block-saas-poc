import { renderBlock } from '../../blocks/registry'
import { cn } from '../../lib/utils'
import type { PlatformConfig } from '../../mcp/client'
import type { BlockAction, CanvasPage } from '../../types/ui'

type Props = {
  canvas: CanvasPage
  platform: PlatformConfig
  suggestions: string[]
  onAction: (action: BlockAction) => void
  onSuggest: (text: string) => void
}

const widthClass = {
  md: 'max-w-3xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
} as const

export function BlockCanvas({ canvas, platform, suggestions, onAction, onSuggest }: Props) {
  if (canvas.blocks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl font-semibold tracking-tight">{platform.title}</p>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">{platform.subtitle}。說你想看什麼，或直接改這個介面。</p>
        {platform.suggestionsEnabled ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => onSuggest(text)}
                className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-sm hover:opacity-80"
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
    <div
      className={cn(
        'mx-auto w-full',
        widthClass[platform.canvasMaxWidth],
        platform.density === 'compact' ? 'gap-2' : 'gap-4',
        canvas.layout === 'grid' && 'grid items-start md:grid-cols-2',
        canvas.layout !== 'grid' && 'flex flex-col',
      )}
    >
      {canvas.blocks.map((block) => (
        <div key={block.blockId}>{renderBlock(block, onAction)}</div>
      ))}
    </div>
  )
}
