import type { BlockProps } from './ui.ts'

export type BlockTemplateField =
  | { key: keyof BlockProps; type: 'string'; label: string; maxLength?: number }
  | { key: keyof BlockProps; type: 'string[]'; label: string; maxItems?: number }
  | { key: keyof BlockProps; type: 'enum'; label: string; options: string[] }

export type BlockTemplate = {
  id: string
  composeKind: string
  component: string
  label: string
  description?: string
  defaultProps: BlockProps
  editableFields: BlockTemplateField[]
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: 'title',
    composeKind: 'title',
    component: 'ShadcnTitleBlock',
    label: '標題',
    defaultProps: { title: '新標題' },
    editableFields: [{ key: 'title', type: 'string', label: '標題', maxLength: 120 }],
  },
  {
    id: 'points',
    composeKind: 'points',
    component: 'ShadcnKeyPointsBlock',
    label: '重點列表',
    defaultProps: { title: '重點', points: ['第一點', '第二點'] },
    editableFields: [
      { key: 'title', type: 'string', label: '標題', maxLength: 80 },
      { key: 'points', type: 'string[]', label: '重點', maxItems: 12 },
    ],
  },
  {
    id: 'document',
    composeKind: 'document',
    component: 'ShadcnDocumentBlock',
    label: '文檔',
    defaultProps: { title: '文檔', body: '內容…' },
    editableFields: [
      { key: 'title', type: 'string', label: '標題', maxLength: 80 },
      { key: 'body', type: 'string', label: '正文', maxLength: 8000 },
    ],
  },
  {
    id: 'confirm',
    composeKind: 'confirm',
    component: 'ShadcnConfirmBlock',
    label: '確認',
    defaultProps: { title: '請確認', description: '是否繼續？' },
    editableFields: [
      { key: 'title', type: 'string', label: '標題', maxLength: 80 },
      { key: 'description', type: 'string', label: '說明', maxLength: 500 },
    ],
  },
  {
    id: 'chart',
    composeKind: 'chart',
    component: 'ShadcnChartBlock',
    label: '圖表',
    defaultProps: {
      title: '趨勢',
      chartType: 'bar',
      series: [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
      ],
    },
    editableFields: [
      { key: 'title', type: 'string', label: '標題', maxLength: 80 },
      { key: 'chartType', type: 'enum', label: '類型', options: ['bar', 'line'] },
    ],
  },
  {
    id: 'alert',
    composeKind: 'alert',
    component: 'ShadcnAlertBlock',
    label: '提醒',
    defaultProps: { title: '提醒', description: '訊息', variant: 'default' },
    editableFields: [
      { key: 'title', type: 'string', label: '標題', maxLength: 80 },
      { key: 'description', type: 'string', label: '內容', maxLength: 500 },
      { key: 'variant', type: 'enum', label: '樣式', options: ['default', 'destructive', 'warning'] },
    ],
  },
]

export function getBlockTemplate(id: string) {
  return BLOCK_TEMPLATES.find((t) => t.id === id) ?? null
}
