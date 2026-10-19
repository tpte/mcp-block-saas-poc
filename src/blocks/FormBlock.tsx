import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

export function FormBlock({ title, description }: BlockProps) {
  return (
    <Card className="border-dashed bg-slate-50">
      {title ? (
        <CardHeader className="border-none pb-0">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </CardContent>
    </Card>
  )
}
