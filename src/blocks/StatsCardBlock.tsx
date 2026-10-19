import type { BlockProps } from '../types/ui'

export function StatsCardBlock({ label, value, trend, description }: BlockProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {trend ? <p className="mt-2 text-sm font-medium text-emerald-600">{trend}</p> : null}
      {description ? <p className="mt-2 text-xs text-slate-400">{description}</p> : null}
    </article>
  )
}
