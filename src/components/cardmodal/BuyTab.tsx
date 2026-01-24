import { ListingsResponse } from './types'
import { ListingCard } from './ListingCard'
import { ListingTable } from './ListingTable'

type BuyTabProps = {
    listingsData: ListingsResponse | null
    isLoadingListings: boolean
    currencyFilter: string
    setCurrencyFilter: (currency: string) => void
    newWallet: string | null
    loggedWallet: string | null
}

export const BuyTab = ({
    listingsData,
    isLoadingListings,
    currencyFilter,
    setCurrencyFilter,
    newWallet,
    loggedWallet,
}: BuyTabProps) => {
    const getFilteredListings = () => {
        if (!listingsData) return []

        if (currencyFilter === 'All') {
            return listingsData.all_listings
        }

        return listingsData.by_currency[currencyFilter as keyof typeof listingsData.by_currency] || []
    }

    const filteredListings = getFilteredListings()

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div></div>
                <select
                    className="bg-light text-white px-3 py-1.5 rounded text-sm cursor-pointer"
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                >
                    <option>All</option>
                    <option>ETH</option>
                    <option>USDC</option>
                    <option>GODS</option>
                    <option>IMX</option>
                </select>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <ListingTable
                    listings={filteredListings}
                    isLoading={isLoadingListings}
                    newWallet={newWallet}
                    loggedWallet={loggedWallet}
                />
            </div> 

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
                {isLoadingListings ? (
                    <div className="bg-background border border-lines rounded-lg p-8 text-center text-gray-400 text-sm">
                        Loading listings...
                    </div>
                ) : filteredListings.length > 0 ? (
                    filteredListings.map((listing) => (
                        <ListingCard
                            key={listing.listing_id}
                            listing={listing}
                            newWallet={newWallet}
                            loggedWallet={loggedWallet}
                        />
                    ))
                ) : (
                    <div className="bg-background border border-lines rounded-lg p-8 text-center text-gray-400 text-sm">
                        No listings available
                    </div>
                )}
            </div>
        </div>
    )
}