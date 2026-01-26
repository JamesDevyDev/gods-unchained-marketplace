'use client'

import { useSearchParams } from 'next/navigation'

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

interface ListingSummary {
    listed_count: number
    unlisted_count: number
    avg_listing_price_usd: number | null
    total_listed_value_usd: number
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
    quantity: number
    listing_summary?: ListingSummary
}

type Props = {
    card: Stack
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    onClick: () => void
    selectedCurrency: string
}

const CardListItem = ({
    card,
    getRarityColor,
    formatPrice,
    onClick,
    selectedCurrency,
}: Props) => {
    const searchParams = useSearchParams()
    const hasWalletParam = searchParams.get('wallet') !== null

    const getCurrencyIcon = (currency: string): string => {
        const currencyLower = currency.toLowerCase()
        return `/assets/currency/${currencyLower}.png`
    }

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

    const displayPrice = getPriceToDisplay()
    const userListedCount = card.listing_summary?.listed_count || 0
    const userUnlistedCount = card.listing_summary?.unlisted_count || 0
    const totalUserCards = card.quantity || 0
    const avgListingPrice = card.listing_summary?.avg_listing_price_usd
    const totalListedValue = card.listing_summary?.total_listed_value_usd
    const keyAttributes = Object.entries(card.attributes || {})

    return (
        <div
            className="bg-light rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2">
                {/* Mobile: Full Width Header with Image and Title */}
                <div className="flex sm:hidden items-center gap-2 w-full">
                    <div className="w-12 h-16 flex-shrink-0 relative overflow-hidden rounded bg-background flex items-center justify-center">
                        <img
                            src={card.image}
                            alt={card.name}
                            className="w-[90%] h-[90%] object-contain"
                            loading="lazy"
                        />
                        <div
                            className={`absolute top-0 right-0 px-1 rounded-bl text-[8px] font-bold ${getRarityColor(
                                card.rarity
                            )} bg-gray-900/90`}
                        >
                            {card.rarity.slice(0, 1)}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-xs truncate leading-tight">
                            {card.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                            <span className="text-gray-400 truncate">{card.item_type || 'Card'}</span>
                            <span className="text-gray-600">•</span>
                            <span className={`font-medium ${getRarityColor(card.rarity)}`}>
                                {card.rarity}
                            </span>
                        </div>
                    </div>

                    {hasWalletParam && totalUserCards > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                            {userListedCount > 0 && (
                                <div className="px-1 py-0.5 rounded text-[9px] bg-green-700/90 text-white font-bold leading-none">
                                    {userListedCount}L
                                </div>
                            )}
                            {userUnlistedCount > 0 && (
                                <div className="px-1 py-0.5 rounded text-[9px] bg-red-700/90 text-white font-bold leading-none">
                                    {userUnlistedCount}U
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Desktop: Larger Image for better visibility */}
                <div className="hidden sm:block w-16 h-24 lg:w-20 lg:h-28 flex-shrink-0 relative overflow-hidden rounded bg-background flex items-center justify-center">
                    <img
                        src={card.image}
                        alt={card.name}
                        className="w-[90%] h-[90%] object-contain"
                        loading="lazy"
                    />
                    <div
                        className={`absolute top-0 right-0 px-1.5 py-0.5 rounded-bl text-[9px] lg:text-[10px] font-bold ${getRarityColor(
                            card.rarity
                        )} bg-gray-900/90`}
                    >
                        {card.rarity.slice(0, 1)}
                    </div>
                </div>

                {/* Main Content - Maximized Data */}
                <div className="flex-1 min-w-0 space-y-1.5 lg:space-y-2 w-full">
                    {/* Header Row - Desktop Only */}
                    <div className="hidden sm:flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm lg:text-base truncate leading-tight">
                                {card.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] lg:text-xs mt-1">
                                <span className="text-gray-400 truncate">{card.item_type || 'Card'}</span>
                                <span className="text-gray-600">•</span>
                                <span className={`font-medium ${getRarityColor(card.rarity)}`}>
                                    {card.rarity}
                                </span>
                            </div>
                        </div>

                        {/* Status Badges - Desktop */}
                        {hasWalletParam && totalUserCards > 0 && (
                            <div className="flex gap-1.5 flex-shrink-0">
                                {userListedCount > 0 && (
                                    <div className="px-2 py-1 rounded text-[10px] lg:text-[11px] bg-green-700/90 text-white font-bold leading-none">
                                        {userListedCount} Listed
                                    </div>
                                )}
                                {userUnlistedCount > 0 && (
                                    <div className="px-2 py-1 rounded text-[10px] lg:text-[11px] bg-red-700/90 text-white font-bold leading-none">
                                        {userUnlistedCount} Unlisted
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attributes - Show ALL attributes on desktop */}
                    {keyAttributes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 lg:gap-2">
                            {keyAttributes.map(([key, value]) => (
                                <div
                                    key={key}
                                    className="bg-background px-2 py-1 rounded text-[10px] lg:text-[11px] leading-none"
                                >
                                    <span className="text-gray-500">{key}:</span>{' '}
                                    <span className="text-gray-300 font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Price & Stats Grid - Expanded on large screens */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 lg:gap-x-4 gap-y-1.5 text-[10px] lg:text-[11px] w-full">
                        {/* Current Price */}
                        <div className="col-span-1">
                            <p className="text-gray-500 leading-none mb-1">Current Price</p>
                            {displayPrice ? (
                                <div>
                                    <p className="font-bold text-xs lg:text-sm text-white leading-none truncate">
                                        ${formatPrice(displayPrice.priceInfo.usd)}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <img
                                            src={getCurrencyIcon(displayPrice.currency)}
                                            alt={displayPrice.currency}
                                            className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full flex-shrink-0"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                        <p className="text-gray-400 leading-none truncate">
                                            {formatPrice(displayPrice.priceInfo.price)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic leading-none">None</p>
                            )}
                        </div>

                        {/* Listings Count */}
                        <div className="col-span-1">
                            <p className="text-gray-500 leading-none mb-1 truncate">
                                {hasWalletParam ? 'Owned' : 'Listings'}
                            </p>
                            <p className="text-text font-bold text-xs lg:text-sm leading-none truncate">
                                {hasWalletParam ? (
                                    <>
                                        {totalUserCards}
                                        <span className="text-gray-500 font-normal text-[10px] lg:text-xs"> / {card.total_listings}</span>
                                    </>
                                ) : (
                                    card.total_listings
                                )}
                            </p>
                        </div>

                        {/* Last Sold */}
                        {card.last_sold_price && (
                            <div className="col-span-1">
                                <p className="text-gray-500 leading-none mb-1">Last Sold</p>
                                <p className="text-gray-300 font-semibold text-xs lg:text-sm leading-none truncate">
                                    ${formatPrice(card.last_sold_price)}
                                </p>
                            </div>
                        )}

                        {/* Average Listed Price */}
                        {hasWalletParam && avgListingPrice && avgListingPrice > 0 && (
                            <div className="col-span-1">
                                <p className="text-gray-500 leading-none mb-1">Avg Price</p>
                                <p className="text-green-400 font-semibold text-xs lg:text-sm leading-none truncate">
                                    ${formatPrice(avgListingPrice)}
                                </p>
                            </div>
                        )}

                        {/* Total Listed Value */}
                        {hasWalletParam && totalListedValue && totalListedValue > 0 && (
                            <div className="col-span-1">
                                <p className="text-gray-500 leading-none mb-1">Total Value</p>
                                <p className="text-blue-400 font-semibold text-xs lg:text-sm leading-none truncate">
                                    ${formatPrice(totalListedValue)}
                                </p>
                            </div>
                        )}

                        {/* Floor Difference (if applicable) - Extra space usage */}
                        {displayPrice && card.last_sold_price && (
                            <div className="col-span-1 hidden xl:block">
                                <p className="text-gray-500 leading-none mb-1">Change</p>
                                <p className={`font-semibold text-xs lg:text-sm leading-none truncate ${displayPrice.priceInfo.usd > card.last_sold_price
                                        ? 'text-green-400'
                                        : displayPrice.priceInfo.usd < card.last_sold_price
                                            ? 'text-red-400'
                                            : 'text-gray-400'
                                    }`}>
                                    {displayPrice.priceInfo.usd > card.last_sold_price
                                        ? '+'
                                        : displayPrice.priceInfo.usd < card.last_sold_price
                                            ? ''
                                            : ''}
                                    {formatPrice(Math.abs(displayPrice.priceInfo.usd - card.last_sold_price))}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardListItem