import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MATRIX_NAVIGATE_EVENT, type MatrixNavigateDetail } from '../features/session/matrixNavigate'

export function MatrixNavigateListener() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<MatrixNavigateDetail>).detail
      if (!slug) return
      const qs =
        detail.query && Object.keys(detail.query).length
          ? `?${new URLSearchParams(detail.query).toString()}`
          : ''
      if (detail.path === 'studio') {
        navigate(`/w/${slug}/studio${qs}`)
      } else {
        navigate(`/w/${slug}${qs}`)
      }
    }
    window.addEventListener(MATRIX_NAVIGATE_EVENT, handler)
    return () => window.removeEventListener(MATRIX_NAVIGATE_EVENT, handler)
  }, [navigate, slug])

  return null
}
