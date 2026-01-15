// 'use client'

// import CardItem from '@/components/reusable/CardItem'
// import CardModal from '@/components/reusable/CardModal'
// import React, { useState, useEffect, useRef, useMemo } from 'react'
// import { useParams } from 'next/navigation'
// import { Menu } from 'lucide-react';


// interface CardAttributes {
//   [key: string]: string | number
// }

// interface PriceInfo {
//   listing_id: string
//   price: number
//   usd: number
// }

// interface AllPrices {
//   [currency: string]: PriceInfo
// }

// interface Stack {
//   metadata_id: string
//   name: string
//   description: string | null
//   image: string
//   attributes: CardAttributes
//   rarity: string
//   item_type: string
//   total_listings: number
//   all_prices: AllPrices
//   best_usd_price: number | null
//   best_currency: string | null
//   last_sold_price: number | null
// }

// interface Contract {
//   cards_with_listings: number | null
//   contract_address: string | null
//   description: string | null
//   floor_currency: string | null
//   floor_price: number | null
//   image: string | null,
//   name: string | null
//   symbol: string | null
//   total_listings: number | null
// }

// interface ApiResponse {
//   stacks: Stack[]
//   total: number
//   cached: boolean
// }

// const CardsPage = () => {
//   const params = useParams()
//   const contract_address = params.contract_address as string

//   const [contractData, setContractData] = useState<Contract>()

//   const [cards, setCards] = useState<Stack[]>([])
//   const [loading, setLoading] = useState(false)
//   const [selectedCard, setSelectedCard] = useState<Stack | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [searchQuery, setSearchQuery] = useState('')

//   // Mobile filter drawer state
//   const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

//   // Filter states - All single selections
//   const [selectedRarity, setSelectedRarity] = useState<string>('')
//   const [selectedType, setSelectedType] = useState<string>('')
//   const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' })
//   const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
//   const [selectedCurrency, setSelectedCurrency] = useState<string>('')

//   // Infinite scroll state
//   const [displayedCount, setDisplayedCount] = useState(50)
//   const observerRef = useRef<IntersectionObserver | null>(null)
//   const loadMoreRef = useRef<HTMLDivElement>(null)

//   // Fetch all stacks from your API
//   const fetchCards = async () => {
//     if (!contract_address) return

//     setLoading(true)
//     setError(null)
//     try {
//       const url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}/all-stacks`
//       const url2 = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}`

//       const response = await fetch(url)
//       const response2 = await fetch(url2)

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//       }
//       if (!response2.ok) {
//         throw new Error(`HTTP error! status: ${response2.status}`)
//       }

//       const data: ApiResponse = await response.json()
//       const data2 = await response2.json()

//       setCards(data.stacks || [])
//       setContractData(data2)

//       if (data.cached) {
//         console.log('Data served from cache')
//       } else {
//         console.log('Fresh data from database')
//       }
//     } catch (error) {
//       console.error('Error fetching cards:', error)
//       setError(error instanceof Error ? error.message : 'Failed to fetch cards')
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Initial fetch
//   useEffect(() => {
//     if (contract_address) {
//       fetchCards()
//     }
//   }, [contract_address])

//   // Specific attributes to show as filters
//   const ALLOWED_ATTRIBUTES = ['Attack', 'God', 'Health', 'Mana', 'Quality', 'Set', 'Tribe']

//   // Get unique values for filters
//   const filterOptions = useMemo(() => {
//     const rarities = new Set<string>()
//     const types = new Set<string>()
//     const currencies = new Set<string>()
//     const attributes: Record<string, Set<string>> = {}

//     cards.forEach(card => {
//       rarities.add(card.rarity)
//       types.add(card.item_type)

//       if (card.all_prices) {
//         Object.keys(card.all_prices).forEach(currency => {
//           currencies.add(currency)
//         })
//       }

//       // Only include allowed attributes
//       Object.entries(card.attributes).forEach(([key, value]) => {
//         if (ALLOWED_ATTRIBUTES.includes(key)) {
//           if (!attributes[key]) {
//             attributes[key] = new Set()
//           }
//           attributes[key].add(String(value))
//         }
//       })
//     })

//     return {
//       rarities: Array.from(rarities).sort(),
//       types: Array.from(types).sort(),
//       currencies: Array.from(currencies).sort(),
//       attributes: Object.fromEntries(
//         Object.entries(attributes).map(([key, values]) => [key, Array.from(values).sort()])
//       )
//     }
//   }, [cards])

//   // Filter cards based on all filters
//   const filteredCards = useMemo(() => {
//     let filtered = cards

//     // Search query filter
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase()
//       filtered = filtered.filter(card =>
//         card.name.toLowerCase().includes(query) ||
//         card.rarity.toLowerCase().includes(query) ||
//         card.item_type.toLowerCase().includes(query) ||
//         Object.values(card.attributes).some(attr =>
//           String(attr).toLowerCase().includes(query)
//         )
//       )
//     }

//     // Rarity filter
//     if (selectedRarity) {
//       filtered = filtered.filter(card => card.rarity === selectedRarity)
//     }

//     // Type filter
//     if (selectedType) {
//       filtered = filtered.filter(card => card.item_type === selectedType)
//     }

//     // Currency filter
//     if (selectedCurrency) {
//       filtered = filtered.filter(card => {
//         if (!card.all_prices) return false
//         return selectedCurrency in card.all_prices
//       })
//     }

//     // Price range filter
//     if (priceRange.min || priceRange.max) {
//       filtered = filtered.filter(card => {
//         const price = card.best_usd_price
//         if (price === null) return false

//         const min = priceRange.min ? parseFloat(priceRange.min) : 0
//         const max = priceRange.max ? parseFloat(priceRange.max) : Infinity

//         return price >= min && price <= max
//       })
//     }

//     // Attribute filters
//     Object.entries(selectedAttributes).forEach(([key, value]) => {
//       if (value) {
//         filtered = filtered.filter(card =>
//           String(card.attributes[key]) === value
//         )
//       }
//     })

//     return filtered
//   }, [cards, searchQuery, selectedRarity, selectedType, selectedCurrency, priceRange, selectedAttributes])

//   // Reset displayed count when filters change
//   useEffect(() => {
//     setDisplayedCount(50)
//   }, [filteredCards])

//   // Cards to display (filtered + limited by displayedCount)
//   const displayedCards = useMemo(() => {
//     return filteredCards.slice(0, displayedCount)
//   }, [filteredCards, displayedCount])

//   // Intersection Observer for infinite scroll
//   useEffect(() => {
//     if (observerRef.current) observerRef.current.disconnect()

//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && !loading) {
//           if (displayedCount < filteredCards.length) {
//             setDisplayedCount(prev => Math.min(prev + 50, filteredCards.length))
//           }
//         }
//       },
//       {
//         threshold: 0.5, rootMargin: '1000px'
//       }
//     )

//     if (loadMoreRef.current) {
//       observerRef.current.observe(loadMoreRef.current)
//     }

//     return () => {
//       if (observerRef.current) {
//         observerRef.current.disconnect()
//       }
//     }
//   }, [loading, displayedCount, filteredCards.length])

//   // Clear all filters
//   const clearAllFilters = () => {
//     setSelectedRarity('')
//     setSelectedType('')
//     setPriceRange({ min: '', max: '' })
//     setSelectedAttributes({})
//     setSearchQuery('')
//     setSelectedCurrency('')
//   }

//   // Format price for display
//   const formatPrice = (price: number | null): string => {
//     if (price === null || price === undefined) return 'N/A'
//     if (price < 0.01) return price.toFixed(6)
//     if (price < 1) return price.toFixed(4)
//     return price.toFixed(2)
//   }

//   // Get rarity color
//   const getRarityColor = (rarity: string): string => {
//     const rarityColors: { [key: string]: string } = {
//       common: 'text-gray-400',
//       rare: 'text-blue-400',
//       epic: 'text-purple-400',
//       legendary: 'text-orange-400',
//       mythic: 'text-red-400'
//     }
//     return rarityColors[rarity.toLowerCase()] || 'text-gray-400'
//   }

//   const activeFiltersCount = (selectedRarity ? 1 : 0) + (selectedType ? 1 : 0) + (selectedCurrency ? 1 : 0) +
//     Object.values(selectedAttributes).filter(v => v).length +
//     (priceRange.min || priceRange.max ? 1 : 0)

//   // Filter content component to avoid duplication
//   const FilterContent = () => (
//     <div className="space-y-4 mb-16">
//       {/* Currency Filter */}
//       {filterOptions.currencies.length > 0 && (
//         <div>
//           <label className="block text-white font-semibold mb-2 text-sm">Currency</label>
//           <select
//             value={selectedCurrency}
//             onChange={(e) => setSelectedCurrency(e.target.value)}
//             className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//           >
//             <option value="">All Currencies</option>
//             {filterOptions.currencies.map(currency => (
//               <option key={currency} value={currency}>
//                 {currency} ({cards.filter(c => c.all_prices && currency in c.all_prices).length})
//               </option>
//             ))}
//           </select>
//         </div>
//       )}

//       {/* Rarity Filter */}
//       <div>
//         <label className="block text-white font-semibold mb-2 text-sm">Rarity</label>
//         <select
//           value={selectedRarity}
//           onChange={(e) => setSelectedRarity(e.target.value)}
//           className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm capitalize"
//         >
//           <option value="">All Rarities</option>
//           {filterOptions.rarities.map(rarity => (
//             <option key={rarity} value={rarity} className="capitalize">
//               {rarity} ({cards.filter(c => c.rarity === rarity).length})
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Price Filter */}
//       <div>
//         <label className="block text-white font-semibold mb-2 text-sm">Price</label>
//         <div className="flex gap-2">
//           <input
//             type="number"
//             placeholder="Min"
//             value={priceRange.min}
//             onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
//             className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//           />
//           <input
//             type="number"
//             placeholder="Max"
//             value={priceRange.max}
//             onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
//             className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//           />
//         </div>
//       </div>

//       {/* Type Filter */}
//       {filterOptions.types.length > 0 && (
//         <div>
//           <label className="block text-white font-semibold mb-2 text-sm">Type</label>
//           <select
//             value={selectedType}
//             onChange={(e) => setSelectedType(e.target.value)}
//             className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//           >
//             <option value="">All Types</option>
//             {filterOptions.types.map(type => (
//               <option key={type} value={type}>
//                 {type} ({cards.filter(c => c.item_type === type).length})
//               </option>
//             ))}
//           </select>
//         </div>
//       )}

//       {/* Attribute Filters */}
//       {ALLOWED_ATTRIBUTES.map(attributeKey => {
//         const values = filterOptions.attributes[attributeKey]
//         if (!values || values.length === 0) return null

//         return (
//           <div key={attributeKey}>
//             <label className="block text-white font-semibold mb-2 text-sm">{attributeKey}</label>
//             <select
//               value={selectedAttributes[attributeKey] || ''}
//               onChange={(e) => setSelectedAttributes(prev => ({
//                 ...prev,
//                 [attributeKey]: e.target.value
//               }))}
//               className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//             >
//               <option value="">All {attributeKey}</option>
//               {values.map(value => (
//                 <option key={value} value={value}>
//                   {value} ({cards.filter(c => String(c.attributes[attributeKey]) === value).length})
//                 </option>
//               ))}
//             </select>
//           </div>
//         )
//       })}
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-background relative">

//       {/* Hero Section */}
//       <div className="relative h-[500px] overflow-hidden">
//         <img
//           src="/assets/bg.png"
//           className="absolute inset-0 w-full h-full object-cover scale-110"
//           alt=""
//         />
//         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
//         <div className="absolute inset-0 bg-black/60" />
//       </div>

//       <div className="flex ">
//         {/* Desktop Sidebar Filters */}
//         <div className="hidden lg:block w-70 bg-background border-r border-lines p-4 overflow-y-auto h-screen sticky top-16">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-bold text-white">Filters</h2>
//             {activeFiltersCount > 0 && (
//               <button
//                 onClick={clearAllFilters}
//                 className="text-sm text-[#2081E2] hover:text-[#1868B7] transition"
//               >
//                 Clear all
//               </button>
//             )}
//           </div>

//           <FilterContent />
//         </div>

//         {/* Mobile Filter Drawer */}
//         {isMobileFilterOpen && (
//           <>
//             <div
//               className="fixed inset-0 bg-black/60 z-40 lg:hidden"
//               onClick={() => setIsMobileFilterOpen(false)}
//             />

//             <div className="fixed left-0 top-0 bottom-0 w-70 bg-background border-r border-lines p-4 overflow-y-auto z-50 lg:hidden animate-slide-in">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold text-white">Filters</h2>
//                 <div className="flex items-center gap-2">
//                   {activeFiltersCount > 0 && (
//                     <button
//                       onClick={clearAllFilters}
//                       className="text-sm text-[#2081E2] hover:text-[#1868B7] transition"
//                     >
//                       Clear all
//                     </button>
//                   )}
//                   <button
//                     onClick={() => setIsMobileFilterOpen(false)}
//                     className="text-gray-400 hover:text-white transition cursor-pointer"
//                   >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>

//               <FilterContent />
//             </div>
//           </>
//         )}

//         {/* Main Content */}
//         <div className="flex-1 px-8 flex">
//           <div className="w-full max-w-[1920px] pb-16 mx-auto">
//             {/* Header */}
//             <div className="z-10 bg-background  border-lines border-b sticky top-16">
//               <div className="flex justify-between items-center mb-4">
//                 <div>
//                   <h1 className="text-3xl font-bold text-white my-4">
//                     {contractData?.name}
//                   </h1>
//                   <p className="text-gray-400">
//                     {displayedCards.length} of {filteredCards.length} items
//                     {searchQuery && ` (filtered from ${cards.length} total)`}
//                   </p>
//                 </div>
//               </div>
//               <div>
//                 {/* Search */}
//                 <div className="mb-6 flex items-center justify-center relative gap-4">
//                   <button
//                     onClick={() => setIsMobileFilterOpen(true)}
//                     className="lg:hidden h-full w-[50px] py-2 cursor-pointer flex items-center justify-center bg-background border border-lines rounded-md hover:bg-[#36393f] transition"
//                   >
//                     <Menu />
//                   </button>

//                   <input
//                     type="text"
//                     placeholder="Search..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Error message */}
//             {error && (
//               <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
//                 <p className="font-semibold">Error loading cards:</p>
//                 <p>{error}</p>
//               </div>
//             )}

//             {/* Loading indicator */}
//             {loading && cards.length === 0 && (
//               <div className="flex flex-col justify-center items-center py-20">
//                 <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
//                 <p className="text-gray-400 text-lg">Loading cards...</p>
//               </div>
//             )}

//             {/* Cards grid */}
//             {!loading && displayedCards.length > 0 && (
//               <>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
//                   {displayedCards.map((card) => (
//                     <CardItem
//                       key={card.metadata_id}
//                       card={card}
//                       getRarityColor={getRarityColor}
//                       formatPrice={formatPrice}
//                       onClick={() => setSelectedCard(card)}
//                       selectedCurrency={selectedCurrency}
//                     />
//                   ))}
//                 </div>

//                 {/* Load more trigger */}
//                 {displayedCount < filteredCards.length && (
//                   <div
//                     ref={loadMoreRef}
//                     className="flex justify-center items-center py-8"
//                   >
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
//                     <span className="ml-3 text-gray-400">Loading more cards...</span>
//                   </div>
//                 )}

//                 {/* End of results */}
//                 {displayedCount >= filteredCards.length && filteredCards.length > 50 && (
//                   <div className="text-center py-8">
//                     <p className="text-gray-400">All cards loaded</p>
//                   </div>
//                 )}
//               </>
//             )}

//             {/* No results state */}
//             {!loading && filteredCards.length === 0 && (
//               <div className="text-center py-20">
//                 <p className="text-gray-400 text-xl mb-4">
//                   No cards found matching your filters
//                 </p>
//                 <button
//                   onClick={clearAllFilters}
//                   className="px-6 py-2 bg-[#2081E2] hover:bg-[#1868B7] text-white rounded-lg transition-colors"
//                 >
//                   Clear All Filters
//                 </button>
//               </div>
//             )}

//             {/* Empty state */}
//             {!loading && cards.length === 0 && !error && (
//               <div className="text-center py-20">
//                 <p className="text-gray-400 text-xl">No cards found</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <CardModal
//         card={selectedCard}
//         getRarityColor={getRarityColor}
//         formatPrice={formatPrice}
//         onClose={() => setSelectedCard(null)}
//         selectedCurrency={selectedCurrency}
//       />
//     </div>
//   )
// }

// export default CardsPage



'use client'

import CardItem from '@/components/reusable/CardItem'
import CardModal from '@/components/reusable/CardModal'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Menu } from 'lucide-react';

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

interface Contract {
  cards_with_listings: number | null
  contract_address: string | null
  description: string | null
  floor_currency: string | null
  floor_price: number | null
  image: string | null,
  name: string | null
  symbol: string | null
  total_listings: number | null
}

interface ApiResponse {
  stacks: Stack[]
  total: number
  cached: boolean
}

// Skeleton Components
const CardSkeleton = () => (
  <div className="bg-background border-lines border-1 rounded-md overflow-hidden shadow-lg">
    {/* Image Skeleton */}
    <div className="aspect-[2/3] relative overflow-hidden flex items-center justify-center bg-gray-800 animate-pulse">
      <div className="w-[90%] h-[90%] bg-gray-700 rounded"></div>
      {/* Rarity Badge Skeleton */}
      <div className="absolute top-2 right-2 w-16 h-5 bg-gray-700 rounded animate-pulse"></div>
    </div>

    {/* Info Skeleton */}
    <div className="p-3 space-y-2">
      {/* Title */}
      <div className="h-5 bg-gray-700 rounded w-3/4 animate-pulse"></div>

      {/* Price */}
      <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>

      {/* Currency */}
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 bg-gray-700 rounded-full animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
      </div>

      {/* Listings */}
      <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
    </div>
  </div>
)

const FilterSkeleton = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i}>
        <div className="h-4 w-20 bg-gray-700 rounded mb-2 animate-pulse"></div>
        <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
      </div>
    ))}
  </div>
)

const CardsPage = () => {
  const params = useParams()
  const contract_address = params.contract_address as string

  const [contractData, setContractData] = useState<Contract>()
  const [cards, setCards] = useState<Stack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<Stack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Filter states - All single selections
  const [selectedRarity, setSelectedRarity] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' })
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(50)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch all stacks from your API
  const fetchCards = async () => {
    if (!contract_address) return

    setLoading(true)
    setError(null)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}/all-stacks`
      const url2 = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}`

      const response = await fetch(url)
      const response2 = await fetch(url2)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response2.status}`)
      }

      const data: ApiResponse = await response.json()
      const data2 = await response2.json()

      setCards(data.stacks || [])
      setContractData(data2)

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

  // Specific attributes to show as filters
  const ALLOWED_ATTRIBUTES = ['Attack', 'God', 'Health', 'Mana', 'Quality', 'Set', 'Tribe']

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const rarities = new Set<string>()
    const types = new Set<string>()
    const currencies = new Set<string>()
    const attributes: Record<string, Set<string>> = {}

    cards.forEach(card => {
      rarities.add(card.rarity)
      types.add(card.item_type)

      if (card.all_prices) {
        Object.keys(card.all_prices).forEach(currency => {
          currencies.add(currency)
        })
      }

      // Only include allowed attributes
      Object.entries(card.attributes).forEach(([key, value]) => {
        if (ALLOWED_ATTRIBUTES.includes(key)) {
          if (!attributes[key]) {
            attributes[key] = new Set()
          }
          attributes[key].add(String(value))
        }
      })
    })

    return {
      rarities: Array.from(rarities).sort(),
      types: Array.from(types).sort(),
      currencies: Array.from(currencies).sort(),
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
    if (selectedRarity) {
      filtered = filtered.filter(card => card.rarity === selectedRarity)
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(card => card.item_type === selectedType)
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

    // Attribute filters
    Object.entries(selectedAttributes).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(card =>
          String(card.attributes[key]) === value
        )
      }
    })

    return filtered
  }, [cards, searchQuery, selectedRarity, selectedType, selectedCurrency, priceRange, selectedAttributes])

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
      { threshold: 0.5, rootMargin: '1000px' }
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

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRarity('')
    setSelectedType('')
    setPriceRange({ min: '', max: '' })
    setSelectedAttributes({})
    setSearchQuery('')
    setSelectedCurrency('')
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

  const activeFiltersCount =
    (selectedRarity ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedCurrency ? 1 : 0) +
    Object.values(selectedAttributes).filter(v => v).length +
    (priceRange.min || priceRange.max ? 1 : 0)

  // Filter content component to avoid duplication
  const FilterContent = () => (
    <div className="space-y-4 mb-16">
      {loading ? (
        <FilterSkeleton />
      ) : (
        <>
          {/* Currency Filter */}
          {filterOptions.currencies.length > 0 && (
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
              >
                <option value="">All Currencies</option>
                {filterOptions.currencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency} ({cards.filter(c => c.all_prices && currency in c.all_prices).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rarity Filter */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Rarity</label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm capitalize"
            >
              <option value="">All Rarities</option>
              {filterOptions.rarities.map(rarity => (
                <option key={rarity} value={rarity} className="capitalize">
                  {rarity} ({cards.filter(c => c.rarity === rarity).length})
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Price</label>
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
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
              >
                <option value="">All Types</option>
                {filterOptions.types.map(type => (
                  <option key={type} value={type}>
                    {type} ({cards.filter(c => c.item_type === type).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Attribute Filters */}
          {ALLOWED_ATTRIBUTES.map(attributeKey => {
            const values = filterOptions.attributes[attributeKey]
            if (!values || values.length === 0) return null

            return (
              <div key={attributeKey}>
                <label className="block text-white font-semibold mb-2 text-sm">{attributeKey}</label>
                <select
                  value={selectedAttributes[attributeKey] || ''}
                  onChange={(e) => setSelectedAttributes(prev => ({
                    ...prev,
                    [attributeKey]: e.target.value
                  }))}
                  className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                >
                  <option value="">All {attributeKey}</option>
                  {values.map(value => (
                    <option key={value} value={value}>
                      {value} ({cards.filter(c => String(c.attributes[attributeKey]) === value).length})
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <img
          src="/assets/bg.png"
          className="absolute inset-0 w-full h-full object-cover scale-110"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="flex ">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block w-70 bg-background border-r border-lines p-4 overflow-y-auto h-screen sticky top-16">
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
          <FilterContent />
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-70 bg-background border-r border-lines p-4 overflow-y-auto z-50 lg:hidden animate-slide-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-[#2081E2] hover:text-[#1868B7] transition"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <FilterContent />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 px-8 flex">
          <div className="w-full max-w-[1920px] pb-16 mx-auto">
            {/* Header */}
            <div className="z-10 bg-background border-lines border-b sticky top-16">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white my-4">
                    {loading ? (
                      <div className="h-9 w-64 bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      contractData?.name
                    )}
                  </h1>
                  {loading ? (
                    <div className="h-5 w-48 bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-gray-400">
                      {displayedCards.length} of {filteredCards.length} items
                      {searchQuery && ` (filtered from ${cards.length} total)`}
                    </p>
                  )}
                </div>
              </div>

              <div>
                {/* Search */}
                <div className="mb-6 flex items-center justify-center relative gap-4">
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden h-full w-[50px] py-2 cursor-pointer flex items-center justify-center bg-background border border-lines rounded-md hover:bg-[#36393f] transition"
                  >
                    <Menu />
                  </button>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
                  />
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

            {/* Loading skeleton grid */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {[...Array(30)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
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
                      selectedCurrency={selectedCurrency}
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
            {!loading && filteredCards.length === 0 && cards.length > 0 && (
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
        selectedCurrency={selectedCurrency}
      />
    </div>
  )
}

export default CardsPage