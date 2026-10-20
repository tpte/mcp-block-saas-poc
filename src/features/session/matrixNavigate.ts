import type { ToolTraceEntry } from '../../../shared/trace.ts'

export type MatrixNavigateDetail = {
  path: 'studio' | 'space'
  query?: Record<string, string>
}

export const MATRIX_NAVIGATE_EVENT = 'matrix:navigate'

export function dispatchMatrixNavigate(detail: MatrixNavigateDetail) {
  window.dispatchEvent(new CustomEvent<MatrixNavigateDetail>(MATRIX_NAVIGATE_EVENT, { detail }))
}

export function matrixNavigateFromTrace(trace: ToolTraceEntry[] | undefined) {
  if (!trace?.length) return
  for (const entry of trace) {
    if (entry.tool !== 'workspace:navigate' || !entry.ok) continue
    const payload = entry.payload ?? {}
    const path = payload.path === 'studio' ? 'studio' : 'space'
    const query =
      payload.query && typeof payload.query === 'object'
        ? (payload.query as Record<string, string>)
        : undefined
    dispatchMatrixNavigate({ path, query })
  }
}
