import type { UiBlock } from '../../shared/ui.ts'
import type { SetupContext } from './setupContext.ts'

export function buildWelcomeBlocks(input: { title: string; ctx: SetupContext; footnote?: string }): UiBlock[] {
  const { ctx } = input
  const steps = [
    ctx.dataSourceCount === 0
      ? '1. 在「打造後台」規劃資料源，或請 Agent 用 data-source skill 解釋'
      : '1. 資料源已規劃 — 可跟 Agent 規劃表單／匯入',
    ctx.enabledModuleCount < 3
      ? '2. 勾選 2～3 個模組並預覽 manifest 變更'
      : '2. 到模組側欄試用已啟用功能',
    '3. 用自然語言描述首頁想先看什麼，Agent 會 compose 到畫布',
  ]
  return [
    {
      type: 'block',
      component: 'ShadcnAlertBlock',
      blockId: 'builder-welcome-alert',
      props: {
        variant: 'default',
        title: input.title,
        description: input.ctx.gaps.length ? input.ctx.gaps.join('\n') : '基礎已就緒，接下來跟 Agent 客製細節。',
      },
    },
    {
      type: 'block',
      component: 'ShadcnDocumentBlock',
      blockId: 'builder-welcome-steps',
      props: {
        title: '建議下一步（Skills 引導，非固定精靈）',
        body: steps.join('\n') + (input.footnote ? `\n\n${input.footnote}` : ''),
      },
    },
  ]
}
