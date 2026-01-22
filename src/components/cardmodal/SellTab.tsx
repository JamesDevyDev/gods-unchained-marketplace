type SellTabProps = {
    youOwn: number
    quantity: number
    setQuantity: (quantity: number) => void
    setActiveTab: (tab: 'details' | 'buy' | 'sell' | 'owned' | 'activity') => void
}

export const SellTab = ({ youOwn, quantity, setQuantity, setActiveTab }: SellTabProps) => {
    return (
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
    )
}