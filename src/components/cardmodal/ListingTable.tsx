import { useState, useEffect } from 'react'
import { Listing } from './types'
import { ListingTableRow } from './ListingTableRow'

type ListingTableProps = {
    listings: Listing[]
    isLoading: boolean
    newWallet: string | null
    loggedWallet: string | null
}

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
    show: boolean
    message: string
    type: ToastType
}

// Toast Component
const Toast = ({
    message,
    type,
    onClose
}: {
    message: string
    type: ToastType
    onClose: () => void
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000) // Auto-hide after 3 seconds

        return () => clearTimeout(timer)
    }, [onClose])

    const bgColor = type === 'success'
        ? 'bg-green-600'
        : type === 'error'
            ? 'bg-red-600'
            : 'bg-blue-600'

    const icon = type === 'success' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : type === 'error' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )

    return (
        <div className="fixed top-4 left-4 z-[100] animate-slide-in">
            <div className="relative bg-light border border-lines text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md overflow-hidden backdrop-blur-sm">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <p className="cursor-pointer flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:bg-white/10 rounded-full p-1.5 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Close notification"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Color indicator bar on the right */}
                <div className={`${bgColor} absolute h-full w-3 right-0 top-0 rounded-r-lg`} />
            </div>
        </div>
    )
}

export const ListingTable = ({ listings, isLoading, newWallet, loggedWallet }: ListingTableProps) => {
    // Manage our own internal state for filtering out purchased/cancelled listings
    const [displayedListings, setDisplayedListings] = useState<Listing[]>(listings)
    const [removedListingIds, setRemovedListingIds] = useState<Set<string>>(new Set())

    // Toast state
    const [toast, setToast] = useState<ToastState>({
        show: false,
        message: '',
        type: 'success'
    })

    // Update displayed listings when the prop changes
    useEffect(() => {
        setDisplayedListings(
            listings.filter(listing => !removedListingIds.has(listing.listing_id))
        )
    }, [listings, removedListingIds])

    // Show toast helper
    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ show: true, message, type })
    }

    // Handler to remove listing after successful purchase
    const handlePurchaseSuccess = (listingId: string) => {
        console.log('Removing purchased listing from UI:', listingId)
        setRemovedListingIds(prev => new Set(prev).add(listingId))
        setDisplayedListings(prev =>
            prev.filter(listing => listing.listing_id !== listingId)
        )
        showToast('NFT purchased successfully!', 'success')
    }

    // Handler to remove listing after successful cancellation
    const handleCancelSuccess = (listingId: string) => {
        console.log('Removing cancelled listing from UI:', listingId)
        setRemovedListingIds(prev => new Set(prev).add(listingId))
        setDisplayedListings(prev =>
            prev.filter(listing => listing.listing_id !== listingId)
        )
        showToast('Listing cancelled successfully!', 'success')
    }

    return (
        <>
            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <div className="lg:border bg-background border-lines rounded-lg overflow-hidden">
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
                                onCancelSuccess={handleCancelSuccess}
                            />
                        ))
                    ) : (
                        <div className="px-4 py-12 text-center text-gray-400 text-sm">
                            No listings available
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}