import { cn } from '../lib/utils'
import type { BlockProps } from '../types/ui'

export function AlertBlock({ title, description, variant = 'default' }: BlockProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        variant === 'destructive' && 'border-red-200 bg-red-50 text-red-900',
        variant === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900',
        variant === 'default' && 'border-slate-200 bg-white text-slate-900',
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
    </div>
  )
}
