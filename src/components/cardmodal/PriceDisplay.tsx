import { Stack } from './types'
import { getCurrencyIcon } from './utils'

type PriceDisplayProps = {
    card: Stack
    selectedCurrency: string
    formatPrice: (price: number | null) => string
    youOwn: number
}

export const PriceDisplay = ({ card, selectedCurrency, formatPrice, youOwn }: PriceDisplayProps) => {
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

    return (
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
    )
}