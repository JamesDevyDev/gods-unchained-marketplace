import { useState } from 'react'
import { Listing } from './types'
import { getCurrencyIcon, getTimeUntilExpiration } from './utils'

// Extend Window interface for MetaMask
declare global {
    interface Window {
        ethereum?: any
    }
}

type ListingTableRowProps = {
    listing: Listing
    newWallet: string | null
    loggedWallet: string | null
}

interface PrepareResponse {
    success: boolean
    mode: string
    orderId: string
    actions: any[]  // Actions from Immutable SDK
    price: string
    fee: string
    feePercentage: number
    totalWithFee: string
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

        // Check if MetaMask is available
        if (!window.ethereum) {
            alert('MetaMask is not installed. Please install MetaMask to continue.')
            window.open('https://metamask.io/download/', '_blank')
            return
        }

        setIsPurchasing(true)
        try {
            console.log('🛒 Preparing purchase for order:', listing.listing_id)
            console.log('Token ID:', listing.token_id)

            // Step 1: Call your prepare endpoint to get transaction details
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

            // Step 2: Verify network (Immutable zkEVM = chainId 13371 / 0x343B)
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
            if (currentChainId.toLowerCase() !== '0x343b') {
                alert('Please switch to Immutable zkEVM network')
                return
            }

            // Step 3: Execute all actions returned by the Immutable SDK
            console.log(`📋 Executing ${data.actions.length} actions...`)

            for (let i = 0; i < data.actions.length; i++) {
                const action = data.actions[i]
                console.log(`🔄 Action ${i + 1}/${data.actions.length}:`, action.type)

                switch (action.type) {
                    case 'TRANSACTION':
                        // Execute the transaction (could be approval or fulfillment)
                        const txHash = await executeTransaction(action, loggedWallet)
                        console.log(`✅ Transaction ${i + 1} sent:`, txHash)
                        await waitForTransaction(txHash)
                        console.log(`✅ Transaction ${i + 1} confirmed`)
                        break

                    case 'SIGNABLE':
                        // Sign a message (if required by Seaport)
                        const signature = await signMessage(action, loggedWallet)
                        console.log(`✅ Message ${i + 1} signed:`, signature)
                        break

                    default:
                        console.warn(`⚠️ Unknown action type: ${action.type}`)
                }
            }

            console.log('✅ All actions completed successfully!')
            alert(`✅ Purchase successful!\n\nNFT Token ID: ${listing.token_id}`)

            // Refresh the page or update the UI
            window.location.reload()

        } catch (error: any) {
            console.error('❌ Purchase failed:', error)

            // Handle specific MetaMask errors
            if (error.code === 4001) {
                alert('Transaction rejected by user')
            } else if (error.code === -32603) {
                alert('Transaction failed: Insufficient funds or gas')
            } else if (error.code === -32602) {
                alert('Invalid transaction parameters')
            } else {
                alert(`Purchase failed: ${error.message || 'Unknown error'}`)
            }
        } finally {
            setIsPurchasing(false)
        }
    }

    // Execute a transaction action
    const executeTransaction = async (action: any, fromAddress: string): Promise<string> => {
        const txParams: any = {
            from: fromAddress,
            to: action.to,
            data: action.data,
        }

        // Only include value if it's not '0x0' or undefined
        if (action.value && action.value !== '0x0') {
            txParams.value = action.value;
        }

        // Include gas limit if provided
        if (action.gasLimit) {
            txParams.gas = action.gasLimit;
        }

        console.log('Transaction parameters:', txParams)

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
        })

        return txHash
    }

    // Sign a message action
    const signMessage = async (action: any, fromAddress: string): Promise<string> => {
        const signature = await window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [fromAddress, JSON.stringify(action.message)],
        })

        return signature
    }

    // Helper function to wait for transaction confirmation
    const waitForTransaction = async (txHash: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let attempts = 0
            const maxAttempts = 60 // Wait up to 60 seconds

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
                            setTimeout(checkTransaction, 1000) // Check again in 1 second
                        } else {
                            console.log('⏱️ Transaction pending (timeout reached)')
                            resolve() // Still resolve to not block the UI
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