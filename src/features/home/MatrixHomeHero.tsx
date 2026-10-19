import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE } from '../../../shared/product.ts'

type Props = {
  workspaceName?: string
}

export function MatrixHomeHero({ workspaceName }: Props) {
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
          選下方工作區：開發者工作台或營運後台範例，開始跟 Agent 對話。
        </p>
      </div>
    </div>
  )
}
