// import { Listing } from './types'
// import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

// type ListingTableRowProps = {
//     listing: Listing
//     newWallet: string | null
//     loggedWallet: string | null
// }

// export const ListingTableRow = ({ listing, newWallet, loggedWallet }: ListingTableRowProps) => {
//     const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
//     const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

//     return (
//         <div
//             className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${isUserListing ? 'bg-light' : ''
//                 }`}
//         >
//             <div className="flex items-center gap-2">
//                 <img
//                     src={getCurrencyIcon(listing.currency)}
//                     alt={listing.currency}
//                     className="w-4 h-4 rounded-full"
//                     onError={(e) => {
//                         e.currentTarget.style.display = 'none'
//                     }}
//                 />
//                 <div>
//                     <div className="text-white font-semibold text-sm">
//                         {listing.prices.total_with_fees.toFixed(4)} {listing.currency}
//                     </div>
//                     <div className="text-gray-400 text-xs">
//                         ${listing.prices.total_usd.toFixed(2)}
//                     </div>
//                 </div>
//             </div>
//             <div className="text-white text-sm flex items-center">
//                 1
//                 {isUserListing && (
//                     <span className="ml-2 text-xs text-blue-400">(You)</span>
//                 )}
//             </div>
//             <div className="text-gray-400 text-sm flex items-center">
//                 {getTimeUntilExpiration(listing.end_at)}
//             </div>
//             <div className="flex items-center justify-end">
//                 {isUserListing && canCancel ? (
//                     <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer">
//                         Cancel
//                     </button>
//                 ) : (
//                     <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer">
//                         Buy
//                     </button>
//                 )}
//             </div>
//         </div>
//     )
// }

import { useState } from 'react'
import { Listing } from './types'
import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

type ListingTableRowProps = {
    listing: Listing
    newWallet: string | null
    loggedWallet: string | null
}

export const ListingTableRow = ({ listing, newWallet, loggedWallet }: ListingTableRowProps) => {
    const [isPurchasing, setIsPurchasing] = useState(false)
    const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
    const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

    const handleBuy = async () => {
        if (!loggedWallet) {
            alert('Please connect your wallet first')
            return
        }

        setIsPurchasing(true)
        try {
            console.log('🛒 Preparing purchase for order:', listing.listing_id)

            // Call your prepare endpoint
            const response = await fetch('/api/orders/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [listing.listing_id],
                    walletAddress: loggedWallet,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to prepare purchase')
            }

            const data = await response.json()
            console.log('✅ Purchase prepared:', data)

            // TODO: Execute the blockchain actions here
            // For now, just show what would happen
            alert(`Purchase Ready!\n\nPrice: ${data.price} wei\nFee: ${data.fee} wei\nTotal: ${data.totalWithFee} wei\n\nActions to execute: ${data.actions.length}`)

            // In production, you would execute the actions:
            // await executeWalletActions(data.actions)
            // window.location.reload()

        } catch (error: any) {
            console.error('❌ Purchase failed:', error)
            alert(`Purchase failed: ${error.message}`)
        } finally {
            setIsPurchasing(false)
        }
    }

    return (
        <div
            className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${isUserListing ? 'bg-light' : ''
                }`}
        >
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
            <div className="text-white text-sm flex items-center">
                1
                {isUserListing && (
                    <span className="ml-2 text-xs text-blue-400">(You)</span>
                )}
            </div>
            <div className="text-gray-400 text-sm flex items-center">
                {getTimeUntilExpiration(listing.end_at)}
            </div>
            <div className="flex items-center justify-end">
                {isUserListing && canCancel ? (
                    <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer">
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleBuy}
                        disabled={isPurchasing}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPurchasing ? 'Buying...' : 'Buy'}
                    </button>
                )}
            </div>
        </div>
    )
}
