import { toCanvas, type CanvasPage, type McpUiResponse } from '../../types/ui'

export const EMPTY_CANVAS: CanvasPage = { layout: 'stack', blocks: [] }

export function applyUiResponse(state: CanvasPage, response: McpUiResponse | null): CanvasPage {
  if (!response) return state
  if (response.action === 'RENDER') return toCanvas(response.ui)
  return {
    ...state,
    blocks: state.blocks.map((block) =>
      block.blockId === response.targetBlockId
        ? { ...block, props: { ...block.props, ...response.patch } }
        : block,
    ),
  }
}
