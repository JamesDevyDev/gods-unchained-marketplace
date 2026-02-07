import { useState, useMemo } from 'react'
import type { Stack, FilterOptions, PriceRange } from '@/app/types'
import { ALLOWED_ATTRIBUTES } from '@/app/constants'

export const useCardFilters = (cards: Stack[]) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
    const [selectedCurrency, setSelectedCurrency] = useState<string>('')
    const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' })
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, Set<string>>>({})
    const [selectedListingStatus, setSelectedListingStatus] = useState<Set<string>>(new Set())

    // Search states for filters
    const [raritySearch, setRaritySearch] = useState('')
    const [typeSearch, setTypeSearch] = useState('')
    const [currencySearch, setCurrencySearch] = useState('')
    const [attributeSearches, setAttributeSearches] = useState<Record<string, string>>({})

    // Get unique values for filters
    const filterOptions = useMemo((): FilterOptions => {
        const rarities = new Set<string>()
        const types = new Set<string>()
        const currencies = new Set<string>()
        const attributes: Record<string, Set<string>> = {}

        cards.forEach(card => {
            if (card.rarity) {
                rarities.add(card.rarity)
            }

            if (card.item_type) {
                types.add(card.item_type)
            }

            if (card.all_prices) {
                Object.keys(card.all_prices).forEach(currency => {
                    if (currency) {
                        currencies.add(currency)
                    }
                })
            }

            if (card.attributes) {
                Object.entries(card.attributes).forEach(([key, value]) => {
                    if (ALLOWED_ATTRIBUTES.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (!attributes[key]) {
                            attributes[key] = new Set()
                        }
                        attributes[key].add(String(value))
                    }
                })
            }
        })

        return {
            rarities: Array.from(rarities).filter(Boolean).sort(),
            types: Array.from(types).filter(Boolean).sort(),
            currencies: Array.from(currencies).filter(Boolean).sort(),
            attributes: Object.fromEntries(
                Object.entries(attributes).map(([key, values]) => [
                    key,
                    Array.from(values).filter(Boolean).sort()
                ])
            )
        }
    }, [cards])

    // Filter cards based on all filters
    const filteredCards = useMemo(() => {
        let filtered = cards

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(card =>
                card.name?.toLowerCase().includes(query) ||
                card.rarity?.toLowerCase().includes(query) ||
                card.item_type?.toLowerCase().includes(query) ||
                (card.attributes && Object.values(card.attributes).some(attr =>
                    String(attr).toLowerCase().includes(query)
                ))
            )
        }

        // Rarity filter
        if (selectedRarities.size > 0) {
            filtered = filtered.filter(card => card.rarity && selectedRarities.has(card.rarity))
        }

        // Type filter
        if (selectedTypes.size > 0) {
            filtered = filtered.filter(card => card.item_type && selectedTypes.has(card.item_type))
        }

        // Currency filter
        if (selectedCurrency) {
            filtered = filtered.filter(card => {
                if (!card.all_prices) return false
                return selectedCurrency in card.all_prices
            })
        }

        // Price range filter
        if (priceRange.min || priceRange.max) {
            filtered = filtered.filter(card => {
                const price = card.best_usd_price
                if (price === null) return false

                const min = priceRange.min ? parseFloat(priceRange.min) : 0
                const max = priceRange.max ? parseFloat(priceRange.max) : Infinity

                return price >= min && price <= max
            })
        }

        // Listing status filter
        if (selectedListingStatus.size > 0) {
            filtered = filtered.filter(card => {
                if (selectedListingStatus.has('listed')) {
                    return card.owned_tokens?.some(token => token.listed === true)
                } else if (selectedListingStatus.has('unlisted')) {
                    return card.owned_tokens?.some(token => token.listed === false)
                }
                return true // Should not reach here with radio buttons
            })
        }

        // Attribute filters
        Object.entries(selectedAttributes).forEach(([key, valueSet]) => {
            if (valueSet.size > 0) {
                filtered = filtered.filter(card =>
                    card.attributes && valueSet.has(String(card.attributes[key]))
                )
            }
        })

        return filtered
    }, [cards, searchQuery, selectedRarities, selectedTypes, selectedCurrency, priceRange, selectedListingStatus, selectedAttributes])

    // Calculate active filters count
    const activeFiltersCount =
        selectedRarities.size +
        selectedTypes.size +
        (selectedCurrency ? 1 : 0) +
        (selectedListingStatus.size > 0 ? 1 : 0) + // Count as 1 if not "All"
        Object.values(selectedAttributes).reduce((sum, set) => sum + set.size, 0) +
        (priceRange.min || priceRange.max ? 1 : 0)

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedRarities(new Set())
        setSelectedTypes(new Set())
        setPriceRange({ min: '', max: '' })
        setSelectedAttributes({})
        setSearchQuery('')
        setSelectedCurrency('')
        setSelectedListingStatus(new Set())
        setRaritySearch('')
        setTypeSearch('')
        setCurrencySearch('')
        setAttributeSearches({})
    }

    return {
        searchQuery,
        setSearchQuery,
        selectedRarities,
        setSelectedRarities,
        selectedTypes,
        setSelectedTypes,
        selectedCurrency,
        setSelectedCurrency,
        priceRange,
        setPriceRange,
        selectedAttributes,
        setSelectedAttributes,
        selectedListingStatus,
        setSelectedListingStatus,
        filterOptions,
        filteredCards,
        activeFiltersCount,
        clearAllFilters,
        raritySearch,
        setRaritySearch,
        typeSearch,
        setTypeSearch,
        currencySearch,
        setCurrencySearch,
        attributeSearches,
        setAttributeSearches
    }
}