import type { ReactNode } from 'react'
import type { CockpitConfig, CockpitSlot } from '../../../shared/cockpit.ts'
import type { BlockAction } from '../../types/ui'
import type { CockpitSlotState } from '../session/useAgentSession'
import { PinnedSlotPanel } from './PinnedSlotPanel'
import { useCockpitSlots } from './useCockpitSlots'

type SessionSlice = {
  runMcpInvokeToSlot: (slotId: string, tool: string, payload?: Record<string, unknown>) => Promise<void>
  clientSession: { workspaceId: string }
  cockpitSlotState: Record<string, CockpitSlotState>
}

type Props = {
  cockpit: CockpitConfig
  main: ReactNode
  session: SessionSlice
  onBlockAction: (action: BlockAction) => void
  onOpenSlotInMain?: (slot: CockpitSlot) => void
}

export function CockpitSpaceView({
  cockpit,
  main,
  session,
  onBlockAction,
  onOpenSlotInMain,
}: Props) {
  const left = cockpit.left ?? []
  const right = cockpit.right ?? []

  useCockpitSlots([...left, ...right], session)

  const refresh = (slot: CockpitSlot) => {
    void session.runMcpInvokeToSlot(slot.id, slot.tool, slot.payload)
  }

  const pinPanelProps = {
    slotState: session.cockpitSlotState,
    onAction: onBlockAction,
    onRefresh: refresh,
    onOpenInMain: onOpenSlotInMain,
  }

  const hasPins = left.length + right.length > 0

  return (
    <div
      className={
        hasPins
          ? 'grid h-full min-h-0 flex-1 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-cols-[200px_minmax(0,1fr)_200px] md:grid-rows-1'
          : 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
      }
    >
      {left.length ? (
        <aside className="col-span-1 max-h-36 min-h-0 min-w-0 overflow-hidden border-b border-[var(--line)] md:col-start-1 md:row-start-1 md:max-h-none md:border-b-0 md:border-r">
          <PinnedSlotPanel side="left" slots={left} {...pinPanelProps} />
        </aside>
      ) : null}
      {right.length ? (
        <aside className="col-span-1 max-h-36 min-h-0 min-w-0 overflow-hidden border-b border-l border-[var(--line)] md:col-start-3 md:row-start-1 md:max-h-none md:border-b-0 md:border-l">
          <PinnedSlotPanel side="right" slots={right} {...pinPanelProps} />
        </aside>
      ) : null}
      <div
        id="cockpit-main"
        className="col-span-2 min-h-0 min-w-0 overflow-hidden bg-[var(--bg)] md:col-span-1 md:col-start-2 md:row-start-1 md:border-x md:border-[var(--line)]"
      >
        {main}
      </div>
    </div>
  )
}
