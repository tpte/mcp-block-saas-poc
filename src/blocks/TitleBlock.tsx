import type { BlockProps } from '../types/ui'

export function TitleBlock({ title }: BlockProps) {
  return <h2 className="text-2xl font-semibold tracking-tight text-[var(--fg)]">{title}</h2>
}
