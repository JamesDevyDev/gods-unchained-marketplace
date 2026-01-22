type TabNavigationProps = {
    activeTab: 'details' | 'buy' | 'sell' | 'owned' | 'activity'
    setActiveTab: (tab: 'details' | 'buy' | 'sell' | 'owned' | 'activity') => void
    showWalletTabs: boolean
}

export const TabNavigation = ({ activeTab, setActiveTab, showWalletTabs }: TabNavigationProps) => {
    const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`pb-3 cursor-pointer text-sm font-semibold transition-colors relative ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-hover'
                }`}
        >
            {label}
            {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
        </button>
    )

    return (
        <div className="border-b border-lines mb-4">
            <div className="flex gap-6">
                <TabButton tab="details" label="Details" />
                <TabButton tab="buy" label="Buy" />
                {showWalletTabs && <TabButton tab="sell" label="Sell" />}
                {showWalletTabs && <TabButton tab="owned" label="Owned" />}
                <TabButton tab="activity" label="Activity" />
            </div>
        </div>
    )
}