import type { SpaceProfile } from '../../../shared/workspaceManifest.ts'
import type { PlatformConfig, CatalogItem } from '../../mcp/client'
import { ModulePillBar } from '../module/ModulePillBar'
import { Button } from '../../components/ui/button'

export type QuickOp = { label: string; tool: string }

type Props = {
  platform: PlatformConfig
  catalogItems: CatalogItem[]
  quickOps?: QuickOp[]
  onRunCatalogItem: (item: CatalogItem) => void
  onQuickOp: (tool: string) => void
  onOpenStudio: () => void
  onOpenBuilder: () => void
  onOpenCommandPalette: () => void
  onOpenModuleMenu?: () => void
  showModuleMenuButton?: boolean
  spaceProfile?: SpaceProfile
}

export function SpaceOpsChrome({
  platform,
  catalogItems,
  quickOps = [],
  onRunCatalogItem,
  onQuickOp,
  onOpenStudio,
  onOpenBuilder,
  onOpenCommandPalette,
  onOpenModuleMenu,
  showModuleMenuButton,
  spaceProfile,
}: Props) {
  const showPills = platform.modulePillsEnabled && catalogItems.length > 0
  const showQuickOps = spaceProfile !== 'cockpit' && quickOps.length > 0

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--card)]/30 px-3 py-2 md:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {spaceProfile === 'cockpit' ? (
            <span
              className="rounded-md bg-[var(--line)]/30 px-2 py-0.5 text-[10px] text-[var(--muted)]"
              title="中間為 Agent 主畫布；寬螢幕左右為固定摘要"
            >
              固定格模式
            </span>
          ) : null}
          {showModuleMenuButton ? (
            <Button type="button" size="sm" variant="outline" className="text-xs md:hidden" onClick={onOpenModuleMenu}>
              模組目錄
            </Button>
          ) : null}
          {showQuickOps
            ? quickOps.map((op) => (
            <Button
              key={op.tool}
              type="button"
              size="sm"
              variant="default"
              className="text-xs"
              onClick={() => onQuickOp(op.tool)}
            >
              {op.label}
            </Button>
              ))
            : null}
          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={onOpenCommandPalette}>
            快捷操作
          </Button>
          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={onOpenBuilder}>
            打造後台
          </Button>
          {!showPills && !quickOps.length ? (
            <span className="hidden text-xs text-[var(--muted)] sm:inline">常用：快捷操作或打造後台</span>
          ) : null}
        </div>
        <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={onOpenStudio}>
          Studio
        </Button>
      </div>
      {showPills ? <ModulePillBar items={catalogItems} onSelect={onRunCatalogItem} /> : null}
    </>
  )
}
