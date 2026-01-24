import { useState, useEffect } from 'react'
import { Listing } from './types'
import { ListingTableRow } from './ListingTableRow'

type ListingTableProps = {
    listings: Listing[]
    isLoading: boolean
    newWallet: string | null
    loggedWallet: string | null
}

export const ListingTable = ({ listings, isLoading, newWallet, loggedWallet }: ListingTableProps) => {
    // Manage our own internal state for filtering out purchased listings
    const [displayedListings, setDisplayedListings] = useState<Listing[]>(listings)
    const [purchasedListingIds, setPurchasedListingIds] = useState<Set<string>>(new Set())

    // Update displayed listings when the prop changes
    useEffect(() => {
        setDisplayedListings(
            listings.filter(listing => !purchasedListingIds.has(listing.listing_id))
        )
    }, [listings, purchasedListingIds])

    // Handler to remove listing after successful purchase
    const handlePurchaseSuccess = (listingId: string) => {
        console.log('Removing listing from UI:', listingId)
        setPurchasedListingIds(prev => new Set(prev).add(listingId))
        setDisplayedListings(prev =>
            prev.filter(listing => listing.listing_id !== listingId)
        )
    }

    return (
        <div className="bg-background border border-lines rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-[#0f1117] border-b border-lines text-gray-400 text-xs font-semibold uppercase">
                <div>Price</div>
                <div>Amount</div>
                <div>Expires In</div>
                <div></div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="px-4 py-12 text-center text-gray-400 text-sm">
                        Loading listings...
                    </div>
                ) : displayedListings.length > 0 ? (
                    displayedListings.map((listing) => (
                        <ListingTableRow
                            key={listing.listing_id}
                            listing={listing}
                            newWallet={newWallet}
                            loggedWallet={loggedWallet}
                            onPurchaseSuccess={handlePurchaseSuccess}
                        />
                    ))
                ) : (
                    <div className="px-4 py-12 text-center text-gray-400 text-sm">
                        No listings available
                    </div>
                )}
            </div>
        </div>
    )
}