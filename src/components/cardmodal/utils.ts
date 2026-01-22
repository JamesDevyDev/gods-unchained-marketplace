export const getCurrencyIcon = (currency: string): string => {
    const currencyLower = currency.toLowerCase()
    return `/assets/currency/${currencyLower}.png`
}

export const getTimeUntilExpiration = (endAt: string): string => {
    const now = new Date()
    const end = new Date(endAt)
    const diffMs = end.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expired'

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`

    const minutes = Math.floor(diffMs / (1000 * 60))
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
}