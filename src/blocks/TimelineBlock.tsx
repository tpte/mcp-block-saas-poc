import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function TimelineBlock({ title, items = [] }: BlockProps) {
  return (
    <Card>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={title ? 'pt-0' : undefined}>
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <p className="text-xs text-slate-500">{item.time}</p>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              {item.detail ? <p className="text-xs text-slate-600">{item.detail}</p> : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
