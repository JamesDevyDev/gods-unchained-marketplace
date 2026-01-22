type CardModalHeaderProps = {
    name: string
    onClose: () => void
}

export const CardModalHeader = ({ name, onClose }: CardModalHeaderProps) => {
    return (
        <div className="bg-background border-lines border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate pr-4">{name}</h2>
            <button
                onClick={onClose}
                className="p-2 hover:bg-light rounded transition-colors flex-shrink-0 cursor-pointer"
            >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}