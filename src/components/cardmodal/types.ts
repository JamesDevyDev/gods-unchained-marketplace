export interface CardAttributes {
    [key: string]: string | number
}

export interface PriceInfo {
    listing_id: string
    price: number
    usd: number
    base_price:number
}

export interface AllPrices {
    [currency: string]: PriceInfo
}

export interface Stack {
    metadata_id: string
    name: string
    description: string | null
    image: string
    attributes: CardAttributes
    rarity: string
    item_type: string
    total_listings: number
    all_prices: AllPrices
    best_usd_price: number | null
    best_currency: string | null
    last_sold_price: number | null
    quantity?: number
}

export interface FeeBreakdown {
    amount: number
    amount_usd: number
    recipient: string
    type: string
}

export interface ListingPrices {
    base_price: number
    base_price_usd: number
    fees: number
    fees_usd: number
    total_usd: number
    total_with_fees: number
}

export interface Listing {
    created_at: string
    currency: string
    end_at: string
    fee_breakdown: FeeBreakdown[]
    listing_id: string
    order_hash: string
    prices: ListingPrices
    seller_address: string
    start_at: string
    status: string
    token_address: string
    token_id: string
}

export interface ListingsResponse {
    all_listings: Listing[]
    by_currency: {
        ETH: Listing[]
        GODS: Listing[]
        IMX: Listing[]
        USDC: Listing[]
        OTHER: Listing[]
    }
    cheapest_listing: Listing
    contract_address: string
    metadata_id: string
    total_listings: number
    token_id: string

}