import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import type { ChatMessage } from '../session/useAgentSession'

type Props = {
  messages: ChatMessage[]
  busy: boolean
  modulePrompts: readonly string[]
  onSend: (text: string) => void
}

export function ChatPanel({ messages, busy, modulePrompts, onSend }: Props) {
  const [input, setInput] = useState(modulePrompts[0] ?? '')

  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <CardHeader>
        <CardTitle>Agent 對話</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="max-h-64 flex-1 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">描述需求，Orchestrator 會呼叫 MCP 並渲染 Block UI。</p>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={m.role === 'user' ? 'text-right' : 'text-left'}
              >
                <span
                  className={
                    m.role === 'user'
                      ? 'inline-block rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white'
                      : 'inline-block rounded-lg bg-white px-3 py-2 text-sm text-slate-800 shadow-sm'
                  }
                >
                  {m.content}
                </span>
              </div>
            ))
          )}
          {busy ? <p className="text-xs text-slate-500">Agent 思考中…</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {modulePrompts.map((p) => (
            <Button key={p} size="sm" variant="outline" disabled={busy} onClick={() => setInput(p)}>
              {p}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            placeholder="輸入指令…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend(input)
              }
            }}
          />
          <Button disabled={busy || !input.trim()} onClick={() => onSend(input)}>
            送出
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
