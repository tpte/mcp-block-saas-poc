import type { PlatformConfig } from '../../mcp/client'
import type { CatalogItem } from '../../mcp/client'
import { ModulePillBar } from '../module/ModulePillBar'
import { Button } from '../../components/ui/button'

type Props = {
  platform: PlatformConfig
  catalogItems: CatalogItem[]
  onRunCatalogItem: (item: CatalogItem) => void
  onOpenStudio: () => void
  onOpenCommandPalette: () => void
  onOpenModuleMenu?: () => void
  showModuleMenuButton?: boolean
}

export function SpaceOpsChrome({
  platform,
  catalogItems,
  onRunCatalogItem,
  onOpenStudio,
  onOpenCommandPalette,
  onOpenModuleMenu,
  showModuleMenuButton,
}: Props) {
  const showPills = platform.modulePillsEnabled && catalogItems.length > 0

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--card)]/30 px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {showModuleMenuButton ? (
            <Button type="button" size="sm" variant="outline" className="text-xs md:hidden" onClick={onOpenModuleMenu}>
              模組目錄
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={onOpenCommandPalette}>
            快捷操作
          </Button>
          {!showPills ? (
            <span className="hidden text-xs text-[var(--muted)] sm:inline">點快捷操作執行 HR、財務等模組</span>
          ) : null}
        </div>
        <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={onOpenStudio}>
          調整工作區
        </Button>
      </div>
      {showPills ? <ModulePillBar items={catalogItems} onSelect={onRunCatalogItem} /> : null}
    </>
  )
}
