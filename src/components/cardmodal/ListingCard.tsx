import { useState } from 'react'
import { Listing } from './types'
import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

declare global {
    interface Window {
        ethereum?: any
    }
}

type ListingCardProps = {
    listing: Listing
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full border border-lines">
                <h2 className="text-xl font-bold text-white mb-4 text-center">
                    Transaction is being processed
                </h2>

                <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>

                <p className="text-gray-400 text-sm text-center">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full border border-lines">
                <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-3 text-center">
                    Purchase Successful! 🎉
                </h2>

                <div className="rounded-lg p-3 mb-4">
                    <p className="text-gray-400 text-xs text-center mb-1">NFT Token ID</p>
                    <p className="text-white text-base font-semibold text-center">{tokenId}</p>
                </div>

                <p className="text-gray-400 text-sm text-center mb-4">
                    Your NFT has been successfully transferred to your wallet!
                </p>

                <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full border border-lines">
                <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-3 text-center">
                    {title}
                </h2>

                <div className="rounded-lg p-3 mb-4">
                    <p className="text-white text-sm text-center">{message}</p>
                </div>

                <button
                    onClick={onClose}
                    className="cursor-pointer w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export const ListingCard = ({ listing, newWallet, loggedWallet }: ListingCardProps) => {
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const isUserListing = newWallet && listing.seller_address.toLowerCase() === newWallet.toLowerCase()
    const canCancel = loggedWallet && newWallet && loggedWallet.toLowerCase() === newWallet.toLowerCase()

    const handleBuy = async () => {
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

        setIsPurchasing(true)

        try {
            console.log('🛒 Preparing purchase for order:', listing.listing_id)
            console.log('Token ID:', listing.token_id)

            const response = await fetch('/api/buy/prepare', {
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
                setIsPurchasing(false)
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

            setIsPurchasing(false)
            setShowSuccess(true)

        } catch (error: any) {
            console.log('❌ Purchase failed:', error)
            setIsPurchasing(false)

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

    const handleSuccessClose = () => {
        setShowSuccess(false)
        // window.location.reload()
    }

    const handleErrorClose = () => {
        setShowError(false)
    }

    return (
        <>
            <PurchaseProgressModal isOpen={isPurchasing} />

            <SuccessModal
                isOpen={showSuccess}
                tokenId={listing.token_id}
                onClose={handleSuccessClose}
            />

            <ErrorModal
                isOpen={showError}
                title={errorTitle}
                message={errorMessage}
                onClose={handleErrorClose}
            />

            <div className={`bg-background border border-lines rounded-lg p-3 ${isUserListing ? 'border-blue-500' : ''}`}>
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
        </>
    )
}