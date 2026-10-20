import { toCanvas, type McpUiResponse } from '../../types/ui'

export function firstBlockIdFromUi(ui: McpUiResponse | null): string | null {
  if (!ui || ui.action !== 'RENDER') return null
  const page = toCanvas(ui.ui)
  return page.blocks[0]?.blockId ?? null
}

export function scrollCockpitMainIntoView() {
  document.getElementById('cockpit-main')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

export function focusMainCanvasFromUi(
  ui: McpUiResponse | null,
  setFocusedBlockId: (id: string | null) => void,
) {
  const blockId = firstBlockIdFromUi(ui)
  if (blockId) setFocusedBlockId(blockId)
  scrollCockpitMainIntoView()
}
