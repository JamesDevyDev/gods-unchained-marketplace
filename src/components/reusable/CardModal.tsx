'use client'
import { useEffect, useState } from 'react'
import useCommonStore from '@/utils/zustand/useCommonStore'
import { CardModalHeader } from '@/components/cardmodal/CardModalHeader'
import { CardImage } from '@/components/cardmodal/CardImage'
import { PriceDisplay } from '@/components/cardmodal/PriceDisplay'
import { ActionButtons } from '@/components/cardmodal/ActionButtons'
import { TabNavigation } from '@/components/cardmodal/TabNavigation'
import { DetailsTab } from '@/components/cardmodal/DetailsTab'
import { BuyTab } from '@/components/cardmodal/BuyTab'
import { OwnedTab } from '@/components/cardmodal/OwnedTab'
import { ActivityTab } from '@/components/cardmodal/ActivityTab'
import { Stack, ListingsResponse } from '@/components/cardmodal/types'

type Props = {
    card: Stack | null
    getRarityColor: (rarity: string) => string
    formatPrice: (price: number | null) => string
    onClose: () => void
    selectedCurrency: string
    contract_address: string
}

const CardModal = ({
    card,
    getRarityColor,
    formatPrice,
    onClose,
    selectedCurrency,
    contract_address,
}: Props) => {
    const { loggedWallet } = useCommonStore()

    const [newWallet, setWallet] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'details' | 'buy' | 'owned' | 'activity'>('details')
    const [listingsData, setListingsData] = useState<ListingsResponse | null>(null)
    const [isLoadingListings, setIsLoadingListings] = useState(false)
    const [currencyFilter, setCurrencyFilter] = useState<string>('All')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set())

    // ⭐ NEW: Function to fetch listings (extracted so it can be called on demand)
    const fetchListings = async () => {
        if (!card?.metadata_id || !contract_address) return

        setIsLoadingListings(true)
        try {
            const response = await fetch(
                `https://immutable-marketplace.onrender.com/api/collections/${contract_address}/listings/${card.metadata_id}`
            )
            if (response.ok) {
                const data = await response.json()
                setListingsData(data)
                console.log('✅ Listings refreshed:', data) //Find the listed here
            }
        } catch (err) {
            console.error('Failed to fetch listings:', err)
        } finally {
            setIsLoadingListings(false)
        }
    }

    // Fetch listings when card changes
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const walletAddress = searchParams.get('wallet')
        setWallet(walletAddress)

        if (!card?.metadata_id || !contract_address) return

        setIsLoading(true)
        fetchListings().then(() => {
            setIsLoading(false)
        })
    }, [card?.metadata_id, contract_address])

    // Reset selected tokens when switching tabs
    useEffect(() => {
        if (activeTab !== 'owned') {
            setSelectedTokens(new Set())
        }
    }, [activeTab])

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

    // ⭐ NEW: Handler for when listings are successfully created
    const handleListingSuccess = () => {
        console.log('🔄 Listing successful, refreshing data...')
        fetchListings() // This will update listingsData state, which will automatically update PriceDisplay

        // If we're not already on the "buy" tab, switch to it to show the new listing
        if (activeTab !== 'buy') {
            setActiveTab('buy')
        }
    }

    if (!card) return null

    const youOwn = card.quantity ?? 0

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-none sm:rounded-lg w-full h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-[1600px] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <CardModalHeader name={card.name} onClose={onClose} />

                <div className="flex-1 overflow-y-auto">

                    <div className="flex flex-col lg:flex-row w-full">
                        <CardImage image={card.image} name={card.name} />

                        <div className="flex-1 bg-background p-4 sm:p-6">
                            <PriceDisplay
                                card={card}
                                selectedCurrency={selectedCurrency}
                                formatPrice={formatPrice}
                                youOwn={youOwn}
                                listingsData={listingsData}
                            />

                            <ActionButtons
                                card={card}
                                listingsData={listingsData}
                                newWallet={newWallet}
                                loggedWallet={loggedWallet}
                                onListingSuccess={handleListingSuccess}
                            />

                            <TabNavigation
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                showWalletTabs={!!newWallet}
                            />

                            <div className="overflow-y-auto">
                                {activeTab === 'details' && (
                                    <DetailsTab
                                        card={card}
                                        getRarityColor={getRarityColor}
                                    />
                                )}

                                {activeTab === 'buy' && (
                                    <BuyTab
                                        listingsData={listingsData}
                                        isLoadingListings={isLoadingListings}
                                        currencyFilter={currencyFilter}
                                        setCurrencyFilter={setCurrencyFilter}
                                        newWallet={newWallet}
                                        loggedWallet={loggedWallet}
                                    />
                                )}

                                {activeTab === 'owned' && (
                                    <OwnedTab
                                        youOwn={youOwn}
                                        listingsData={listingsData}
                                        newWallet={newWallet}
                                        selectedTokens={selectedTokens}
                                        setSelectedTokens={setSelectedTokens}
                                        setActiveTab={setActiveTab}
                                    />
                                )}

                                {activeTab === 'activity' && <ActivityTab />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardModal