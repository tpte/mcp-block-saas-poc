export type BlockAction = {
  label: string
  mcpTool: string
  payload?: Record<string, unknown>
}

export type TableColumn = {
  key: string
  label: string
}

export type TableRow = Record<string, string | number>

export type BlockProps = {
  title?: string
  columns?: TableColumn[]
  data?: TableRow[]
  actions?: BlockAction[]
  value?: string
  label?: string
  trend?: string
  description?: string
}

export type UiBlock = {
  type: 'block'
  component: string
  blockId: string
  props: BlockProps
}

export type RenderPayload = {
  action: 'RENDER'
  ui: UiBlock | { layout: 'stack'; blocks: UiBlock[] }
}

export type UpdatePayload = {
  action: 'UPDATE_DATA'
  targetBlockId: string
  patch: Partial<BlockProps>
}

export type McpUiResponse = RenderPayload | UpdatePayload
