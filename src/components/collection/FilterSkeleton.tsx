import React from 'react'

export const FilterSkeleton = () => (
    <div className="space-y-1">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="border-b border-[#353840] py-4">
                <div className="h-5 w-24 bg-light rounded animate-pulse"></div>
            </div>
        ))}
    </div>
)