export const PurchaseProgressModal = ({
    isOpen
}: {
    isOpen: boolean
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Transaction is being processed
                </h2>
                <div className="flex justify-center mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-gray-400 text-center">
                    Please wait while your transaction is being confirmed on the blockchain.
                </p>
            </div>
        </div>
    )
}