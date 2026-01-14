'use client'
import { useEffect, useState } from 'react'

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
    card: Stack | null
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    onClose: () => void
}

const CardModal = ({
    card,
    getRarityColor,
    formatPrice,
    onClose,
}: Props) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
    const [quantity, setQuantity] = useState(1)
    const [showGroupOrders, setShowGroupOrders] = useState(true)
    const [showMyOrders, setShowMyOrders] = useState(false)

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

    const youOwn = 5

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4 "
            onClick={onClose}
        >
            <div
                className="bg-background rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-background border-lines border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate pr-4">{card.name}</h2>
                    {/* X button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Mobile: Vertical Stack, Desktop: Horizontal */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row w-full">
                        {/* Left: Card Image & Chart */}
                        <div className="w-full lg:w-[40%] bg-background border-b lg:border-b-0 lg:border-r border-lines p-4 sm:p-6">
                            <img
                                src={card.image}
                                alt={card.name}
                                className="w-full max-w-md mx-auto lg:max-w-none rounded-lg shadow-2xl mb-4"
                            />

                            {/* Price Chart */}
                            <div className="bg-background border border-lines rounded-lg p-3 sm:p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <span className="text-gray-400 text-xs sm:text-sm">Avg. Daily Price</span>
                                </div>
                                <div className="text-gray-500 text-center py-8 h-48 sm:h-64 flex items-center justify-center border border-gray-700 rounded text-sm">
                                    Chart visualization
                                </div>
                            </div>
                        </div>

                        {/* Right: Trading Interface */}
                        <div className="flex-1 bg-background p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
                                {/* Buy/Sell Tabs */}
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded font-semibold transition-colors text-sm sm:text-base ${activeTab === 'buy'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                        onClick={() => setActiveTab('buy')}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded font-semibold transition-colors text-sm sm:text-base ${activeTab === 'sell'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                        onClick={() => setActiveTab('sell')}
                                    >
                                        Sell
                                    </button>
                                </div>

                                <span className="text-gray-400 text-xs sm:text-sm">
                                    You Own: <span className="text-white font-semibold">{youOwn}</span>
                                </span>
                            </div>

                            {/* Total Price & Actions */}
                            <div className="bg-background border-lines border rounded-lg p-3 sm:p-4 mb-6">
                                <div className="mb-4">
                                    <span className="text-gray-400 text-xs sm:text-sm">Total Price:</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-yellow-500 text-xl sm:text-2xl font-bold">
                                            ⟁ {card.best_usd_price ? formatPrice(card.best_usd_price) : '0.000001'}
                                        </span>
                                        <span className="text-gray-500 text-xs sm:text-sm">($0.00)</span>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white font-bold transition-colors"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="flex-1 bg-gray-700 text-white text-center py-2 rounded font-semibold"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white font-bold transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <select className="bg-gray-700 text-white px-4 py-2 rounded font-semibold text-sm sm:text-base">
                                        <option>All</option>
                                        <option>USDC</option>
                                        <option>GODS</option>
                                        <option>IMX</option>
                                    </select>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base">
                                        Buy
                                    </button>
                                    <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base">
                                        Make Offer
                                    </button>
                                </div>
                            </div>

                            {/* For Sale Section */}
                            <div className="mb-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                                    <h3 className="text-white font-semibold text-base sm:text-lg">For Sale</h3>
                                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm w-full sm:w-auto">
                                        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showGroupOrders}
                                                onChange={(e) => setShowGroupOrders(e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="whitespace-nowrap">Group Orders</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showMyOrders}
                                                onChange={(e) => setShowMyOrders(e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="whitespace-nowrap">My Orders Only</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Orders Table - Desktop */}
                                <div className="hidden sm:block bg-background border border-lines rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-[#0f1117] border-b border-gray-700 text-gray-400 text-sm font-semibold">
                                        <div>Price</div>
                                        <div>Amount</div>
                                        <div>Expires In</div>
                                        <div></div>
                                    </div>

                                    <div>
                                        {Object.entries(card.all_prices).map(([currency, priceInfo], index) => (
                                            <div
                                                key={priceInfo.listing_id}
                                                className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div>
                                                    <div className="text-yellow-500 font-bold">${formatPrice(priceInfo.usd)}</div>
                                                    <div className="text-gray-500 text-xs">⟁ {formatPrice(priceInfo.price)}</div>
                                                </div>
                                                <div className="text-white">1</div>
                                                <div className="text-gray-400 text-sm">
                                                    {Math.floor(Math.random() * 24)} months
                                                </div>
                                                <div>
                                                    <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1 rounded transition-colors">
                                                        Buy
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Orders Cards - Mobile */}
                                <div className="sm:hidden space-y-3">
                                    {Object.entries(card.all_prices).map(([currency, priceInfo], index) => (
                                        <div
                                            key={priceInfo.listing_id}
                                            className="bg-background border border-lines rounded-lg p-3"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-yellow-500 font-bold text-sm">${formatPrice(priceInfo.usd)}</div>
                                                    <div className="text-gray-500 text-xs">⟁ {formatPrice(priceInfo.price)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-gray-400 text-xs">Amount</div>
                                                    <div className="text-white text-sm font-semibold">1</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-gray-400 text-xs">Expires In</div>
                                                    <div className="text-gray-300 text-sm">{Math.floor(Math.random() * 24)} months</div>
                                                </div>
                                                <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
                                                    Buy
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Offers Section */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-white font-semibold text-base sm:text-lg">Offers</h3>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>

                                {/* Offers Table - Desktop */}
                                <div className="hidden sm:block bg-background border border-lines rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-[#0f1117] border-b border-gray-700 text-gray-400 text-sm font-semibold">
                                        <div>Price</div>
                                        <div>Amount</div>
                                        <div>Expires In</div>
                                    </div>

                                    <div className="px-4 py-12 text-center text-gray-500 text-sm">
                                        No Offers Available
                                    </div>
                                </div>

                                {/* Offers Card - Mobile */}
                                <div className="sm:hidden bg-background border border-lines rounded-lg overflow-hidden">
                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No Offers Available
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardModal