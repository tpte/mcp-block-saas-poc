import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import type { PlatformConfig } from '../../mcp/client'
import type { ChatMessage } from '../session/useAgentSession'

export type ComposerHandle = {
  focus: () => void
  setDraft: (text: string) => void
}

type Props = {
  scopeId: string
  messages: ChatMessage[]
  platform: PlatformConfig
  suggestions: string[]
  busy: boolean
  compact?: boolean
  onSend: (text: string) => void
}

const drafts = new Map<string, string>()

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { scopeId, platform, suggestions, busy, compact = false, onSend },
  ref,
) {
  const [input, setInput] = useState(() => drafts.get(scopeId) ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const scopeRef = useRef(scopeId)
  const top = platform.composerPosition === 'top'

  if (scopeRef.current !== scopeId) {
    drafts.set(scopeRef.current, inputRef.current?.value ?? input)
    scopeRef.current = scopeId
    const next = drafts.get(scopeId) ?? ''
    if (next !== input) setInput(next)
  }

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setDraft: (text: string) => setInput(text),
  }))

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput('')
  }

  return (
    <div
      className={cn(
        'relative z-30 shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-3',
        compact ? 'py-2' : top ? 'order-first border-b border-t-0 pb-8 pt-2' : 'pb-5 pt-3',
      )}
    >
      <div className={cn('mx-auto w-full', platform.composerWidth === 'wide' ? 'max-w-4xl' : 'max-w-[720px]')}>
        {platform.suggestionsEnabled && suggestions.length > 0 ? (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((text, index) => (
              <button
                key={`${index}-${text}`}
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSend(text)
                }}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--fg)] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
        {busy ? <p className="mb-2 text-xs text-[var(--muted)]">回覆中…</p> : null}
        <form
          className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-lg"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              drafts.set(scopeId, e.target.value)
              setInput(e.target.value)
            }}
            placeholder={platform.placeholder}
            aria-label={platform.placeholder || '跟 Agent 說你想看什麼'}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-[var(--fg)] outline-none"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            送出
          </Button>
        </form>
      </div>
    </div>
  )
})
