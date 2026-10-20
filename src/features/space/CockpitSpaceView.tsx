import type { ReactNode } from 'react'
import { useState } from 'react'
import type { CockpitConfig, CockpitSlot } from '../../../shared/cockpit.ts'
import type { PlatformConfig } from '../../mcp/client'
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
  platform: PlatformConfig
  session: SessionSlice
  onBlockAction: (action: BlockAction) => void
}

export function CockpitSpaceView({ cockpit, main, platform, session, onBlockAction }: Props) {
  const [pinsOpen, setPinsOpen] = useState(false)
  const left = cockpit.left ?? []
  const right = cockpit.right ?? []

  useCockpitSlots([...left, ...right], session)

  const refresh = (slot: CockpitSlot) => {
    void session.runMcpInvokeToSlot(slot.id, slot.tool, slot.payload)
  }

  const pinCount = left.length + right.length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {pinCount > 0 ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--line)] px-3 py-1.5 lg:hidden">
          <button
            type="button"
            className="rounded-md border border-[var(--line)] px-2 py-1 text-xs"
            onClick={() => setPinsOpen((o) => !o)}
          >
            {pinsOpen ? '關閉固定格' : '固定小工具'}
          </button>
        </div>
      ) : null}
      <div
        className={
          pinCount > 0
            ? 'grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(220px,280px)_1fr_minmax(220px,280px)]'
            : 'min-h-0 flex-1 overflow-hidden'
        }
      >
        {pinCount > 0 ? (
          <aside
            className={`min-h-0 overflow-hidden border-[var(--line)] lg:border-r ${
              pinsOpen ? 'max-lg:block' : 'max-lg:hidden'
            } hidden lg:block`}
          >
            <PinnedSlotPanel
              side="left"
              slots={left}
              slotState={session.cockpitSlotState}
              platform={platform}
              onAction={onBlockAction}
              onRefresh={refresh}
            />
          </aside>
        ) : null}
        <div id="cockpit-main" className="min-h-0 min-w-0 overflow-y-auto">
          {main}
        </div>
        {pinCount > 0 ? (
          <aside
            className={`min-h-0 overflow-hidden border-[var(--line)] lg:border-l ${
              pinsOpen ? 'max-lg:block' : 'max-lg:hidden'
            } hidden lg:block`}
          >
            <PinnedSlotPanel
              side="right"
              slots={right}
              slotState={session.cockpitSlotState}
              platform={platform}
              onAction={onBlockAction}
              onRefresh={refresh}
            />
          </aside>
        ) : null}
      </div>
      {pinsOpen && pinCount > 0 ? (
        <div className="max-h-[45vh] shrink-0 overflow-y-auto border-t border-[var(--line)] lg:hidden">
          <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
            {left.length ? (
              <PinnedSlotPanel
                side="left"
                slots={left}
                slotState={session.cockpitSlotState}
                platform={platform}
                onAction={onBlockAction}
                onRefresh={refresh}
              />
            ) : null}
            {right.length ? (
              <PinnedSlotPanel
                side="right"
                slots={right}
                slotState={session.cockpitSlotState}
                platform={platform}
                onAction={onBlockAction}
                onRefresh={refresh}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
