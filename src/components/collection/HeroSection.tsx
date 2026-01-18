import React from 'react'

interface HeroSectionProps {
    contractName?: string | null
    loading: boolean
}

export const HeroSection: React.FC<HeroSectionProps> = ({ contractName, loading }) => {
    return (
        <div className="relative h-[300px] overflow-hidden flex items-center justify-center" >
            <img
                src="/assets/bg.png"
                className="absolute inset-0 w-full h-full object-cover scale-110"
                alt=""
            />

            <div className="flex justify-between items-center z-20" >
                <div>
                    <h1 className="text-3xl font-bold text-white my-4" >
                        {loading ? "" : contractName}
                    </h1>
                </div>
            </div>

            < div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-black/60" />
        </div>
    )
}