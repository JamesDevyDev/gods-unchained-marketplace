import { Listing } from './types'

type OwnedTokenRowProps = {
    index: number
    listing: Listing | null
    isSelected: boolean
    onToggle: () => void
}

export const OwnedTokenRow = ({ index, listing, isSelected, onToggle }: OwnedTokenRowProps) => {
    return (
        <div
            className={`grid grid-cols-5 gap-4 px-4 py-3 border-b border-lines hover:bg-hover transition-colors ${isSelected ? 'bg-hover' : ''
                }`}
        >
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-light cursor-pointer"
                    checked={isSelected}
                    onChange={onToggle}
                />
                <span className="text-white font-semibold text-sm">
                    {listing ? `#${listing.token_id}` : `#Token ${index + 1}`}
                </span>
            </div>
            <div className="text-sm font-semibold flex items-center text-text justify-center rounded-md">
                {listing ? (
                    <span className="bg-light text-white text-xs font-semibold px-2 py-1 rounded">
                        Listed
                    </span>
                ) : (
                    <span className="bg-light text-white text-xs font-semibold px-2 py-1 rounded">
                        Not Listed
                    </span>
                )}
            </div>
            <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md`}>
                {listing ? listing.prices.base_price.toFixed(6) : ''}
            </div>
            <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md`}>
                {listing ? `$${listing.prices.base_price_usd.toFixed(4)}` : ''}
            </div>
            <div className={`text-sm font-semibold flex items-center text-text bg-light justify-center rounded-md gap-2`}>
                {listing ? listing.currency : ''}
            </div>
        </div>
    )
}