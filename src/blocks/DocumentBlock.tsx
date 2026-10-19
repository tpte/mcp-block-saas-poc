import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function DocumentBlock({ title, body }: BlockProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">文檔</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <article className="whitespace-pre-wrap text-sm leading-6">{body}</article>
      </CardContent>
    </Card>
  )
}
