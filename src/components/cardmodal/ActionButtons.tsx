import { useState } from 'react'
import { Stack, ListingsResponse } from './types'

type ActionButtonsProps = {
    card: Stack
    listingsData: ListingsResponse | null
    newWallet: string | null
    loggedWallet: string | null
}

export const ActionButtons = ({ card, listingsData, newWallet, loggedWallet }: ActionButtonsProps) => {
    const [isBuying, setIsBuying] = useState(false)

    const userHasListings = () => {
        if (!listingsData || !newWallet) return false
        return listingsData.all_listings.some(
            listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
        )
    }

    const getUserListings = () => {
        if (!listingsData || !newWallet) return []
        return listingsData.all_listings.filter(
            listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
        )
    }

    const handleBuyNow = async () => {
        if (!loggedWallet) {
            alert('Please connect your wallet first')
            return
        }

        if (!listingsData?.cheapest_listing) {
            alert('No listings available')
            return
        }

        setIsBuying(true)
        try {
            console.log('Actions Button : 🛒 Buying cheapest listing:', listingsData.cheapest_listing.listing_id)
            console.log(listingsData.cheapest_listing.token_id)

            const response = await fetch('/api/buy/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [listingsData.cheapest_listing.listing_id],
                    walletAddress: loggedWallet,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to prepare purchase')
            }

            const data = await response.json()
            console.log(data) // Ito yung ibabala sa metamask


        } catch (error: any) {
            console.error('❌ Purchase failed:', error)
            alert(`Purchase failed: ${error.message}`)
        } finally {
            setIsBuying(false)
        }
    }

    const hasUserListings = userHasListings()
    const userListings = getUserListings()

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {hasUserListings && loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase() ? (
                <>
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                        Cancel Listing ({userListings.length})
                    </button>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                        Edit Listing
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={handleBuyNow}
                        disabled={isBuying || !listingsData?.cheapest_listing}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBuying ? 'Buying...' : 'Buy Now'}
                    </button>
                    <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                        Make Offer
                    </button>
                </>
            )}
        </div>
    )
}