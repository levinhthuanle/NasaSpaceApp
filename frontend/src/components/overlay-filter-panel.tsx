"use client"
import { useState, useMemo } from "react"
import {
    Search,
    X,
    MapPin,
    Map as MapIcon,
    Calendar,
    Pin,
    FileText,
    ExternalLink,
    BarChart3,
    TrendingUp
} from "lucide-react"
import { MapOverlay, Location } from "@/types/api"
import ChartModal from "@/components/chart-modal"
import PredictModal from "@/components/predict-modal"

interface OverlayFilterPanelProps {
    allOverlays: MapOverlay[]
    allLocations: Location[]
    selectedOverlayIds: number[]
    onOverlayFilter: (overlayIds: number[]) => void
    onRegionFocus?: (bounds: {
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    }) => void
    className?: string
}

export default function OverlayFilterPanel({
    allOverlays,
    allLocations,
    selectedOverlayIds,
    onOverlayFilter,
    onRegionFocus,
    className = "w-sm bg-white rounded-lg shadow-lg border border-gray-300"
}: OverlayFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [chartModal, setChartModal] = useState<{
        isOpen: boolean
        chartUrls: string[]
        overlayName: string
    }>({
        isOpen: false,
        chartUrls: [],
        overlayName: ""
    })

    const [predictModal, setPredictModal] = useState<{
        isOpen: boolean
        predictUrls: string[]
        overlayName: string
    }>({
        isOpen: false,
        predictUrls: [],
        overlayName: ""
    })

    // Check if a location is within overlay bounds
    const isLocationInOverlay = (
        location: Location,
        overlay: MapOverlay
    ): boolean => {
        const [lon, lat] = location.coordinates
        return (
            lon >= overlay.bounds.minLon &&
            lon <= overlay.bounds.maxLon &&
            lat >= overlay.bounds.minLat &&
            lat <= overlay.bounds.maxLat
        )
    }

    // Create overlay data with location counts
    const overlaysWithStats = useMemo(() => {
        return allOverlays.map((overlay) => {
            const overlayLocations = allLocations.filter((loc) =>
                isLocationInOverlay(loc, overlay)
            )
            return {
                ...overlay,
                locationCount: overlayLocations.length,
                locations: overlayLocations
            }
        })
    }, [allOverlays, allLocations])

    // Filter overlays by search query
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return overlaysWithStats

        const query = searchQuery.toLowerCase()
        return overlaysWithStats.filter((overlay) =>
            overlay.name.toLowerCase().includes(query)
        )
    }, [overlaysWithStats, searchQuery])

    // Handle individual overlay selection
    const handleOverlayToggle = (overlayId: number) => {
        const newSelection = selectedOverlayIds.includes(overlayId)
            ? selectedOverlayIds.filter((id) => id !== overlayId)
            : [...selectedOverlayIds, overlayId]

        onOverlayFilter(newSelection)
    }

    // Handle view report
    const handleViewReport = (
        event: React.MouseEvent,
        reportUrl: string | undefined,
        overlayName: string
    ) => {
        event.stopPropagation()
        if (reportUrl) {
            window.open(reportUrl, "_blank", "noopener,noreferrer")
        }
    }

    // Handle view charts
    const handleViewCharts = (
        event: React.MouseEvent,
        chartUrls: string[],
        overlayName: string
    ) => {
        event.stopPropagation() // Prevent toggling checkbox when clicking chart button
        setChartModal({
            isOpen: true,
            chartUrls,
            overlayName
        })
    }

    // Handle close chart modal
    const handleCloseChartModal = () => {
        setChartModal({
            isOpen: false,
            chartUrls: [],
            overlayName: ""
        })
    }

    // Handle view predictions
    const handleViewPredictions = (
        event: React.MouseEvent,
        predictUrls: string[],
        overlayName: string
    ) => {
        event.stopPropagation() // Prevent toggling checkbox when clicking predict button
        setPredictModal({
            isOpen: true,
            predictUrls,
            overlayName
        })
    }

    // Handle close predict modal
    const handleClosePredictModal = () => {
        setPredictModal({
            isOpen: false,
            predictUrls: [],
            overlayName: ""
        })
    }

    // Handle region focus when clicking on region name
    const handleRegionNameClick = (overlay: MapOverlay) => {
        if (onRegionFocus) {
            onRegionFocus(overlay.bounds)
        }
    }

    // Handle select all overlays
    const handleSelectAll = () => {
        if (selectedOverlayIds.length === overlaysWithStats.length) {
            onOverlayFilter([]) // Deselect all if all are selected
        } else {
            onOverlayFilter(overlaysWithStats.map((overlay) => overlay.id))
        }
    }

    // Clear all selections
    const handleClearAll = () => {
        onOverlayFilter([])
        setSearchQuery("")
    }

    const selectedCount = selectedOverlayIds.length
    const totalCount = overlaysWithStats.length
    const totalLocationsInSelected = overlaysWithStats
        .filter((overlay) => selectedOverlayIds.includes(overlay.id))
        .reduce((sum, overlay) => sum + overlay.locationCount, 0)

    return (
        <div className={className}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="w-full items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500 hover:text-gray-700 w-full"
                    >
                        <div className="flex items-center gap-2">
                            <MapIcon size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-gray-800">
                                Filter by Region
                            </h3>
                        </div>
                    </button>
                </div>

                {/* Summary */}
                <div className="mt-2 text-sm text-gray-600">
                    <span>
                        {selectedCount} region{selectedCount > 1 ? "s" : ""}{" "}
                        selected ({totalLocationsInSelected} locations)
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4">
                    {/* Search */}
                    <div className="relative mb-3">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search regions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleSelectAll}
                            className="flex-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                            {selectedCount === totalCount
                                ? "Deselect All"
                                : "Select All"}
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Overlay List */}
                    <div className="max-h-68 overflow-y-auto space-y-3">
                        {searchResults.length > 0 ? (
                            searchResults.map((overlay) => (
                                <div
                                    key={overlay.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedOverlayIds.includes(overlay.id)
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                        handleOverlayToggle(overlay.id)
                                    }
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedOverlayIds.includes(
                                                overlay.id
                                            )}
                                            onChange={() =>
                                                handleOverlayToggle(overlay.id)
                                            }
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="text-sm font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRegionNameClick(
                                                        overlay
                                                    )
                                                }}
                                                title={`Focus on ${overlay.name} region`}
                                            >
                                                {overlay.name}
                                            </div>

                                            {/* Address */}
                                            {overlay.address && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                                    <MapPin
                                                        size={12}
                                                        className="text-gray-400 flex-shrink-0"
                                                    />
                                                    <span className="truncate">
                                                        {overlay.address}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bloom Period */}
                                            {overlay.startDate &&
                                                overlay.endDate && (
                                                    <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                                                        <Calendar
                                                            size={12}
                                                            className="text-green-500 flex-shrink-0"
                                                        />
                                                        <span>
                                                            Bloom:{" "}
                                                            {new Date(
                                                                overlay.startDate
                                                            ).toLocaleDateString()}{" "}
                                                            -{" "}
                                                            {new Date(
                                                                overlay.endDate
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}

                                            <div className="flex items-center gap-1 text-xs mb-1">
                                                <Pin
                                                    size={12}
                                                    className="text-gray-400 flex-shrink-0"
                                                />
                                                <div className="text-xs text-gray-500">
                                                    {overlay.locationCount} loc
                                                    {overlay.locationCount !== 1
                                                        ? "s"
                                                        : ""}
                                                </div>
                                                {/* Action Buttons */}
                                                {(overlay.reportUrl ||
                                                    (overlay.chartUrls &&
                                                        overlay.chartUrls
                                                            .length > 0) ||
                                                    (overlay.predictUrls &&
                                                        overlay.predictUrls
                                                            .length > 0)) && (
                                                    <div className="flex items-center gap-2s">
                                                        {/* Charts Button - Only show if chartUrls exists and not empty */}
                                                        {overlay.chartUrls &&
                                                            overlay.chartUrls
                                                                .length > 0 && (
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleViewCharts(
                                                                            e,
                                                                            overlay.chartUrls!,
                                                                            overlay.name
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                                                    title={`View charts for ${overlay.name}`}
                                                                >
                                                                    <BarChart3
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Charts
                                                                    </span>
                                                                </button>
                                                            )}

                                                        {/* Predict Button - Only show if predictUrls exists and not empty */}
                                                        {overlay.predictUrls &&
                                                            overlay.predictUrls
                                                                .length > 0 && (
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleViewPredictions(
                                                                            e,
                                                                            overlay.predictUrls!,
                                                                            overlay.name
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                                                    title={`View predictions for ${overlay.name}`}
                                                                >
                                                                    <TrendingUp
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Predict
                                                                    </span>
                                                                </button>
                                                            )}

                                                        {/* Report Button - Only show if reportUrl exists */}
                                                        {overlay.reportUrl && (
                                                            <button
                                                                onClick={(e) =>
                                                                    handleViewReport(
                                                                        e,
                                                                        overlay.reportUrl,
                                                                        overlay.name
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                                title={`View report for ${overlay.name}`}
                                                            >
                                                                <FileText
                                                                    size={10}
                                                                />
                                                                <span>
                                                                    Report
                                                                </span>
                                                                <ExternalLink
                                                                    size={8}
                                                                />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                {searchQuery
                                    ? "No regions match your search"
                                    : "No regions available"}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chart Modal */}
            <ChartModal
                isOpen={chartModal.isOpen}
                onClose={handleCloseChartModal}
                chartUrls={chartModal.chartUrls}
                overlayName={chartModal.overlayName}
            />

            {/* Predict Modal */}
            <PredictModal
                isOpen={predictModal.isOpen}
                onClose={handleClosePredictModal}
                predictUrls={predictModal.predictUrls}
                overlayName={predictModal.overlayName}
            />
        </div>
    )
}
