import { useState, useEffect } from 'react'
import { Stack, ListingsResponse } from './types'
import { PurchaseProgressModal } from './ActionButtonSubComponents/PurchaseProgressModal'
import { ListCollectibleModal } from './ActionButtonSubComponents/ListCollectibleModal'

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

// Known NFT contract address for Gods Unchained cards
const GU_NFT_CONTRACT_ADDRESS = '0x06d92b637dfcdf95a2faba04ef22b2a096029b69'

export const ActionButtons = ({ card, listingsData, loggedWallet }: ActionButtonsProps) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
    const [quantity, setQuantity] = useState(1)
    const [isBuying, setIsBuying] = useState(false)
    const [purchasedTokenId, setPurchasedTokenId] = useState('')
    const [showListModal, setShowListModal] = useState(false)
    const [listingPrice, setListingPrice] = useState('')
    const [listingDuration, setListingDuration] = useState(12)
    const [currency, setCurrency] = useState('ETH')

    // Toast state
    const [toast, setToast] = useState<ToastState>({
        show: false,
        message: '',
        type: 'success'
    })

    // Show toast helper
    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ show: true, message, type })
    }

    const getUserOwnedCount = () => {
        const unlistedCount = (card as any)?.owned_tokens?.filter((token: any) => !token.listed).length || 0
        return unlistedCount
    }

    /**
     * Resolves the NFT contract address.
     * Prefers the token_address from an owned token if available,
     * falls back to the known GU contract address.
     */
    const getNftContractAddress = (): string => {
        const ownedTokens = (card as any)?.owned_tokens || []
        // Try to find a token that has a non-null token_address
        const tokenWithAddress = ownedTokens.find((token: any) => token.token_address)
        if (tokenWithAddress?.token_address) {
            return tokenWithAddress.token_address
        }
        // Fallback to the known contract address
        return GU_NFT_CONTRACT_ADDRESS
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
                            console.log('❌ Transaction failed')
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
                    console.log('Error checking transaction:', error)
                    reject(error)
                }
            }

            checkTransaction()
        })
    }

    /**
     * Validates and signs an EIP-712 message
     */
    const signEIP712Message = async (message: any, walletAddress: string): Promise<string> => {
        console.log('\n🔍 ===== VALIDATING MESSAGE BEFORE SIGNING =====');
        console.log('Message type:', typeof message);
        console.log('Message keys:', Object.keys(message || {}));
        console.log('Full message:', JSON.stringify(message, null, 2));

        // Validate EIP-712 structure
        if (!message || typeof message !== 'object') {
            throw new Error('Message must be an object');
        }

        if (!message.domain) {
            console.log('❌ Message missing domain field');
            throw new Error('Invalid EIP-712 message: missing domain');
        }

        if (!message.types) {
            console.log('❌ Message missing types field');
            throw new Error('Invalid EIP-712 message: missing types');
        }

        // The value field can be either 'value' or 'message'
        if (!message.value && !message.message) {
            console.log('❌ Message missing value/message field');
            throw new Error('Invalid EIP-712 message: missing value or message field');
        }

        console.log('✅ Message structure validation passed');
        console.log('Domain:', message.domain);
        console.log('Types:', Object.keys(message.types));
        console.log('Primary Type:', message.primaryType);

        // Convert to string for MetaMask
        const messageString = JSON.stringify(message);
        console.log('📤 Stringified message length:', messageString.length);
        console.log('📤 Sending to MetaMask...');

        try {
            const signature = await window.ethereum.request({
                method: 'eth_signTypedData_v4',
                params: [walletAddress, messageString],
            });

            console.log('✅ Signature obtained:', signature);
            return signature;
        } catch (error: any) {
            console.log('❌ MetaMask signing error:', error);
            console.log('Error code:', error.code);
            console.log('Error message:', error.message);
            throw error;
        }
    }

    //Pag Bibili ka ng cards
    const handleBuyNow = async () => {
        if (!loggedWallet) {
            showToast('Please connect your wallet first to make a purchase.', 'error')
            return
        }

        if (!window.ethereum) {
            showToast('MetaMask is not installed. Please install MetaMask to continue.', 'error')
            window.open('https://metamask.io/download/', '_blank')
            return
        }

        if (!listingsData?.cheapest_listing) {
            showToast('There are currently no listings available for this item.', 'error')
            return
        }

        setIsBuying(true)

        try {
            console.log('🛒 Preparing purchase for order:', listingsData.cheapest_listing.listing_id)
            console.log('Token ID:', listingsData.cheapest_listing.token_id)

            const response = await fetch('/api/listing/buy', {
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
                showToast('Please switch to Immutable zkEVM network in your wallet.', 'error')
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
            showToast('NFT purchased successfully!', 'success')

        } catch (error: any) {
            console.log('❌ Purchase failed:', error)
            setIsBuying(false)

            if (error.code === 4001) {
                showToast('You rejected the transaction in your wallet.', 'error')
            } else if (error.code === -32603) {
                showToast('Transaction failed. You may have insufficient funds or gas.', 'error')
            } else if (error.code === -32602) {
                showToast('Invalid transaction parameters. Please try again.', 'error')
            } else {
                showToast(error.message || 'An unknown error occurred. Please try again.', 'error')
            }
        }
    }

    //Pag Bebenta ka ng cards
    const handleListNow = async () => {
        if (!listingPrice || parseFloat(listingPrice) <= 0) {
            showToast('Please enter a valid listing price.', 'error')
            return
        }

        const unlistedTokens = (card as any)?.owned_tokens?.filter((token: any) => !token.listed) || []

        if (unlistedTokens.length === 0) {
            showToast('You have no unlisted tokens to list.', 'error')
            return
        }

        if (quantity > unlistedTokens.length) {
            showToast(`You only have ${unlistedTokens.length} unlisted token(s).`, 'error')
            return
        }

        // Close the modal immediately
        setShowListModal(false)

        const SYMBOL_MAP: Record<string, { name: string; address: string; decimals: number }> = {
            'ETH': {
                name: 'ethereum',
                address: '0x52a6c53869ce09a731cd772f245b97a4401d3348',
                decimals: 18
            },
            'GODS': {
                name: 'gods-unchained',
                address: '0xe0e0981d19ef2e0a57cc48ca60d9454ed2d53feb',
                decimals: 18
            },
            'IMX': {
                name: 'immutable-x',
                address: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff',
                decimals: 18
            },
            'USDC': {
                name: 'usd-coin',
                address: '0x6de8acc0d406837030ce4dd28e7c08c5a96a30d2',
                decimals: 6
            }
        }

        const currencyInfo = SYMBOL_MAP[currency]
        const tokensToList = unlistedTokens.slice(0, quantity)
        const nftContractAddress = getNftContractAddress()
        const priceInWei = (parseFloat(listingPrice) * Math.pow(10, currencyInfo.decimals)).toString()

        console.log('\n📋 ===== LISTING DETAILS =====')
        console.log('Currency:', currency)
        console.log('Price (human readable):', listingPrice)
        console.log('Decimals:', currencyInfo.decimals)
        console.log('Price (wei/smallest unit):', priceInWei)
        console.log('Currency address:', currencyInfo.address)
        console.log('Tokens to list:', tokensToList.length)
        console.log('NFT contract:', nftContractAddress)
        console.log('================================\n')

        setIsBuying(true)

        try {
            // Step 1: Prepare listings
            console.log('🔄 Step 1: Preparing listings...')

            const listings = tokensToList.map((token: any) => ({
                tokenId: token.token_id,
                contractAddress: nftContractAddress,
                price: priceInWei,
                currencyAddress: currencyInfo.address,
                decimals: currencyInfo.decimals, // ⭐ Pass decimals to backend
            }))

            console.log('📤 Sending to backend:', JSON.stringify(listings, null, 2))

            const prepareResponse = await fetch('/api/listing/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listings,
                    walletAddress: loggedWallet,
                }),
            })

            if (!prepareResponse.ok) {
                const errorData = await prepareResponse.json()
                throw new Error(errorData.error || 'Failed to prepare listing')
            }

            const prepareData = await prepareResponse.json()

            if (!prepareData.success) {
                throw new Error('Failed to prepare listing')
            }

            // ⭐ CRITICAL: Handle approval transactions BEFORE signing
            if (prepareData.mode === 'single' && prepareData.requiresApproval && prepareData.approvalAction) {
                console.log('\n🔐 ===== APPROVAL REQUIRED =====')
                console.log('⚠️ You need to approve the marketplace contract to transfer your NFT')
                console.log('This is a one-time transaction per collection')
                console.log('================================\n')

                const approvalTx = await executeTransaction(prepareData.approvalAction, loggedWallet!)
                console.log('✅ Approval transaction sent:', approvalTx)

                await waitForTransaction(approvalTx)
                console.log('✅ Approval transaction confirmed')
            } else if (prepareData.mode === 'bulk' && prepareData.listings) {
                // Handle approvals for bulk listings
                for (let i = 0; i < prepareData.listings.length; i++) {
                    const listing = prepareData.listings[i]
                    if (listing.requiresApproval && listing.approvalAction) {
                        console.log(`\n🔐 Approval required for token ${i + 1}/${prepareData.listings.length}`)

                        const approvalTx = await executeTransaction(listing.approvalAction, loggedWallet!)
                        console.log('✅ Approval transaction sent:', approvalTx)

                        await waitForTransaction(approvalTx)
                        console.log('✅ Approval transaction confirmed')

                        // Only need to approve once per collection
                        break
                    }
                }
            }

            // Step 2: Sign the message(s)
            console.log('\n🔄 Step 2: Signing message(s)...')

            let signatures: string[] = []

            if (prepareData.mode === 'single' && prepareData.message) {
                const signature = await signEIP712Message(prepareData.message, loggedWallet!)
                signatures = [signature]
            } else if (prepareData.mode === 'bulk' && prepareData.listings) {
                for (let i = 0; i < prepareData.listings.length; i++) {
                    const { message } = prepareData.listings[i]
                    const signature = await signEIP712Message(message, loggedWallet!)
                    signatures.push(signature)
                }
            }

            // Step 3: Execute listings with signatures
            console.log('\n🔄 Step 3: Creating listings...')

            const executeResponse = await fetch('/api/listing/list', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listings,
                    walletAddress: loggedWallet,
                    signature: prepareData.mode === 'single' ? signatures[0] : undefined,
                    signatures: prepareData.mode === 'bulk' ? signatures : undefined,
                    cacheKey: prepareData.mode === 'single' ? prepareData.cacheKey : undefined,
                    cacheKeys: prepareData.mode === 'bulk' ? prepareData.listings?.map((l: any) => l.cacheKey) : undefined,
                }),
            })

            if (!executeResponse.ok) {
                const errorData = await executeResponse.json()
                throw new Error(errorData.error || 'Failed to create listing')
            }

            const executeData = await executeResponse.json()

            if (!executeData.success) {
                throw new Error('Failed to create listing')
            }

            console.log('\n🎉 ===== LISTING SUCCESS =====')
            console.log('✅ Successful:', executeData.result.successful_listings.length)
            console.log('❌ Failed:', executeData.result.failed_listings.length)
            console.log('================================\n')

            setIsBuying(false)
            // Reset form fields
            setListingPrice('')
            setQuantity(1)
            setCurrency('ETH')
            showToast('Listing created successfully!', 'success')

        } catch (error: any) {
            console.log('\n❌ ===== LISTING FAILED =====')
            console.log('Error:', error)
            console.log('================================\n')

            setIsBuying(false)

            if (error.code === 4001) {
                showToast('You rejected the transaction in your wallet.', 'error')
            } else {
                showToast(error.message || 'An unknown error occurred.', 'error')
            }
        }
    }

    ////////////

    const handleListClick = () => {
        if (!loggedWallet) {
            showToast('Please connect your wallet first to list an item.', 'error')
            return
        }

        setShowListModal(true)
    }

    const handleListModalClose = () => {
        setShowListModal(false)
        setListingPrice('')
        setQuantity(1)
        setCurrency('ETH')
    }

    const ownedCount = getUserOwnedCount()

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

            <PurchaseProgressModal isOpen={isBuying} />
            <ListCollectibleModal
                card={card}
                isOpen={showListModal}
                onClose={handleListModalClose}
                quantity={quantity}
                setQuantity={setQuantity}
                maxQuantity={ownedCount}
                listingPrice={listingPrice}
                setListingPrice={setListingPrice}
                duration={listingDuration}
                setDuration={setListingDuration}
                currency={currency}
                setCurrency={setCurrency}
                onListNow={handleListNow}
                listingsData={listingsData}
            />

            {/* Buy/Sell Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('buy')}
                    className={`px-6 py-2 rounded transition-colors cursor-pointer ${activeTab === 'buy'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setActiveTab('sell')}
                    className={`px-6 py-2 rounded transition-colors cursor-pointer ${activeTab === 'buy'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-blue-600 text-white'
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Buy Tab Content */}
            {activeTab === 'buy' && (
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleBuyNow}
                            disabled={isBuying || !listingsData?.cheapest_listing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isBuying ? 'Buying...' : 'Buy Now'}
                        </button>
                        <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-base cursor-pointer">
                            Make Offer
                        </button>
                    </div>
                </div>
            )}

            {/* Sell Tab Content */}
            {activeTab === 'sell' && (
                <div className="mb-6">
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <button
                            onClick={handleListClick}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors cursor-pointer"
                        >
                            List
                        </button>
                        <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors cursor-pointer">
                            Fill Offer
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}