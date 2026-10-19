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
    if (ctx.dataSourceCount === 0) prompts.push('先幫我接上公司資料')
    if (ctx.gaps.length > 0) prompts.push('這個工作區還缺什麼？')
    return [...new Set(prompts)]
  } catch {
    return []
  }
}
