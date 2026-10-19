import type { BlockProps } from '../types/ui'

export function FormBlock({ title, description }: BlockProps) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </section>
  )
}
