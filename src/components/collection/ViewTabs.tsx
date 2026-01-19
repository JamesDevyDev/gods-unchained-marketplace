import React from 'react'

interface ViewTabsProps {
    activeView: 'market' | 'nfts'
    onViewChange: (view: 'market' | 'nfts') => void
    loggedWallet: string | null
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
    activeView,
    onViewChange,
    loggedWallet
}) => {
    return (
        <div className='flex items-center justify-start py-1 gap-5 text-text text-xl font-bold'>
            <div
                className={` px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'market' ? 'bg-light' : ''
                    }`}
                onClick={() => onViewChange('market')}
            >
                Market
            </div>

            {loggedWallet && (
                <div
                    className={` px-2 bg-background flex items-center justify-center cursor-pointer hover:bg-light rounded-md ${activeView === 'nfts' ? 'bg-light' : ''
                        }`}
                    onClick={() => onViewChange('nfts')}
                >
                    My NFTs
                </div>
            )}
        </div>
    )
} 