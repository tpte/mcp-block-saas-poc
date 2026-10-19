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
  messages: ChatMessage[]
  platform: PlatformConfig
  suggestions: string[]
  busy: boolean
  onSend: (text: string) => void
}

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { platform, suggestions, busy, onSend },
  ref,
) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const top = platform.composerPosition === 'top'

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
        'pointer-events-none absolute inset-x-0 z-40 px-4',
        top ? 'top-14 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/95 to-transparent pb-8 pt-2' : 'bottom-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pb-5 pt-10',
      )}
    >
      <div className={cn('pointer-events-auto mx-auto w-full', platform.composerWidth === 'wide' ? 'max-w-4xl' : 'max-w-[720px]')}>
        {platform.suggestionsEnabled && suggestions.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
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
                className="cursor-pointer rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--fg)] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
        {busy ? <p className="mb-2 text-xs text-[var(--muted)]">正在把回覆畫到畫布…</p> : null}
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
})
