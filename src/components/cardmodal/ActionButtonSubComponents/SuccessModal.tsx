export const SuccessModal = ({
    isOpen,
    tokenId,
    onClose
}: {
    isOpen: boolean
    tokenId: string
    onClose: () => void
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    Purchase Successful! 🎉
                </h2>
                <div className="rounded-lg p-4 mb-6">
                    <p className="text-gray-400 text-sm text-center mb-2">NFT Token ID</p>
                    <p className="text-white text-lg font-semibold text-center">{tokenId}</p>
                </div>
                <p className="text-gray-400 text-center mb-6">
                    Your NFT has been successfully transferred to your wallet!
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
                >
                    Close
                </button>
            </div>
        </div>
    )
}