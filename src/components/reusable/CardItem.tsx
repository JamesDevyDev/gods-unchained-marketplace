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
}

const CardItem = ({
    card,
    getRarityColor,
    formatPrice,
    onClick,
}: Props) => {
    return (
        <div
            className="bg-background border-lines border-1 rounded-md overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-101 transform cursor-pointer group"
            onClick={onClick}
        >
            {/* Image */}
            <div className="aspect-[2/3] relative overflow-hidden">
                <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
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
                <h3 className="text-white font-semibold text-center truncate mb-2">
                    {card.name}
                </h3>

                {card.best_usd_price && (
                    <div className="text-center">
                        <p className="text-green-400 font-bold text-sm">
                            ${formatPrice(card.best_usd_price)}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {card.best_currency}
                        </p>
                    </div>
                )}

                <p className="text-gray-400 text-xs text-center mt-1">
                    {card.total_listings} listing
                    {card.total_listings !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    )
}

export default CardItem