import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockAction, BlockProps } from '../types/ui'

type Props = BlockProps & { onAction?: (action: BlockAction) => void }

export function DataTableBlock({ title, columns = [], data = [], actions, onAction }: Props) {
  return (
    <Card>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={title ? 'pt-0' : undefined}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={String(row.id)} className="border-b border-slate-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-slate-800">
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {actions && actions.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button key={action.mcpTool} size="sm" onClick={() => onAction?.(action)}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function formatCell(value: string | number | undefined) {
  if (value === 'warning') return '⚠️ 超過 3 天'
  if (value === 'normal') return '正常'
  if (value === 'approved') return '✅ 已核准'
  if (value === 'low') return '偏低'
  if (value === 'critical') return '危急'
  if (value === 'ok') return '正常'
  if (value === 'open') return '未指派'
  if (value === 'assigned') return '處理中'
  return value ?? '—'
}
