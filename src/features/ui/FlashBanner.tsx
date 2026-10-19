type Props = {
  message: string | null
  variant?: 'error' | 'ok'
  onDismiss: () => void
}

export function FlashBanner({ message, variant = 'error', onDismiss }: Props) {
  if (!message) return null
  const tone =
    variant === 'ok'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
  return (
    <div className={`flex items-center justify-between gap-3 border-b px-4 py-2 text-sm ${tone}`} role="status">
      <span>{message}</span>
      <button type="button" className="shrink-0 text-xs underline" onClick={onDismiss}>
        關閉
      </button>
    </div>
  )
}
