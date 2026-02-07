'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import useCommonStore from '@/utils/zustand/useCommonStore'
import { BarChart3 } from 'lucide-react'

// Hooks
import { useCardData } from '@/components/hooks/useCardData'
import { useCardFilters } from '@/components/hooks/useCardFilters'
import { useCardSort } from '@/components/hooks/useCardSort'
import { useInfiniteScroll } from '@/components/hooks/useInfiniteScroll'

// Components
import { HeroSection } from '@/components/collection/HeroSection'
import { FilterSidebar } from '@/components/collection/FilterSidebar'
import { MobileFilterDrawer } from '@/components/collection/MoibleFilterDrawer'
import { SearchAndSort } from '@/components/collection/SearchAndSort'
import { CardsGrid } from '@/components/collection/CardsGrid'
import CardModal from '@/components/reusable/CardModal'
import { ViewTabs } from '@/components/collection/ViewTabs'
import { StatsModal } from '@/components/collection/StatsModal'

// Types
import type { Stack } from '@/app/types'

const CardsPage = () => {
  const params = useParams()
  const contract_address = params.contract_address as string
  const { loggedWallet } = useCommonStore()

  // State
  const [selectedCard, setSelectedCard] = useState<Stack | null>(null)
  const [activeView, setActiveView] = useState<'market' | 'nfts'>('market')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')

  // ✅ Track the last fetched view to prevent redundant fetches
  const lastFetchedViewRef = useRef<'market' | 'nfts' | null>(null)

  // Custom hooks
  const {
    contractData,
    cards,
    stats,
    loading,
    error,
    fetchCards
  } = useCardData(contract_address)

  const {
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
    // Search states
    raritySearch,
    setRaritySearch,
    typeSearch,
    setTypeSearch,
    currencySearch,
    setCurrencySearch,
    attributeSearches,
    setAttributeSearches
  } = useCardFilters(cards)

  const {
    sortType,
    setSortType,
    sortDirection,
    setSortDirection,
    isSortOpen,
    setIsSortOpen,
    sortedCards,
    sortOptions,
    sortRef
  } = useCardSort(filteredCards)

  const {
    displayedCards,
    loadMoreRef
  } = useInfiniteScroll(sortedCards, loading)

  // Calculate total real value
  const totalRealValue = useMemo(() => {
    return cards.reduce((sum, stack) => {
      const realValue = stack.real_value || 0
      const quantity = stack.quantity || 0

      return sum + (realValue * quantity)
    }, 0)
  }, [cards])

  // Calculate total floor value
  const totalFloorValue = useMemo(() => {
    return cards.reduce((sum, stack) => {
      return sum + (stack.total_floor_value || 0)
    }, 0)
  }, [cards])

  // Set active view based on URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      setActiveView(searchParams.get('wallet') ? 'nfts' : 'market')
    }
  }, [])

  // Handle view change
  const handleViewChange = (view: 'market' | 'nfts') => {
    const url = new URL(window.location.href)

    if (view === 'nfts' && loggedWallet) {
      url.searchParams.set('wallet', loggedWallet)
    } else {
      url.searchParams.delete('wallet')
    }

    window.history.pushState({}, '', url.toString())
    setActiveView(view)

    // ✅ Only fetch if we haven't fetched this view yet
    if (lastFetchedViewRef.current !== view) {
      lastFetchedViewRef.current = view
      fetchCards()
    }
  }

  // Utility functions
  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'N/A'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  const getRarityColor = (rarity: string): string => {
    const rarityColors: { [key: string]: string } = {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-orange-400',
      mythic: 'text-red-400'
    }
    return rarityColors[rarity?.toLowerCase()] || 'text-gray-400'
  }


  return (
    <div className="min-h-screen bg-background relative">
      <HeroSection
        contractName={contractData?.name}
        loading={loading}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <FilterSidebar
          loading={loading}
          filterOptions={filterOptions}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          selectedRarities={selectedRarities}
          setSelectedRarities={setSelectedRarities}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={setSelectedAttributes}
          selectedListingStatus={selectedListingStatus}
          setSelectedListingStatus={setSelectedListingStatus}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          activeFiltersCount={activeFiltersCount}
          clearAllFilters={clearAllFilters}
          cards={cards}
          currencySearch={currencySearch}
          setCurrencySearch={setCurrencySearch}
          raritySearch={raritySearch}
          setRaritySearch={setRaritySearch}
          typeSearch={typeSearch}
          setTypeSearch={setTypeSearch}
          attributeSearches={attributeSearches}
          setAttributeSearches={setAttributeSearches}
          activeView={activeView}
        />

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          loading={loading}
          filterOptions={filterOptions}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          selectedRarities={selectedRarities}
          setSelectedRarities={setSelectedRarities}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={setSelectedAttributes}
          selectedListingStatus={selectedListingStatus}
          setSelectedListingStatus={setSelectedListingStatus}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          activeFiltersCount={activeFiltersCount}
          clearAllFilters={clearAllFilters}
          cards={cards}
          currencySearch={currencySearch}
          setCurrencySearch={setCurrencySearch}
          raritySearch={raritySearch}
          setRaritySearch={setRaritySearch}
          typeSearch={typeSearch}
          setTypeSearch={setTypeSearch}
          attributeSearches={attributeSearches}
          setAttributeSearches={setAttributeSearches}
          activeView={activeView}
        />

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="w-full max-w-[1920px] pb-16">
            <div className="z-10 bg-background border-lines border-b sticky top-13 px-2">
              <ViewTabs
                activeView={activeView}
                onViewChange={handleViewChange}
                loggedWallet={loggedWallet}
                layoutMode={layoutMode}
                onLayoutChange={setLayoutMode}
                loading={loading}
              />

              <SearchAndSort
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortType={sortType}
                setSortType={setSortType}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                isSortOpen={isSortOpen}
                setIsSortOpen={setIsSortOpen}
                sortOptions={sortOptions}
                sortRef={sortRef}
                onFilterToggle={() => setIsMobileFilterOpen(true)}
              />
            </div>

            <CardsGrid
              loading={loading}
              error={error}
              displayedCards={displayedCards}
              sortedCards={sortedCards}
              cards={cards}
              getRarityColor={getRarityColor}
              formatPrice={formatPrice}
              selectedCurrency={selectedCurrency}
              onCardClick={setSelectedCard}
              loadMoreRef={loadMoreRef}
              clearAllFilters={clearAllFilters}
              layoutMode={layoutMode}
            />

            {activeView === 'nfts' && stats && (
              <div
                className='bg-background border-t border-lines w-full h-11 fixed bottom-0 flex items-center justify-between px-2'
              >
                <div
                  className='flex items-center gap-2 h-full'
                >
                  <div
                    onClick={() => setIsStatsModalOpen(true)}
                    className='bg-light p-2 rounded-lg  w-[40px] flex items-center justify-center cursor-pointer border-lines border'
                  >
                    <BarChart3 className='w-4 h-4 text-gray-400 group-hover:text-text transition-colors' />
                  </div>

                  <span className='text-text text-[12px] font-bold'>
                    Collection Value: ${formatPrice(totalRealValue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardModal
        contract_address={contract_address}
        card={selectedCard}
        getRarityColor={getRarityColor}
        formatPrice={formatPrice}
        onClose={() => setSelectedCard(null)}
        selectedCurrency={selectedCurrency}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        totalRealValue={totalRealValue}
        totalFloorValue={totalFloorValue}
        formatPrice={formatPrice}
      />
    </div>
  )
}

export default CardsPage