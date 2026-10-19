import type { BlockPresentation, McpUiResponse, UiBlock } from '../../shared/ui.ts'
import { toCanvas } from '../../shared/ui.ts'
import { loadPublishedBundle } from '../blocks/packages.ts'
import { getSession } from '../requestContext.ts'

type Section = {
  kind?: string
  text?: string
  title?: string
  items?: string[]
  points?: string[]
  description?: string
  chartType?: 'bar' | 'line'
  series?: { label: string; value: number }[]
  actions?: { label: string; mcpTool: string; payload?: Record<string, unknown> }[]
  before?: string
  after?: string
  body?: string
  steps?: { title: string; detail?: string }[]
  presentation?: BlockPresentation
  priority?: number
  role?: BlockPresentation['role']
  emphasis?: BlockPresentation['emphasis']
  collapsible?: boolean
  packageRef?: string
  props?: Record<string, unknown>
}

let seq = 0

export function composeCanvas(payload?: Record<string, unknown>): McpUiResponse {
  const sections = Array.isArray(payload?.blocks) ? (payload.blocks as Section[]) : []
  const blocks = sections.map(sectionToBlock).filter((block): block is UiBlock => Boolean(block))
  if (blocks.length === 0) return speechToBlocks('沒有可渲染的內容。')
  return { action: 'RENDER', ui: { layout: 'stack', blocks } }
}

export function speechToBlocks(text: string): McpUiResponse {
  const clean = text.trim()
  if (!clean) return composeCanvas({ blocks: [{ kind: 'title', text: '我在' }, { kind: 'points', items: ['直接說你想看的資料，或要我開文檔、Plan、Diff、請你確認。'] }] })
  if (clean.length > 280 || clean.includes('\n\n')) {
    const [head, ...rest] = clean.split('\n')
    return composeCanvas({
      blocks: [
        { kind: 'title', text: head.replace(/^#+\s*/, '').slice(0, 80) },
        { kind: 'document', title: '回覆', body: rest.join('\n').trim() || clean },
      ],
    })
  }
  const lines = clean.split('\n').map((line) => line.trim()).filter(Boolean)
  const title = lines[0].replace(/^#+\s*/, '').slice(0, 80)
  const points = lines.slice(1).map((line) => line.replace(/^[-*•]\s*/, ''))
  if (!points.length) return composeCanvas({ blocks: [{ kind: 'title', text: title }] })
  return composeCanvas({ blocks: [{ kind: 'title', text: title }, { kind: 'points', items: points }] })
}

export function mergeUi(current: McpUiResponse | null, next: McpUiResponse | null): McpUiResponse | null {
  if (!next) return current
  if (!current) return next
  if (current.action !== 'RENDER' || next.action !== 'RENDER') return next
  return {
    action: 'RENDER',
    ui: { layout: 'stack', blocks: [...toCanvas(current.ui).blocks, ...toCanvas(next.ui).blocks] },
  }
}

function presentationFrom(section: Section): BlockPresentation | undefined {
  const p = section.presentation ?? {}
  const merged: BlockPresentation = {
    ...p,
    priority: p.priority ?? section.priority,
    role: p.role ?? section.role,
    emphasis: p.emphasis ?? section.emphasis,
    collapsible: p.collapsible ?? section.collapsible,
  }
  return Object.values(merged).some((v) => v !== undefined) ? merged : undefined
}

function sectionToBlock(section: Section): UiBlock | null {
  const id = `reply-${++seq}`
  const kind = section.kind ?? 'points'
  const presentation = presentationFrom(section)
  if (kind === 'title') {
    return {
      type: 'block',
      component: 'ShadcnTitleBlock',
      blockId: id,
      props: { title: section.text || section.title || '回覆' },
      presentation: presentation ?? { role: 'summary', priority: 8, emphasis: 'primary' },
    }
  }
  if (kind === 'points') {
    const points = section.items || section.points || []
    return {
      type: 'block',
      component: 'ShadcnKeyPointsBlock',
      blockId: id,
      props: { title: section.title, points },
      presentation: presentation ?? { role: 'summary', priority: 7 },
    }
  }
  if (kind === 'chart') {
    return {
      type: 'block',
      component: 'ShadcnChartBlock',
      blockId: id,
      props: { title: section.title, chartType: section.chartType ?? 'bar', series: section.series ?? [] },
    }
  }
  if (kind === 'confirm') {
    return {
      type: 'block',
      component: 'ShadcnConfirmBlock',
      blockId: id,
      props: { title: section.title || '請確認', description: section.description, actions: section.actions ?? [] },
    }
  }
  if (kind === 'diff') {
    return {
      type: 'block',
      component: 'ShadcnDiffBlock',
      blockId: id,
      props: { title: section.title || 'Diff', before: section.before, after: section.after },
    }
  }
  if (kind === 'document') {
    return {
      type: 'block',
      component: 'ShadcnDocumentBlock',
      blockId: id,
      props: { title: section.title || '文檔', body: section.body || section.text },
    }
  }
  if (kind === 'plan') {
    return {
      type: 'block',
      component: 'ShadcnPlanBlock',
      blockId: id,
      props: { title: section.title || 'Plan', steps: section.steps ?? [] },
    }
  }
  if (kind === 'pkg') {
    const ref = section.packageRef ?? ''
    const componentId = ref.startsWith('pkg:') ? ref.slice(4) : ref
    const loaded = componentId ? loadPublishedBundle(getSession().workspace.id, componentId) : null
    return {
      type: 'block',
      component: 'ShadcnPackageBlock',
      blockId: id,
      props: {
        title: section.title ?? loaded?.pkg.name ?? 'Package Block',
        packageRef: ref,
        sandbox: loaded?.bundle ?? { template: 'fallback', body: '套件未發布或不存在' },
        ...(section.props ?? {}),
      },
      presentation: presentation ?? { role: 'detail', priority: 5 },
    }
  }
  return null
}
