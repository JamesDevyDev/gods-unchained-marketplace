import React from 'react'
import CardItem from '@/components/reusable/CardItem'
import { CardSkeleton } from './CardSkeleton'
import type { Stack } from '@/app/types'

interface CardsGridProps {
    loading: boolean
    error: string | null
    displayedCards: Stack[]
    sortedCards: Stack[]
    cards: Stack[]
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    selectedCurrency: string
    onCardClick: (card: Stack) => void
    loadMoreRef: React.RefObject<HTMLDivElement | null>
    clearAllFilters: () => void
}

export const CardsGrid: React.FC<CardsGridProps> = ({
    loading,
    error,
    displayedCards,
    sortedCards,
    cards,
    getRarityColor,
    formatPrice,
    selectedCurrency,
    onCardClick,
    loadMoreRef,
    clearAllFilters
}) => {
    // Error state
    if (error) {
        return (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
                <p className="font-semibold">Error loading cards:</p>
                <p>{error}</p>
            </div>
        )
    }

    // Loading skeleton
    if (loading) {
        return (
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {[...Array(30)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        )
    }

    // Cards grid with infinite scroll
    if (displayedCards.length > 0) {
        return (
            <>
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 px-2">
                    {displayedCards.map((card) => (
                        <CardItem
                            key={card.metadata_id}
                            card={card}
                            getRarityColor={getRarityColor}
                            formatPrice={formatPrice}
                            onClick={() => onCardClick(card)}
                            selectedCurrency={selectedCurrency}
                        />
                    ))}
                </div>

                {/* Load more trigger */}
                {displayedCards.length < sortedCards.length && (
                    <div
                        ref={loadMoreRef}
                        className="flex justify-center items-center py-8"
                    >
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <span className="ml-3 text-gray-400">Loading more cards...</span>
                    </div>
                )}

                {/* End of results */}
                {displayedCards.length >= sortedCards.length && sortedCards.length > 50 && (
                    <div className="text-center py-8">
                        <p className="text-gray-400">All cards loaded</p>
                    </div>
                )}
            </>
        )
    }

    // No results state
    if (sortedCards.length === 0 && cards.length > 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 text-xl mb-4">
                    No cards found matching your filters
                </p>
                <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-[#2081E2] hover:text-[#1868B7] text-white rounded-lg transition-colors"
                >
                    Clear All Filters
                </button>
            </div>
        )
    }

    // Empty state
    return (
        <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No cards found</p>
        </div>
    )
}