import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

type RoutePosition = { key: string; pathname: string; hash: string }

const positions = new Map<string, number>()

function getHashTarget(hash: string): HTMLElement | null {
  if (!hash || hash === '#') return null
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)))
  } catch {
    return null
  }
}

export default function RouteScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousRoute = useRef<RoutePosition | null>(null)

  useEffect(() => {
    const originalRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = originalRestoration }
  }, [])

  useLayoutEffect(() => {
    const key = location.key
    const savePosition = () => {
      positions.set(key, window.scrollY)
      if (positions.size > 100) positions.delete(positions.keys().next().value!)
    }
    window.addEventListener('scroll', savePosition, { passive: true })
    return () => {
      savePosition()
      window.removeEventListener('scroll', savePosition)
    }
  }, [location.key])

  useLayoutEffect(() => {
    const currentRoute = { key: location.key, pathname: location.pathname, hash: location.hash }
    const previous = previousRoute.current
    previousRoute.current = currentRoute

    if (location.hash) {
      const target = getHashTarget(location.hash)
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'auto' })
        return
      }
    }

    if (!previous) return
    const entryChanged = currentRoute.key !== previous.key
    const pathnameChanged = currentRoute.pathname !== previous.pathname
    const hashChanged = currentRoute.hash !== previous.hash
    if (!entryChanged && !pathnameChanged && !hashChanged) return

    if (navigationType === 'POP') {
      window.scrollTo({ top: positions.get(currentRoute.key) ?? 0, left: 0, behavior: 'instant' })
    } else if (pathnameChanged || hashChanged) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.hash, location.key, location.pathname, navigationType])

  return null
}
