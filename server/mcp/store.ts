import type { TableRow } from '../../shared/ui.ts'

export const tenant = {
  name: '北極星科技',
  user: '王經理',
  role: '營運主管',
}

export let leaveRows: TableRow[] = [
  { id: 1, name: '張小明', days: 5, status: 'warning', dept: '工程' },
  { id: 2, name: '李大華', days: 1, status: 'normal', dept: '業務' },
  { id: 3, name: '王美玲', days: 4, status: 'warning', dept: '財務' },
]

export const invoices: TableRow[] = [
  { id: 1, vendor: '雲端主機 A', amount: 128000, status: '待付' },
  { id: 2, vendor: '辦公耗材 B', amount: 8600, status: '已付' },
  { id: 3, vendor: '顧問服務 C', amount: 450000, status: '審核中' },
]

export const stockRows: TableRow[] = [
  { id: 1, sku: 'SKU-001', name: '感測器模組', qty: 12, status: 'low' },
  { id: 2, sku: 'SKU-014', name: '控制板', qty: 86, status: 'ok' },
  { id: 3, sku: 'SKU-022', name: '電源供應器', qty: 5, status: 'critical' },
]

export let tickets: TableRow[] = [
  { id: 101, customer: '宏達物流', subject: 'API 延遲', priority: '高', status: 'open' },
  { id: 102, customer: '星際零售', subject: '報表匯出失敗', priority: '中', status: 'open' },
  { id: 103, customer: '綠能科技', subject: '權限申請', priority: '低', status: 'assigned' },
]

/*
 * 示範資料是全站共用的記憶體狀態。persist=false（訪客）時只回傳模擬結果，不改共享資料。
 */
export function approveAllLeave(persist = true) {
  const next = leaveRows.map((row) => ({ ...row, status: 'approved' }))
  if (persist) leaveRows = next
  return next
}

export function assignFirstTicket(persist = true) {
  const next = tickets.map((row, i) => (i === 0 ? { ...row, status: 'assigned', owner: tenant.user } : row))
  if (persist) tickets = next
  return next
}

export function reorderCriticalStock(persist = true) {
  const next = stockRows.map((row, i) => (i === 2 ? { ...row, qty: 45, status: 'ok' } : row))
  if (persist) stockRows.splice(0, stockRows.length, ...next)
  return next
}
