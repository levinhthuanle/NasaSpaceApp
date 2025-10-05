"use client"
import { useState, useEffect } from "react"
import "ol/ol.css"
import "@/styles/ol-custom.css"
import OLMap from "@/components/ol-map"
import OLMapControls from "@/components/ol-map-controls"
import OverlayFilterPanel from "@/components/overlay-filter-panel"
import MapSearch from "@/components/map-search"

import BloomCalendar from "@/components/bloom-calendar"
import AddLocationForm from "@/components/add-location-form"
import { Species, Location, MapOverlay, LocationCreate } from "@/types/api"
import {
    getAllSpeciesAndLocations,
    getMapOverlays,
    createLocation
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
    const [showAddLocationForm, setShowAddLocationForm] = useState(false)
    const [newLocationCoordinates, setNewLocationCoordinates] = useState<
        [number, number] | null
    >(null)

    // Data state
    const [allSpecies, setAllSpecies] = useState<Species[]>([])
    const [allLocations, setAllLocations] = useState<Location[]>([])
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]) // Filtered by overlays
    const [calendarFilteredLocations, setCalendarFilteredLocations] = useState<
        Location[]
    >([]) // Further filtered by calendar dates
    const [selectedOverlayIds, setSelectedOverlayIds] = useState<number[]>([])
    const [hasDateFilter, setHasDateFilter] = useState(false) // Track if calendar has active date filter
    const [mapOverlays, setMapOverlays] = useState<MapOverlay[]>([]) // Map overlays from API
    const [overlayVisible, setOverlayVisible] = useState(true) // Control overlay visibility
    const [searchLocation, setSearchLocation] = useState<{
        coordinates: [number, number]
        displayName: string
    } | null>(null) // Search result location with marker

    const [focusBounds, setFocusBounds] = useState<{
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    } | null>(null) // Bounds to focus map on when clicking region names

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
                setFilteredLocations([]) // Initially show no locations until user selects overlays
            } catch (error) {
                console.error("Error loading data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Get current location on component mount
    useEffect(() => {
        getCurrentLocation()
    }, [])

    // Filter locations when overlay selection changes
    useEffect(() => {
        if (selectedOverlayIds.length === 0) {
            setFilteredLocations([]) // Không hiển thị marker nào khi chưa chọn overlay
        } else {
            const filtered = allLocations.filter((location) => {
                return selectedOverlayIds.some((overlayId) => {
                    const overlay = mapOverlays.find((o) => o.id === overlayId)
                    if (!overlay) return false

                    // Check if location is within overlay bounds
                    const [lon, lat] = location.coordinates
                    const { bounds } = overlay
                    return (
                        lon >= bounds.minLon &&
                        lon <= bounds.maxLon &&
                        lat >= bounds.minLat &&
                        lat <= bounds.maxLat
                    )
                })
            })
            setFilteredLocations(filtered)
        }
    }, [selectedOverlayIds, allLocations, mapOverlays])

    // Get current location using Geolocation API
    const getCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setMapCenter([longitude, latitude]) // OpenLayers uses [lon, lat] format
                setMapZoom(10) // Zoom in to show local area
                console.log("Current location set:", latitude, longitude)
            },
            (error) => {
                let errorMessage = "Unable to get your location"

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied by user"
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable"
                        break
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out"
                        break
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds timeout
                maximumAge: 300000 // 5 minutes cache
            }
        )
    }

    // Event handlers
    const handleLocationClick = (location: Location) => {
        console.log("Location clicked:", location.locationName)
        setSelectedLocation(location)
        setMapCenter(location.coordinates)
        setMapZoom(12)
    }

    const handleOverlayFilter = (overlayIds: number[]) => {
        setSelectedOverlayIds(overlayIds)
    }

    const handleToggleOverlay = () => {
        setOverlayVisible((prev) => !prev)
    }

    const handleRegionFocus = (bounds: {
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    }) => {
        setFocusBounds({ ...bounds })
        // Clear focus bounds after a short delay to allow the map to respond
        setTimeout(() => setFocusBounds(null), 100)
    }

    const handleDateSelect = (dates: string[]) => {
        // TODO: Implement date filtering based on blooming periods
        console.log("Selected dates:", dates)
    }

    const resetFilters = () => {
        setSelectedOverlayIds([])
        setFilteredLocations([])
    }

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar)
    }

    // Handle adding new location
    const handleAddLocation = (coordinates: [number, number]) => {
        setNewLocationCoordinates(coordinates)
        setShowAddLocationForm(true)
    }

    const handleSaveNewLocation = async (newLocation: LocationCreate) => {
        try {
            // Call the API service to create the location
            const result = await createLocation(newLocation)
            if (result.success && result.data) {
                // Add to local state
                const updatedLocations = [...allLocations, result.data]
                setAllLocations(updatedLocations)
                setFilteredLocations(updatedLocations)

                // Close the form
                setShowAddLocationForm(false)
                setNewLocationCoordinates(null)

                // Show success message
                // console.log("Location created successfully:", result.message)
                // alert(result.message) // You can replace this with a toast notification
            } else {
                // Handle error
                console.error("Failed to create location:", result.message)
                alert(`Lỗi: ${result.message}`) // You can replace this with a toast notification
            }
        } catch (error) {
            console.error("Error saving location:", error)
            alert("Có lỗi xảy ra khi tạo địa điểm mới") // You can replace this with a toast notification
        }
    }

    const handleCancelAddLocation = () => {
        setShowAddLocationForm(false)
        setNewLocationCoordinates(null)
    }

    // Handle search location selection
    const handleSearchLocationSelect = (
        coordinates: [number, number],
        displayName: string
    ) => {
        // MapSearch returns [lat, lon] but we need [lon, lat] for the map
        const mapCoordinates: [number, number] = [
            coordinates[1],
            coordinates[0]
        ]
        setMapCenter(mapCoordinates)
        setMapZoom(12)

        // Save search location for marker display
        setSearchLocation({
            coordinates: mapCoordinates,
            displayName: displayName
        })

        console.log("Search location selected:", displayName, coordinates)
    }

    // Clear search location when clicking on regular locations
    const handleLocationClickWithClearSearch = (location: Location) => {
        setSearchLocation(null) // Clear search marker
        handleLocationClick(location)
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
                onLocationClick={handleLocationClickWithClearSearch}
                onAddLocation={handleAddLocation}
                searchLocation={searchLocation}
                overlays={mapOverlays}
                overlayVisible={overlayVisible}
                onToggleOverlay={handleToggleOverlay}
                selectedOverlayIds={selectedOverlayIds}
                focusOnBounds={focusBounds}
                className="h-full w-full"
            />

            {/* Map Search - Centered at Top */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                <MapSearch
                    onLocationSelect={handleSearchLocationSelect}
                    className="w-96"
                />
            </div>

            {/* Overlay Filter Panel - Top Left */}
            <div className="absolute top-4 left-4 z-[1000]">
                <OverlayFilterPanel
                    allOverlays={mapOverlays}
                    allLocations={allLocations}
                    selectedOverlayIds={selectedOverlayIds}
                    onOverlayFilter={handleOverlayFilter}
                    onRegionFocus={handleRegionFocus}
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
                        filteredLocations={filteredLocations}
                        onDateSelect={(dates: Date[]) => {
                            const dateStrings = dates.map(
                                (d) => d.toISOString().split("T")[0]
                            )
                            handleDateSelect(dateStrings)
                        }}
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

            {/* Add Location Form */}
            {showAddLocationForm && newLocationCoordinates && (
                <AddLocationForm
                    coordinates={newLocationCoordinates}
                    allSpecies={allSpecies}
                    onSave={handleSaveNewLocation}
                    onCancel={handleCancelAddLocation}
                />
            )}
        </div>
    )
}
