"use client"
import { useState, useEffect } from "react"
import "ol/ol.css"
import "@/styles/ol-custom.css"
import OLMap from "@/components/ol-map"
import OLMapControls from "@/components/ol-map-controls"
import SpeciesFilterPanel from "@/components/species-filter-panel"

import BloomCalendar from "@/components/bloom-calendar"
import Chatbot from "@/components/chatbot"
import {
    Species,
    Location,
    SpeciesWithLocations,
    MapOverlay
} from "@/types/api"
import {
    getAllSpecies,
    getAllLocations,
    getLocationsBySpecies,
    getAllSpeciesAndLocations,
    getMapOverlays
} from "@/services/species-api"

export default function Home() {
    // Map state
    const [mapCenter, setMapCenter] = useState<[number, number]>([106.0, 16.0])
    const [mapZoom, setMapZoom] = useState(6)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        null
    )

    // UI state
    const [showCalendar, setShowCalendar] = useState(false)
    const [showChatbot, setShowChatbot] = useState(false)

    // Data state
    const [allSpecies, setAllSpecies] = useState<Species[]>([])
    const [allLocations, setAllLocations] = useState<Location[]>([])
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]) // Filtered by species
    const [calendarFilteredLocations, setCalendarFilteredLocations] = useState<
        Location[]
    >([]) // Further filtered by calendar dates
    const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<number[]>([])
    const [hasDateFilter, setHasDateFilter] = useState(false) // Track if calendar has active date filter
    const [mapOverlays, setMapOverlays] = useState<MapOverlay[]>([]) // Map overlays from API
    const [overlayVisible, setOverlayVisible] = useState(true) // Control overlay visibility

    const [loading, setLoading] = useState(true)

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                const [speciesData, overlaysData] = await Promise.all([
                    getAllSpeciesAndLocations(),
                    getMapOverlays()
                ])

                setAllSpecies(speciesData.species)
                setAllLocations(speciesData.locations)
                setMapOverlays(overlaysData)
                setFilteredLocations([]) // Initially show no locations until user selects species
            } catch (error) {
                console.error("Error loading data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Filter locations when species selection changes
    useEffect(() => {
        if (selectedSpeciesIds.length === 0) {
            setFilteredLocations([]) // Không hiển thị marker nào khi chưa chọn species
        } else {
            const filtered = allLocations.filter((location) =>
                selectedSpeciesIds.includes(location.speciesId)
            )
            setFilteredLocations(filtered)
        }
    }, [selectedSpeciesIds, allLocations])

    // Event handlers
    const handleLocationClick = (location: Location) => {
        console.log("Location clicked:", location.locationName)
        setSelectedLocation(location)
        setMapCenter(location.coordinates)
        setMapZoom(12)
    }

    const handleSpeciesFilter = (speciesIds: number[]) => {
        setSelectedSpeciesIds(speciesIds)
    }

    const handleToggleOverlay = () => {
        setOverlayVisible((prev) => !prev)
    }

    const handleDateSelect = (dates: string[]) => {
        // TODO: Implement date filtering based on blooming periods
        console.log("Selected dates:", dates)
    }

    const resetFilters = () => {
        setSelectedSpeciesIds([])
        setFilteredLocations(allLocations)
    }

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar)
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-lg">Loading species and locations...</div>
            </div>
        )
    }

    return (
        <div className="h-screen text-black bg-gray-100 relative overflow-hidden">
            {/* Main Map */}
            <OLMap
                center={mapCenter}
                zoom={mapZoom}
                locations={
                    hasDateFilter
                        ? calendarFilteredLocations
                        : filteredLocations
                }
                allSpecies={allSpecies}
                selectedLocation={selectedLocation}
                onLocationClick={handleLocationClick}
                overlays={mapOverlays}
                overlayVisible={overlayVisible}
                onToggleOverlay={handleToggleOverlay}
                className="h-full w-full"
            />

            {/* Top Bar - Left Side */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 max-w-sm max-h-[60vh] overflow-y-auto">
                {/* Species Filter Panel */}
                <SpeciesFilterPanel
                    allSpecies={allSpecies}
                    allLocations={allLocations}
                    selectedSpeciesIds={selectedSpeciesIds}
                    onSpeciesFilter={handleSpeciesFilter}
                />
            </div>

            {/* Left Side Controls - Position to avoid overlap */}
            <OLMapControls
                onCalendarToggle={toggleCalendar}
                showCalendar={showCalendar}
                className="absolute left-4 bottom-32 z-[1000]"
            />

            {/* Calendar Component - Next to Controls when active */}
            {showCalendar && (
                <div className="absolute left-16 bottom-5 z-[900] w-84 overflow-y-auto">
                    <BloomCalendar
                        allSpecies={allSpecies}
                        filteredLocations={filteredLocations}
                        selectedSpeciesIds={selectedSpeciesIds}
                        onDateSelect={(dates: Date[]) => {
                            const dateStrings = dates.map(
                                (d) => d.toISOString().split("T")[0]
                            )
                            handleDateSelect(dateStrings)
                        }}
                        onSpeciesFilter={handleSpeciesFilter}
                        onClearFilter={resetFilters}
                        onLocationFilter={(
                            locations: Location[],
                            hasDates: boolean
                        ) => {
                            setCalendarFilteredLocations(locations)
                            setHasDateFilter(hasDates)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
