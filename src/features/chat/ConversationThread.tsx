import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../session/useAgentSession'

type Props = {
  messages: ChatMessage[]
  busy: boolean
}

export function ConversationThread({ messages, busy }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const visible = messages.slice(-8)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, busy])

  if (visible.length === 0) return null

  return (
    <div className="mx-auto mb-4 w-full max-w-[720px] space-y-2">
      {visible.map((message, index) => (
        <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
          <p
            className={
              message.role === 'user'
                ? 'inline-block max-w-[85%] rounded-2xl bg-[var(--fg)] px-3 py-2 text-left text-sm text-[var(--bg)]'
                : 'inline-block max-w-[85%] rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm'
            }
          >
            {message.content.replace(/\*\*/g, '')}
          </p>
        </div>
      ))}
      {busy ? <p className="text-xs text-[var(--muted)]">回覆中…</p> : null}
      <div ref={endRef} />
    </div>
  )
}
