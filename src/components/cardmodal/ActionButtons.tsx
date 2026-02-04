import { useState } from 'react'
import { Stack, ListingsResponse } from './types'
import { PurchaseProgressModal } from './ActionButtonSubComponents/PurchaseProgressModal'
import { SuccessModal } from './ActionButtonSubComponents/SuccessModal'
import { ErrorModal } from './ActionButtonSubComponents/ErrorModal'
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

// Known NFT contract address for Gods Unchained cards
const GU_NFT_CONTRACT_ADDRESS = '0x06d92b637dfcdf95a2faba04ef22b2a096029b69'

export const ActionButtons = ({ card, listingsData, loggedWallet }: ActionButtonsProps) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
    const [quantity, setQuantity] = useState(1)
    const [isBuying, setIsBuying] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorTitle, setErrorTitle] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [purchasedTokenId, setPurchasedTokenId] = useState('')
    const [showListModal, setShowListModal] = useState(false)
    const [listingPrice, setListingPrice] = useState('')
    const [listingDuration, setListingDuration] = useState(12)
    const [currency, setCurrency] = useState('ETH')

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
            console.error('❌ Message missing domain field');
            throw new Error('Invalid EIP-712 message: missing domain');
        }

        if (!message.types) {
            console.error('❌ Message missing types field');
            throw new Error('Invalid EIP-712 message: missing types');
        }

        // The value field can be either 'value' or 'message'
        if (!message.value && !message.message) {
            console.error('❌ Message missing value/message field');
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
            console.error('❌ MetaMask signing error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }

    //Pag Bibili ka ng cards
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

    //Pag Bebenta ka ng cards
    const handleListNow = async () => {
        if (!listingPrice || parseFloat(listingPrice) <= 0) {
            setErrorTitle('Invalid Price')
            setErrorMessage('Please enter a valid listing price.')
            setShowError(true)
            return
        }

        // Get unlisted tokens
        const unlistedTokens = (card as any)?.owned_tokens?.filter((token: any) => !token.listed) || []

        if (unlistedTokens.length === 0) {
            setErrorTitle('No Unlisted Tokens')
            setErrorMessage('You have no unlisted tokens to list.')
            setShowError(true)
            return
        }

        if (quantity > unlistedTokens.length) {
            setErrorTitle('Invalid Quantity')
            setErrorMessage(`You only have ${unlistedTokens.length} unlisted token(s).`)
            setShowError(true)
            return
        }

        // Currency symbol to API name and contract mapping
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

        // Get the tokens to list based on quantity
        const tokensToList = unlistedTokens.slice(0, quantity)

        // Resolve the NFT contract address
        const nftContractAddress = getNftContractAddress()

        // Convert price to wei (multiply by 10^decimals)
        const priceInWei = (parseFloat(listingPrice) * Math.pow(10, currencyInfo.decimals)).toString()

        console.log('\n📋 ===== LISTING DETAILS =====')
        console.log('Card Name:', (card as any)?.name)
        console.log('Metadata ID:', (card as any)?.metadata_id)
        console.log('NFT Contract Address:', nftContractAddress)
        console.log('Selected Currency Symbol:', currency)
        console.log('Currency API Name:', currencyInfo.name)
        console.log('Currency Contract Address:', currencyInfo.address)
        console.log('Currency Decimals:', currencyInfo.decimals)
        console.log('Duration:', listingDuration, 'months')
        console.log('Listing Price:', listingPrice, currency)
        console.log('Price in Wei:', priceInWei)
        console.log('Quantity to List:', quantity)
        console.log('Total Owned Tokens:', (card as any)?.owned_tokens?.length)
        console.log('Total Unlisted Tokens:', unlistedTokens.length)
        console.log('\n📦 Tokens to List:')
        tokensToList.forEach((token: any, index: number) => {
            console.log(`  ${index + 1}. Token ID: ${token.token_id}`)
        })
        console.log('================================\n')

        setIsBuying(true) // Reuse buying state for listing progress

        try {
            // Step 1: Prepare listings (get messages to sign)
            console.log('🔄 Step 1: Preparing listings...')

            const listings = tokensToList.map((token: any) => ({
                tokenId: token.token_id,
                contractAddress: nftContractAddress,
                price: priceInWei,
                currencyAddress: currencyInfo.address,
            }))

            console.log('📦 Listings payload:', JSON.stringify(listings, null, 2))

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
                console.error('❌ Prepare API error:', errorData)
                throw new Error(errorData.error || 'Failed to prepare listing')
            }

            const prepareData = await prepareResponse.json()
            console.log('\n✅ ===== PREPARE RESPONSE RECEIVED =====')
            console.log('Success:', prepareData.success)
            console.log('Mode:', prepareData.mode)
            console.log('Full response:', JSON.stringify(prepareData, null, 2))
            console.log('================================\n')

            if (!prepareData.success) {
                throw new Error('Failed to prepare listing')
            }

            // Step 2: Sign the message(s)
            console.log('🔄 Step 2: Signing message(s)...')

            let signatures: string[] = []

            if (prepareData.mode === 'single' && prepareData.message) {
                // Single listing
                console.log('\n📝 ===== SIGNING SINGLE MESSAGE =====');

                try {
                    const signature = await signEIP712Message(prepareData.message, loggedWallet!)
                    signatures = [signature]
                } catch (signError: any) {
                    console.error('❌ Signature error:', signError)
                    throw signError
                }
            } else if (prepareData.mode === 'bulk' && prepareData.listings) {
                // Bulk listings - sign each message
                console.log(`\n📝 ===== SIGNING ${prepareData.listings.length} MESSAGES =====`);

                for (let i = 0; i < prepareData.listings.length; i++) {
                    const { message } = prepareData.listings[i]
                    console.log(`\n--- Signing message ${i + 1}/${prepareData.listings.length} ---`)

                    try {
                        const signature = await signEIP712Message(message, loggedWallet!)
                        signatures.push(signature)
                    } catch (signError: any) {
                        console.error(`❌ Signature ${i + 1} error:`, signError)
                        throw signError
                    }
                }

                console.log('\n✅ All signatures obtained');
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
                    // ⭐ Send cache keys instead of raw responses
                    cacheKey: prepareData.mode === 'single' ? prepareData.cacheKey : undefined,
                    cacheKeys: prepareData.mode === 'bulk' ? prepareData.listings?.map((l: any) => l.cacheKey) : undefined,
                }),
            })

            if (!executeResponse.ok) {
                const errorData = await executeResponse.json()
                console.error('❌ Execute API error:', errorData)
                throw new Error(errorData.error || 'Failed to create listing')
            }

            const executeData = await executeResponse.json()
            console.log('\n✅ ===== EXECUTE RESPONSE =====')
            console.log('Full response:', JSON.stringify(executeData, null, 2))
            console.log('================================\n')

            if (!executeData.success) {
                throw new Error('Failed to create listing')
            }

            // Show results
            console.log('\n🎉 ===== LISTING RESULTS =====')
            console.log('✅ Successful:', executeData.result.successful_listings.length)
            executeData.result.successful_listings.forEach((listing: any) => {
                console.log(`  - Order ID: ${listing.order_id}, Token: ${listing.token_id}`)
            })
            console.log('⏳ Pending:', executeData.result.pending_listings.length)
            console.log('❌ Failed:', executeData.result.failed_listings.length)
            executeData.result.failed_listings.forEach((listing: any) => {
                console.log(`  - Token: ${listing.token_id}, Reason: ${listing.reason_code}`)
            })
            console.log('================================\n')

            setIsBuying(false)
            setShowListModal(false)
            setListingPrice('')
            setQuantity(1)
            setCurrency('ETH')

            // Show success message
            setShowSuccess(true)

        } catch (error: any) {
            console.error('\n❌ ===== LISTING FAILED =====')
            console.error('Error:', error)
            console.error('Error code:', error.code)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
            console.error('================================\n')

            setIsBuying(false)

            if (error.code === 4001) {
                setErrorTitle('Signature Rejected')
                setErrorMessage('You rejected the signature request in your wallet.')
            } else if (error.code === -32000) {
                setErrorTitle('Invalid Request')
                setErrorMessage('The signature request was invalid. Please check the browser console for detailed logs and report this issue.')
            } else if (error.code === -32603) {
                setErrorTitle('Internal Error')
                setErrorMessage('An internal error occurred. Please check the browser console for details.')
            } else {
                setErrorTitle('Listing Failed')
                setErrorMessage(error.message || 'An unknown error occurred. Please check the console for details.')
            }
            setShowError(true)
        }
    }

    ////////////

    const handleSuccessClose = () => {
        setShowSuccess(false)
    }

    const handleErrorClose = () => {
        setShowError(false)
    }

    const handleListClick = () => {
        if (!loggedWallet) {
            setErrorTitle('Wallet Not Connected')
            setErrorMessage('Please connect your wallet first to list an item.')
            setShowError(true)
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
                    className={`px-6 py-2 rounded transition-colors cursor-pointer ${activeTab === 'sell'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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