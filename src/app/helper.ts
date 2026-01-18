import { RARITY_COLORS } from "./constants"

export const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'N/A'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
}

export const getRarityColor = (rarity: string): string => {
    return RARITY_COLORS[rarity?.toLowerCase()] || 'text-gray-400'
}

export const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
    const newSet = new Set(set)
    if (newSet.has(item)) {
        newSet.delete(item)
    } else {
        newSet.add(item)
    }
    return newSet
}