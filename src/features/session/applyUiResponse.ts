import { toCanvas, type CanvasPage, type McpUiResponse } from '../../types/ui'

export const EMPTY_CANVAS: CanvasPage = { layout: 'stack', blocks: [] }

export function applyUiResponse(
  state: CanvasPage,
  response: McpUiResponse | null,
  mergeMode: 'merge' | 'replace' = 'merge',
): CanvasPage {
  if (!response) return state
  if (response.action === 'UPDATE_DATA') {
    return {
      ...state,
      blocks: state.blocks.map((block) =>
        block.blockId === response.targetBlockId
          ? { ...block, props: { ...block.props, ...response.patch } }
          : block,
      ),
    }
  }
  const incoming = toCanvas(response.ui)
  if (mergeMode === 'replace' || state.blocks.length === 0) return incoming
  const map = new Map(state.blocks.map((b) => [b.blockId, b]))
  for (const b of incoming.blocks) {
    const prev = map.get(b.blockId)
    map.set(
      b.blockId,
      prev
        ? {
            ...prev,
            component: b.component,
            props: { ...prev.props, ...b.props },
            presentation: b.presentation ?? prev.presentation,
          }
        : b,
    )
  }
  return { layout: incoming.layout ?? state.layout, blocks: [...map.values()] }
}
