import type { ComponentType } from 'react'
import { AlertBlock } from './AlertBlock'
import { ChartBlock } from './ChartBlock'
import { DataTableBlock } from './DataTableBlock'
import { FormBlock } from './FormBlock'
import { KanbanBlock } from './KanbanBlock'
import { MetricGridBlock } from './MetricGridBlock'
import { StatsCardBlock } from './StatsCardBlock'
import { TabsBlock } from './TabsBlock'
import { TimelineBlock } from './TimelineBlock'
import type { BlockAction, BlockProps, UiBlock } from '../types/ui'

const BLOCK_MAP: Record<string, ComponentType<BlockProps & { onAction?: (a: BlockAction) => void }>> = {
  ShadcnDataTableBlock: DataTableBlock,
  ShadcnStatsCardBlock: StatsCardBlock,
  ShadcnFormBlock: FormBlock,
  ShadcnMetricGridBlock: MetricGridBlock,
  ShadcnAlertBlock: AlertBlock,
  ShadcnKanbanBlock: KanbanBlock,
  ShadcnChartBlock: ChartBlock,
  ShadcnTabsBlock: TabsBlock,
  ShadcnTimelineBlock: TimelineBlock,
}

export function renderBlock(block: UiBlock, onAction?: (action: BlockAction) => void) {
  const Component = BLOCK_MAP[block.component]
  if (!Component) {
    return (
      <div key={block.blockId} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        未知 Block：{block.component}
      </div>
    )
  }
  return <Component key={block.blockId} {...block.props} onAction={onAction} />
}
