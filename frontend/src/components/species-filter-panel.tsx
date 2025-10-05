"use client"
import { useState, useMemo } from "react"
import { Search, X, MapPin } from "lucide-react"
import { Species, Location } from "@/types/api"

interface SpeciesFilterPanelProps {
    allSpecies: Species[]
    allLocations: Location[]
    selectedSpeciesIds: number[]
    onSpeciesFilter: (speciesIds: number[]) => void
    className?: string
}

export default function SpeciesFilterPanel({
    allSpecies,
    allLocations,
    selectedSpeciesIds,
    onSpeciesFilter,
    className = "w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-300"
}: SpeciesFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Create species data with location counts
    const speciesWithStats = useMemo(() => {
        return allSpecies.map((species) => {
            const speciesLocations = allLocations.filter(
                (loc) => loc.speciesId === species.speciesId
            )
            return {
                ...species,
                locationCount: speciesLocations.length,
                locations: speciesLocations
            }
        })
    }, [allSpecies, allLocations])

    // Filter species - search by species name and scientific name only
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return speciesWithStats

        const query = searchQuery.toLowerCase()
        return speciesWithStats.filter(
            (species) =>
                species.name.toLowerCase().includes(query) ||
                species.scientificName.toLowerCase().includes(query)
        )
    }, [speciesWithStats, searchQuery])

    // Handle individual species selection
    const handleSpeciesToggle = (speciesId: number) => {
        const newSelected = selectedSpeciesIds.includes(speciesId)
            ? selectedSpeciesIds.filter((id) => id !== speciesId)
            : [...selectedSpeciesIds, speciesId]

        onSpeciesFilter(newSelected)
    }

    // Handle select all/none
    const handleSelectAll = () => {
        const allIds = searchResults.map((species) => species.speciesId)
        onSpeciesFilter(allIds)
    }

    const handleSelectNone = () => {
        onSpeciesFilter([])
    }

    if (!isExpanded) {
        return (
            <div className={className}>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-sm">
                                🌸 Species Filter
                            </div>
                            <div className="text-xs text-gray-600">
                                {selectedSpeciesIds.length} of{" "}
                                {allSpecies.length} species selected
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        )
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="font-semibold text-sm w-full text-left"
                    >
                        🌸 Species Filter
                    </button>
                </div>

                {/* Search Bar - chỉ search species name */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by species name only..."
                        className="w-full px-3 py-2 pr-8 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search
                        size={14}
                        className="absolute right-2 top-2.5 text-gray-400"
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Select All
                    </button>
                    <button
                        onClick={handleSelectNone}
                        className="flex-1 px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                    Showing {searchResults.length} of {allSpecies.length}{" "}
                    species • {selectedSpeciesIds.length} selected
                </div>
            </div>

            {/* Species List */}
            <div className="max-h-80 overflow-y-auto">
                {searchResults.map((species) => (
                    <div
                        key={species.speciesId}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSpeciesToggle(species.speciesId)}
                    >
                        <div className="flex items-start gap-3">
                            {/* Species Image */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                    src={
                                        species.imageUrl ||
                                        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400"
                                    }
                                    alt={species.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Species Info */}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                    {species.name}
                                </div>

                                <div className="text-xs text-gray-500 italic">
                                    {species.scientificName}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                        <MapPin size={12} />
                                        {species.locationCount} locations
                                    </div>
                                    <div className="text-xs text-green-600 font-medium">
                                        {species.bloomTime || "Unknown season"}
                                    </div>
                                </div>

                                {/* Show some sample locations */}
                                <div className="text-xs text-gray-600 mt-1">
                                    📍{" "}
                                    {species.locations
                                        .slice(0, 2)
                                        .map(
                                            (loc) =>
                                                loc.locationName.split(",")[0]
                                        )
                                        .join(", ")}
                                    {species.locationCount > 2 &&
                                        ` +${species.locationCount - 2} more`}
                                </div>
                            </div>

                            {/* Select Checkbox - moved to the end */}
                            <div className="mt-0.5 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedSpeciesIds.includes(
                                        species.speciesId
                                    )}
                                    onChange={() =>
                                        handleSpeciesToggle(species.speciesId)
                                    }
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {searchResults.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        {searchQuery
                            ? `No species found matching "${searchQuery}"`
                            : "No species available"}
                    </div>
                )}
            </div>
        </div>
    )
}
