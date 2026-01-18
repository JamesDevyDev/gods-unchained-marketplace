export interface CardAttributes {
    [key: string]: string | number
}

export interface PriceInfo {
    listing_id: string
    price: number
    usd: number
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