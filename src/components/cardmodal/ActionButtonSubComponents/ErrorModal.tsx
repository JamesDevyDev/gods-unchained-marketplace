export const ErrorModal = ({
    isOpen,
    title,
    message,
    onClose
}: {
    isOpen: boolean
    title: string
    message: string
    onClose: () => void
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-lines">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    {title}
                </h2>
                <div className="rounded-lg p-4 mb-6">
                    <p className="text-white text-center">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="cursor-pointer w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}