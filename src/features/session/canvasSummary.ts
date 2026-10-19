import type { CanvasPage } from '../../types/ui'

export function summarizeCanvas(canvas: CanvasPage): string {
  if (canvas.blocks.length === 0) return '（畫布尚無 Block）'
  return canvas.blocks
    .slice(0, 8)
    .map((b) => `${b.component}「${b.props.title ?? b.blockId}」`)
    .join('、')
}
