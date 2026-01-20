'use client'
import { useEffect, useState } from 'react'
import useCommonStore from '@/utils/zustand/useCommonStore'

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
    quantity?: number
}

interface FeeBreakdown {
    amount: number
    amount_usd: number
    recipient: string
    type: string
}

interface ListingPrices {
    base_price: number
    base_price_usd: number
    fees: number
    fees_usd: number
    total_usd: number
    total_with_fees: number
}

interface Listing {
    created_at: string
    currency: string
    end_at: string
    fee_breakdown: FeeBreakdown[]
    listing_id: string
    order_hash: string
    prices: ListingPrices
    seller_address: string
    start_at: string
    status: string
    token_address: string
    token_id: string
}

interface ListingsResponse {
    all_listings: Listing[]
    by_currency: {
        ETH: Listing[]
        GODS: Listing[]
        IMX: Listing[]
        USDC: Listing[]
        OTHER: Listing[]
    }
    cheapest_listing: Listing
    contract_address: string
    metadata_id: string
    total_listings: number
}

type Props = {
    card: Stack | null
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    onClose: () => void
    selectedCurrency: string
    contract_address: string
}

const CardModal = ({
    card,
    getRarityColor,
    formatPrice,
    onClose,
    selectedCurrency,
    contract_address,
}: Props) => {
    const { loggedWallet } = useCommonStore()

    const [newWallet, setWallet] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState<'details' | 'buy' | 'sell' | 'owned' | 'activity'>('details')
    const [quantity, setQuantity] = useState(1)
    const [listingsData, setListingsData] = useState<ListingsResponse | null>(null)
    const [isLoadingListings, setIsLoadingListings] = useState(false)
    const [currencyFilter, setCurrencyFilter] = useState<string>('All')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set())

    // Check if current user has listings for this card
    const userHasListings = () => {
        if (!listingsData || !newWallet) return false
        return listingsData.all_listings.some(
            listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
        )
    }

    // Get user's listings
    const getUserListings = (): Listing[] => {
        if (!listingsData || !newWallet) return []
        return listingsData.all_listings.filter(
            listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
        )
    }

    // Get currency icon path
    const getCurrencyIcon = (currency: string): string => {
        const currencyLower = currency.toLowerCase()
        return `/assets/currency/${currencyLower}.png`
    }

    // Toggle individual token selection
    const toggleTokenSelection = (index: number) => {
        setSelectedTokens(prev => {
            const newSet = new Set(prev)
            if (newSet.has(index)) {
                newSet.delete(index)
            } else {
                newSet.add(index)
            }
            return newSet
        })
    }

    // Select all tokens
    const selectAllTokens = () => {
        const youOwn = card?.quantity ?? 0
        setSelectedTokens(new Set(Array.from({ length: youOwn }, (_, i) => i)))
    }

    // Select all non-listed tokens
    const selectAllNonListed = () => {
        const youOwn = card?.quantity ?? 0
        const userListings = getUserListings()
        const newSelection = new Set<number>()

        for (let i = 0; i < youOwn; i++) {
            const listingForToken = userListings[i] || null
            if (!listingForToken) {
                newSelection.add(i)
            }
        }

        setSelectedTokens(newSelection)
    }

    // Deselect all tokens
    const deselectAllTokens = () => {
        setSelectedTokens(new Set())
    }

    // Check if token is listed
    const isTokenListed = (index: number): boolean => {
        const userListings = getUserListings()
        return !!userListings[index]
    }

    // Fetch listings when card changes
    useEffect(() => {
        const fetchListings = async () => {
            const searchParams = new URLSearchParams(window.location.search)
            const walletAddress = searchParams.get('wallet')
            setWallet(walletAddress)

            if (!card?.metadata_id || !contract_address) return

            setIsLoading(true)
            setIsLoadingListings(true)
            try {
                const response = await fetch(
                    `https://immutable-marketplace.onrender.com/api/collections/${contract_address}/listings/${card.metadata_id}`
                )
                if (response.ok) {
                    const data = await response.json()
                    setListingsData(data)
                }
            } catch (err) {
                console.error('Failed to fetch listings:', err)
            } finally {
                setIsLoadingListings(false)
                setIsLoading(false)
            }
        }

        fetchListings()
    }, [card?.metadata_id, contract_address])

    // Reset selected tokens when switching tabs
    useEffect(() => {
        if (activeTab !== 'owned') {
            setSelectedTokens(new Set())
        }
    }, [activeTab])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (card) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [card])

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (card) {
            window.addEventListener('keydown', handleEscape)
        }
        return () => window.removeEventListener('keydown', handleEscape)
    }, [card, onClose])

    if (!card) return null

    // Get price to display based on selectedCurrency
    const getPriceToDisplay = () => {
        if (!card.all_prices || Object.keys(card.all_prices).length === 0) {
            return null
        }

        if (selectedCurrency && card.all_prices[selectedCurrency]) {
            return {
                currency: selectedCurrency,
                priceInfo: card.all_prices[selectedCurrency]
            }
        }

        if (card.best_currency && card.all_prices[card.best_currency]) {
            return {
                currency: card.best_currency,
                priceInfo: card.all_prices[card.best_currency]
            }
        }

        return null
    }

    // Get filtered listings based on currency filter
    const getFilteredListings = (): Listing[] => {
        if (!listingsData) return []

        if (currencyFilter === 'All') {
            return listingsData.all_listings
        }

        return listingsData.by_currency[currencyFilter as keyof typeof listingsData.by_currency] || []
    }

    // Calculate time until expiration
    const getTimeUntilExpiration = (endAt: string): string => {
        const now = new Date()
        const end = new Date(endAt)
        const diffMs = end.getTime() - now.getTime()

        if (diffMs <= 0) return 'Expired'

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const months = Math.floor(days / 30)
        const years = Math.floor(days / 365)

        if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
        if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`

        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`

        const minutes = Math.floor(diffMs / (1000 * 60))
        return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }

    const displayPrice = getPriceToDisplay()
    const filteredListings = getFilteredListings()
    const youOwn = card.quantity ?? 0
    const hasUserListings = userHasListings()
    const userListings = getUserListings()

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-none sm:rounded-lg w-full h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-[1600px] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-background border-lines border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate pr-4">{card.name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-light rounded transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        // Skeleton Loader
                        <div className="flex flex-col lg:flex-row w-full">
                            {/* Left: Card Image Skeleton */}
                            <div className="w-full lg:w-[40%] bg-background border-b lg:border-b-0 lg:border-r border-lines p-4 sm:p-6">
                                <div className="w-full max-w-md mx-auto lg:max-w-none aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
                            </div>

                            {/* Right: Trading Interface Skeleton */}
                            <div className="flex-1 bg-background p-4 sm:p-6">
                                {/* Price Info Skeleton */}
                                <div className="mb-6">
                                    <div className="h-4 w-20 bg-light rounded mb-2 animate-pulse"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-light rounded-full animate-pulse"></div>
                                        <div className="flex flex-col gap-2">
                                            <div className="h-8 w-32 bg-light rounded animate-pulse"></div>
                                            <div className="h-3 w-24 bg-light rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Skeleton */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <div className="flex-1 h-12 bg-light rounded animate-pulse"></div>
                                    <div className="flex-1 h-12 bg-light rounded animate-pulse"></div>
                                </div>

                                {/* Tabs Skeleton */}
                                <div className="border-b border-lines mb-4">
                                    <div className="flex gap-6">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="pb-3">
                                                <div className="h-4 w-16 bg-light rounded animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tab Content Skeleton */}
                                <div className="space-y-4">
                                    <div className="h-6 w-24 bg-light rounded animate-pulse"></div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="bg-light border border-lines rounded-lg p-3">
                                                <div className="h-3 w-16 bg-light rounded mb-2 animate-pulse"></div>
                                                <div className="h-4 w-20 bg-light rounded animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row w-full">
                            {/* Left: Card Image */}
                            <div className="w-full lg:w-[40%] bg-background border-b lg:border-b-0 lg:border-r border-lines p-4 sm:p-6">
                                <img
                                    src={card.image}
                                    alt={card.name}
                                    className="w-full max-w-md mx-auto lg:max-w-none rounded-lg shadow-2xl"
                                />
                            </div>

                            {/* Right: Trading Interface */}
                            <div className="flex-1 bg-background p-4 sm:p-6">
                                {/* Price Info */}
                                <div className="mb-6">
                                    <span className="text-gray-400 text-xs sm:text-sm block mb-2">Buy for:</span>
                                    {displayPrice ? (
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={getCurrencyIcon(displayPrice.currency)}
                                                alt={displayPrice.currency}
                                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-white text-2xl sm:text-3xl font-bold">
                                                    ${formatPrice(displayPrice.priceInfo.usd)}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {formatPrice(displayPrice.priceInfo.price)} {displayPrice.currency}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-2xl font-bold italic">
                                            No listings
                                        </span>
                                    )}

                                    {youOwn > 0 && (
                                        <span className="text-gray-400 text-xs sm:text-sm block mt-2">
                                            You Own: <span className="text-white font-semibold">{youOwn}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    {hasUserListings && loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase() ? (
                                        <>
                                            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                                                Cancel Listing ({userListings.length})
                                            </button>
                                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                                                Edit Listing
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                                                Buy Now
                                            </button>
                                            <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                                                Make Offer
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Tabs */}
                                <div className="border-b border-lines mb-4">
                                    <div className="flex gap-6">

                                        <button
                                            onClick={() => setActiveTab('details')}
                                            className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === 'details'
                                                ? 'text-white'
                                                : 'text-gray-400 hover:text-hover'
                                                }`}
                                        >
                                            Details
                                            {activeTab === 'details' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setActiveTab('buy')}
                                            className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === 'buy'
                                                ? 'text-white'
                                                : 'text-gray-400 hover:text-hover'
                                                }`}
                                        >
                                            Buy
                                            {activeTab === 'buy' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setActiveTab('sell')}
                                            className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === 'sell'
                                                ? 'text-white'
                                                : 'text-gray-400 hover:text-hover'
                                                }`}
                                        >
                                            Sell
                                            {activeTab === 'sell' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                            )}
                                        </button>

                                        {newWallet && (
                                            <button
                                                onClick={() => setActiveTab('owned')}
                                                className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === 'owned'
                                                    ? 'text-white'
                                                    : 'text-gray-400 hover:text-hover'
                                                    }`}
                                            >
                                                Owned
                                                {activeTab === 'owned' && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                                )}
                                            </button>
                                        )
                                        }



                                        <button
                                            onClick={() => setActiveTab('activity')}
                                            className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === 'activity'
                                                ? 'text-white'
                                                : 'text-gray-400 hover:text-hover'
                                                }`}
                                        >
                                            Activity
                                            {activeTab === 'activity' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div className="overflow-y-auto">
                                    {/* Details Tab */}
                                    {activeTab === 'details' && (
                                        <div>
                                            {/* Attributes Section */}
                                            <div className="mb-6">
                                                <h3 className="text-white font-semibold text-base mb-3">Attributes</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {Object.entries(card.attributes).map(([key, value]) => (
                                                        <div key={key} className="bg-light border border-lines rounded-lg p-3">
                                                            <div className="text-gray-400 text-xs uppercase mb-1">{key}</div>
                                                            <div className="text-white text-sm font-semibold">{value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rarity & Type */}
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-light border border-lines rounded-lg p-3">
                                                    <div className="text-gray-400 text-xs uppercase mb-1">Rarity</div>
                                                    <div className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
                                                        {card.rarity}
                                                    </div>
                                                </div>
                                                <div className="bg-light border border-lines rounded-lg p-3">
                                                    <div className="text-gray-400 text-xs uppercase mb-1">Type</div>
                                                    <div className="text-white text-sm font-semibold">{card.item_type}</div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {card.description && (
                                                <div className="mb-6">
                                                    <h3 className="text-white font-semibold text-base mb-2">Description</h3>
                                                    <p className="text-gray-400 text-sm">{card.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Buy Tab */}
                                    {activeTab === 'buy' && (
                                        <div>

                                            <div className="flex justify-between items-center mb-4">
                                                <div></div>
                                                <select
                                                    className="bg-light text-white px-3 py-1.5 rounded text-sm cursor-pointer"
                                                    value={currencyFilter}
                                                    onChange={(e) => setCurrencyFilter(e.target.value)}
                                                >
                                                    <option>All</option>
                                                    <option>ETH</option>
                                                    <option>USDC</option>
                                                    <option>GODS</option>
                                                    <option>IMX</option>
                                                </select>
                                            </div>

                                            {/* Listings Table - Desktop */}
                                            <div className="hidden sm:block bg-background border border-lines rounded-lg overflow-hidden">
                                                <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-[#0f1117] border-b border-lines text-gray-400 text-xs font-semibold uppercase">
                                                    <div>Price</div>
                                                    <div>Amount</div>
                                                    <div>Expires In</div>
                                                    <div></div>
                                                </div>

                                                <div className="max-h-96 overflow-y-auto">
                                                    {isLoadingListings ? (
                                                        <div className="px-4 py-12 text-center text-gray-400 text-sm">
                                                            Loading listings...
                                                        </div>
                                                    ) : filteredListings.length > 0 ? (
                                                        filteredListings.map((listing) => {
                                                            const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
                                                            const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

                                                            return (
                                                                <div
                                                                    key={listing.listing_id}
                                                                    className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${isUserListing ? 'bg-light' : ''}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <img
                                                                            src={getCurrencyIcon(listing.currency)}
                                                                            alt={listing.currency}
                                                                            className="w-4 h-4 rounded-full"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none'
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <div className="text-white font-semibold text-sm">
                                                                                {listing.prices.total_with_fees.toFixed(4)} {listing.currency}
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">
                                                                                ${listing.prices.total_usd.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-white text-sm flex items-center">
                                                                        1
                                                                        {isUserListing && (
                                                                            <span className="ml-2 text-xs text-blue-400">(You)</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-gray-400 text-sm flex items-center">
                                                                        {getTimeUntilExpiration(listing.end_at)}
                                                                    </div>
                                                                    <div className="flex items-center justify-end">
                                                                        {isUserListing && canCancel ? (
                                                                            <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer">
                                                                                Cancel
                                                                            </button>
                                                                        ) : (
                                                                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer">
                                                                                Buy
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        <div className="px-4 py-12 text-center text-gray-400 text-sm">
                                                            No listings available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Listings Cards - Mobile */}
                                            <div className="sm:hidden space-y-3">
                                                {isLoadingListings ? (
                                                    <div className="bg-background border border-lines rounded-lg p-8 text-center text-gray-400 text-sm">
                                                        Loading listings...
                                                    </div>
                                                ) : filteredListings.length > 0 ? (
                                                    filteredListings.map((listing) => {
                                                        const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
                                                        const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

                                                        return (
                                                            <div
                                                                key={listing.listing_id}
                                                                className={`bg-background border border-lines rounded-lg p-3 ${isUserListing ? 'border-blue-500' : ''}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <img
                                                                            src={getCurrencyIcon(listing.currency)}
                                                                            alt={listing.currency}
                                                                            className="w-4 h-4 rounded-full"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none'
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <div className="text-white font-semibold text-sm">
                                                                                {listing.prices.total_with_fees.toFixed(4)} {listing.currency}
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">
                                                                                ${listing.prices.total_usd.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-gray-400 text-xs">Amount</div>
                                                                        <div className="text-white text-sm font-semibold">
                                                                            1 {isUserListing && <span className="text-blue-400">(You)</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <div className="text-gray-400 text-xs">Expires In</div>
                                                                        <div className="text-gray-300 text-sm">
                                                                            {getTimeUntilExpiration(listing.end_at)}
                                                                        </div>
                                                                    </div>
                                                                    {isUserListing && canCancel ? (
                                                                        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer">
                                                                            Cancel
                                                                        </button>
                                                                    ) : (
                                                                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer">
                                                                            Buy
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="bg-background border border-lines rounded-lg p-8 text-center text-gray-400 text-sm">
                                                        No listings available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                    {/* Owned Tab */}
                                    {activeTab === 'owned' && (
                                        <div>
                                            {youOwn > 0 ? (
                                                <div className="bg-background border border-lines rounded-lg overflow-hidden">
                                                    {/* Filter Controls */}
                                                    <div className="px-4 py-3 bg-background border-b border-lines flex flex-wrap gap-2">
                                                        <button
                                                            onClick={selectAllTokens}
                                                            className="bg-light hover:bg-hover text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                                                        >
                                                            Select All
                                                        </button>
                                                        <button
                                                            onClick={selectAllNonListed}
                                                            className="bg-light hover:bg-hover text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                                                        >
                                                            Select All Non-Listed
                                                        </button>
                                                        <button
                                                            onClick={deselectAllTokens}
                                                            className="bg-light hover:bg-hover text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                                                        >
                                                            Deselect All
                                                        </button>
                                                        <span className="ml-auto text-gray-400 text-xs flex items-center">
                                                            {selectedTokens.size} selected
                                                        </span>
                                                    </div>

                                                    {/* Table Header */}
                                                    <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-light border-b border-lines">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400 text-xs font-semibold uppercase text-center">Token ID</span>
                                                        </div>
                                                        <div className="text-gray-400 text-xs font-semibold uppercase text-center">Status</div>
                                                        <div className="text-gray-400 text-xs font-semibold uppercase text-center">Listed Price</div>
                                                        <div className="text-gray-400 text-xs font-semibold uppercase text-center">Price (USD)</div>
                                                        <div className="text-gray-400 text-xs font-semibold uppercase text-center">Currency</div>
                                                    </div>

                                                    {/* Table Body */}
                                                    <div className="max-h-100 overflow-y-auto">
                                                        {Array.from({ length: youOwn }).map((_, index) => {
                                                            // Check if this token is listed
                                                            const listingForToken = userListings[index] || null
                                                            const isSelected = selectedTokens.has(index)

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`grid grid-cols-5 gap-4 px-4 py-3 border-b border-lines hover:bg-hover transition-colors ${isSelected ? 'bg-hover' : ''}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 rounded border-gray-600 bg-light cursor-pointer"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleTokenSelection(index)}
                                                                        />
                                                                        <span className="text-white font-semibold text-sm">
                                                                            {listingForToken ? `#${listingForToken.token_id}` : `#Token ${index + 1}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm font-semibold flex items-center text-text  justify-center rounded-md">
                                                                        {listingForToken ? (
                                                                            <span className="bg-light text-white text-xs font-semibold px-2  py-1 rounded">
                                                                                Listed
                                                                            </span>
                                                                        ) : (<span className="bg-light text-white text-xs font-semibold px-2  py-1 rounded">
                                                                            Not Listed
                                                                        </span>)}
                                                                    </div>
                                                                    <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md`}>
                                                                        {listingForToken ? listingForToken.prices.base_price.toFixed(6) : ''}
                                                                    </div>
                                                                    <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md`}>
                                                                        {listingForToken ? `$${listingForToken.prices.base_price_usd.toFixed(4)}` : ''}
                                                                    </div>
                                                                    <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md gap-2`}>
                                                                        {listingForToken ? listingForToken.currency : ''}
                                                                        {/* {listingForToken && (
                                                                            <img src={`/assets/currency/${listingForToken.currency}.png`} className='w-[15px] h-[15px]' />
                                                                        )} */}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    {/* Actions Footer */}
                                                    <div className="px-4 py-3 bg-background border-t border-lines flex justify-between items-center">
                                                        <span className="text-gray-400 text-sm">
                                                            {youOwn} token{youOwn > 1 ? 's' : ''} owned • {userListings.length} listed
                                                        </span>
                                                        <button
                                                            onClick={() => setActiveTab('sell')}
                                                            disabled={selectedTokens.size === 0}
                                                            className={`text-sm font-semibold px-4 py-2 rounded transition-colors ${selectedTokens.size === 0
                                                                ? 'bg-light text-gray-500 cursor-not-allowed'
                                                                : 'bg-light hover:bg-hover text-white cursor-pointer'
                                                                }`}
                                                        >
                                                            List Selected ({selectedTokens.size})
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-background border border-lines rounded-lg p-8 text-center">
                                                    <div className="text-gray-400 text-sm mb-4">
                                                        You don't own any of this card
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('buy')}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded transition-colors cursor-pointer"
                                                    >
                                                        View Listings
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}



                                    {/* Activity Tab */}
                                    {activeTab === 'activity' && (
                                        <div>
                                            <div className="bg-background border border-lines rounded-lg p-8 text-center">
                                                <div className="text-gray-500 text-sm mb-4">Price Chart Placeholder</div>
                                                <div className="h-64 border border-lines rounded flex items-center justify-center">
                                                    <span className="text-gray-400">Chart visualization will go here</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'sell' && (
                                        <div className="bg-background border border-lines rounded-lg p-6">
                                            {youOwn > 0 ? (
                                                <>
                                                    {/* Quantity Selector */}
                                                    <div className="mb-4">
                                                        <label className="text-gray-400 text-sm block mb-2">Quantity</label>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                                className="w-10 h-10 bg-light hover:bg-gray-600 rounded flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={quantity}
                                                                onChange={(e) => setQuantity(Math.max(1, Math.min(youOwn, parseInt(e.target.value) || 1)))}
                                                                className="flex-1 bg-light text-white text-center py-2 rounded font-semibold"
                                                                max={youOwn}
                                                            />
                                                            <button
                                                                onClick={() => setQuantity(Math.min(youOwn, quantity + 1))}
                                                                className="w-10 h-10 bg-light hover:bg-gray-600 rounded flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="text-gray-500 text-xs mt-1 block">
                                                            You own {youOwn} of this card
                                                        </span>
                                                    </div>

                                                    {/* Price Input */}
                                                    <div className="mb-4">
                                                        <label className="text-gray-400 text-sm block mb-2">Price per item</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="flex-1 bg-light text-white px-4 py-2 rounded font-semibold"
                                                                step="0.0001"
                                                            />
                                                            <select className="bg-light text-white px-4 py-2 rounded font-semibold cursor-pointer">
                                                                <option>ETH</option>
                                                                <option>USDC</option>
                                                                <option>GODS</option>
                                                                <option>IMX</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="mb-6">
                                                        <label className="text-gray-400 text-sm block mb-2">Duration</label>
                                                        <select className="w-full bg-light text-white px-4 py-2 rounded font-semibold cursor-pointer">
                                                            <option>1 day</option>
                                                            <option>3 days</option>
                                                            <option>7 days</option>
                                                            <option>1 month</option>
                                                            <option>3 months</option>
                                                            <option>6 months</option>
                                                        </select>
                                                    </div>

                                                    {/* List Button */}
                                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors cursor-pointer">
                                                        List for Sale
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-400 text-sm">
                                                        You don't own any of this card to sell.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CardModal