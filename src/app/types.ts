export interface CardAttributes {
    [key: string]: string | number
}

export interface PriceInfo {
    listing_id: string
    price: number
    usd: number
    base_price: number
}

export interface AllPrices {
    [currency: string]: PriceInfo
}

export interface OwnedToken {
    token_id: string
    listed: boolean
    listing_id: string | null
    price: number | null
    price_usd: number | null
    currency: string | null
    status: string | null
    order_hash: string | null
    expires_at: string | null
    created_at: string | null
    token_address: string | null
}

export interface Listing {
    created_at: string
    currency: string
    expires_at: string
    listing_id: string
    order_hash: string
    price: number
    price_usd: number
    status: string
    token_address: string
    token_id: string
}

export interface ListingSummary {
    avg_listing_price_usd: number
    listed_count: number
    total_listed_value_usd: number
    unlisted_count: number
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
    // Add missing properties from your API response
    quantity: number
    real_value: number
    total_floor_value: number
    owned_tokens?: OwnedToken[]
    active_listings?: Listing[]
    listing_summary?: ListingSummary
    unlisted_token_ids?: string[]
}

export interface UserListingStats {
    cards_with_user_listings: number
    total_listed_tokens: number
    total_listed_value_usd: number
    total_listings: number
    total_unlisted_tokens: number
}

export interface Stats {
    cards_with_listings: number
    cards_without_listings: number
    total_floor_value_usd: number
    total_tokens: number
    total_unique_cards: number
    user_listing_stats?: UserListingStats
}

export interface Contract {
    cards_with_listings: number | null
    contract_address: string | null
    description: string | null
    floor_currency: string | null
    floor_price: number | null
    image: string | null
    name: string | null
    symbol: string | null
    total_listings: number | null
}

export interface ApiResponse {
    stacks: Stack[]
    total: number
    cached: boolean
    contract_address?: string
    wallet_address?: string
    stats?: Stats
}

export interface FilterOptions {
    rarities: string[]
    types: string[]
    currencies: string[]
    attributes: Record<string, string[]>
}

export interface PriceRange {
    min: string
    max: string
}

export interface SortOption {
    value: string
    label: string
}