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

export type MetricItem = {
  label: string
  value: string
  trend?: string
}

export type KanbanColumn = {
  id: string
  title: string
  cards: { id: string; title: string; meta?: string }[]
}

export type ChartPoint = {
  label: string
  value: number
}

export type TimelineItem = {
  id: string
  time: string
  title: string
  detail?: string
}

export type TabItem = {
  id: string
  label: string
  blocks: UiBlock[]
}

export type BlockPresentation = {
  priority?: number
  role?: 'summary' | 'detail' | 'action' | 'context'
  emphasis?: 'primary' | 'secondary'
  collapsible?: boolean
}

export type BlockProps = {
  title?: string
  description?: string
  columns?: TableColumn[]
  data?: TableRow[]
  actions?: BlockAction[]
  value?: string
  label?: string
  trend?: string
  variant?: 'default' | 'destructive' | 'warning'
  metrics?: MetricItem[]
  kanban?: KanbanColumn[]
  chartType?: 'bar' | 'line'
  series?: ChartPoint[]
  tabs?: TabItem[]
  items?: TimelineItem[]
  points?: string[]
  before?: string
  after?: string
  body?: string
  steps?: { title: string; detail?: string }[]
}

export type UiBlock = {
  type: 'block'
  component: string
  blockId: string
  props: BlockProps
  presentation?: BlockPresentation
}

export type CanvasLayout = 'stack' | 'grid' | 'hero'

export type CanvasPage = {
  layout: CanvasLayout
  blocks: UiBlock[]
}

export type RenderPayload = {
  action: 'RENDER'
  ui: UiBlock | CanvasPage
}

export function toCanvas(ui: UiBlock | CanvasPage): CanvasPage {
  if ('blocks' in ui && 'layout' in ui) return ui
  return { layout: 'hero', blocks: [ui] }
}

export type UpdatePayload = {
  action: 'UPDATE_DATA'
  targetBlockId: string
  patch: Partial<BlockProps>
}

export type McpUiResponse = RenderPayload | UpdatePayload

export const BLOCK_COMPONENTS = [
  'ShadcnDataTableBlock',
  'ShadcnStatsCardBlock',
  'ShadcnFormBlock',
  'ShadcnMetricGridBlock',
  'ShadcnAlertBlock',
  'ShadcnKanbanBlock',
  'ShadcnChartBlock',
  'ShadcnTabsBlock',
  'ShadcnTimelineBlock',
] as const
