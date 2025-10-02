"use client"
import { Pin, X, MapPin } from "lucide-react"
import { PinnedSpecies } from "@/types/api"

interface PinnedSpeciesPanelProps {
    pinnedSpeciesData: PinnedSpecies[]
    onUnpinSpecies: (speciesName: string) => void
    onFocusSpecies?: (species: PinnedSpecies) => void
    className?: string
}

export default function PinnedSpeciesPanel({
    pinnedSpeciesData,
    onUnpinSpecies,
    onFocusSpecies,
    className = "max-w-sm"
}: PinnedSpeciesPanelProps) {
    if (pinnedSpeciesData.length === 0) {
        return null
    }

    return (
        <div className={className}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <Pin size={16} className="text-yellow-500" />
                    <h4 className="font-semibold text-sm">
                        Pinned Species ({pinnedSpeciesData.length})
                    </h4>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {pinnedSpeciesData.map((species) => (
                        <div
                            key={species.name}
                            className="p-3 bg-yellow-50 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors"
                        >
                            {/* Species Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {species.name}
                                    </div>
                                    <div className="text-xs text-gray-500 italic">
                                        {species.scientificName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                            <MapPin size={12} />
                                            {species.locations.length} locations
                                        </div>
                                    </div>
                                </div>

                                {/* Unpin Button */}
                                <button
                                    onClick={() => onUnpinSpecies(species.name)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Unpin species"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Locations List */}
                            <div className="space-y-1">
                                {species.locations
                                    .slice(0, 3)
                                    .map((location, index) => (
                                        <div
                                            key={location.id}
                                            className="text-xs bg-white rounded px-2 py-1 border cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() =>
                                                onFocusSpecies?.(species)
                                            }
                                        >
                                            <div className="font-medium text-gray-700">
                                                📍 {location.locationName}
                                            </div>
                                            <div className="text-green-600 font-medium">
                                                {location.bloomProbability}%
                                                bloom probability
                                            </div>
                                        </div>
                                    ))}

                                {species.locations.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                        +{species.locations.length - 3} more
                                        locations
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
