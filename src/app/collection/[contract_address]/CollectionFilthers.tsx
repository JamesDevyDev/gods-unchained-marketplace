'use client'

import React from 'react'

interface FilterOptions {
    rarities: string[]
    types: string[]
    attributes: Record<string, string[]>
}

interface FilterState {
    selectedRarities: string[]
    selectedTypes: string[]
    priceRange: { min: string; max: string }
    selectedAttributes: Record<string, string[]>
    searchQuery: string
}

interface CollectionFiltersProps {
    filterOptions: FilterOptions
    filterState: FilterState
    onFilterChange: (updates: Partial<FilterState>) => void
    onClearAll: () => void
    cardCounts: {
        byRarity: Record<string, number>
        byType: Record<string, number>
        byAttribute: Record<string, Record<string, number>>
    }
}

const CollectionFilters: React.FC<CollectionFiltersProps> = ({
    filterOptions,
    filterState,
    onFilterChange,
    onClearAll,
    cardCounts
}) => {
    const toggleRarity = (rarity: string) => {
        const updated = filterState.selectedRarities.includes(rarity)
            ? filterState.selectedRarities.filter(r => r !== rarity)
            : [...filterState.selectedRarities, rarity]
        onFilterChange({ selectedRarities: updated })
    }

    const toggleType = (type: string) => {
        const updated = filterState.selectedTypes.includes(type)
            ? filterState.selectedTypes.filter(t => t !== type)
            : [...filterState.selectedTypes, type]
        onFilterChange({ selectedTypes: updated })
    }

    const toggleAttribute = (key: string, value: string) => {
        const current = filterState.selectedAttributes[key] || []
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]

        onFilterChange({
            selectedAttributes: { ...filterState.selectedAttributes, [key]: updated }
        })
    }

    const activeFiltersCount =
        filterState.selectedRarities.length +
        filterState.selectedTypes.length +
        Object.values(filterState.selectedAttributes).reduce((acc, arr) => acc + arr.length, 0) +
        (filterState.priceRange.min || filterState.priceRange.max ? 1 : 0)

    return (
        <div className="w-80 bg-[#2c2f33] border-r border-[#36393f] p-6 overflow-y-auto h-[calc(100vh-5rem)] sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                {activeFiltersCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-sm text-[#2081E2] hover:text-[#1868B7] transition"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search..."
                    value={filterState.searchQuery}
                    onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                    className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                />
            </div>

            {/* Status Filter */}
            <FilterSection title="Status">
                <FilterCheckbox label="All" count={0} />
                <FilterCheckbox label="Listed" count={0} />
            </FilterSection>

            {/* Rarity Filter */}
            <FilterSection title="Rarity">
                {filterOptions.rarities.map(rarity => (
                    <FilterCheckbox
                        key={rarity}
                        label={rarity}
                        checked={filterState.selectedRarities.includes(rarity)}
                        onChange={() => toggleRarity(rarity)}
                        count={cardCounts.byRarity[rarity] || 0}
                    />
                ))}
            </FilterSection>

            {/* Price Filter */}
            <FilterSection title="Price">
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={filterState.priceRange.min}
                        onChange={(e) => onFilterChange({
                            priceRange: { ...filterState.priceRange, min: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={filterState.priceRange.max}
                        onChange={(e) => onFilterChange({
                            priceRange: { ...filterState.priceRange, max: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                    />
                </div>
            </FilterSection>

            {/* Type Filter */}
            {filterOptions.types.length > 0 && (
                <FilterSection title="Type">
                    <div className="max-h-48 overflow-y-auto">
                        {filterOptions.types.map(type => (
                            <FilterCheckbox
                                key={type}
                                label={type}
                                checked={filterState.selectedTypes.includes(type)}
                                onChange={() => toggleType(type)}
                                count={cardCounts.byType[type] || 0}
                            />
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Attribute Filters */}
            {Object.entries(filterOptions.attributes).map(([key, values]) => (
                values.length > 0 && values.length <= 20 && (
                    <FilterSection key={key} title={key}>
                        <div className="max-h-48 overflow-y-auto">
                            {values.map(value => (
                                <FilterCheckbox
                                    key={value}
                                    label={value}
                                    checked={(filterState.selectedAttributes[key] || []).includes(value)}
                                    onChange={() => toggleAttribute(key, value)}
                                    count={cardCounts.byAttribute[key]?.[value] || 0}
                                />
                            ))}
                        </div>
                    </FilterSection>
                )
            ))}
        </div>
    )
}

// Helper Components
const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
            <span className="capitalize">{title}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        <div className="space-y-2">
            {children}
        </div>
    </div>
)

const FilterCheckbox: React.FC<{
    label: string
    checked?: boolean
    onChange?: () => void
    count?: number
}> = ({ label, checked = false, onChange, count }) => (
    <label className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer group">
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="mr-2 rounded accent-[#2081E2]"
            />
            <span className="capitalize truncate">{label}</span>
        </div>
        {count !== undefined && (
            <span className="text-gray-500 text-xs group-hover:text-gray-400">
                {count}
            </span>
        )}
    </label>
)

export default CollectionFilters