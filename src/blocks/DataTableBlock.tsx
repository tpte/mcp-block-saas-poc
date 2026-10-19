import type { BlockAction, BlockProps } from '../types/ui'

type Props = BlockProps & {
  onAction?: (action: BlockAction) => void
}

export function DataTableBlock({ title, columns = [], data = [], actions, onAction }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2> : null}
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
            <button
              key={action.mcpTool}
              type="button"
              onClick={() => onAction?.(action)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function formatCell(value: string | number | undefined) {
  if (value === 'warning') return '⚠️ 超過 3 天'
  if (value === 'normal') return '正常'
  if (value === 'approved') return '✅ 已核准'
  return value ?? '—'
}
