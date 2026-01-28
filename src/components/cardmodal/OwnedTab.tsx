import { ListingsResponse, Listing } from './types'
import { OwnedTokenRow } from './OwnedTokenRow'

type OwnedTabProps = {
    youOwn: number
    listingsData: ListingsResponse | null
    newWallet: string | null
    selectedTokens: Set<number>
    setSelectedTokens: React.Dispatch<React.SetStateAction<Set<number>>>
    setActiveTab: (tab: 'details' | 'buy' | 'owned' | 'activity') => void
}

export const OwnedTab = ({
    youOwn,
    listingsData,
    newWallet,
    selectedTokens,
    setSelectedTokens,
    setActiveTab,
}: OwnedTabProps) => {
    const getUserListings = (): Listing[] => {
        if (!listingsData || !newWallet) return []
        return listingsData.all_listings.filter(
            listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
        )
    }

    const selectAllTokens = () => {
        setSelectedTokens(new Set(Array.from({ length: youOwn }, (_, i) => i)))
    }

    const selectAllNonListed = () => {
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

    const deselectAllTokens = () => {
        setSelectedTokens(new Set())
    }

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

    const userListings = getUserListings()

    return (
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
                        {Array.from({ length: youOwn }).map((_, index) => (
                            <OwnedTokenRow
                                key={index}
                                index={index}
                                listing={userListings[index] || null}
                                isSelected={selectedTokens.has(index)}
                                onToggle={() => toggleTokenSelection(index)}
                            />
                        ))}
                    </div>

                    {/* Actions Footer */}
                    <div className="px-4 py-3 bg-background border-t border-lines flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                            {youOwn} token{youOwn > 1 ? 's' : ''} owned • {userListings.length} listed
                        </span>
                        <button
                            onClick={() => setActiveTab('buy')}
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
    )
}