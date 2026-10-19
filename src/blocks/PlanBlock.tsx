import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function PlanBlock({ title, steps = [] }: BlockProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Plan</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              {step.detail ? <p className="text-xs text-[var(--muted)]">{step.detail}</p> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}