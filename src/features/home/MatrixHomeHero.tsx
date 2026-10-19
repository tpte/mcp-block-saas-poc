import { useNavigate } from 'react-router-dom'
import type { Workspace } from '../../../shared/domain.ts'
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE } from '../../../shared/product.ts'
import { Button } from '../../components/ui/button'

type Props = {
  workspaceName?: string
  workspaces?: Workspace[]
}

export function MatrixHomeHero({ workspaceName, workspaces = [] }: Props) {
  const navigate = useNavigate()
  const company = workspaces.find((w) => w.slug === 'company')
  const personal = workspaces.find((w) => w.slug === 'personal')

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 45%),
            radial-gradient(circle at 80% 70%, rgba(129, 140, 248, 0.22), transparent 40%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 48px 48px, 48px 48px',
        }}
      />
      <div className="relative max-w-lg text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{PRODUCT_NAME}</h1>
        <p className="mt-3 text-sm font-medium text-[var(--fg)]">{PRODUCT_SUBTITLE}</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{PRODUCT_TAGLINE}</p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
          {workspaceName ? `目前是「${workspaceName}」。` : ''}
          選一個工作區開始：上方按鈕或底部 Dock。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {company ? (
            <Button type="button" onClick={() => navigate(`/w/${company.slug}`)}>
              進入營運後台範例
            </Button>
          ) : null}
          {personal ? (
            <Button type="button" variant="outline" onClick={() => navigate(`/w/${personal.slug}`)}>
              開發者工作台
            </Button>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">在工作區內可用上方模組列、快捷操作（⌘K）執行日常任務。</p>
      </div>
    </div>
  )
}
