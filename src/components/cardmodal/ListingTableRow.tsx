import { useState } from 'react'
import { Listing } from './types'
import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

declare global {
    interface Window {
        ethereum?: any
    }
}

type ListingTableRowProps = {
    listing: Listing
    newWallet: string | null
    loggedWallet: string | null
    onPurchaseSuccess?: (listingId: string) => void
    onCancelSuccess?: (listingId: string) => void
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

interface PrepareCancelResponse {
    success: boolean
    mode: "single" | "bulk"
    orderId?: string
    orderIds?: string[]
    requiresSignature: true
    message: any
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

// Cancel Progress Modal Component
const CancelProgressModal = ({
    isOpen
}: {
    isOpen: boolean
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Cancelling Order
                </h2>

                <div className="flex justify-center mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
                </div>

                <p className="text-gray-400 text-center">
                    Please sign the message in your wallet to cancel this listing.
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

                <div className=" rounded-lg p-4 mb-6">
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

// Cancel Success Modal Component
const CancelSuccessModal = ({
    isOpen,
    orderId,
    onClose
}: {
    isOpen: boolean
    orderId: string
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
                    Listing Cancelled Successfully! ✅
                </h2>

                <div className=" rounded-lg p-4 mb-6">
                    <p className="text-gray-400 text-sm text-center mb-2">Order ID</p>
                    <p className="text-white text-sm font-semibold text-center break-all">{orderId}</p>
                </div>

                <p className="text-gray-400 text-center mb-6">
                    Your listing has been removed from the marketplace.
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

                <div className=" rounded-lg p-4 mb-6">
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

export const ListingTableRow = ({ listing, newWallet, loggedWallet, onPurchaseSuccess, onCancelSuccess }: ListingTableRowProps) => {
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    const [showSuccess, setShowSuccess] = useState(false)
    const [showCancelSuccess, setShowCancelSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const isUserListing = loggedWallet && listing.seller_address.toLowerCase() === loggedWallet.toLowerCase()
    const canCancel = isUserListing  // If it's your listing, you can cancel it

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
            // console.log('🛒 Preparing purchase for order:', listing.listing_id)
            // console.log('Token ID:', listing.token_id)

            const response = await fetch('/api/listing/buy', {
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
            // console.log('Prepared data:', data)

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

            // console.log(`📋 Executing ${data.actions.length} actions...`)

            for (let i = 0; i < data.actions.length; i++) {
                const action = data.actions[i]
                // console.log(`🔄 Action ${i + 1}/${data.actions.length}:`, action.type)

                switch (action.type) {
                    case 'TRANSACTION':
                        const txHash = await executeTransaction(action, loggedWallet)
                        // console.log(`✅ Transaction ${i + 1} sent:`, txHash)

                        await waitForTransaction(txHash)
                        // console.log(`✅ Transaction ${i + 1} confirmed`)
                        break

                    case 'SIGNABLE':
                        const signature = await signMessage(action, loggedWallet)
                        // console.log(`✅ Message ${i + 1} signed:`, signature)
                        break

                    default:
                        console.warn(`⚠️ Unknown action type: ${action.type}`)
                }
            }

            // console.log('✅ All actions completed successfully!')

            setIsPurchasing(false)
            setShowSuccess(true)

            // Call the callback to remove the listing from the UI
            if (onPurchaseSuccess) {
                onPurchaseSuccess(listing.listing_id)
            }

        } catch (error: any) {
            // console.log('❌ Purchase failed:', error)
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

    const handleCancel = async () => {
        if (!loggedWallet) {
            setErrorTitle('Wallet Not Connected')
            setErrorMessage('Please connect your wallet first.')
            setShowError(true)
            return
        }

        if (!window.ethereum) {
            setErrorTitle('MetaMask Not Found')
            setErrorMessage('MetaMask is not installed. Please install MetaMask to continue.')
            setShowError(true)
            return
        }

        setIsCancelling(true)

        try {
            // console.log('🚫 Starting cancellation process...')
            // console.log('Order ID:', listing.listing_id)
            // console.log('Wallet Address:', loggedWallet)

            // Step 1: Prepare cancellation (POST) - get message to sign
            // console.log('📤 Step 1: Preparing cancellation (POST)...')
            const prepareResponse = await fetch('/api/listing/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [listing.listing_id],
                    walletAddress: loggedWallet,
                }),
            })

            // console.log('Response status:', prepareResponse.status)

            const prepareData = await prepareResponse.json()
            // console.log('Response data:', prepareData)

            if (!prepareResponse.ok) {
                throw new Error(prepareData.error || `HTTP ${prepareResponse.status}: Failed to prepare cancellation`)
            }

            if (!prepareData.success || !prepareData.requiresSignature) {
                throw new Error('Invalid preparation response: ' + JSON.stringify(prepareData))
            }

            // console.log('✅ Preparation successful')
            // console.log('Message to sign:', prepareData.message)

            // Check network
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
            // console.log('Current chain ID:', currentChainId)

            if (currentChainId.toLowerCase() !== '0x343b') {
                setErrorTitle('Wrong Network')
                setErrorMessage('Please switch to Immutable zkEVM network (Chain ID: 13371) in your wallet.')
                setShowError(true)
                setIsCancelling(false)
                return
            }

            // Step 2: Sign the message
            // console.log('✍️ Step 2: Requesting signature from wallet...')
            // console.log('Raw message from API:', JSON.stringify(prepareData.message, null, 2))
            let signature: string

            try {
                // The API returns the message in a format that needs to be restructured for eth_signTypedData_v4
                // Standard EIP-712 format: { domain, types, primaryType, message }
                const rawMessage = prepareData.message

                // Build EIP712Domain type based on what's actually in the domain
                const domainFields = []
                if (rawMessage.domain.name) domainFields.push({ name: 'name', type: 'string' })
                if (rawMessage.domain.version) domainFields.push({ name: 'version', type: 'string' })
                if (rawMessage.domain.chainId) domainFields.push({ name: 'chainId', type: 'uint256' })
                if (rawMessage.domain.verifyingContract) domainFields.push({ name: 'verifyingContract', type: 'address' })

                // Build the domain object - only include fields that exist
                const domain: any = {
                    chainId: Number(rawMessage.domain.chainId),
                }
                if (rawMessage.domain.name) domain.name = rawMessage.domain.name
                if (rawMessage.domain.version) domain.version = rawMessage.domain.version
                if (rawMessage.domain.verifyingContract) domain.verifyingContract = rawMessage.domain.verifyingContract

                const messageToSign = {
                    domain,
                    types: {
                        EIP712Domain: domainFields,
                        ...rawMessage.types
                    },
                    primaryType: 'CancelPayload',
                    message: rawMessage.value
                }

                // console.log('Restructured message for signing:', JSON.stringify(messageToSign, null, 2))
                // console.log('Wallet address:', loggedWallet)

                signature = await window.ethereum.request({
                    method: 'eth_signTypedData_v4',
                    params: [loggedWallet, JSON.stringify(messageToSign)],
                })
                // console.log('✅ Signature received:', signature.substring(0, 20) + '...')
            } catch (signError: any) {
                console.error('Signature error caught:', signError)
                console.error('Signature error stringified:', JSON.stringify(signError))

                // Extract the actual error message
                const errorMessage = signError?.message || signError?.data?.cause?.message || 'Signature request failed'

                const error = new Error(errorMessage)
                error.name = 'SignatureError'
                throw error
            }

            // Step 3: Execute cancellation (PUT) - submit signature
            // console.log('🔄 Step 3: Executing cancellation (PUT)...')
            const executeResponse = await fetch('/api/listing/cancel', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [listing.listing_id],
                    walletAddress: loggedWallet,
                    signature: signature,
                }),
            })

            // console.log('Execute response status:', executeResponse.status)

            const executeData = await executeResponse.json()
            // console.log('Execute response data:', executeData)

            if (!executeResponse.ok) {
                throw new Error(executeData.error || `HTTP ${executeResponse.status}: Failed to execute cancellation`)
            }

            if (!executeData.success) {
                throw new Error('Execution failed: ' + JSON.stringify(executeData))
            }

            // Check results
            const { successful_cancellations, failed_cancellations, pending_cancellations } = executeData.result

            // console.log('Successful:', successful_cancellations)
            // console.log('Failed:', failed_cancellations)
            // console.log('Pending:', pending_cancellations)

            if (failed_cancellations && failed_cancellations.length > 0) {
                const failedOrder = failed_cancellations[0]
                const failedReason = failedOrder.reason_code || 'Unknown error'
                throw new Error(`Cancellation failed: ${failedReason}`)
            }

            if (!successful_cancellations || successful_cancellations.length === 0) {
                if (pending_cancellations && pending_cancellations.length > 0) {
                    // console.log('⏳ Cancellation is pending...')
                    // You might want to handle pending state differently
                } else {
                    throw new Error('No orders were cancelled')
                }
            }

            // console.log('✅ Cancellation completed successfully!')

            setIsCancelling(false)
            setShowCancelSuccess(true)

            // Call the callback to remove the listing from the UI
            if (onCancelSuccess) {
                onCancelSuccess(listing.listing_id)
            }

        } catch (error: any) {
            console.error('❌ Cancellation failed:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
            })

            setIsCancelling(false)

            // Handle empty error object (usually means user rejected)
            if (!error || (!error.message && !error.code)) {
                setErrorTitle('Signature Rejected')
                setErrorMessage('You rejected the signature request in your wallet.')
                setShowError(true)
                return
            }

            if (error.code === 4001) {
                setErrorTitle('Signature Rejected')
                setErrorMessage('You rejected the signature request in your wallet.')
            } else if (error.code === -32602) {
                setErrorTitle('Invalid Parameters')
                setErrorMessage('Invalid signature parameters. Please try again.')
            } else {
                setErrorTitle('Cancellation Failed')
                setErrorMessage(error.message || 'An unknown error occurred. Please check the console for details.')
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

        // console.log('Transaction parameters:', txParams)

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
                            // console.log('✅ Transaction confirmed!')
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
                            // console.log('⏱️ Transaction pending (timeout reached)')
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
    }

    const handleCancelSuccessClose = () => {
        setShowCancelSuccess(false)
    }

    const handleErrorClose = () => {
        setShowError(false)
    }

    return (
        <>
            <PurchaseProgressModal
                isOpen={isPurchasing}
            />

            <CancelProgressModal
                isOpen={isCancelling}
            />

            <SuccessModal
                isOpen={showSuccess}
                tokenId={listing.token_id}
                onClose={handleSuccessClose}
            />

            <CancelSuccessModal
                isOpen={showCancelSuccess}
                orderId={listing.listing_id}
                onClose={handleCancelSuccessClose}
            />

            <ErrorModal
                isOpen={showError}
                title={errorTitle}
                message={errorMessage}
                onClose={handleErrorClose}
            />

            <div className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${isUserListing ? 'bg-light' : ''}`}>
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
                        <div className="text-white font-semibold text-[10px] sm:text-sm">
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
                        <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel'}
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
        </>
    )
}