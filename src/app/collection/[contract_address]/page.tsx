// 'use client'

// import CardItem from '@/components/reusable/CardItem'
// import CardModal from '@/components/reusable/CardModal'
// import React, { useState, useEffect, useRef, useMemo } from 'react'
// import { useParams } from 'next/navigation'
// import { Menu, ChevronDown, ChevronUp, Search } from 'lucide-react';
// import useCommonStore from '@/utils/zustand/useCommonStore'

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

// // Skeleton Components
// const CardSkeleton = () => (
//   <div className="bg-background px-2 rounded-md overflow-hidden shadow-lg">
//     <div className="aspect-[2/3] relative overflow-hidden flex items-center justify-center bg-light animate-pulse">

//     </div>
//     <div className="p-3 space-y-2">
//       <div className="h-5 bg-light rounded w-3/4 animate-pulse"></div>
//       <div className="h-4 bg-light rounded w-1/2 animate-pulse"></div>
//       <div className="flex items-center gap-1.5">
//         <div className="w-3.5 h-3.5 bg-light rounded-full animate-pulse"></div>
//         <div className="h-3 bg-light rounded w-20 animate-pulse"></div>
//       </div>
//       <div className="h-3 bg-light rounded w-16 animate-pulse"></div>
//     </div>
//   </div>
// )

// const FilterSkeleton = () => (
//   <div className="space-y-1">
//     {[...Array(6)].map((_, i) => (
//       <div key={i} className="border-b border-[#353840] py-4">
//         <div className="h-5 w-24 bg-light rounded animate-pulse"></div>
//       </div>
//     ))}
//   </div>
// )

// // OpenSea-style Dropdown Filter Component
// interface DropdownFilterProps {
//   label: string
//   count?: number
//   isOpen: boolean
//   onToggle: () => void
//   children: React.ReactNode
// }

// const DropdownFilter: React.FC<DropdownFilterProps> = ({ label, count, isOpen, onToggle, children }) => (
//   <div className="border-b border-[#353840] ">
//     <button
//       onClick={onToggle}
//       className="w-full flex items-center justify-between py-4 px-0 hover:opacity-80 transition-opacity cursor-pointer"
//     >
//       <div className="flex items-center gap-2">
//         <span className="text-white font-semibold text-base">{label}</span>
//         {count !== undefined && count > 0 && (
//           <span className="text-xs text-white bg-[#2081E2] px-2 py-0.5 rounded-full font-medium">
//             {count}
//           </span>
//         )}
//       </div>
//       {isOpen ? (
//         <ChevronUp className="w-5 h-5 text-gray-400" />
//       ) : (
//         <ChevronDown className="w-5 h-5 text-gray-400" />
//       )}
//     </button>

//     {isOpen && (
//       <div className="pb-4">
//         {children}
//       </div>
//     )}
//   </div>
// )

// // Checkbox Option Component
// interface CheckboxOptionProps {
//   label: string
//   count: number
//   checked: boolean
//   onChange: () => void
// }

// const CheckboxOption: React.FC<CheckboxOptionProps> = ({ label, count, checked, onChange }) => (
//   <label className="flex items-center justify-between py-2 px-1 hover:bg-[#353840] rounded cursor-pointer group transition-colors">
//     <div className="flex items-center gap-3 flex-1">
//       <div className="relative flex items-center justify-center">
//         <input
//           type="checkbox"
//           checked={checked}
//           onChange={onChange}
//           className="w-4 h-4 appearance-none border-2 border-gray-500 rounded cursor-pointer
//                      checked:bg-[#2081E2] checked:border-[#2081E2] transition-all
//                      hover:border-gray-400"
//         />
//         {checked && (
//           <svg
//             className="w-3 h-3 text-white absolute pointer-events-none"
//             fill="none"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="3"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path d="M5 13l4 4L19 7"></path>
//           </svg>
//         )}
//       </div>
//       <span className="text-gray-300 text-sm group-hover:text-white capitalize">
//         {label}
//       </span>
//     </div>
//     <span className="text-gray-400 text-sm">{count}</span>
//   </label>
// )

// // Radio Option Component for single selection
// interface RadioOptionProps {
//   label: string
//   count: number
//   checked: boolean
//   onChange: () => void
// }

// const RadioOption: React.FC<RadioOptionProps> = ({ label, count, checked, onChange }) => (
//   <label className="flex items-center justify-between py-2 px-1 hover:bg-[#353840] rounded cursor-pointer group transition-colors">
//     <div className="flex items-center gap-3 flex-1">
//       <div className="relative flex items-center justify-center">
//         <input
//           type="radio"
//           checked={checked}
//           onChange={onChange}
//           className="w-4 h-4 appearance-none border-2 border-gray-500 rounded-full cursor-pointer
//                      checked:border-[#2081E2] transition-all hover:border-gray-400"
//         />
//         {checked && (
//           <div className="w-2 h-2 bg-[#2081E2] rounded-full absolute pointer-events-none"></div>
//         )}
//       </div>
//       <span className="text-gray-300 text-sm group-hover:text-white capitalize">
//         {label}
//       </span>
//     </div>
//     <span className="text-gray-400 text-sm">{count}</span>
//   </label>
// )

// // Filter footer - Remove mt-4 and add border-top for separation
// const FilterFooter = () => (
//   <div className="w-full p-4 bg-light border-t border-lines flex items-center justify-start text-text font-bold">
//     ChainedX
//   </div>
// )

// const CardsPage = () => {
//   const params = useParams()
//   const contract_address = params.contract_address as string

//   const { loggedWallet } = useCommonStore()

//   const [contractData, setContractData] = useState<Contract>()
//   const [cards, setCards] = useState<Stack[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedCard, setSelectedCard] = useState<Stack | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [searchQuery, setSearchQuery] = useState('')

//   // Sort state
//   const [sortType, setSortType] = useState('price')
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
//   const [isSortOpen, setIsSortOpen] = useState(false)

//   // Mobile filter drawer state
//   const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

//   // Dropdown open states
//   const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
//     currency: true,
//     rarity: false,
//     price: false,
//     type: false,
//   })

//   // Filter states
//   const [activeView, setActiveView] = useState<'market' | 'nfts'>('market')

//   const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set())
//   const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
//   const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' })
//   const [selectedAttributes, setSelectedAttributes] = useState<Record<string, Set<string>>>({})
//   const [selectedCurrency, setSelectedCurrency] = useState<string>('')

//   // Search states for filters
//   const [raritySearch, setRaritySearch] = useState('')
//   const [typeSearch, setTypeSearch] = useState('')
//   const [currencySearch, setCurrencySearch] = useState('')
//   const [attributeSearches, setAttributeSearches] = useState<Record<string, string>>({})

//   // Infinite scroll state
//   const [displayedCount, setDisplayedCount] = useState(50)
//   const observerRef = useRef<IntersectionObserver | null>(null)
//   const loadMoreRef = useRef<HTMLDivElement>(null)
//   const sortRef = useRef<HTMLDivElement>(null)

//   // Close sort dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
//         setIsSortOpen(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [])

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const searchParams = new URLSearchParams(window.location.search)
//       setActiveView(searchParams.get('wallet') ? 'nfts' : 'market')
//     }
//   }, [])

//   // Sort options
//   const sortOptions = [
//     { value: 'price', label: 'Price' },
//     { value: 'listing-time', label: 'Listing Time' },
//     { value: 'name', label: 'Name' },
//     { value: 'quality', label: 'Quality' },
//     { value: 'quantity', label: 'Quantity' },
//     { value: 'volume', label: 'Volume' },
//     { value: 'price-change', label: 'Price Change' },
//     { value: 'win-rate', label: 'Win %' },
//     { value: 'matches', label: 'Matches' },
//   ]

//   // Toggle dropdown
//   const toggleDropdown = (key: string) => {
//     setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }))
//   }

//   // Toggle selection helpers
//   const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
//     const newSet = new Set(set)
//     if (newSet.has(item)) {
//       newSet.delete(item)
//     } else {
//       newSet.add(item)
//     }
//     return newSet
//   }

//   const fetchCards = async () => {
//     if (!contract_address) return

//     // Clear everything first
//     setCards([])
//     setContractData(undefined)
//     setLoading(true)
//     setError(null)

//     try {
//       // Check if wallet parameter exists in URL
//       const searchParams = new URLSearchParams(window.location.search)
//       const walletAddress = searchParams.get('wallet')

//       let url: string
//       const url2 = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}`

//       if (walletAddress) {
//         // Fetch user's NFTs if wallet parameter exists
//         url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/users/${walletAddress}/nfts?contract=${contract_address}`
//         // console.log(url)
//       } else {
//         // Fetch all stacks if no wallet parameter
//         url = `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/collections/${contract_address}/all-stacks`
//         // console.log(url)
//       }

//       const response = await fetch(url)
//       const response2 = await fetch(url2)

//       if (!response.ok) {
//         // throw new Error(`HTTP error! status: ${response.status}`)
//         console.warn(`HTTP error! status: ${response.status}`)
//       }
//       if (!response2.ok) {
//         console.warn(`HTTP error! status: ${response2.status}`)
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
//       // Only add non-empty rarities
//       if (card.rarity) {
//         rarities.add(card.rarity)
//       }

//       // Only add non-empty types
//       if (card.item_type) {
//         types.add(card.item_type)
//       }

//       if (card.all_prices) {
//         Object.keys(card.all_prices).forEach(currency => {
//           if (currency) {
//             currencies.add(currency)
//           }
//         })
//       }

//       // Only include allowed attributes
//       if (card.attributes) {
//         Object.entries(card.attributes).forEach(([key, value]) => {
//           if (ALLOWED_ATTRIBUTES.includes(key) && value !== null && value !== undefined && value !== '') {
//             if (!attributes[key]) {
//               attributes[key] = new Set()
//             }
//             attributes[key].add(String(value))
//           }
//         })
//       }
//     })

//     return {
//       rarities: Array.from(rarities).filter(Boolean).sort(),
//       types: Array.from(types).filter(Boolean).sort(),
//       currencies: Array.from(currencies).filter(Boolean).sort(),
//       attributes: Object.fromEntries(
//         Object.entries(attributes).map(([key, values]) => [
//           key,
//           Array.from(values).filter(Boolean).sort()
//         ])
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
//         card.name?.toLowerCase().includes(query) ||
//         card.rarity?.toLowerCase().includes(query) ||
//         card.item_type?.toLowerCase().includes(query) ||
//         (card.attributes && Object.values(card.attributes).some(attr =>
//           String(attr).toLowerCase().includes(query)
//         ))
//       )
//     }

//     // Rarity filter (multiple)
//     if (selectedRarities.size > 0) {
//       filtered = filtered.filter(card => card.rarity && selectedRarities.has(card.rarity))
//     }

//     // Type filter (multiple)
//     if (selectedTypes.size > 0) {
//       filtered = filtered.filter(card => card.item_type && selectedTypes.has(card.item_type))
//     }

//     // Currency filter (single selection)
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

//     // Attribute filters (multiple per attribute)
//     Object.entries(selectedAttributes).forEach(([key, valueSet]) => {
//       if (valueSet.size > 0) {
//         filtered = filtered.filter(card =>
//           card.attributes && valueSet.has(String(card.attributes[key]))
//         )
//       }
//     })

//     return filtered
//   }, [cards, searchQuery, selectedRarities, selectedTypes, selectedCurrency, priceRange, selectedAttributes])

//   // Sort filtered cards
//   const sortedCards = useMemo(() => {
//     const sorted = [...filteredCards]

//     switch (sortType) {
//       case 'price':
//         sorted.sort((a, b) => {
//           const priceA = a.best_usd_price ?? Infinity
//           const priceB = b.best_usd_price ?? Infinity
//           return sortDirection === 'asc' ? priceA - priceB : priceB - priceA
//         })
//         break
//       case 'name':
//         sorted.sort((a, b) => {
//           const comparison = (a.name || '').localeCompare(b.name || '')
//           return sortDirection === 'asc' ? comparison : -comparison
//         })
//         break
//       case 'quantity':
//       case 'listing-time':
//         sorted.sort((a, b) => {
//           const qtyA = a.total_listings || 0
//           const qtyB = b.total_listings || 0
//           return sortDirection === 'asc' ? qtyA - qtyB : qtyB - qtyA
//         })
//         break
//       case 'quality':
//         const rarityOrder: Record<string, number> = {
//           'common': 1,
//           'rare': 2,
//           'epic': 3,
//           'legendary': 4,
//           'mythic': 5
//         }
//         sorted.sort((a, b) => {
//           const rarityA = rarityOrder[a.rarity?.toLowerCase()] || 0
//           const rarityB = rarityOrder[b.rarity?.toLowerCase()] || 0
//           return sortDirection === 'asc' ? rarityA - rarityB : rarityB - rarityA
//         })
//         break
//       // Add other sort types as needed
//       default:
//         // Default to price sorting
//         sorted.sort((a, b) => {
//           const priceA = a.best_usd_price ?? Infinity
//           const priceB = b.best_usd_price ?? Infinity
//           return sortDirection === 'asc' ? priceA - priceB : priceB - priceA
//         })
//     }

//     return sorted
//   }, [filteredCards, sortType, sortDirection])

//   // Reset displayed count when filters change
//   useEffect(() => {
//     setDisplayedCount(50)
//   }, [sortedCards])

//   // Cards to display (filtered + sorted + limited by displayedCount)
//   const displayedCards = useMemo(() => {
//     return sortedCards.slice(0, displayedCount)
//   }, [sortedCards, displayedCount])

//   // Intersection Observer for infinite scroll
//   useEffect(() => {
//     if (observerRef.current) observerRef.current.disconnect()

//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && !loading) {
//           if (displayedCount < sortedCards.length) {
//             setDisplayedCount(prev => Math.min(prev + 50, sortedCards.length))
//           }
//         }
//       },
//       { threshold: 0.5, rootMargin: '1000px' }
//     )

//     if (loadMoreRef.current) {
//       observerRef.current.observe(loadMoreRef.current)
//     }

//     return () => {
//       if (observerRef.current) {
//         observerRef.current.disconnect()
//       }
//     }
//   }, [loading, displayedCount, sortedCards.length])

//   // Clear all filters
//   const clearAllFilters = () => {
//     setSelectedRarities(new Set())
//     setSelectedTypes(new Set())
//     setPriceRange({ min: '', max: '' })
//     setSelectedAttributes({})
//     setSearchQuery('')
//     setSelectedCurrency('')
//     setRaritySearch('')
//     setTypeSearch('')
//     setCurrencySearch('')
//     setAttributeSearches({})
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
//     return rarityColors[rarity?.toLowerCase()] || 'text-gray-400'
//   }

//   const activeFiltersCount =
//     selectedRarities.size +
//     selectedTypes.size +
//     (selectedCurrency ? 1 : 0) +
//     Object.values(selectedAttributes).reduce((sum, set) => sum + set.size, 0) +
//     (priceRange.min || priceRange.max ? 1 : 0)

//   // Filter content component to avoid duplication
//   const FilterContent = () => (
//     <div className="space-y-0">
//       {loading ? (
//         <FilterSkeleton />
//       ) : (
//         <>
//           {/* Currency Filter - Single Selection */}
//           {filterOptions.currencies && filterOptions.currencies.length > 0 && (
//             <DropdownFilter
//               label="Currency"
//               count={selectedCurrency ? 1 : 0}
//               isOpen={openDropdowns.currency}
//               onToggle={() => toggleDropdown('currency')}
//             >
//               <div className="space-y-1">
//                 {/* Search */}
//                 <div className="relative mb-2">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search currencies"
//                     value={currencySearch}
//                     onChange={(e) => setCurrencySearch(e.target.value)}
//                     className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
//                   />
//                 </div>

//                 <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                   {/* All option */}
//                   <RadioOption
//                     label="All Currencies"
//                     count={cards.length}
//                     checked={!selectedCurrency}
//                     onChange={() => setSelectedCurrency('')}
//                   />

//                   {filterOptions.currencies
//                     .filter(currency => currency && currency.toLowerCase().includes(currencySearch.toLowerCase()))
//                     .map(currency => (
//                       <RadioOption
//                         key={currency}
//                         label={currency}
//                         count={cards.filter(c => c.all_prices && currency in c.all_prices).length}
//                         checked={selectedCurrency === currency}
//                         onChange={() => setSelectedCurrency(currency)}
//                       />
//                     ))}
//                 </div>
//               </div>
//             </DropdownFilter>
//           )}

//           {/* Rarity Filter */}
//           {filterOptions.rarities && filterOptions.rarities.length > 0 && (
//             <DropdownFilter
//               label="Rarity"
//               count={selectedRarities.size}
//               isOpen={openDropdowns.rarity}
//               onToggle={() => toggleDropdown('rarity')}
//             >
//               <div className="space-y-1">
//                 {/* Search */}
//                 <div className="relative mb-2">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search rarities"
//                     value={raritySearch}
//                     onChange={(e) => setRaritySearch(e.target.value)}
//                     className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
//                   />
//                 </div>

//                 <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                   {filterOptions.rarities
//                     .filter(rarity => rarity && rarity.toLowerCase().includes(raritySearch.toLowerCase()))
//                     .map(rarity => (
//                       <CheckboxOption
//                         key={rarity}
//                         label={rarity}
//                         count={cards.filter(c => c.rarity === rarity).length}
//                         checked={selectedRarities.has(rarity)}
//                         onChange={() => setSelectedRarities(prev => toggleSetItem(prev, rarity))}
//                       />
//                     ))}
//                 </div>
//               </div>
//             </DropdownFilter>
//           )}

//           {/* Price Filter */}
//           <DropdownFilter
//             label="Price"
//             count={priceRange.min || priceRange.max ? 1 : 0}
//             isOpen={openDropdowns.price}
//             onToggle={() => toggleDropdown('price')}
//           >
//             <div className="flex gap-2">
//               <input
//                 type="number"
//                 placeholder="Min"
//                 value={priceRange.min}
//                 onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
//                 className="w-full px-3 py-2 bg-[#202225] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//               />
//               <input
//                 type="number"
//                 placeholder="Max"
//                 value={priceRange.max}
//                 onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
//                 className="w-full px-3 py-2 bg-[#202225] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//               />
//             </div>
//           </DropdownFilter>

//           {/* Type Filter */}
//           {filterOptions.types && filterOptions.types.length > 0 && (
//             <DropdownFilter
//               label="Type"
//               count={selectedTypes.size}
//               isOpen={openDropdowns.type}
//               onToggle={() => toggleDropdown('type')}
//             >
//               <div className="space-y-1">
//                 {/* Search */}
//                 <div className="relative mb-2">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search types"
//                     value={typeSearch}
//                     onChange={(e) => setTypeSearch(e.target.value)}
//                     className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
//                   />
//                 </div>

//                 <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                   {filterOptions.types
//                     .filter(type => type && type.toLowerCase().includes(typeSearch.toLowerCase()))
//                     .map(type => (
//                       <CheckboxOption
//                         key={type}
//                         label={type}
//                         count={cards.filter(c => c.item_type === type).length}
//                         checked={selectedTypes.has(type)}
//                         onChange={() => setSelectedTypes(prev => toggleSetItem(prev, type))}
//                       />
//                     ))}
//                 </div>
//               </div>
//             </DropdownFilter>
//           )}

//           {/* Attribute Filters */}
//           {ALLOWED_ATTRIBUTES.map(attributeKey => {
//             const values = filterOptions.attributes[attributeKey]
//             if (!values || values.length === 0) return null

//             const dropdownKey = `attr_${attributeKey}`
//             const selectedSet = selectedAttributes[attributeKey] || new Set()
//             const searchValue = attributeSearches[attributeKey] || ''

//             return (
//               <DropdownFilter
//                 key={attributeKey}
//                 label={attributeKey}
//                 count={selectedSet.size}
//                 isOpen={openDropdowns[dropdownKey]}
//                 onToggle={() => toggleDropdown(dropdownKey)}
//               >
//                 <div className="space-y-1">
//                   {/* Search */}
//                   <div className="relative mb-2">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                     <input
//                       type="text"
//                       placeholder={`Search ${attributeKey.toLowerCase()}`}
//                       value={searchValue}
//                       onChange={(e) => setAttributeSearches(prev => ({ ...prev, [attributeKey]: e.target.value }))}
//                       className="w-full pl-9 pr-3 py-2 bg-[#202225] text-white text-sm rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none"
//                     />
//                   </div>

//                   <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                     {values
//                       .filter(value => value && value.toLowerCase().includes(searchValue.toLowerCase()))
//                       .map(value => (
//                         <CheckboxOption
//                           key={value}
//                           label={value}
//                           count={cards.filter(c => c.attributes && String(c.attributes[attributeKey]) === value).length}
//                           checked={selectedSet.has(value)}
//                           onChange={() => {
//                             setSelectedAttributes(prev => ({
//                               ...prev,
//                               [attributeKey]: toggleSetItem(prev[attributeKey] || new Set(), value)
//                             }))
//                           }}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               </DropdownFilter>
//             )
//           })}
//         </>
//       )}
//     </div>
//   )

//   return (
//     <div className="min-h-screen  bg-background relative">
//       {/* Hero Section */}
//       <div className="relative h-[300px] overflow-hidden flex items-center justify-center">

//         <img
//           src="/assets/bg.png"
//           className="absolute inset-0 w-full h-full object-cover scale-110"
//           alt=""
//         />

//         <div className="flex justify-between items-center z-20">
//           <div>
//             <h1 className="text-3xl font-bold text-white my-4">
//               {loading ? (
//                 "") : (
//                 contractData?.name
//               )}
//             </h1>
//           </div>
//         </div>

//         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
//         <div className="absolute inset-0 bg-black/60" />
//       </div>

//       <div className="flex ">
//         {/* Desktop Sidebar Filters */}
//         <div className="hidden lg:flex lg:flex-col w-80 bg-background border-r border-lines h-screen sticky top-16">
//           <div className="flex items-center justify-between px-5 py-[35px]  flex-shrink-0 border-b border-lines">
//             <h2 className="text-xl font-bold text-white">Filters</h2>
//             {activeFiltersCount > 0 && (
//               <button
//                 onClick={clearAllFilters}
//                 className="cursor-pointer text-sm text-[#2081E2] hover:text-[#1868B7] transition font-semibold"
//               >
//                 Clear all
//               </button>
//             )}
//           </div>
//           <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
//             <FilterContent />
//             <FilterFooter />
//           </div>
//         </div>

//         {/* Mobile Filter Drawer */}
//         {isMobileFilterOpen && (
//           <>
//             <div
//               className="fixed inset-0 bg-black/60 z-40 lg:hidden"
//               onClick={() => setIsMobileFilterOpen(false)}
//             />
//             <div className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-lines z-50 lg:hidden animate-slide-in flex flex-col">
//               <div className="flex items-center justify-between px-5 py-6 border-b border-lines flex-shrink-0">
//                 <h2 className="text-xl font-bold text-white">Filters</h2>
//                 <div className="flex items-center gap-2">
//                   {activeFiltersCount > 0 && (
//                     <button
//                       onClick={clearAllFilters}
//                       className="text-sm text-[#2081E2] hover:text-[#1868B7] transition font-semibold"
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
//               <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
//                 <FilterContent />
//               </div>
//               <div className="flex-shrink-0">
//                 <FilterFooter />
//               </div>
//             </div>
//           </>
//         )}

//         {/* Main Content */}
//         <div className="flex-1 flex">
//           <div className="w-full max-w-[1920px] pb-16">
//             {/* Header */}
//             <div className="z-10 bg-background border-lines border-b sticky top-16 px-2">

//               <div className='flex items-center justify-start py-2 gap-8 text-text text-xl font-bold'>
//                 <div
//                   className={`py-1 px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'market' ? 'bg-light' : ''
//                     }`}
//                   onClick={() => {
//                     const url = new URL(window.location.href);
//                     url.searchParams.delete('wallet');
//                     window.history.pushState({}, '', url.toString());
//                     setActiveView('market');
//                     fetchCards();
//                   }}
//                 >
//                   Market
//                 </div>

//                 {/* ✅ Only show My NFTs tab if wallet is connected */}
//                 {loggedWallet && (
//                   <div
//                     className={`py-1 px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'nfts' ? 'bg-light' : ''
//                       }`}
//                     onClick={() => {
//                       const url = new URL(window.location.href);
//                       url.searchParams.set('wallet', loggedWallet);
//                       window.history.pushState({}, '', url.toString());
//                       setActiveView('nfts');
//                       fetchCards();
//                     }}
//                   >
//                     My NFTs
//                   </div>
//                 )}
//               </div>

//               <div>
//                 {/* Search and Sort */}
//                 <div className="mb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">


//                   <div className='flex w-full gap-4'>
//                     {/* Mobile Filter Button */}
//                     <button
//                       onClick={() => setIsMobileFilterOpen(true)}
//                       className="lg:hidden sm:w-auto px-4 cursor-pointer flex items-center justify-center gap-2 bg-background border border-lines rounded-md hover:bg-[#36393f] transition"
//                     >
//                       <Menu className="w-4 h-4" />
//                     </button>
//                     {/* Search Input */}
//                     <input
//                       type="text"
//                       placeholder="Search..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="w-full  px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-sm"
//                     />

//                     {/* Sort Section */}
//                     <div className="flex items-center gap-2  sm:w-auto">
//                       {/* Sort Type Dropdown */}
//                       <div ref={sortRef} className="relative flex-1 sm:flex-initial">
//                         <button
//                           onClick={() => setIsSortOpen(!isSortOpen)}
//                           className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] hover:bg-[#3d4147] transition whitespace-nowrap text-sm sm:min-w-[140px] justify-between"
//                         >
//                           <div className="flex items-center gap-2">
//                             <span className="font-medium">
//                               {sortOptions.find(opt => opt.value === sortType)?.label || 'Price'}
//                             </span>
//                           </div>
//                           <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
//                         </button>

//                         {isSortOpen && (
//                           <div className="absolute right-0 mt-2 w-48 bg-[#36393f] border border-[#3d4147] rounded-lg shadow-xl z-50 overflow-hidden">
//                             {sortOptions.map((option) => (
//                               <button
//                                 key={option.value}
//                                 onClick={() => {
//                                   setSortType(option.value)
//                                   setIsSortOpen(false)
//                                 }}
//                                 className={`cursor-pointer w-full text-left px-4 py-3 hover:bg-[#3d4147] transition text-sm ${sortType === option.value ? 'bg-[#2081E2] text-white' : 'text-gray-300'
//                                   }`}
//                               >
//                                 {option.label}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>

//                       {/* Direction Toggle Button */}
//                       <button
//                         onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
//                         className="h-full cursor-pointer flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] hover:bg-[#3d4147] transition text-sm flex-shrink-0"
//                         title={sortDirection === 'asc' ? 'Low to High' : 'High to Low'}
//                       >
//                         {sortDirection === 'asc' ? (
//                           <ChevronDown className="w-4 h-4" />
//                         ) : (
//                           <ChevronUp className="w-4 h-4" />
//                         )}
//                       </button>
//                     </div>
//                   </div>
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

//             {/* Loading skeleton grid */}
//             {loading && (
//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
//                 {[...Array(30)].map((_, i) => (
//                   <CardSkeleton key={i} />
//                 ))}
//               </div>
//             )}

//             {/* Cards grid */}
//             {!loading && displayedCards.length > 0 && (
//               <>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 px-2">
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
//                 {displayedCount < sortedCards.length && (
//                   <div
//                     ref={loadMoreRef}
//                     className="flex justify-center items-center py-8"
//                   >
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
//                     <span className="ml-3 text-gray-400">Loading more cards...</span>
//                   </div>
//                 )}

//                 {/* End of results */}
//                 {displayedCount >= sortedCards.length && sortedCards.length > 50 && (
//                   <div className="text-center py-8">
//                     <p className="text-gray-400">All cards loaded</p>
//                   </div>
//                 )}
//               </>
//             )}

//             {/* No results state */}
//             {!loading && sortedCards.length === 0 && cards.length > 0 && (
//               <div className="text-center py-20">
//                 <p className="text-gray-400 text-xl mb-4">
//                   No cards found matching your filters
//                 </p>
//                 <button
//                   onClick={clearAllFilters}
//                   className="px-6 py-2 bg-[#2081E2] hover:text-[#1868B7] text-white rounded-lg transition-colors"
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
//         contract_address={contract_address}
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

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import useCommonStore from '@/utils/zustand/useCommonStore'

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

  // Custom hooks
  const {
    contractData,
    cards,
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
    fetchCards()
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
        />

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="w-full max-w-[1920px] pb-16">
            <div className="z-10 bg-background border-lines border-b sticky top-16 px-2">
              <ViewTabs
                activeView={activeView}
                onViewChange={handleViewChange}
                loggedWallet={loggedWallet}
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
            />
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
    </div>
  )
}

export default CardsPage