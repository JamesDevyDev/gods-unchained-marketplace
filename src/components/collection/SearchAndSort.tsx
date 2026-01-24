import React from 'react'
import { Menu, ChevronDown, ChevronUp } from 'lucide-react'
import type { SortOption } from '@/app/types'

interface SearchAndSortProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    sortType: string
    setSortType: (type: string) => void
    sortDirection: 'asc' | 'desc'
    setSortDirection: (direction: 'asc' | 'desc') => void
    isSortOpen: boolean
    setIsSortOpen: (open: boolean) => void
    sortOptions: SortOption[]
    sortRef: React.RefObject<HTMLDivElement | null>
    onFilterToggle: () => void
}

export const SearchAndSort: React.FC<SearchAndSortProps> = ({
    searchQuery,
    setSearchQuery,
    sortType,
    setSortType,
    sortDirection,
    setSortDirection,
    isSortOpen,
    setIsSortOpen,
    sortOptions,
    sortRef,
    onFilterToggle
}) => {
    return (
        <div>
            <div className="mb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <div className='flex w-full  gap-4'>
                    {/* Mobile Filter Button */}
                    <button
                        onClick={onFilterToggle}
                        className="h-8 lg:hidden sm:w-auto px-4 cursor-pointer flex items-center justify-center gap-2 bg-background border border-lines rounded-md hover:bg-[#36393f] transition"
                    >
                        <Menu className="w-4 h-4" />
                    </button>

                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className=" h-8 w-full px-3 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] focus:border-[#2081E2] focus:outline-none text-base"
                    />

                    {/* Sort Section */}
                    <div className="flex items-center gap-2 sm:w-auto">
                        {/* Sort Type Dropdown */}
                        <div ref={sortRef} className="relative flex-1 sm:flex-initial">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="h-8 w-full cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] hover:bg-[#3d4147] transition whitespace-nowrap text-sm sm:min-w-[140px] justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {sortOptions.find(opt => opt.value === sortType)?.label || 'Price'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSortOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#36393f] border border-[#3d4147] rounded-lg shadow-xl z-50 overflow-hidden">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortType(option.value)
                                                setIsSortOpen(false)
                                            }}
                                            className={`cursor-pointer w-full text-left px-4 py-3 hover:bg-[#3d4147] transition text-sm ${sortType === option.value ? 'bg-[#2081E2] text-white' : 'text-gray-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Direction Toggle Button */}
                        <button
                            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                            className="h-8 cursor-pointer flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#36393f] text-white rounded-lg border border-[#3d4147] hover:bg-[#3d4147] transition text-sm flex-shrink-0"
                            title={sortDirection === 'asc' ? 'Low to High' : 'High to Low'}
                        >
                            {sortDirection === 'asc' ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}