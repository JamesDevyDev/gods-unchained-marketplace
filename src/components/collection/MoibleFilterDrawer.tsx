import React from 'react'
import { X } from 'lucide-react'
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
    selectedListingStatus: Set<string>
    setSelectedListingStatus: (status: Set<string>) => void
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
    activeView: 'market' | 'nfts'
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
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-80 bg-background z-50 lg:hidden flex flex-col border-r border-lines">
                <div className="flex items-center justify-between px-5 py-6 flex-shrink-0 border-b border-lines">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <div className="flex items-center gap-3">
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="cursor-pointer text-sm text-[#2081E2] hover:text-[#1868B7] transition font-semibold"
                            >
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-1 hover:bg-[#36393f] rounded transition"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5">
                    <FilterContent {...filterProps} />
                    <FilterFooter />
                </div>
            </div>
        </>
    )
}