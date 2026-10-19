import { renderBlock } from '../../blocks/registry'
import type { BlockAction, UiBlock } from '../../types/ui'

type Props = {
  blocks: UiBlock[]
  onAction: (action: BlockAction) => void
}

export function BlockCanvas({ blocks, onAction }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Canvas 空白 — 送指令或選模組以渲染 UI Blocks。
      </div>
    )
  }

  return <div className="space-y-4">{blocks.map((block) => renderBlock(block, onAction))}</div>
}
