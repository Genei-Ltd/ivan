'use client'

import { useSyncExternalStore } from 'react'

interface MediaQueryStore {
  getSnapshot: () => boolean
  subscribe: (onStoreChange: () => void) => () => void
}

const stores = new Map<string, MediaQueryStore>()

function getServerSnapshot() {
  return false
}

function getMediaQueryStore(query: string) {
  const existing = stores.get(query)
  if (existing) {
    return existing
  }

  const store = {
    getSnapshot: () => window.matchMedia(query).matches,
    subscribe: (onStoreChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onStoreChange)
      return () => {
        media.removeEventListener('change', onStoreChange)
      }
    },
  }
  stores.set(query, store)
  return store
}

export function useMediaQuery(query: string) {
  const store = getMediaQueryStore(query)
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  )
}
