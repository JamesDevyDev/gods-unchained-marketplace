import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DropdownFilterProps {
    label: string
    count?: number
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
    label,
    count,
    isOpen,
    onToggle,
    children
}) => (
    <div className="border-b border-[#353840]">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-4 px-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
            <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-base">{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="text-xs text-white bg-[#2081E2] px-2 py-0.5 rounded-full font-medium">
                        {count}
                    </span>
                )}
            </div>
            {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
        </button>

        {isOpen && (
            <div className="pb-4">
                {children}
            </div>
        )}
    </div>
)