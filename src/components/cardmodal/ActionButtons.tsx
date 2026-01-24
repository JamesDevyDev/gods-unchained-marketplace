// import { useState } from 'react'
// import { Stack, ListingsResponse } from './types'

// type ActionButtonsProps = {
//     card: Stack
//     listingsData: ListingsResponse | null
//     newWallet: string | null
//     loggedWallet: string | null
// }

// export const ActionButtons = ({ card, listingsData, newWallet, loggedWallet }: ActionButtonsProps) => {
//     const [isBuying, setIsBuying] = useState(false)

//     const userHasListings = () => {
//         if (!listingsData || !newWallet) return false
//         return listingsData.all_listings.some(
//             listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
//         )
//     }

//     const getUserListings = () => {
//         if (!listingsData || !newWallet) return []
//         return listingsData.all_listings.filter(
//             listing => listing.seller_address.toLowerCase() === newWallet.toLowerCase()
//         )
//     }

//     const handleBuyNow = async () => {
//         if (!loggedWallet) {
//             alert('Please connect your wallet first')
//             return
//         }

//         if (!listingsData?.cheapest_listing) {
//             alert('No listings available')
//             return
//         }

//         setIsBuying(true)
//         try {
//             console.log('Actions Button : 🛒 Buying cheapest listing:', listingsData.cheapest_listing.listing_id)
//             console.log(listingsData.cheapest_listing.token_id)

//             const response = await fetch('/api/buy/prepare', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     orderIds: [listingsData.cheapest_listing.listing_id],
//                     walletAddress: loggedWallet,
//                 }),
//             })

//             if (!response.ok) {
//                 const errorData = await response.json()
//                 throw new Error(errorData.error || 'Failed to prepare purchase')
//             }

//             const data = await response.json()
//             console.log(data) // Ito yung ibabala sa metamask


//         } catch (error: any) {
//             console.error('❌ Purchase failed:', error)
//             alert(`Purchase failed: ${error.message}`)
//         } finally {
//             setIsBuying(false)
//         }
//     }

//     const hasUserListings = userHasListings()
//     const userListings = getUserListings()

//     return (
//         <div className="flex flex-col sm:flex-row gap-3 mb-6">
//             {hasUserListings && loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase() ? (
//                 <>
//                     <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
//                         Cancel Listing ({userListings.length})
//                     </button>
//                     <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
//                         Edit Listing
//                     </button>
//                 </>
//             ) : (
//                 <>
//                     <button
//                         onClick={handleBuyNow}
//                         disabled={isBuying || !listingsData?.cheapest_listing}
//                         className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {isBuying ? 'Buying...' : 'Buy Now'}
//                     </button>
//                     <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
//                         Make Offer
//                     </button>
//                 </>
//             )}
//         </div>
//     )
// }

import { useState } from 'react'
import { Stack, ListingsResponse } from './types'

declare global {
    interface Window {
        ethereum?: any
    }
}

type ActionButtonsProps = {
    card: Stack
    listingsData: ListingsResponse | null
    newWallet: string | null
    loggedWallet: string | null
}

interface PrepareResponse {
    success: boolean
    mode: string
    orderId: string
    actions: any[]
    price: string
    fee: string
    feePercentage: number
    totalWithFee: string
}

// Progress Modal Component
const PurchaseProgressModal = ({
    isOpen
}: {
    isOpen: boolean
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Transaction is being processed
                </h2>

                <div className="flex justify-center mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>

                <p className="text-gray-400 text-center">
                    Please wait while your transaction is being confirmed on the blockchain.
                </p>
            </div>
        </div>
    )
}

// Success Modal Component
const SuccessModal = ({
    isOpen,
    tokenId,
    onClose
}: {
    isOpen: boolean
    tokenId: string
    onClose: () => void
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    Purchase Successful! 🎉
                </h2>

                <div className="rounded-lg p-4 mb-6">
                    <p className="text-gray-400 text-sm text-center mb-2">NFT Token ID</p>
                    <p className="text-white text-lg font-semibold text-center">{tokenId}</p>
                </div>

                <p className="text-gray-400 text-center mb-6">
                    Your NFT has been successfully transferred to your wallet!
                </p>

                <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

// Error Modal Component
const ErrorModal = ({
    isOpen,
    title,
    message,
    onClose
}: {
    isOpen: boolean
    title: string
    message: string
    onClose: () => void
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    {title}
                </h2>

                <div className="rounded-lg p-4 mb-6">
                    <p className="text-white text-center">{message}</p>
                </div>

                <button
                    onClick={onClose}
                    className="cursor-pointer w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export const ActionButtons = ({ card, listingsData, newWallet, loggedWallet }: ActionButtonsProps) => {
    const [isBuying, setIsBuying] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [purchasedTokenId, setPurchasedTokenId] = useState('')

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

    const executeTransaction = async (action: any, fromAddress: string): Promise<string> => {
        const txParams: any = {
            from: fromAddress,
            to: action.to,
            data: action.data,
        }

        if (action.value && action.value !== '0x0') {
            txParams.value = action.value
        }

        if (action.gasLimit) {
            txParams.gas = action.gasLimit
        }

        console.log('Transaction parameters:', txParams)

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
        })

        return txHash
    }

    const signMessage = async (action: any, fromAddress: string): Promise<string> => {
        const signature = await window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [fromAddress, JSON.stringify(action.message)],
        })

        return signature
    }

    const waitForTransaction = async (txHash: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let attempts = 0
            const maxAttempts = 60

            const checkTransaction = async () => {
                try {
                    const receipt = await window.ethereum!.request({
                        method: 'eth_getTransactionReceipt',
                        params: [txHash],
                    })

                    if (receipt !== null) {
                        if (receipt.status === '0x1') {
                            console.log('✅ Transaction confirmed!')
                            resolve()
                        } else {
                            console.error('❌ Transaction failed')
                            reject(new Error('Transaction failed'))
                        }
                    } else {
                        attempts++
                        if (attempts < maxAttempts) {
                            setTimeout(checkTransaction, 1000)
                        } else {
                            console.log('⏱️ Transaction pending (timeout reached)')
                            resolve()
                        }
                    }
                } catch (error) {
                    console.error('Error checking transaction:', error)
                    reject(error)
                }
            }

            checkTransaction()
        })
    }

    const handleBuyNow = async () => {
        if (!loggedWallet) {
            setErrorTitle('Wallet Not Connected')
            setErrorMessage('Please connect your wallet first to make a purchase.')
            setShowError(true)
            return
        }

        if (!window.ethereum) {
            setErrorTitle('MetaMask Not Found')
            setErrorMessage('MetaMask is not installed. Please install MetaMask to continue.')
            setShowError(true)
            window.open('https://metamask.io/download/', '_blank')
            return
        }

        if (!listingsData?.cheapest_listing) {
            setErrorTitle('No Listings Available')
            setErrorMessage('There are currently no listings available for this item.')
            setShowError(true)
            return
        }

        setIsBuying(true)

        try {
            console.log('🛒 Preparing purchase for order:', listingsData.cheapest_listing.listing_id)
            console.log('Token ID:', listingsData.cheapest_listing.token_id)

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

            const data: PrepareResponse = await response.json()
            console.log('Prepared data:', data)

            if (!data.success) {
                throw new Error('Preparation failed')
            }

            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
            if (currentChainId.toLowerCase() !== '0x343b') {
                setErrorTitle('Wrong Network')
                setErrorMessage('Please switch to Immutable zkEVM network in your wallet.')
                setShowError(true)
                setIsBuying(false)
                return
            }

            console.log(`📋 Executing ${data.actions.length} actions...`)

            for (let i = 0; i < data.actions.length; i++) {
                const action = data.actions[i]
                console.log(`🔄 Action ${i + 1}/${data.actions.length}:`, action.type)

                switch (action.type) {
                    case 'TRANSACTION':
                        const txHash = await executeTransaction(action, loggedWallet)
                        console.log(`✅ Transaction ${i + 1} sent:`, txHash)

                        await waitForTransaction(txHash)
                        console.log(`✅ Transaction ${i + 1} confirmed`)
                        break

                    case 'SIGNABLE':
                        const signature = await signMessage(action, loggedWallet)
                        console.log(`✅ Message ${i + 1} signed:`, signature)
                        break

                    default:
                        console.warn(`⚠️ Unknown action type: ${action.type}`)
                }
            }

            console.log('✅ All actions completed successfully!')

            setPurchasedTokenId(listingsData.cheapest_listing.token_id)
            setIsBuying(false)
            setShowSuccess(true)

        } catch (error: any) {
            console.log('❌ Purchase failed:', error)
            setIsBuying(false)

            if (error.code === 4001) {
                setErrorTitle('Transaction Rejected')
                setErrorMessage('You rejected the transaction in your wallet.')
            } else if (error.code === -32603) {
                setErrorTitle('Transaction Failed')
                setErrorMessage('Transaction failed. You may have insufficient funds or gas.')
            } else if (error.code === -32602) {
                setErrorTitle('Invalid Parameters')
                setErrorMessage('Invalid transaction parameters. Please try again.')
            } else {
                setErrorTitle('Purchase Failed')
                setErrorMessage(error.message || 'An unknown error occurred. Please try again.')
            }

            setShowError(true)
        }
    }

    const handleSuccessClose = () => {
        setShowSuccess(false)
    }

    const handleErrorClose = () => {
        setShowError(false)
    }

    const hasUserListings = userHasListings()
    const userListings = getUserListings()

    return (
        <>
            <PurchaseProgressModal isOpen={isBuying} />

            <SuccessModal
                isOpen={showSuccess}
                tokenId={purchasedTokenId}
                onClose={handleSuccessClose}
            />

            <ErrorModal
                isOpen={showError}
                title={errorTitle}
                message={errorMessage}
                onClose={handleErrorClose}
            />

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
        </>
    )
}