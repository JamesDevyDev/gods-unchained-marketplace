import React from 'react'
import { FilterContent } from './FilterContent'
import { FilterFooter } from './FilterFooter'
import type { Stack, FilterOptions, PriceRange } from '@/app/types'

interface FilterSidebarProps {
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

export const FilterSidebar: React.FC<FilterSidebarProps> = (props) => {
    const { activeFiltersCount, clearAllFilters } = props

    return (
        <div className="hidden lg:flex lg:flex-col w-80 bg-background border-r border-lines h-screen sticky top-14">
            <div className="flex items-center justify-between px-5 py-[35px] flex-shrink-0 border-b border-lines">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                {activeFiltersCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="cursor-pointer text-sm text-[#2081E2] hover:text-[#1868B7] transition font-semibold"
                    >
                        Clear all
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                <FilterContent {...props} />
                <FilterFooter />
            </div>
        </div>
    )
}