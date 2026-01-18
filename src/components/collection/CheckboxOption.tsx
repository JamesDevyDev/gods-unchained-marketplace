import React from 'react'

interface CheckboxOptionProps {
    label: string
    count: number
    checked: boolean
    onChange: () => void
}

export const CheckboxOption: React.FC<CheckboxOptionProps> = ({
    label,
    count,
    checked,
    onChange
}) => (
    <label className="flex items-center justify-between py-2 px-1 hover:bg-[#353840] rounded cursor-pointer group transition-colors">
        <div className="flex items-center gap-3 flex-1">
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="w-4 h-4 appearance-none border-2 border-gray-500 rounded cursor-pointer
                     checked:bg-[#2081E2] checked:border-[#2081E2] transition-all
                     hover:border-gray-400"
                />
                {checked && (
                    <svg
                        className="w-3 h-3 text-white absolute pointer-events-none"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M5 13l4 4L19 7"></path>
                    </svg>
                )}
            </div>
            <span className="text-gray-300 text-sm group-hover:text-white capitalize">
                {label}
            </span>
        </div>
        <span className="text-gray-400 text-sm">{count}</span>
    </label>
)