/**
 * Marker Manager for OpenLayers
 * Manages marker features efficiently with pooling and reuse
 */

import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorSource from "ol/source/Vector"
import { Style, Icon } from "ol/style"
import { fromLonLat } from "ol/proj"
import { imageCache } from "./image-cache"
import { canvasWorkerManager } from "./canvas-worker-manager"
import { Species, Location } from "@/services/species-api"

interface MarkerState {
    species: Species
    location: Location
    isSelected: boolean
    isHovered?: boolean
}

interface MarkerFeature extends Feature<Point> {
    _speciesId?: number
    _markerState?: MarkerState
}

class MarkerManager {
    private vectorSource: VectorSource<Feature<Point>>
    private activeMarkers = new Map<number, MarkerFeature>()
    private markerPool: MarkerFeature[] = []
    private pendingUpdates = new Set<number>()
    private updateTimer: NodeJS.Timeout | null = null

    constructor(vectorSource: VectorSource<Feature<Point>>) {
        this.vectorSource = vectorSource
    }

    /**
     * Get or create marker feature from pool
     */
    private getMarkerFromPool(locationId: number): MarkerFeature {
        let marker = this.markerPool.pop()

        if (!marker) {
            marker = new Feature(new Point([0, 0])) as MarkerFeature
        }

        marker._speciesId = locationId
        return marker
    }

    /**
     * Return marker to pool
     */
    private returnMarkerToPool(marker: MarkerFeature): void {
        // Clean up marker
        marker._speciesId = undefined
        marker._markerState = undefined
        marker.setStyle(undefined)

        this.markerPool.push(marker)
    }

    /**
     * Calculate marker style properties
     */
    private getStyleProperties(state: MarkerState): {
        baseSize: number
        scale: number
        finalSize: number
        borderColor: string
        borderWidth: number
    } {
        const baseSize = 40
        // Scale: hover or selected = 105%
        const scale = state.isHovered || state.isSelected ? 1.05 : 1.0
        const finalSize = baseSize

        // Border color changes for selected state
        const borderColor = state.isSelected
            ? "#DC2626" // red border for selected
            : "#FFFFFF" // white border for normal

        // Thicker border for selected
        const borderWidth = state.isSelected ? 4 : 3

        return { baseSize, scale, finalSize, borderColor, borderWidth }
    }

    /**
     * Create optimized marker style
     */
    private async createMarkerStyle(state: MarkerState): Promise<Style> {
        const { scale, finalSize, borderColor, borderWidth } =
            this.getStyleProperties(state)

        try {
            // Try to get cached canvas with dynamic border
            const canvas = await imageCache.getCanvas(
                state.species.imageUrl,
                finalSize,
                borderWidth,
                scale,
                borderColor // Pass border color to canvas creation
            )

            return new Style({
                image: new Icon({
                    img: canvas,
                    anchor: [0.5, 0.5],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction"
                })
            })
        } catch (error) {
            console.warn(
                `Failed to load image for ${state.species.name}:`,
                error
            )

            // Fallback to cached circle canvas - use borderColor as circle color
            const fallbackCanvas = await imageCache.createFallbackCanvas(
                finalSize,
                borderColor,
                borderWidth,
                scale
            )

            return new Style({
                image: new Icon({
                    img: fallbackCanvas,
                    anchor: [0.5, 0.5],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction"
                })
            })
        }
    }

    /**
     * Update single marker efficiently
     */
    private async updateMarker(
        locationId: number,
        newState: MarkerState
    ): Promise<void> {
        let marker = this.activeMarkers.get(locationId)

        if (!marker) {
            marker = this.getMarkerFromPool(locationId)
            this.activeMarkers.set(locationId, marker)
            this.vectorSource.addFeature(marker)
        }

        // Check if update is needed
        const currentState = marker._markerState
        if (currentState && this.statesEqual(currentState, newState)) {
            return // No update needed
        }

        // Update geometry if needed
        const newCoordinate = fromLonLat(newState.location.coordinates)
        const currentCoordinate = marker.getGeometry()?.getCoordinates()

        if (
            !currentCoordinate ||
            currentCoordinate[0] !== newCoordinate[0] ||
            currentCoordinate[1] !== newCoordinate[1]
        ) {
            marker.getGeometry()?.setCoordinates(newCoordinate)
        }

        // Update style
        try {
            const style = await this.createMarkerStyle(newState)
            marker.setStyle(style)
        } catch (error) {
            console.error(
                `Failed to update marker style for location ${locationId}:`,
                error
            )
        }

        // Update metadata
        marker._markerState = { ...newState }
        marker.set("species", newState.species)
        marker.set("location", newState.location)
    }

    /**
     * Compare marker states for optimization
     */
    private statesEqual(state1: MarkerState, state2: MarkerState): boolean {
        return (
            state1.species.id === state2.species.id &&
            state1.location.id === state2.location.id &&
            state1.species.imageUrl === state2.species.imageUrl &&
            state1.isSelected === state2.isSelected &&
            state1.location.coordinates[0] === state2.location.coordinates[0] &&
            state1.location.coordinates[1] === state2.location.coordinates[1]
        )
    }

    /**
     * Debounced update mechanism
     */
    private scheduleUpdate(locationId: number, state: MarkerState): void {
        this.pendingUpdates.add(locationId)

        if (this.updateTimer) {
            clearTimeout(this.updateTimer)
        }

        this.updateTimer = setTimeout(async () => {
            const updates = Array.from(this.pendingUpdates)
            this.pendingUpdates.clear()

            // Batch process updates
            const updatePromises = updates.map((id) => {
                const pendingState = this.getPendingState(id)
                if (pendingState) {
                    return this.updateMarker(id, pendingState)
                }
                return Promise.resolve()
            })

            try {
                await Promise.all(updatePromises)
            } catch (error) {
                console.error("Error in batch marker update:", error)
            }
        }, 16) // ~60fps
    }

    private getPendingState(locationId: number): MarkerState | null {
        // This would be set by the update methods
        // For now, return null - will be implemented with the update methods
        return null
    }

    /**
     * Update all markers efficiently
     */
    async updateMarkers(
        locations: Location[],
        allSpecies: Species[],
        pinnedSpeciesNames: string[],
        selectedLocation: Location | null
    ): Promise<void> {
        // Create species lookup map
        const speciesLookup = new Map<number, Species>()
        allSpecies.forEach((s) => speciesLookup.set(s.speciesId, s))

        // Preload images for visible species
        const imageUrls = locations
            .map((l) => speciesLookup.get(l.speciesId)?.imageUrl)
            .filter(Boolean) as string[]
        imageCache.preloadImages(imageUrls).catch(() => {
            // Ignore preload errors
        })

        // Create state map for new markers
        const newStates = new Map<number, MarkerState>()

        locations.forEach((location) => {
            const species = speciesLookup.get(location.speciesId)
            if (!species) return

            const locationSpeciesName = `${species.name} - ${location.locationName}`

            newStates.set(location.id, {
                species,
                location,
                isSelected: selectedLocation?.id === location.id
            })
        })

        // Remove markers that are no longer needed
        const markersToRemove: number[] = []
        for (const [locationId, marker] of this.activeMarkers) {
            if (!newStates.has(locationId)) {
                markersToRemove.push(locationId)
            }
        }

        markersToRemove.forEach((locationId) => {
            const marker = this.activeMarkers.get(locationId)!
            this.vectorSource.removeFeature(marker)
            this.activeMarkers.delete(locationId)
            this.returnMarkerToPool(marker)
        })

        // Update existing markers and add new ones
        const updatePromises: Promise<void>[] = []

        for (const [locationId, newState] of newStates) {
            updatePromises.push(this.updateMarker(locationId, newState))
        }

        try {
            await Promise.all(updatePromises)
        } catch (error) {
            console.error("Error updating markers:", error)
        }
    }

    /**
     * Clear all markers
     */
    clear(): void {
        // Return all active markers to pool
        for (const [speciesId, marker] of this.activeMarkers) {
            this.vectorSource.removeFeature(marker)
            this.returnMarkerToPool(marker)
        }

        this.activeMarkers.clear()
        this.pendingUpdates.clear()

        if (this.updateTimer) {
            clearTimeout(this.updateTimer)
            this.updateTimer = null
        }
    }

    /**
     * Handle marker hover state
     */
    async setMarkerHover(speciesId: number, isHovered: boolean): Promise<void> {
        const marker = this.activeMarkers.get(speciesId)
        if (!marker || !marker._markerState) return

        const currentState = marker._markerState

        // Only update if hover state actually changed
        if (currentState.isHovered === isHovered) return

        const newState: MarkerState = {
            ...currentState,
            isHovered: isHovered
        }

        try {
            const style = await this.createMarkerStyle(newState)
            marker.setStyle(style)
            marker._markerState = newState
        } catch (error) {
            console.error(
                `Failed to update hover state for species ${speciesId}:`,
                error
            )
        }
    }

    /**
     * Get marker by species ID for event handling
     */
    getMarkerBySpeciesId(speciesId: number): MarkerFeature | undefined {
        return this.activeMarkers.get(speciesId)
    }

    /**
     * Get species ID from marker feature
     */
    getSpeciesIdFromFeature(feature: Feature): number | undefined {
        return (feature as MarkerFeature)._speciesId
    }

    /**
     * Get statistics for debugging
     */
    getStats(): {
        activeMarkers: number
        pooledMarkers: number
        pendingUpdates: number
    } {
        return {
            activeMarkers: this.activeMarkers.size,
            pooledMarkers: this.markerPool.length,
            pendingUpdates: this.pendingUpdates.size
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.clear()
        this.markerPool.length = 0
    }
}

export default MarkerManager
