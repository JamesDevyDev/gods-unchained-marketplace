import React from 'react'
import { FilterContent } from './FilterContent'
import { FilterFooter } from './FilterFooter'
import type { Stack, FilterOptions, PriceRange } from '@/app/types'

interface MobileFilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    loading: boolean
    filterOptions: FilterOptions
    selectedCurrency: string
    setSelectedCurrency: (currency: string) => void
    selectedRarities: Set<string>
    setSelectedRarities: (rarities: Set<string>) => void
    selectedTypes: Set<string>
    setSelectedTypes: (types: Set<string>) => void
    selectedAttributes: Record<string, Set<string>>
    setSelectedAttributes: (attributes: Record<string, Set<string>>) => void
    priceRange: PriceRange
    setPriceRange: (range: PriceRange) => void
    activeFiltersCount: number
    clearAllFilters: () => void
    cards: Stack[]
    currencySearch: string
    setCurrencySearch: (search: string) => void
    raritySearch: string
    setRaritySearch: (search: string) => void
    typeSearch: string
    setTypeSearch: (search: string) => void
    attributeSearches: Record<string, string>
    setAttributeSearches: (searches: Record<string, string>) => void
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
    isOpen,
    onClose,
    activeFiltersCount,
    clearAllFilters,
    ...filterProps
}) => {
    if (!isOpen) return null

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={onClose}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-lines z-50 lg:hidden animate-slide-in flex flex-col">
                <div className="flex items-center justify-between px-5 py-6 border-b border-lines flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-[#2081E2] hover:text-[#1868B7] transition font-semibold"
                            >
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition cursor-pointer"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    <FilterContent {...filterProps} />
                </div>
                <div className="flex-shrink-0">
                    <FilterFooter />
                </div>
            </div>
        </>
    )
}