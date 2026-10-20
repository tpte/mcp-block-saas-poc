import { useEffect, useRef } from 'react'
import type { CockpitSlot } from '../../../shared/cockpit.ts'
import type { useAgentSession } from '../session/useAgentSession'

type Session = {
  runMcpInvokeToSlot: ReturnType<typeof useAgentSession>['runMcpInvokeToSlot']
  clientSession: { workspaceId: string }
}

export function useCockpitSlots(slots: CockpitSlot[], session: Session) {
  const loadedKeyRef = useRef('')
  const wsId = session.clientSession.workspaceId
  const runSlot = session.runMcpInvokeToSlot

  useEffect(() => {
    const key = `${wsId}:${slots.map((s) => `${s.id}:${s.tool}`).join(',')}`
    if (!slots.length || key === loadedKeyRef.current) return
    loadedKeyRef.current = key
    for (const slot of slots) {
      void runSlot(slot.id, slot.tool, slot.payload)
    }
  }, [wsId, slots, runSlot])
}
