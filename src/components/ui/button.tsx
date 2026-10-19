import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ className, variant = 'default', size = 'md', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        variant === 'default' && 'bg-slate-900 text-white hover:bg-slate-700',
        variant === 'outline' && 'border border-slate-300 bg-white hover:bg-slate-50',
        variant === 'ghost' && 'hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  )
}
