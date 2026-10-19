import { createContext, useContext, type ReactNode } from 'react'
import { useAgentSession, type AgentSessionOptions } from './useAgentSession'

type SessionValue = ReturnType<typeof useAgentSession>

const AgentSessionContext = createContext<SessionValue | null>(null)

export function AgentSessionProvider({
  options,
  children,
}: {
  options: AgentSessionOptions
  children: ReactNode
}) {
  const session = useAgentSession(options)
  return <AgentSessionContext.Provider value={session}>{children}</AgentSessionContext.Provider>
}

export function useAgentSessionContext() {
  const ctx = useContext(AgentSessionContext)
  if (!ctx) throw new Error('useAgentSessionContext requires AgentSessionProvider')
  return ctx
}
