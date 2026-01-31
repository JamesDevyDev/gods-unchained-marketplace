import React, { useRef } from 'react'
import { LayoutGrid, List } from 'lucide-react'

interface ViewTabsProps {
    activeView: 'market' | 'nfts'
    onViewChange: (view: 'market' | 'nfts') => void
    loggedWallet: string | null
    layoutMode: 'grid' | 'list'
    onLayoutChange: (mode: 'grid' | 'list') => void
    loading: boolean
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
    activeView,
    onViewChange,
    loggedWallet,
    layoutMode,
    onLayoutChange,
}) => {
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const handleViewChange = (view: 'market' | 'nfts') => {
        if (view === activeView) return

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            onViewChange(view)
        }, 120)
    }

    return (
        <div className="flex items-center justify-between py-1 text-text text-xl font-bold">
            <div className="flex items-center gap-5">
                <div
                    onClick={() => handleViewChange('market')}
                    className={`px-2 py-1 rounded-md cursor-pointer ${activeView === 'market' ? 'bg-light' : 'bg-background'
                        }`}
                >
                    Market
                </div>

                {loggedWallet && (
                    <div
                        onClick={() => handleViewChange('nfts')}
                        className={`px-2 py-1 rounded-md cursor-pointer ${activeView === 'nfts' ? 'bg-light' : 'bg-background'
                            }`}
                    >
                        My NFTs
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onLayoutChange('grid')}
                    className={`p-2 cursor-pointer rounded-md ${layoutMode === 'grid'
                            ? 'bg-light text-text'
                            : 'bg-background text-gray-400'
                        }`}
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onLayoutChange('list')}
                    className={`p-2 cursor-pointer rounded-md ${layoutMode === 'list'
                            ? 'bg-light text-text'
                            : 'bg-background text-gray-400'
                        }`}
                >
                    <List className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}