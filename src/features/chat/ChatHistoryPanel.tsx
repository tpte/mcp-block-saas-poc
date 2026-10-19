import type { ChatMessage } from '../session/useAgentSession'
import type { OpFeedbackRating } from '../../../shared/opsLog.ts'

type Props = {
  messages: ChatMessage[]
  onPickUserMessage: (text: string) => void
  onRateReply?: (logId: string, rating: OpFeedbackRating) => void
}

export function ChatHistoryPanel({ messages, onPickUserMessage, onRateReply }: Props) {
  if (messages.length === 0) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] p-3 text-xs text-[var(--muted)] md:block">
        尚無對話
      </aside>
    )
  }

  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)]/30 md:flex"
      aria-label="對話紀錄"
    >
      <p className="border-b border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
        對話 · 可評價回覆
      </p>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {messages.map((msg, i) => (
          <li key={`${msg.role}-${i}-${msg.logId ?? ''}`}>
            {msg.role === 'user' ? (
              <button
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-[var(--line)]/40 focus-visible:outline focus-visible:outline-2"
                onClick={() => onPickUserMessage(msg.content)}
              >
                <span className="font-medium text-[var(--fg)]">你：</span> {msg.content.slice(0, 120)}
              </button>
            ) : (
              <div className="rounded-md px-2 py-1 text-xs text-[var(--muted)]">
                <p>
                  <span className="font-medium">Agent：</span> {msg.content.slice(0, 100)}
                </p>
                {msg.logId && onRateReply ? (
                  <div className="mt-1 flex gap-1">
                    {(
                      [
                        ['helpful', '👍'],
                        ['partial', '◑'],
                        ['wrong', '👎'],
                      ] as const
                    ).map(([rating, label]) => (
                      <button
                        key={rating}
                        type="button"
                        title={
                          rating === 'helpful'
                            ? '回覆正確'
                            : rating === 'wrong'
                              ? '回覆不正確'
                              : '部分正確'
                        }
                        disabled={Boolean(msg.feedback)}
                        onClick={() => onRateReply(msg.logId!, rating)}
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          msg.feedback === rating
                            ? 'bg-[var(--line)] text-[var(--fg)]'
                            : 'hover:bg-[var(--line)]/50 disabled:opacity-60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
