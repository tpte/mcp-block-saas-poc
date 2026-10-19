import { renderBlock } from '../../blocks/registry'
import { cn } from '../../lib/utils'
import type { BlockAction, CanvasPage } from '../../types/ui'
import { SUGGESTIONS } from '../session/useAgentSession'

type Props = {
  canvas: CanvasPage
  onAction: (action: BlockAction) => void
  onSuggest: (text: string) => void
}

export function BlockCanvas({ canvas, onAction, onSuggest }: Props) {
  if (canvas.blocks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">Super MCP</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">任何 MCP，即時渲染成畫面。說你想看什麼，整頁會跟著變。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onSuggest(text)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl',
        canvas.layout === 'grid' && 'grid items-start gap-4 md:grid-cols-2',
        canvas.layout === 'stack' && 'flex flex-col gap-4',
        canvas.layout === 'hero' && 'flex flex-col gap-4',
      )}
    >
      {canvas.blocks.map((block) => (
        <div key={block.blockId} className={canvas.layout === 'hero' ? 'w-full' : undefined}>
          {renderBlock(block, onAction)}
        </div>
      ))}
    </div>
  )
}
