// import React from 'react'
// import { LayoutGrid, List } from 'lucide-react'

// interface ViewTabsProps {
//     activeView: 'market' | 'nfts'
//     onViewChange: (view: 'market' | 'nfts') => void
//     loggedWallet: string | null
//     layoutMode: 'grid' | 'list'
//     onLayoutChange: (mode: 'grid' | 'list') => void
// }

// export const ViewTabs: React.FC<ViewTabsProps> = ({
//     activeView,
//     onViewChange,
//     loggedWallet,
//     layoutMode,
//     onLayoutChange
// }) => {
//     return (
//         <div className='flex items-center justify-between py-1 text-text text-xl font-bold'>
//             <div className='flex items-center gap-5'>
//                 <div
//                     className={`px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'market' ? 'bg-light' : ''
//                         }`}
//                     onClick={() => onViewChange('market')}
//                 >
//                     Market
//                 </div>

//                 {loggedWallet && (
//                     <div
//                         className={`px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'nfts' ? 'bg-light' : ''
//                             }`}
//                         onClick={() => onViewChange('nfts')}
//                     >
//                         My NFTs
//                     </div>
//                 )}
//             </div>

//             {/* Layout Toggle */}
//             <div className='flex items-center gap-2'>
//                 <button
//                     onClick={() => onLayoutChange('grid')}
//                     className={`cursor-pointer p-2 rounded-md transition-colors ${layoutMode === 'grid'
//                         ? 'bg-light text-text'
//                         : 'bg-background text-gray-400 hover:bg-light hover:text-text'
//                         }`}
//                     title="Grid view"
//                 >
//                     <LayoutGrid className='w-5 h-5' />
//                 </button>
//                 <button
//                     onClick={() => onLayoutChange('list')}
//                     className={`cursor-pointer p-2 rounded-md transition-colors ${layoutMode === 'list'
//                         ? 'bg-light text-text'
//                         : 'bg-background text-gray-400 hover:bg-light hover:text-text'
//                         }`}
//                     title="List view"
//                 >
//                     <List className='w-5 h-5' />
//                 </button>
//             </div>
//         </div>
//     )
// }

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
    loading
}) => {
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const handleViewChange = (view: 'market' | 'nfts') => {
        if (loading || view === activeView) return

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
                        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    Market
                </div>

                {loggedWallet && (
                    <div
                        onClick={() => handleViewChange('nfts')}
                        className={`px-2 py-1 rounded-md cursor-pointer ${activeView === 'nfts' ? 'bg-light' : 'bg-background'
                            } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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
