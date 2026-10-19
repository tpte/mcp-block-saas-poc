import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { BlockProps } from '../types/ui'

type Sandbox = {
  template?: string
  body?: string
  title?: string
  points?: string[]
}

type Props = BlockProps & {
  packageRef?: string
  sandbox?: Sandbox
}

export function PackageBlock({ title, packageRef, sandbox }: Props) {
  const tpl = sandbox?.template ?? 'document'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? 'Package Block'}</CardTitle>
        {packageRef ? <p className="text-xs text-[var(--muted)]">{packageRef}</p> : null}
      </CardHeader>
      <CardContent className="text-sm">
        {tpl === 'document' ? <pre className="whitespace-pre-wrap">{sandbox?.body ?? ''}</pre> : null}
        {tpl === 'points' ? (
          <ul className="list-disc pl-5">
            {(sandbox?.points ?? []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        {tpl === 'fallback' ? <p className="text-[var(--muted)]">{String(sandbox?.body)}</p> : null}
      </CardContent>
    </Card>
  )
}
