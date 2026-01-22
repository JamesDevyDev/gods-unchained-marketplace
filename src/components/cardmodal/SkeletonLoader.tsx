export const SkeletonLoader = () => {
    return (
        <div className="flex flex-col lg:flex-row w-full">
            <div className="w-full lg:w-[40%] bg-background border-b lg:border-b-0 lg:border-r border-lines p-4 sm:p-6">
                <div className="w-full max-w-md mx-auto lg:max-w-none aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
            </div>

            <div className="flex-1 bg-background p-4 sm:p-6">
                <div className="mb-6">
                    <div className="h-4 w-20 bg-light rounded mb-2 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-light rounded-full animate-pulse"></div>
                        <div className="flex flex-col gap-2">
                            <div className="h-8 w-32 bg-light rounded animate-pulse"></div>
                            <div className="h-3 w-24 bg-light rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 h-12 bg-light rounded animate-pulse"></div>
                    <div className="flex-1 h-12 bg-light rounded animate-pulse"></div>
                </div>

                <div className="border-b border-lines mb-4">
                    <div className="flex gap-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="pb-3">
                                <div className="h-4 w-16 bg-light rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="h-6 w-24 bg-light rounded animate-pulse"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-light border border-lines rounded-lg p-3">
                                <div className="h-3 w-16 bg-light rounded mb-2 animate-pulse"></div>
                                <div className="h-4 w-20 bg-light rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}