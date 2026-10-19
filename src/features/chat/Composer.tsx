import { useState } from 'react'
import { Button } from '../../components/ui/button'
import type { ChatMessage } from '../session/useAgentSession'

type Props = {
  messages: ChatMessage[]
  busy: boolean
  onSend: (text: string) => void
}

export function Composer({ messages, busy, onSend }: Props) {
  const [input, setInput] = useState('')
  const recent = messages.slice(-4)

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent px-4 pb-5 pt-10">
      <div className="pointer-events-auto mx-auto w-full max-w-[720px]">
        {recent.length > 0 ? (
          <div className="mb-2 max-h-36 space-y-1.5 overflow-y-auto">
            {recent.map((m, i) => (
              <p
                key={`${m.role}-${i}`}
                className={
                  m.role === 'user'
                    ? 'ml-auto w-fit max-w-[85%] rounded-2xl bg-slate-900 px-3 py-1.5 text-sm text-white'
                    : 'w-fit max-w-[85%] rounded-2xl bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm'
                }
              >
                {m.content}
              </p>
            ))}
            {busy ? <p className="text-xs text-slate-500">正在重排畫布…</p> : null}
          </div>
        ) : null}
        <form
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="跟 Agent 說你想看什麼…"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            送出
          </Button>
        </form>
      </div>
    </div>
  )
}
