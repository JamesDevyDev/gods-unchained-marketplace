import { useState, useEffect } from 'react'
import { Stack, ListingsResponse } from './types'
import { getCurrencyIcon } from './utils'

type PriceDisplayProps = {
    card: Stack
    selectedCurrency: string
    formatPrice: (price: number | null) => string
    youOwn: number
    listingsData?: ListingsResponse | null
    isLoadingListings?: boolean
}

export const PriceDisplay = ({
    card,
    selectedCurrency,
    formatPrice,
    youOwn,
    listingsData,
    isLoadingListings

}: PriceDisplayProps) => {
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    useEffect(() => {
        setIsInitialLoading(true)

        const timer = setTimeout(() => {
            setIsInitialLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [card.metadata_id])

    const getPriceToDisplay = () => {
        // ⭐ PRIORITY 1: Use cheapest_listing from refetched data if available
        if (listingsData?.cheapest_listing) {
            const cheapest = listingsData.cheapest_listing
            return {
                currency: cheapest.currency,
                priceInfo: {
                    usd: cheapest.prices.total_usd || cheapest.prices.base_price_usd,
                    base_price: cheapest.prices.base_price,
                    fees: cheapest.prices.fees
                },
                isFromListing: true
            }
        }

        // ⭐ FALLBACK: Use card's all_prices data
        if (!card.all_prices || Object.keys(card.all_prices).length === 0) {
            return null
        }

        if (selectedCurrency && card.all_prices[selectedCurrency]) {
            return {
                currency: selectedCurrency,
                priceInfo: card.all_prices[selectedCurrency],
                isFromListing: false
            }
        }

        if (card.best_currency && card.all_prices[card.best_currency]) {
            return {
                currency: card.best_currency,
                priceInfo: card.all_prices[card.best_currency],
                isFromListing: false
            }
        }

        return null
    }

    const displayPrice = getPriceToDisplay()

    return (
        <div className="mb-6">
            <span className="text-gray-400 text-xs sm:text-sm block mb-2">
                Buy for:
            </span>
            {isInitialLoading ? (
                // Skeleton loader
                <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-700"></div>
                    <div className="flex flex-col gap-1">
                        <div className="h-8 sm:h-9 w-32 bg-gray-700 rounded"></div>
                        <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    </div>
                </div>
            ) : displayPrice ? (
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
                        <span className="text-gray-400 text-sm">
                            {formatPrice(displayPrice.priceInfo.base_price)} {displayPrice.currency}
                        </span>
                    </div>
                </div>
            ) : (
                <span className="text-gray-500 text-2xl font-bold italic">
                    No listings
                </span>
            )}

            {isInitialLoading ? (
                // Skeleton for "You Own"
                <div className="h-4 w-28 bg-gray-700 rounded mt-2 animate-pulse"></div>
            ) : youOwn > 0 ? (
                <span className="text-gray-400 text-xs sm:text-sm block mt-2">
                    You Own: <span className="text-white font-semibold">{youOwn}</span>
                </span>
            ) : null}
        </div>
    )
}