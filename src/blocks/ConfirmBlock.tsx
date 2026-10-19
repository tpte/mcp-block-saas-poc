import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockAction, BlockProps } from '../types/ui'

type Props = BlockProps & { onAction?: (action: BlockAction) => void }

export function ConfirmBlock({ title, description, actions = [], onAction }: Props) {
  return (
    <Card className="border-indigo-200">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">請確認</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {description ? <p className="text-sm text-[var(--muted)]">{description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button key={action.label} size="sm" onClick={() => onAction?.(action)}>
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
