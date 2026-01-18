import React, { useState } from 'react'
import { DropdownFilter } from './DropdownFilter'
import { CheckboxOption } from './CheckboxOption'
import { RadioOption } from './RadioOption'
import { FilterSkeleton } from './FilterSkeleton'
import { Search } from 'lucide-react'
import { ALLOWED_ATTRIBUTES } from '@/app/constants'
import type { Stack, FilterOptions, PriceRange } from '@/app/types'

interface FilterContentProps {
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

export const FilterContent: React.FC<FilterContentProps> = ({
    loading,
    filterOptions,
    selectedCurrency,
    setSelectedCurrency,
    selectedRarities,
    setSelectedRarities,
    selectedTypes,
    setSelectedTypes,
    selectedAttributes,
    setSelectedAttributes,
    priceRange,
    setPriceRange,
    cards,
    currencySearch,
    setCurrencySearch,
    raritySearch,
    setRaritySearch,
    typeSearch,
    setTypeSearch,
    attributeSearches,
    setAttributeSearches
}) => {
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
        currency: true,
        rarity: false,
        price: false,
        type: false,
    })

    const toggleDropdown = (key: string) => {
        setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
        const newSet = new Set(set)
        if (newSet.has(item)) {
            newSet.delete(item)
        } else {
            newSet.add(item)
        }
        return newSet
    }

    if (loading) {
        return <FilterSkeleton />
    }

    return (
        <div className="space-y-0">
            {/* Currency Filter */}
            {filterOptions.currencies && filterOptions.currencies.length > 0 && (
                <DropdownFilter
                    label="Currency"
                    count={selectedCurrency ? 1 : 0}
                    isOpen={openDropdowns.currency}
                    onToggle={() => toggleDropdown('currency')}
                >
                    <div className="space-y-1">
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search currencies"
                                value={currencySearch}
                                onChange={(e) => setCurrencySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <RadioOption
                                label="All Currencies"
                                count={cards.length}
                                checked={!selectedCurrency}
                                onChange={() => setSelectedCurrency('')}
                            />

                            {filterOptions.currencies
                                .filter(currency => currency && currency.toLowerCase().includes(currencySearch.toLowerCase()))
                                .map(currency => (
                                    <RadioOption
                                        key={currency}
                                        label={currency}
                                        count={cards.filter(c => c.all_prices && currency in c.all_prices).length}
                                        checked={selectedCurrency === currency}
                                        onChange={() => setSelectedCurrency(currency)}
                                    />
                                ))}
                        </div>
                    </div>
                </DropdownFilter>
            )}

            {/* Rarity Filter */}
            {filterOptions.rarities && filterOptions.rarities.length > 0 && (
                <DropdownFilter
                    label="Rarity"
                    count={selectedRarities.size}
                    isOpen={openDropdowns.rarity}
                    onToggle={() => toggleDropdown('rarity')}
                >
                    <div className="space-y-1">
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search rarities"
                                value={raritySearch}
                                onChange={(e) => setRaritySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filterOptions.rarities
                                .filter(rarity => rarity && rarity.toLowerCase().includes(raritySearch.toLowerCase()))
                                .map(rarity => (
                                    <CheckboxOption
                                        key={rarity}
                                        label={rarity}
                                        count={cards.filter(c => c.rarity === rarity).length}
                                        checked={selectedRarities.has(rarity)}
                                        onChange={() => setSelectedRarities(toggleSetItem(selectedRarities, rarity))}
                                    />
                                ))}
                        </div>
                    </div>
                </DropdownFilter>
            )}

            {/* Price Filter */}
            <DropdownFilter
                label="Price"
                count={priceRange.min || priceRange.max ? 1 : 0}
                isOpen={openDropdowns.price}
                onToggle={() => toggleDropdown('price')}
            >
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="w-full px-3 py-2 bg-[#202225] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="w-full px-3 py-2 bg-[#202225] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                    />
                </div>
            </DropdownFilter>

            {/* Type Filter */}
            {filterOptions.types && filterOptions.types.length > 0 && (
                <DropdownFilter
                    label="Type"
                    count={selectedTypes.size}
                    isOpen={openDropdowns.type}
                    onToggle={() => toggleDropdown('type')}
                >
                    <div className="space-y-1">
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search types"
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filterOptions.types
                                .filter(type => type && type.toLowerCase().includes(typeSearch.toLowerCase()))
                                .map(type => (
                                    <CheckboxOption
                                        key={type}
                                        label={type}
                                        count={cards.filter(c => c.item_type === type).length}
                                        checked={selectedTypes.has(type)}
                                        onChange={() => setSelectedTypes(toggleSetItem(selectedTypes, type))}
                                    />
                                ))}
                        </div>
                    </div>
                </DropdownFilter>
            )}

            {/* Attribute Filters */}
            {ALLOWED_ATTRIBUTES.map(attributeKey => {
                const values = filterOptions.attributes[attributeKey]
                if (!values || values.length === 0) return null

                const dropdownKey = `attr_${attributeKey}`
                const selectedSet = selectedAttributes[attributeKey] || new Set()
                const searchValue = attributeSearches[attributeKey] || ''

                return (
                    <DropdownFilter
                        key={attributeKey}
                        label={attributeKey}
                        count={selectedSet.size}
                        isOpen={openDropdowns[dropdownKey]}
                        onToggle={() => toggleDropdown(dropdownKey)}
                    >
                        <div className="space-y-1">
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${attributeKey.toLowerCase()}`}
                                    value={searchValue}
                                    onChange={(e) => setAttributeSearches({ ...attributeSearches, [attributeKey]: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
                                />
                            </div>

                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {values
                                    .filter(value => value && value.toLowerCase().includes(searchValue.toLowerCase()))
                                    .map(value => (
                                        <CheckboxOption
                                            key={value}
                                            label={value}
                                            count={cards.filter(c => c.attributes && String(c.attributes[attributeKey]) === value).length}
                                            checked={selectedSet.has(value)}
                                            onChange={() => {
                                                setSelectedAttributes({
                                                    ...selectedAttributes,
                                                    [attributeKey]: toggleSetItem(selectedSet, value)
                                                })
                                            }}
                                        />
                                    ))}
                            </div>
                        </div>
                    </DropdownFilter>
                )
            })}
        </div>
    )
}