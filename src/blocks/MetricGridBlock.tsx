import { Card, CardContent } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function MetricGridBlock({ metrics = [] }: BlockProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{m.value}</p>
            {m.trend ? <p className="mt-1 text-xs text-emerald-600">{m.trend}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
