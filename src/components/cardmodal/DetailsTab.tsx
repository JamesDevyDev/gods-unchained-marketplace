import { Stack } from './types'

type DetailsTabProps = {
    card: Stack
    getRarityColor: (rarity: string) => string
}

export const DetailsTab = ({ card, getRarityColor }: DetailsTabProps) => {
    return (
        <div>
            {/* Attributes Section */}
            <div className="mb-6">
                <h3 className="text-white font-semibold text-base mb-3">Attributes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(card.attributes).map(([key, value]) => (
                        <div key={key} className="bg-light border border-lines rounded-lg p-3">
                            <div className="text-gray-400 text-xs uppercase mb-1">{key}</div>
                            <div className="text-white text-sm font-semibold">{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rarity & Type */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-light border border-lines rounded-lg p-3">
                    <div className="text-gray-400 text-xs uppercase mb-1">Rarity</div>
                    <div className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
                        {card.rarity}
                    </div>
                </div>
                <div className="bg-light border border-lines rounded-lg p-3">
                    <div className="text-gray-400 text-xs uppercase mb-1">Type</div>
                    <div className="text-white text-sm font-semibold">{card.item_type}</div>
                </div>
            </div>

            {/* Description */}
            {card.description && (
                <div className="mb-6">
                    <h3 className="text-white font-semibold text-base mb-2">Description</h3>
                    <p className="text-gray-400 text-sm">{card.description}</p>
                </div>
            )}
        </div>
    )
}
