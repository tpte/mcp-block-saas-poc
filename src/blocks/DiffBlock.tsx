import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function DiffBlock({ title, before, after }: BlockProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Diff</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
        <pre className="overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950 dark:text-red-100">{before}</pre>
        <pre className="overflow-auto rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{after}</pre>
      </CardContent>
    </Card>
  )
}
