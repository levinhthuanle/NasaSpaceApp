"use client"
import { useState } from "react"
import "ol/ol.css"
import "@/styles/ol-custom.css"
import OLMap from "@/components/ol-map"
import OLMapControls from "@/components/ol-map-controls"
import SpeciesFilterPanel from "@/components/species-filter-panel"
import PinnedSpeciesPanel from "@/components/pinned-species-panel"
import BloomCalendar from "@/components/bloom-calendar"
import Chatbot from "@/components/chatbot"
import { useSpeciesData } from "@/hooks/use-species-data"
import { SpeciesData } from "@/types/api"

export default function Home() {
    const [mapCenter, setMapCenter] = useState<[number, number]>([106.0, 16.0])
    const [mapZoom, setMapZoom] = useState(6)
    const [selectedSpecies, setSelectedSpecies] = useState<SpeciesData | null>(
        null
    )
    const [showCalendar, setShowCalendar] = useState(false)
    const [showChatbot, setShowChatbot] = useState(false)

    // Use the species data hook
    const {
        allSpecies,
        speciesGroups,
        filteredSpeciesGroups,
        selectedDates,
        pinnedSpeciesNames,
        pinnedSpeciesData,
        allLocationsOfPinnedSpecies,
        handleDateSelect,
        handleFlowerFilter,
        handlePinSpecies,
        resetFilters
    } = useSpeciesData()

    // Get filtered species for map display
    const filteredSpeciesForMap = filteredSpeciesGroups.flatMap(
        (g) => g.locations
    )

    const handleSpeciesClick = (species: SpeciesData) => {
        console.log("Species clicked:", species.name)
        setSelectedSpecies(species)
        setMapCenter(species.location)
        // setMapZoom(10)
    }

    const handleSpeciesPin = (species: SpeciesData) => {
        handlePinSpecies(species.name)
    }

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar)
    }

    const toggleChatbot = () => {
        setShowChatbot(!showChatbot)
    }

    return (
        <div className="h-screen text-black bg-gray-100 relative overflow-hidden">
            {/* Main Map */}
            <OLMap
                center={mapCenter}
                zoom={mapZoom}
                species={filteredSpeciesForMap}
                pinnedSpeciesNames={pinnedSpeciesNames}
                selectedSpecies={selectedSpecies}
                onSpeciesClick={handleSpeciesClick}
                onSpeciesPin={handleSpeciesPin}
                className="h-full w-full"
            />

            {/* Top Bar - Left Side */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 max-w-sm max-h-[60vh] overflow-y-auto">
                {/* Species Filter Panel */}
                <SpeciesFilterPanel
                    speciesGroups={speciesGroups}
                    filteredSpeciesGroups={filteredSpeciesGroups}
                    onSpeciesFilter={handleFlowerFilter}
                    onPinSpecies={handlePinSpecies}
                    pinnedSpeciesNames={pinnedSpeciesNames}
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
                        flowerData={allSpecies}
                        onDateSelect={handleDateSelect}
                        onFlowerFilter={handleFlowerFilter}
                        onClearFilter={resetFilters}
                    />
                </div>
            )}

            {/* Bottom Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-between items-end gap-4">
                {/* Pinned Species Panel - Bottom Left */}
                <div className="flex-shrink-0">
                    <PinnedSpeciesPanel
                        pinnedSpeciesData={pinnedSpeciesData}
                        onUnpinSpecies={handlePinSpecies}
                        onFocusSpecies={(species) => {
                            if (species.locations.length > 0) {
                                const firstLocation = species.locations[0]
                                setMapCenter(firstLocation.location)
                                setMapZoom(12)
                                setSelectedSpecies(firstLocation)
                            }
                        }}
                    />
                </div>

                {/* Chatbot - Bottom Right */}
                <div className="flex-shrink-0">
                    <Chatbot isOpen={showChatbot} onToggle={toggleChatbot} />
                </div>
            </div>
        </div>
    )
}
