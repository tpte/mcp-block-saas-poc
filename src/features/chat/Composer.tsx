import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import type { PlatformConfig } from '../../mcp/client'
import type { ChatMessage } from '../session/useAgentSession'

type Props = {
  messages: ChatMessage[]
  platform: PlatformConfig
  suggestions: string[]
  busy: boolean
  onSend: (text: string) => void
}

export function Composer({ messages, platform, suggestions, busy, onSend }: Props) {
  const [input, setInput] = useState('')
  const recent = platform.showHistory ? messages.slice(-4) : []
  const top = platform.composerPosition === 'top'

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput('')
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 px-4',
        top ? 'top-14 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/95 to-transparent pb-8 pt-2' : 'bottom-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pb-5 pt-10',
      )}
    >
      <div className={cn('pointer-events-auto mx-auto w-full', platform.composerWidth === 'wide' ? 'max-w-4xl' : 'max-w-[720px]')}>
        {platform.suggestionsEnabled && suggestions.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                disabled={busy}
                onClick={() => onSend(text)}
                className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--fg)] hover:opacity-80 disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
        {recent.length > 0 ? (
          <div className="mb-2 max-h-36 space-y-1.5 overflow-y-auto">
            {recent.map((m, i) => (
              <p
                key={`${m.role}-${i}`}
                className={
                  m.role === 'user'
                    ? 'ml-auto w-fit max-w-[85%] rounded-2xl bg-slate-900 px-3 py-1.5 text-sm text-white'
                    : 'w-fit max-w-[85%] rounded-2xl bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--fg)] shadow-sm'
                }
              >
                {m.content}
              </p>
            ))}
            {busy ? <p className="text-xs text-[var(--muted)]">正在更新…</p> : null}
          </div>
        ) : null}
        <form
          className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-lg"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={platform.placeholder}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-[var(--fg)] outline-none"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            送出
          </Button>
        </form>
      </div>
    </div>
  )
}
