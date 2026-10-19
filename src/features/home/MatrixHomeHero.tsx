import { PRODUCT_NAME } from '../../../shared/product.ts'

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
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-600/90 dark:text-cyan-400/90">
          AI · MCP · Blocks
        </p>
        <h1 className="bg-gradient-to-br from-[var(--fg)] via-[var(--fg)] to-cyan-600/80 bg-clip-text text-4xl font-semibold tracking-tight text-transparent md:text-5xl">
          {PRODUCT_NAME}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
          {workspaceName ? `${workspaceName} · ` : ''}
          在下方跟 Agent 對話；模組頁面由 MCP 驅動 Block 畫布。建置 MODULE／BLOCK 請到 Studio。
        </p>
      </div>
    </div>
  )
}
