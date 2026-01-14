'use client'

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

type Props = {
    card: Stack
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    onClick: () => void
    selectedCurrency: string
}

const CardItem = ({
    card,
    getRarityColor,
    formatPrice,
    onClick,
    selectedCurrency,
}: Props) => {
    // Get currency icon path
    const getCurrencyIcon = (currency: string): string => {
        const currencyLower = currency.toLowerCase()
        return `/assets/currency/${currencyLower}.png`
    }

    // Determine which price to show based on selectedCurrency
    const getPriceToDisplay = () => {
        if (!card.all_prices || Object.keys(card.all_prices).length === 0) {
            return null
        }

        // If a specific currency is selected, show only that currency's price
        if (selectedCurrency && card.all_prices[selectedCurrency]) {
            return {
                currency: selectedCurrency,
                priceInfo: card.all_prices[selectedCurrency]
            }
        }

        // If no currency filter, show the best (cheapest) price
        if (card.best_currency && card.all_prices[card.best_currency]) {
            return {
                currency: card.best_currency,
                priceInfo: card.all_prices[card.best_currency]
            }
        }

        return null
    }

    const displayPrice = getPriceToDisplay()

    return (
        <div
            className="bg-background border-lines border-1 rounded-md overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-101 transform cursor-pointer group"
            onClick={onClick}
        >
            {/* Image */}
            <div className="aspect-[2/3] relative overflow-hidden flex items-center justify-center">
                <img
                    src={card.image}
                    alt={card.name}
                    className="w-[90%] h-[90%]"
                    loading="lazy"
                />

                {/* Rarity */}
                <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold uppercase ${getRarityColor(
                        card.rarity
                    )} bg-gray-900/80`}
                >
                    {card.rarity}
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="text-white font-semibold truncate mb-2">
                    {card.name}
                </h3>

                {displayPrice ? (
                    <div className="">
                        {/* USD Price - Main Highlight */}
                        <p className="font-bold text-sm mb-1">
                            ${formatPrice(displayPrice.priceInfo.usd)} USD
                        </p>

                        {/* Currency Price - Bottom */}
                        <div className="flex items-center gap-1.5">
                            <img
                                src={getCurrencyIcon(displayPrice.currency)}
                                alt={displayPrice.currency}
                                className="w-3.5 h-3.5 rounded-full"
                                onError={(e) => {
                                    // Fallback if image doesn't load
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                            <p className="text-gray-500 text-xs">
                                {formatPrice(displayPrice.priceInfo.price)} {displayPrice.currency}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="">
                        <p className="text-gray-500 text-sm italic">
                            No listings
                        </p>
                    </div>
                )}

                <p className="text-gray-400 text-xs mt-1">
                    {card.total_listings} listing
                    {card.total_listings !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    )
}

export default CardItem