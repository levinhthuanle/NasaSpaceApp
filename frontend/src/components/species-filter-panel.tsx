"use client"
import { useState, useMemo } from "react"
import { Search, Pin, Eye, EyeOff, X, MapPin } from "lucide-react"
import { SpeciesData, SpeciesGroup } from "@/types/api"

interface SpeciesFilterPanelProps {
    speciesGroups: SpeciesGroup[]
    filteredSpeciesGroups: SpeciesGroup[]
    onSpeciesFilter: (species: SpeciesData[]) => void
    onPinSpecies?: (speciesName: string) => void
    pinnedSpeciesNames?: string[]
    className?: string
}

export default function SpeciesFilterPanel({
    speciesGroups,
    filteredSpeciesGroups,
    onSpeciesFilter,
    onPinSpecies,
    pinnedSpeciesNames = [],
    className = "w-full bg-white rounded-lg shadow-lg border border-gray-300"
}: SpeciesFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSpeciesNames, setSelectedSpeciesNames] = useState<
        Set<string>
    >(new Set(filteredSpeciesGroups.map((g) => g.name)))

    // Filter species groups - ONLY search by species name and scientific name (NO location search)
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return speciesGroups

        const query = searchQuery.toLowerCase()
        return speciesGroups.filter(
            (group) =>
                group.name.toLowerCase().includes(query) ||
                group.scientificName.toLowerCase().includes(query)
        )
    }, [speciesGroups, searchQuery])

    // Handle individual species group selection
    const handleSpeciesToggle = (speciesName: string) => {
        const newSelected = new Set(selectedSpeciesNames)
        if (newSelected.has(speciesName)) {
            newSelected.delete(speciesName)
        } else {
            newSelected.add(speciesName)
        }

        setSelectedSpeciesNames(newSelected)

        // Update filtered species - get all locations for selected species
        const selectedGroups = speciesGroups.filter((group) =>
            newSelected.has(group.name)
        )
        const allSelectedLocations = selectedGroups.flatMap(
            (group) => group.locations
        )
        onSpeciesFilter(allSelectedLocations)
    }

    // Handle select all/none
    const handleSelectAll = () => {
        const allNames = new Set(searchResults.map((g) => g.name))
        setSelectedSpeciesNames(allNames)
        const allLocations = searchResults.flatMap((group) => group.locations)
        onSpeciesFilter(allLocations)
    }

    const handleSelectNone = () => {
        setSelectedSpeciesNames(new Set())
        onSpeciesFilter([])
    }

    // Handle pin/unpin species
    const handlePinToggle = (speciesName: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (onPinSpecies) {
            onPinSpecies(speciesName)
        }
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
                                {selectedSpeciesNames.size} of{" "}
                                {speciesGroups.length} species selected
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
                    Showing {searchResults.length} of {speciesGroups.length}{" "}
                    species • {selectedSpeciesNames.size} selected
                </div>
            </div>

            {/* Species Groups List */}
            <div className="max-h-80 overflow-y-auto">
                {searchResults.map((group) => (
                    <div
                        key={group.name}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSpeciesToggle(group.name)}
                    >
                        <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={selectedSpeciesNames.has(
                                        group.name
                                    )}
                                    onChange={() =>
                                        handleSpeciesToggle(group.name)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>

                            {/* Species Group Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm truncate">
                                        {group.name}
                                    </div>

                                    {/* Pin Button */}
                                    {onPinSpecies && (
                                        <button
                                            onClick={(e) =>
                                                handlePinToggle(group.name, e)
                                            }
                                            className={`p-1 rounded transition-colors ${
                                                pinnedSpeciesNames.includes(
                                                    group.name
                                                )
                                                    ? "text-yellow-500 hover:text-yellow-600"
                                                    : "text-gray-400 hover:text-gray-600"
                                            }`}
                                        >
                                            <Pin size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 italic">
                                    {group.scientificName}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                        <MapPin size={12} />
                                        {group.totalLocations} locations
                                    </div>
                                    <div className="text-xs text-green-600 font-medium">
                                        {group.averageBloomProbability}% avg
                                        bloom
                                    </div>
                                    {pinnedSpeciesNames.includes(
                                        group.name
                                    ) && (
                                        <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                            Pinned
                                        </div>
                                    )}
                                </div>

                                {/* Show some sample locations */}
                                <div className="text-xs text-gray-600 mt-1">
                                    📍{" "}
                                    {group.locations
                                        .slice(0, 2)
                                        .map(
                                            (loc) =>
                                                loc.locationName.split(",")[0]
                                        )
                                        .join(", ")}
                                    {group.totalLocations > 2 &&
                                        ` +${group.totalLocations - 2} more`}
                                </div>
                            </div>

                            {/* Visibility Icon */}
                            <div className="mt-1">
                                {selectedSpeciesNames.has(group.name) ? (
                                    <Eye size={16} className="text-blue-500" />
                                ) : (
                                    <EyeOff
                                        size={16}
                                        className="text-gray-400"
                                    />
                                )}
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
