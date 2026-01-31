import { useState, useEffect } from 'react'
import { ListingsResponse, Listing } from '../types'

export const ListCollectibleModal = ({
    card,
    isOpen,
    onClose,
    quantity,
    setQuantity,
    listingPrice,
    setListingPrice,
    duration,
    setDuration,
    currency,
    setCurrency,
    onListNow,
    listingsData
}: {
    card: any
    isOpen: boolean
    onClose: () => void
    quantity: number
    setQuantity: (quantity: number) => void
    maxQuantity: number
    listingPrice: string
    setListingPrice: (price: string) => void
    duration: number
    setDuration: (duration: number) => void
    currency: string
    setCurrency: (currency: string) => void
    onListNow: () => void
    listingsData: ListingsResponse | null
}) => {
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
        'ETH': 3000,
        'GODS': 0.25,
        'IMX': 1.5,
        'USDC': 1
    })

    // Fetch real-time exchange rates from Immutable API
    const fetchExchangeRates = async () => {
        try {
            const response = await fetch('https://checkout-api.immutable.com/v1/fiat/conversion?ids=ethereum,immutable-x,usd-coin,gods-unchained,guild-of-guardians,ravenquest,cross-the-ages,tokyo-games-token,immortal-token&currencies=usd,eth')
            const data = await response.json()

            const symbolToId: { [key: string]: string } = {
                'ETH': 'ethereum',
                'GODS': 'gods-unchained',
                'IMX': 'immutable-x',
                'USDC': 'usd-coin'
            }

            const rates: Record<string, number> = {}
            Object.entries(symbolToId).forEach(([symbol, id]) => {
                if (data[id]?.usd) {
                    rates[symbol] = data[id].usd
                }
            })

            setExchangeRates(rates)
        } catch (error) {
            console.error('Error fetching exchange rates:', error)
            // Keep using default rates if API fails
        }
    }

    // Fetch exchange rates when modal opens or currency changes
    useEffect(() => {
        if (isOpen) {
            fetchExchangeRates()
        }
    }, [isOpen, currency])

    const getUsdRate = (curr: string): number => {
        return exchangeRates[curr] || 1
    }

    const formatUsd = (amount: string | number): string => {
        if (!amount || isNaN(parseFloat(amount.toString()))) return '0.00'
        const value = parseFloat(amount.toString())
        const usdValue = value * getUsdRate(currency)
        return usdValue.toFixed(2)
    }

    const calculateEarnings = () => {
        if (!listingPrice || isNaN(parseFloat(listingPrice))) return '0.00'
        const price = parseFloat(listingPrice)
        // Deduct fees: Royalties (0.5%) + Protocol (2%) + Maker (1%)
        const totalFees = price * 0.035 // 3.5% total
        return (price - totalFees).toFixed(4)
    }

    if (!isOpen) return null

    const getLowestPriceForCurrency = () => {
        if (!listingsData?.by_currency) return null

        // Find the absolute lowest price across ALL currencies by comparing USD values
        let absoluteLowestUsd = Infinity
        let lowestListingCurrency = ''
        let lowestListingPrice = 0

        const currencies = ['ETH', 'GODS', 'IMX', 'USDC'] as const

        for (const curr of currencies) {
            const currencyListings = listingsData.by_currency[curr]
            if (!currencyListings || currencyListings.length === 0) continue

            // Find the lowest price in this currency
            const lowestInCurrency = currencyListings.reduce((min: Listing, listing: Listing) => {
                const price = listing.prices.base_price
                const minPrice = min.prices.base_price
                return price < minPrice ? listing : min
            })

            const priceInCurrency = lowestInCurrency.prices.base_price
            // Convert to USD for comparison
            const priceInUsd = priceInCurrency * getUsdRate(curr)

            if (priceInUsd < absoluteLowestUsd) {
                absoluteLowestUsd = priceInUsd
                lowestListingCurrency = curr
                lowestListingPrice = priceInCurrency
            }
        }

        if (absoluteLowestUsd === Infinity) return null

        // If the lowest is already in the selected currency, return it directly
        if (lowestListingCurrency === currency) {
            return lowestListingPrice
        }

        // Convert from the lowest currency to the selected currency
        // Step 1: Lowest price in its original currency → USD
        const lowestInUsd = lowestListingPrice * getUsdRate(lowestListingCurrency)

        // Step 2: USD → Selected currency
        const selectedCurrencyRate = getUsdRate(currency)
        if (selectedCurrencyRate === 0) return null

        const convertedPrice = lowestInUsd / selectedCurrencyRate

        return convertedPrice
    }

    const handleLowestClick = () => {
        const lowestPrice = getLowestPriceForCurrency()
        if (lowestPrice !== null) {
            // Set price 1% below the lowest
            const priceBelow = lowestPrice * 0.99
            // Format to 8 decimal places to avoid scientific notation
            setListingPrice(priceBelow.toFixed(8))
        }
    }

    const handleMaxClick = () => {
        const unlistedCount = card?.owned_tokens?.filter((token: any) => !token.listed).length || 0
        setQuantity(unlistedCount)
    }

    const lowestPrice = getLowestPriceForCurrency()
    const unlistedCount = card?.owned_tokens?.filter((token: any) => !token.listed).length || 0

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-4 sm:p-5 max-w-sm w-full border border-gray-700 relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    List Collectible
                </h2>

                {/* Quantity and Currency Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Quantity */}
                    <div>
                        <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                            Quantity
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0
                                        if (value >= 0 && value <= unlistedCount) {
                                            setQuantity(value)
                                        }
                                    }}
                                    min="0"
                                    max={unlistedCount}
                                    className="w-full bg-light rounded px-3 py-2 text-white text-base border border-gray-700 focus:border-yellow-500 focus:outline-none cursor-pointer"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
                                    of {unlistedCount}
                                </span>
                            </div>
                            <button
                                onClick={handleMaxClick}
                                disabled={unlistedCount === 0}
                                className={`text-white text-xs px-3 py-2 rounded transition-colors font-semibold ${
                                    unlistedCount > 0
                                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                                }`}
                            >
                                Max
                            </button>
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                            Currency
                        </label>
                        <div className="relative">
                            <img
                                src={`/assets/currency/${currency.toLocaleLowerCase()}.png`}
                                alt={currency}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            />
                            <select
                                value={currency}
                                onChange={(e) => {
                                    setCurrency(e.target.value)
                                    setListingPrice('') // Clear price when currency changes
                                }}
                                className="w-full bg-light text-white text-sm pl-8 pr-3 py-2 rounded border border-gray-700 appearance-none cursor-pointer"
                            >
                                <option value="ETH">ETH</option>
                                <option value="GODS">GODS</option>
                                <option value="IMX">IMX</option>
                                <option value="USDC">USDC</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                        Duration
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                            className="bg-light text-white text-base px-3 py-2 rounded border border-gray-700 cursor-pointer"
                            min="1"
                        />
                        <select className="bg-light text-white text-sm px-3 py-2 rounded border border-gray-700 appearance-none cursor-pointer">
                            <option value="months">Months</option>
                            <option value="days">Days</option>
                        </select>
                    </div>
                </div>

                {/* Listing Price */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-yellow-500 text-xs font-semibold">
                            Listing Price
                        </label>
                        <button
                            onClick={handleLowestClick}
                            disabled={lowestPrice === null}
                            className={`text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                                lowestPrice !== null
                                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                            <span>Lowest</span>
                            {lowestPrice !== null && (
                                <span className="font-mono">{Number(lowestPrice).toFixed(8)} {currency}</span>
                            )}
                        </button>
                    </div>
                    <input
                        type="text"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        placeholder="0"
                        className="w-full bg-light text-white text-base px-3 py-2 rounded border border-gray-700 focus:border-yellow-500 focus:outline-none cursor-pointer"
                    />
                    <p className="text-gray-400 text-xs mt-1">${formatUsd(listingPrice)}</p>
                </div>

                {/* Earnings */}
                <div className="mb-4">
                    <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                        Earnings
                    </label>
                    <input
                        type="text"
                        value={calculateEarnings()}
                        disabled
                        className="w-full bg-light text-gray-400 text-base px-3 py-2 rounded border border-gray-700 cursor-not-allowed"
                    />
                    <p className="text-gray-400 text-xs mt-1">${formatUsd(calculateEarnings())}</p>
                </div>

                {/* List Now Button */}
                <button
                    onClick={onListNow}
                    disabled={!listingPrice || parseFloat(listingPrice) <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mb-3 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    List Now
                </button>

                {/* Fees - Collapsible on mobile */}
                <details className="border-t border-gray-700 pt-3 group">
                    <summary className="text-gray-400 text-xs font-semibold cursor-pointer flex items-center justify-between list-none">
                        <div className="flex items-center gap-2">
                            <span>Fee Breakdown</span>
                            <svg
                                className="w-4 h-4 transition-transform group-open:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <span className="text-xs">3.5% total</span>
                    </summary>
                    <div className="space-y-1 text-xs mt-2">
                        <div className="flex justify-between text-gray-400">
                            <span>Royalties</span>
                            <span>0.5%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Protocol Fee</span>
                            <span>2%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Maker Fee</span>
                            <span>1%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Taker Fee (est.)</span>
                            <span>1%</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Orders are time sensitive. Manually changing gas price/limit may stop processing.
                    </p>
                </details>
            </div>
        </div>
    )
}