import { useNavigate } from 'react-router-dom'
import type { Workspace } from '../../../shared/domain.ts'
import {
  PRODUCT_NAME,
  PRODUCT_SECONDARY_ENTRY,
  PRODUCT_SUBTITLE,
  PRODUCT_TAGLINE,
} from '../../../shared/product.ts'
import { Button } from '../../components/ui/button'

type Props = {
  workspaceName?: string
  workspaces?: Workspace[]
}

const SELLING_POINTS: { title: string; body: string }[] = [
  {
    title: '⌘K 直呼 MCP tool，不經 LLM',
    body: '模組按鈕與命令盤直接打 /api/mcp/invoke，零延遲、不花 token。',
  },
  {
    title: 'Agent 回覆＝整頁畫布（圖表／Diff／確認／Plan）',
    body: '需要推理時才交給 Agent，回答直接畫成可操作的 Block。',
  },
  {
    title: 'manifest 進 Git，改版有 Diff',
    body: '模組、資料源與外殼都寫在 manifest.json，每次變更都看得到差異。',
  },
]

const STDIO_EXAMPLE = `# .env 或 docker run -e
MCP_STDIO_SERVERS='[
  {
    "name": "fs",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"]
  }
]'

docker run -p 8787:8787 --env-file .env matrix`

export function MatrixHomeHero({ workspaceName, workspaces = [] }: Props) {
  const navigate = useNavigate()
  const companySlug = workspaces.find((w) => w.slug === 'company')?.slug ?? 'company'
  const personalSlug = workspaces.find((w) => w.slug === 'personal')?.slug ?? 'personal'

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto">
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
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-12 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-[var(--muted)]">{PRODUCT_NAME}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{PRODUCT_SUBTITLE}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{PRODUCT_TAGLINE}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => navigate(`/w/${personalSlug}`)}>
            開啟開發者工作台
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/w/${companySlug}`)}>
            看營運後台範例
          </Button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
          {workspaceName ? `目前是「${workspaceName}」。` : ''}
          30 秒試用：進入後按 ⌘K 執行「本週 KPI」，或對 Agent 說「看這個月的請假」。
        </p>

        <ul className="mt-10 grid w-full gap-3 text-left md:grid-cols-3" aria-label="賣點">
          {SELLING_POINTS.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border border-[var(--line)] bg-[var(--card)]/70 p-4 backdrop-blur"
            >
              <p className="text-sm font-semibold leading-snug">{point.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{point.body}</p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-6 text-xs text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
          onClick={() => navigate(`/w/${companySlug}/studio?focus=builder`)}
        >
          {PRODUCT_SECONDARY_ENTRY}：用「打造後台」精靈一步步上線公司模組 →
        </button>

        <section className="mt-12 w-full text-left" aria-labelledby="bring-your-mcp">
          <h2 id="bring-your-mcp" className="text-base font-semibold">
            接上你自己的 MCP
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            用環境變數 <code>MCP_STDIO_SERVERS</code> 掛任何 stdio MCP server，重啟後會出現在 Bridge 列表與 ⌘K。
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 font-mono text-[11px] leading-relaxed">
            {STDIO_EXAMPLE}
          </pre>
        </section>
      </div>
    </div>
  )
}
