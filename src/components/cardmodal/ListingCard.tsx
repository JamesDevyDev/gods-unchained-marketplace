import { useState } from 'react'
import { Listing } from './types'
import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

type ListingCardProps = {
    listing: Listing
    newWallet: string | null
    loggedWallet: string | null
}

export const ListingCard = ({ listing, newWallet, loggedWallet }: ListingCardProps) => {
    const [isPurchasing, setIsPurchasing] = useState(false)
    const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
    const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

    const handleBuy = async () => {
        if (!loggedWallet) {
            alert('Please connect your wallet first')
            return
        }

        setIsPurchasing(true)
        console.log('🛒 Preparing purchase for order:', listing.listing_id)
        console.log(listing.token_id)

        // try {
        // const response = await fetch('/api/buy/prepare', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         orderIds: [listing.listing_id],
        //         walletAddress: loggedWallet,
        //     }),
        // })

        // if (!response.ok) {
        //     const errorData = await response.json()
        //     throw new Error(errorData.error || 'Failed to prepare purchase')
        // }

        // const data = await response.json()
        // console.log('✅ Purchase prepared:', data)

        // alert(`Purchase Ready!\n\nPrice: ${data.price} wei\nFee: ${data.fee} wei\nTotal: ${data.totalWithFee} wei\n\nActions to execute: `)

        // } catch (error: any) {
        //     console.error('❌ Purchase failed:', error)
        //     alert(`Purchase failed: ${error.message}`)
        // } finally {
        //     setIsPurchasing(false)
        // }
    }

    return (
        <div className={`bg-background border bg-red-500 border-lines rounded-lg p-3 ${isUserListing ? 'border-blue-500' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <img
                        src={getCurrencyIcon(listing.currency)}
                        alt={listing.currency}
                        className="w-4 h-4 rounded-full"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                    <div>
                        <div className="text-white font-semibold text-sm">
                            {listing.prices.total_with_fees.toFixed(4)} {listing.currency}
                        </div>
                        <div className="text-gray-400 text-xs">
                            ${listing.prices.total_usd.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-gray-400 text-xs">Amount</div>
                    <div className="text-white text-sm font-semibold">
                        1 {isUserListing && <span className="text-blue-400">(You)</span>}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-gray-400 text-xs">Expires In</div>
                    <div className="text-gray-300 text-sm">
                        {getTimeUntilExpiration(listing.end_at)}
                    </div>
                </div>
                {isUserListing && canCancel ? (
                    <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer">
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleBuy}
                        disabled={isPurchasing}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPurchasing ? 'Buying...' : 'Buy'}
                    </button>
                )}
            </div>
        </div>
    )
} 
