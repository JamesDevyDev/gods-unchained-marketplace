'use client'

import CardItem from '@/components/reusable/CardItem'
import CardModal from '@/components/reusable/CardModal'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'

interface CardAttributes {
  [key: string]: string | number
}

interface PriceInfo {
  listing_id: string
  price: number
  usd: number
}

interface AllPrices {
  [currency: string]: PriceInfo
}

interface Stack {
  metadata_id: string
  name: string
  description: string | null
  image: string
  attributes: CardAttributes
  rarity: string
  item_type: string
  total_listings: number
  all_prices: AllPrices
  best_usd_price: number | null
  best_currency: string | null
  last_sold_price: number | null
}

interface ApiResponse {
  stacks: Stack[]
  total: number
  cached: boolean
}

const CardsPage = () => {
  const params = useParams()
  const contract_address = params.contract_address as string

  const [cards, setCards] = useState<Stack[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Stack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter states
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' })
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(50)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // API Configuration
  const API_BASE_URL = 'https://immutable-marketplace.onrender.com'

  // Fetch all stacks from your API
  const fetchCards = async () => {
    if (!contract_address) return

    setLoading(true)
    setError(null)
    try {
      const url = `${API_BASE_URL}/api/collections/${contract_address}/all-stacks`
      console.log('Fetching from:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log('Fetched data:', data)

      setCards(data.stacks || [])

      // Log cache status
      if (data.cached) {
        console.log('Data served from cache')
      } else {
        console.log('Fresh data from database')
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch cards')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (contract_address) {
      fetchCards()
    }
  }, [contract_address])

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const rarities = new Set<string>()
    const types = new Set<string>()
    const attributes: Record<string, Set<string>> = {}

    cards.forEach(card => {
      rarities.add(card.rarity)
      types.add(card.item_type)

      Object.entries(card.attributes).forEach(([key, value]) => {
        if (!attributes[key]) {
          attributes[key] = new Set()
        }
        attributes[key].add(String(value))
      })
    })

    return {
      rarities: Array.from(rarities).sort(),
      types: Array.from(types).sort(),
      attributes: Object.fromEntries(
        Object.entries(attributes).map(([key, values]) => [key, Array.from(values).sort()])
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
        card.name.toLowerCase().includes(query) ||
        card.rarity.toLowerCase().includes(query) ||
        card.item_type.toLowerCase().includes(query) ||
        Object.values(card.attributes).some(attr =>
          String(attr).toLowerCase().includes(query)
        )
      )
    }

    // Rarity filter
    if (selectedRarities.length > 0) {
      filtered = filtered.filter(card => selectedRarities.includes(card.rarity))
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(card => selectedTypes.includes(card.item_type))
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

    // Attribute filters
    Object.entries(selectedAttributes).forEach(([key, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(card =>
          values.includes(String(card.attributes[key]))
        )
      }
    })

    return filtered
  }, [cards, searchQuery, selectedRarities, selectedTypes, priceRange, selectedAttributes])

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(50)
  }, [filteredCards])

  // Cards to display (filtered + limited by displayedCount)
  const displayedCards = useMemo(() => {
    return filteredCards.slice(0, displayedCount)
  }, [filteredCards, displayedCount])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          if (displayedCount < filteredCards.length) {
            setDisplayedCount(prev => Math.min(prev + 50, filteredCards.length))
          }
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, displayedCount, filteredCards.length])

  // Toggle filter selection
  const toggleFilter = (type: 'rarity' | 'type', value: string) => {
    if (type === 'rarity') {
      setSelectedRarities(prev =>
        prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
      )
    } else {
      setSelectedTypes(prev =>
        prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
      )
    }
  }

  const toggleAttributeFilter = (attributeKey: string, value: string) => {
    setSelectedAttributes(prev => {
      const current = prev[attributeKey] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]

      return { ...prev, [attributeKey]: updated }
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRarities([])
    setSelectedTypes([])
    setPriceRange({ min: '', max: '' })
    setSelectedAttributes({})
    setSearchQuery('')
  }

  // Format price for display
  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'N/A'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  // Get rarity color
  const getRarityColor = (rarity: string): string => {
    const rarityColors: { [key: string]: string } = {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-orange-400',
      mythic: 'text-red-400'
    }
    return rarityColors[rarity.toLowerCase()] || 'text-gray-400'
  }

  const activeFiltersCount = selectedRarities.length + selectedTypes.length +
    Object.values(selectedAttributes).reduce((acc, arr) => acc + arr.length, 0) +
    (priceRange.min || priceRange.max ? 1 : 0)

  return (
    <div className="min-h-screen bg-[#151b2e]">
      <div className="flex pt-20">
        {/* Sidebar Filters */}
        <div className="w-80 bg-[#151b2e] border-r border-[#36393f] p-6 overflow-y-auto h-screen sticky top-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Filters</h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
              <span>Status</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="space-y-2">
              <label className="flex items-center text-sm text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" className="mr-2 rounded" />
                All
              </label>
              <label className="flex items-center text-sm text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" className="mr-2 rounded" />
                Listed
              </label>
            </div>
          </div>

          {/* Rarity Filter */}
          <div className="mb-6">
            <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
              <span>Rarity</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="space-y-2">
              {filterOptions.rarities.map(rarity => (
                <label key={rarity} className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRarities.includes(rarity)}
                      onChange={() => toggleFilter('rarity', rarity)}
                      className="mr-2 rounded"
                    />
                    <span className="capitalize">{rarity}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {cards.filter(c => c.rarity === rarity).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="mb-6">
            <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
              <span>Price</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Type Filter */}
          {filterOptions.types.length > 0 && (
            <div className="mb-6">
              <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
                <span>Type</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.types.map(type => (
                  <label key={type} className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleFilter('type', type)}
                        className="mr-2 rounded"
                      />
                      <span>{type}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {cards.filter(c => c.item_type === type).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Attribute Filters */}
          {Object.entries(filterOptions.attributes).map(([key, values]) => (
            values.length > 0 && (
              <div key={key} className="mb-6">
                <button className="w-full flex items-center justify-between text-white font-semibold mb-3">
                  <span className="capitalize">{key}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {values.slice(0, 10).map(value => (
                    <label key={value} className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(selectedAttributes[key] || []).includes(value)}
                          onChange={() => toggleAttributeFilter(key, value)}
                          className="mr-2 rounded"
                        />
                        <span className="truncate">{value}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {cards.filter(c => String(c.attributes[key]) === value).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Gods Unchained Cards
                  </h1>
                  <p className="text-gray-400">
                    {displayedCards.length} of {filteredCards.length} items
                    {searchQuery && ` (filtered from ${cards.length} total)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
                <p className="font-semibold">Error loading cards:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Loading indicator */}
            {loading && cards.length === 0 && (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
                <p className="text-gray-400 text-lg">Loading cards...</p>
              </div>
            )}

            {/* Cards grid */}
            {!loading && displayedCards.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {displayedCards.map((card) => (
                    <CardItem
                      key={card.metadata_id}
                      card={card}
                      getRarityColor={getRarityColor}
                      formatPrice={formatPrice}
                      onClick={() => setSelectedCard(card)}
                    />
                  ))}
                </div>

                {/* Load more trigger */}
                {displayedCount < filteredCards.length && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center items-center py-8"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-3 text-gray-400">Loading more cards...</span>
                  </div>
                )}

                {/* End of results */}
                {displayedCount >= filteredCards.length && filteredCards.length > 50 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">All cards loaded</p>
                  </div>
                )}
              </>
            )}

            {/* No results state */}
            {!loading && filteredCards.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-xl mb-4">
                  No cards found matching your filters
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-[#2081E2] hover:bg-[#1868B7] text-white rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && cards.length === 0 && !error && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-xl">No cards found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardModal
        card={selectedCard}
        getRarityColor={getRarityColor}
        formatPrice={formatPrice}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  )
}

export default CardsPage