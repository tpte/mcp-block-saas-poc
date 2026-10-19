import type { McpUiResponse, UiBlock } from '../../types/ui'
import { flattenUi } from '../../types/ui'

export function applyUiResponse(blocks: UiBlock[], response: McpUiResponse | null): UiBlock[] {
  if (!response) return blocks
  if (response.action === 'RENDER') return flattenUi(response.ui)
  return blocks.map((block) =>
    block.blockId === response.targetBlockId
      ? { ...block, props: { ...block.props, ...response.patch } }
      : block,
  )
}
