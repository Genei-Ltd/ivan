'use client'

import { useEffect, useRef } from 'react'

const BOTTOM_STICKINESS_THRESHOLD = 48

function isNearBottom(element: HTMLElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    BOTTOM_STICKINESS_THRESHOLD
  )
}

function scrollToBottom(element: HTMLElement) {
  element.scrollTop = element.scrollHeight
}

export function useStickToBottom(trigger: unknown, secondaryTrigger?: unknown) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)

  function onViewportScroll() {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }
    shouldStickToBottomRef.current = isNearBottom(viewport)
  }

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current
      if (viewport && shouldStickToBottomRef.current) {
        scrollToBottom(viewport)
      }
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [trigger, secondaryTrigger])

  return { onViewportScroll, viewportRef }
}
