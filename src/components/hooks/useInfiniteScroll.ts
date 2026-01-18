import { useState, useEffect, useRef, useMemo } from 'react'
import type { Stack } from '@/app/types'
import { INITIAL_DISPLAY_COUNT, LOAD_MORE_COUNT, SCROLL_THRESHOLD, SCROLL_ROOT_MARGIN } from '@/app/constants'

export const useInfiniteScroll = (sortedCards: Stack[], loading: boolean) => {
    const [displayedCount, setDisplayedCount] = useState(INITIAL_DISPLAY_COUNT)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // Reset displayed count when cards change
    useEffect(() => {
        setDisplayedCount(INITIAL_DISPLAY_COUNT)
    }, [sortedCards])

    // Cards to display
    const displayedCards = useMemo(() => {
        return sortedCards.slice(0, displayedCount)
    }, [sortedCards, displayedCount])

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect()

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading) {
                    if (displayedCount < sortedCards.length) {
                        setDisplayedCount(prev => Math.min(prev + LOAD_MORE_COUNT, sortedCards.length))
                    }
                }
            },
            { threshold: SCROLL_THRESHOLD, rootMargin: SCROLL_ROOT_MARGIN }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, displayedCount, sortedCards.length])

    return {
        displayedCards,
        displayedCount,
        loadMoreRef
    }
}