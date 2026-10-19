import { Navigate, useParams } from 'react-router-dom'
import { LAST_SPACE_SLUG_KEY } from '../features/session/workspaceUiCache'
import { HomePage } from '../pages/HomePage'

export function RedirectModuleRoute() {
  const slug = localStorage.getItem(LAST_SPACE_SLUG_KEY) ?? 'personal'
  return <Navigate to={`/w/${slug}`} replace />
}

export function RedirectGlobalStudio() {
  const slug = localStorage.getItem(LAST_SPACE_SLUG_KEY) ?? 'personal'
  return <Navigate to={`/w/${slug}/studio`} replace />
}

export function HomeOrLastSpace() {
  const last = localStorage.getItem(LAST_SPACE_SLUG_KEY)
  if (last) return <Navigate to={`/w/${last}`} replace />
  return <HomePage />
}

export function RedirectStudioWithSlug() {
  const { slug = 'personal' } = useParams()
  return <Navigate to={`/w/${slug}/studio`} replace />
}
