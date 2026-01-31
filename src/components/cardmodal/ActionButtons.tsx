import { useState, useEffect } from 'react'
import { Stack, ListingsResponse, Listing } from './types'

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
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
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

// List Collectible Modal Component - UPDATED with editable quantity input
const ListCollectibleModal = ({
    card,
    isOpen,
    onClose,
    quantity,
    setQuantity,
    maxQuantity,
    listingPrice,
    setListingPrice,
    duration,
    setDuration,
    currency,
    setCurrency,
    onListNow,
    listingsData
}: {
    card: any
    isOpen: boolean
    onClose: () => void
    quantity: number
    setQuantity: (quantity: number) => void
    maxQuantity: number
    listingPrice: string
    setListingPrice: (price: string) => void
    duration: number
    setDuration: (duration: number) => void
    currency: string
    setCurrency: (currency: string) => void
    onListNow: () => void
    listingsData: ListingsResponse | null
}) => {
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
        'ETH': 3000,
        'GODS': 0.25,
        'IMX': 1.5,
        'USDC': 1
    })

    // Fetch real-time exchange rates from Immutable API
    const fetchExchangeRates = async () => {
        try {
            const response = await fetch('https://checkout-api.immutable.com/v1/fiat/conversion?ids=ethereum,immutable-x,usd-coin,gods-unchained,guild-of-guardians,ravenquest,cross-the-ages,tokyo-games-token,immortal-token&currencies=usd,eth')
            const data = await response.json()

            const symbolToId: { [key: string]: string } = {
                'ETH': 'ethereum',
                'GODS': 'gods-unchained',
                'IMX': 'immutable-x',
                'USDC': 'usd-coin'
            }

            const rates: Record<string, number> = {}
            Object.entries(symbolToId).forEach(([symbol, id]) => {
                if (data[id]?.usd) {
                    rates[symbol] = data[id].usd
                }
            })

            setExchangeRates(rates)
        } catch (error) {
            console.error('Error fetching exchange rates:', error)
            // Keep using default rates if API fails
        }
    }

    // Fetch exchange rates when modal opens or currency changes
    useEffect(() => {
        if (isOpen) {
            fetchExchangeRates()
        }
    }, [isOpen, currency])

    const getUsdRate = (curr: string): number => {
        return exchangeRates[curr] || 1
    }

    const formatUsd = (amount: string | number): string => {
        if (!amount || isNaN(parseFloat(amount.toString()))) return '0.00'
        const value = parseFloat(amount.toString())
        const usdValue = value * getUsdRate(currency)
        return usdValue.toFixed(2)
    }

    const calculateEarnings = () => {
        if (!listingPrice || isNaN(parseFloat(listingPrice))) return '0.00'
        const price = parseFloat(listingPrice)
        // Deduct fees: Royalties (0.5%) + Protocol (2%) + Maker (1%)
        const totalFees = price * 0.035 // 3.5% total
        return (price - totalFees).toFixed(4)
    }

    if (!isOpen) return null

    const getLowestPriceForCurrency = () => {
        if (!listingsData?.by_currency) return null

        // Find the absolute lowest price across ALL currencies by comparing USD values
        let absoluteLowestUsd = Infinity
        let lowestListingCurrency = ''
        let lowestListingPrice = 0

        const currencies = ['ETH', 'GODS', 'IMX', 'USDC'] as const

        for (const curr of currencies) {
            const currencyListings = listingsData.by_currency[curr]
            if (!currencyListings || currencyListings.length === 0) continue

            // Find the lowest price in this currency
            const lowestInCurrency = currencyListings.reduce((min: Listing, listing: Listing) => {
                const price = listing.prices.base_price
                const minPrice = min.prices.base_price
                return price < minPrice ? listing : min
            })

            const priceInCurrency = lowestInCurrency.prices.base_price
            // Convert to USD for comparison
            const priceInUsd = priceInCurrency * getUsdRate(curr)

            if (priceInUsd < absoluteLowestUsd) {
                absoluteLowestUsd = priceInUsd
                lowestListingCurrency = curr
                lowestListingPrice = priceInCurrency
            }
        }

        if (absoluteLowestUsd === Infinity) return null

        // If the lowest is already in the selected currency, return it directly
        if (lowestListingCurrency === currency) {
            return lowestListingPrice
        }

        // Convert from the lowest currency to the selected currency
        // Step 1: Lowest price in its original currency → USD
        const lowestInUsd = lowestListingPrice * getUsdRate(lowestListingCurrency)

        // Step 2: USD → Selected currency
        const selectedCurrencyRate = getUsdRate(currency)
        if (selectedCurrencyRate === 0) return null

        const convertedPrice = lowestInUsd / selectedCurrencyRate

        return convertedPrice
    }

    const handleLowestClick = () => {
        const lowestPrice = getLowestPriceForCurrency()
        if (lowestPrice !== null) {
            // Set price 1% below the lowest
            const priceBelow = lowestPrice * 0.99
            // Format to 8 decimal places to avoid scientific notation
            setListingPrice(priceBelow.toFixed(8))
        }
    }

    const handleMaxClick = () => {
        const unlistedCount = card?.owned_tokens?.filter((token: any) => !token.listed).length || 0
        setQuantity(unlistedCount)
    }

    const lowestPrice = getLowestPriceForCurrency()
    const unlistedCount = card?.owned_tokens?.filter((token: any) => !token.listed).length || 0

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-4 sm:p-5 max-w-sm w-full border border-gray-700 relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    List Collectible
                </h2>

                {/* Quantity and Currency Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Quantity */}
                    <div>
                        <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                            Quantity
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0
                                        if (value >= 0 && value <= unlistedCount) {
                                            setQuantity(value)
                                        }
                                    }}
                                    min="0"
                                    max={unlistedCount}
                                    className="w-full bg-light rounded px-3 py-2 text-white text-sm border border-gray-700 focus:border-yellow-500 focus:outline-none cursor-pointer"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
                                    of {unlistedCount}
                                </span>
                            </div>
                            <button
                                onClick={handleMaxClick}
                                disabled={unlistedCount === 0}
                                className={`text-white text-xs px-3 py-2 rounded transition-colors font-semibold ${unlistedCount > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                Max
                            </button>
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                            Currency
                        </label>
                        <div className="relative">
                            <img
                                src={`/assets/currency/${currency.toLowerCase()}.png`}
                                alt={currency}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            />
                            <select
                                value={currency}
                                onChange={(e) => {
                                    setCurrency(e.target.value)
                                    setListingPrice('') // Clear price when currency changes
                                }}
                                className="w-full bg-light text-white text-sm pl-8 pr-3 py-2 rounded border border-gray-700 appearance-none cursor-pointer"
                            >
                                <option value="ETH">ETH</option>
                                <option value="GODS">GODS</option>
                                <option value="IMX">IMX</option>
                                <option value="USDC">USDC</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                        Duration
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                            className="bg-light text-white text-sm px-3 py-2 rounded border border-gray-700 cursor-pointer"
                            min="1"
                        />
                        <select className="bg-light text-white text-sm px-3 py-2 rounded border border-gray-700 appearance-none cursor-pointer">
                            <option value="months">Months</option>
                            <option value="days">Days</option>
                        </select>
                    </div>
                </div>

                {/* Listing Price */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-yellow-500 text-xs font-semibold">
                            Listing Price
                        </label>
                        <div className='flex items-center justify-center gap-4'>
                            {lowestPrice !== null && (
                                <span className="font-mono text-[11px] text-white/40">{Number(lowestPrice).toFixed(8)} {currency}</span>
                            )}
                            <button
                                onClick={handleLowestClick}
                                disabled={lowestPrice === null}
                                className={`text-white text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${lowestPrice !== null
                                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <span>Lowest</span>

                            </button>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        placeholder="0"
                        className="w-full bg-light text-white text-sm px-3 py-2 rounded border border-gray-700 focus:border-yellow-500 focus:outline-none cursor-pointer"
                    />
                    <p className="text-gray-400 text-xs mt-1">${formatUsd(listingPrice)}</p>
                </div>

                {/* Earnings */}
                <div className="mb-4">
                    <label className="text-yellow-500 text-xs font-semibold mb-1.5 block">
                        Earnings
                    </label>
                    <input
                        type="text"
                        value={calculateEarnings()}
                        disabled
                        className="w-full bg-light text-gray-400 text-sm px-3 py-2 rounded border border-gray-700 cursor-not-allowed"
                    />
                    <p className="text-gray-400 text-xs mt-1">${formatUsd(calculateEarnings())}</p>
                </div>

                {/* List Now Button */}
                <button
                    onClick={onListNow}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mb-3 cursor-pointer text-sm"
                >
                    List Now
                </button>

                {/* Fees - Collapsible on mobile */}
                <details className="border-t border-gray-700 pt-3 group">
                    <summary className="text-gray-400 text-xs font-semibold cursor-pointer flex items-center justify-between list-none">
                        <div className="flex items-center gap-2">
                            <span>Fee Breakdown</span>
                            <svg
                                className="w-4 h-4 transition-transform group-open:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <span className="text-xs">3.5% total</span>
                    </summary>
                    <div className="space-y-1 text-xs mt-2">
                        <div className="flex justify-between text-gray-400">
                            <span>Royalties</span>
                            <span>0.5%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Protocol Fee</span>
                            <span>2%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Maker Fee</span>
                            <span>1%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Taker Fee (est.)</span>
                            <span>1%</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Orders are time sensitive. Manually changing gas price/limit may stop processing.
                    </p>
                </details>
            </div>
        </div>
    )
}

export const ActionButtons = ({ card, listingsData, newWallet, loggedWallet }: ActionButtonsProps) => {
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

    const getUserOwnedCount = () => {
        // Get unlisted tokens count
        const unlistedCount = (card as any)?.owned_tokens?.filter((token: any) => !token.listed).length || 0
        return unlistedCount
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
    }

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

        // Get the tokens to list based on quantity
        const tokensToList = unlistedTokens.slice(0, quantity)

        console.log('📋 ===== LISTING DETAILS =====')
        console.log('Card Name:', (card as any)?.name)
        console.log('Metadata ID:', (card as any)?.metadata_id)
        console.log('Contract Address:', (card as any)?.owned_tokens?.[0]?.token_address)
        console.log('Currency:', currency)
        console.log('Duration:', listingDuration, 'months')
        console.log('Listing Price:', listingPrice, currency)
        console.log('Quantity to List:', quantity)
        console.log('Total Owned Tokens:', (card as any)?.owned_tokens?.length)
        console.log('Total Unlisted Tokens:', unlistedTokens.length)
        console.log('\n📦 Unlisted Tokens to be Listed:')
        tokensToList.forEach((token: any, index: number) => {
            console.log(`  ${index + 1}. Token ID: ${token.token_id}`)
        })
        console.log('\n🔍 All Unlisted Token IDs:')
        console.log(unlistedTokens.map((t: any) => t.token_id))
        console.log('===========================')

        // TODO: Implement the actual listing flow
        // 1. Call POST /api/listing/list to prepare
        // 2. Sign the message
        // 3. Call PUT /api/listing/list with signature

        setShowListModal(false)
        setListingPrice('')
        setQuantity(1)
    }

    const decrementQuantity = () => {
        if (quantity > 1) setQuantity(quantity - 1)
    }

    const incrementQuantity = () => {
        const maxQuantity = getUserOwnedCount()
        if (quantity < maxQuantity) setQuantity(quantity + 1)
    }

    const hasUserListings = userHasListings()
    const userListings = getUserListings()
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
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isBuying ? 'Buying...' : 'Buy Now'}
                        </button>
                        <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors text-sm sm:text-base cursor-pointer">
                            Make Offer
                        </button>
                    </div>
                </div>
            )}

            {/* Sell Tab Content */}
            {activeTab === 'sell' && (
                <div className="mb-6">
                    {/* Quantity Selector and Buttons */}
                    <div className="flex gap-3">
                        {/* List Button */}
                        <button
                            onClick={handleListClick}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors cursor-pointer"
                        >
                            List
                        </button>
                        {/* Fill Offer Button */}
                        <button className="flex-1 bg-light hover:bg-gray-600 text-white font-semibold py-3 rounded transition-colors cursor-pointer">
                            Fill Offer
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}