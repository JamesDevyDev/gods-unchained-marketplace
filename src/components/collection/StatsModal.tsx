import React from 'react'
import { X } from 'lucide-react'
import type { Stats } from '@/app/types'

interface StatsModalProps {
    isOpen: boolean
    onClose: () => void
    stats: Stats | undefined
    totalRealValue: number
    totalFloorValue: number
    formatPrice: (price: number | null) => string
}

export const StatsModal: React.FC<StatsModalProps> = ({
    isOpen,
    onClose,
    stats,
    totalRealValue,
    formatPrice
}) => {
    if (!isOpen || !stats) return null

    const StatRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-text">{value}</span>
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-background border border-lines rounded-lg w-full max-w-4xl">
                {/* Header */}
                <div className="bg-background border-b border-lines px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text">Collection Stats</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-light rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Portfolio Value */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-light  rounded-lg p-4 text-center">
                            <div className="text-xs text-gray-400 mb-2">Real Value</div>
                            <div className="text-sm md:text-2xl font-bold text-green-400">
                                ${formatPrice(totalRealValue)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">Real Market Value</div>
                        </div>
                        <div className="bg-light  rounded-lg p-4 text-center">
                            <div className="text-xs text-gray-400 mb-2">Floor Value</div>
                            <div className="text-sm md:text-2xl font-bold text-blue-400">
                                ${formatPrice(stats.total_floor_value_usd)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">Current Market Floor</div>
                        </div>
                        <div className="bg-light  rounded-lg p-4 text-center">
                            <div className="text-xs text-gray-400 mb-2">Listed Value</div>
                            <div className="text-sm md:text-2xl font-bold text-purple-400">
                                ${formatPrice(stats.user_listing_stats?.total_listed_value_usd || 0)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">Active listings Value</div>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Collection Overview */}
                            <div className="bg-light  rounded-lg p-4 space-y-1">
                                <h3 className="text-xs font-semibold text-gray-400 mb-2">Collection Overview</h3>
                                <StatRow label="Total Tokens" value={stats.total_tokens} />
                                <div className="h-px bg-lines" />
                                <StatRow label="Unique Cards" value={stats.total_unique_cards} />
                                <div className="h-px bg-lines" />
                                <StatRow label="With Listings" value={stats.cards_with_listings} />
                                <div className="h-px bg-lines" />
                                <StatRow label="Without Listings" value={stats.cards_without_listings} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Listing Statistics */}
                            {stats.user_listing_stats && (
                                <div className="bg-light  rounded-lg p-4 space-y-1">
                                    <h3 className="text-xs font-semibold text-gray-400 mb-2">Your Listings</h3>
                                    
                                    <div className="h-px bg-lines" />
                                    <StatRow
                                        label="Listed Tokens"
                                        value={stats.user_listing_stats.total_listed_tokens}
                                    />
                                    <div className="h-px bg-lines" />
                                    <StatRow
                                        label="Unlisted Tokens"
                                        value={stats.user_listing_stats.total_unlisted_tokens}
                                    />
                                </div>
                            )}
                        </div>
                    </div> 
                </div>
            </div>
        </div>
    )
}