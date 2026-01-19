export const ALLOWED_ATTRIBUTES = [
    'God',
    'Quality',
    'Set',
    'Tribe'
]

export const SORT_OPTIONS = [
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' },
    { value: 'quality', label: 'Quality' },
    { value: 'quantity', label: 'Quantity' },
]

export const RARITY_COLORS: { [key: string]: string } = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-orange-400',
    mythic: 'text-red-400'
}

export const RARITY_ORDER: Record<string, number> = {
    'common': 1,
    'rare': 2,
    'epic': 3,
    'legendary': 4,
    'mythic': 5
}

export const INITIAL_DISPLAY_COUNT = 50
export const LOAD_MORE_COUNT = 50
export const SCROLL_THRESHOLD = 0.5
export const SCROLL_ROOT_MARGIN = '2000px'