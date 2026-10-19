import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function KanbanBlock({ title, kanban = [] }: BlockProps) {
  return (
    <Card>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={title ? 'pt-0' : undefined}>
        <div className="grid gap-3 md:grid-cols-3">
          {kanban.map((col) => (
            <div key={col.id} className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{col.title}</p>
              <ul className="space-y-2">
                {col.cards.map((card) => (
                  <li key={card.id} className="rounded-md border border-slate-200 bg-white p-2 text-sm">
                    <p className="font-medium">{card.title}</p>
                    {card.meta ? <p className="text-xs text-slate-500">{card.meta}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
