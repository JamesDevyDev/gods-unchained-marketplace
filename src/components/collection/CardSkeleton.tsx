import React from 'react'

export const CardSkeleton = () => (
    <div className="bg-background px-2 rounded-md overflow-hidden shadow-lg">
        <div className="aspect-[2/3] relative overflow-hidden flex items-center justify-center bg-light animate-pulse">
        </div>
        <div className="p-3 space-y-2">
            <div className="h-5 bg-light rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-light rounded w-1/2 animate-pulse"></div>
            <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-light rounded-full animate-pulse"></div>
                <div className="h-3 bg-light rounded w-20 animate-pulse"></div>
            </div>
            <div className="h-3 bg-light rounded w-16 animate-pulse"></div>
        </div>
    </div>
)