import { useState, useMemo, useRef, useEffect } from 'react'
import type { Stack, SortOption } from '@/app/types'
import { SORT_OPTIONS, RARITY_ORDER } from '@/app/constants'

export const useCardSort = (cards: Stack[]) => {
    const [sortType, setSortType] = useState('price')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Sort cards
    const sortedCards = useMemo(() => {
        const sorted = [...cards]

        switch (sortType) {
            case 'price':
                sorted.sort((a, b) => {
                    const priceA = a.best_usd_price ?? Infinity
                    const priceB = b.best_usd_price ?? Infinity
                    return sortDirection === 'asc' ? priceA - priceB : priceB - priceA
                })
                break
            case 'name':
                sorted.sort((a, b) => {
                    const comparison = (a.name || '').localeCompare(b.name || '')
                    return sortDirection === 'asc' ? comparison : -comparison
                })
                break
            case 'quantity':
            case 'listing-time':
                sorted.sort((a, b) => {
                    const qtyA = a.total_listings || 0
                    const qtyB = b.total_listings || 0
                    return sortDirection === 'asc' ? qtyA - qtyB : qtyB - qtyA
                })
                break
            case 'quality':
                sorted.sort((a, b) => {
                    const rarityA = RARITY_ORDER[a.rarity?.toLowerCase()] || 0
                    const rarityB = RARITY_ORDER[b.rarity?.toLowerCase()] || 0
                    return sortDirection === 'asc' ? rarityA - rarityB : rarityB - rarityA
                })
                break
            default:
                sorted.sort((a, b) => {
                    const priceA = a.best_usd_price ?? Infinity
                    const priceB = b.best_usd_price ?? Infinity
                    return sortDirection === 'asc' ? priceA - priceB : priceB - priceA
                })
        }

        return sorted
    }, [cards, sortType, sortDirection])

    return {
        sortType,
        setSortType,
        sortDirection,
        setSortDirection,
        isSortOpen,
        setIsSortOpen,
        sortedCards,
        sortOptions: SORT_OPTIONS,
        sortRef
    }
}