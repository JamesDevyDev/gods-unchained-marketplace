import React from 'react'

interface RadioOptionProps {
    label: string
    count: number
    checked: boolean
    onChange: () => void
}

export const RadioOption: React.FC<RadioOptionProps> = ({
    label,
    count,
    checked,
    onChange
}) => (
    <label className="flex items-center justify-between py-2 px-1 hover:bg-[#353840] rounded cursor-pointer group transition-colors">
        <div className="flex items-center gap-3 flex-1">
            <div className="relative flex items-center justify-center">
                <input
                    type="radio"
                    checked={checked}
                    onChange={onChange}
                    className="w-4 h-4 appearance-none border-2 border-gray-500 rounded-full cursor-pointer
                     checked:border-[#2081E2] transition-all hover:border-gray-400"
                />
                {checked && (
                    <div className="w-2 h-2 bg-[#2081E2] rounded-full absolute pointer-events-none"></div>
                )}
            </div>
            <span className="text-gray-300 text-sm group-hover:text-white capitalize">
                {label}
            </span>
        </div>
        <span className="text-gray-400 text-sm">{count}</span>
    </label>
)