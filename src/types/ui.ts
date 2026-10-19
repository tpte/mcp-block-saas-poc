export type {
  BlockAction,
  BlockProps,
  ChartPoint,
  KanbanColumn,
  MetricItem,
  McpUiResponse,
  RenderPayload,
  TabItem,
  TableColumn,
  TableRow,
  TimelineItem,
  UiBlock,
  UpdatePayload,
} from '../../shared/ui.ts'

export { BLOCK_COMPONENTS } from '../../shared/ui.ts'

export function flattenUi(ui: import('../../shared/ui.ts').UiBlock | { layout: 'stack'; blocks: import('../../shared/ui.ts').UiBlock[] }) {
  if ('layout' in ui) return ui.blocks
  return [ui]
}
