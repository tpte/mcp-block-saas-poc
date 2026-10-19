import { getSession } from '../requestContext.ts'
import { loadManifest } from '../workspaces/manifest.ts'
import { analyzeSetupContext } from './setupContext.ts'

/** 依工作區缺口動態建議（非寫死首頁 pool 的唯一來源） */
export function builderSuggestionPrompts(): string[] {
  try {
    const { workspace } = getSession()
    const manifest = loadManifest(workspace.id, workspace.name)
    const ctx = analyzeSetupContext(manifest)
    const prompts: string[] = []
    if (ctx.dataSourceCount === 0) {
      prompts.push('我想在 MATRIX 做自己的公司後台，請用 data-source skill 說明資料要存哪')
      prompts.push('請帶我建立本機 SQLite 資料庫計畫（不懂程式）')
    }
    if (ctx.enabledModuleCount < 4) {
      prompts.push('請用 industry-discovery 問我 2 題，再建議先開哪些模組')
    }
    if (ctx.gaps.length > 0) {
      prompts.push('幫我看工作區還缺什麼，並 preview 變更再套用')
    }
    prompts.push('還原 HIYEN 型入門模板，但不要一次全開')
    return [...new Set(prompts)]
  } catch {
    return []
  }
}
