/**
 * Viewport Manager for OpenLayers
 * Handles viewport-based optimizations and lazy loading
 */

import Map from "ol/Map"
import { Extent, getCenter } from "ol/extent"
import { transform } from "ol/proj"
import { Species, Location } from "@/types/api"

interface ViewportBounds {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
    center: [number, number]
    zoom: number
}

interface VisibleMarker {
    location: Location
    species: Species
    distance: number // Distance from viewport center
    priority: number // Loading priority (0 = highest)
}

class ViewportManager {
    private map: Map | null = null
    private lastViewport: ViewportBounds | null = null
    private viewportChangeCallbacks: Array<(bounds: ViewportBounds) => void> =
        []

    constructor(map?: Map) {
        if (map) {
            this.setMap(map)
        }
    }

    /**
     * Set the map instance
     */
    setMap(map: Map): void {
        this.map = map
        this.setupViewportListeners()
    }

    /**
     * Setup viewport change listeners
     */
    private setupViewportListeners(): void {
        if (!this.map) return

        const view = this.map.getView()

        // Listen to view changes with debouncing
        let viewChangeTimer: NodeJS.Timeout | null = null

        const handleViewChange = () => {
            if (viewChangeTimer) {
                clearTimeout(viewChangeTimer)
            }

            viewChangeTimer = setTimeout(() => {
                this.updateViewport()
            }, 100) // 100ms debounce
        }

        view.on("change:center", handleViewChange)
        view.on("change:resolution", handleViewChange)
    }

    /**
     * Update current viewport bounds
     */
    private updateViewport(): void {
        if (!this.map) return

        const view = this.map.getView()
        const extent = view.calculateExtent(this.map.getSize())

        // Convert extent to LngLat bounds
        const bottomLeft = transform(
            [extent[0], extent[1]],
            "EPSG:3857",
            "EPSG:4326"
        )
        const topRight = transform(
            [extent[2], extent[3]],
            "EPSG:3857",
            "EPSG:4326"
        )
        const center = transform(getCenter(extent), "EPSG:3857", "EPSG:4326")

        const bounds: ViewportBounds = {
            minLng: bottomLeft[0],
            maxLng: topRight[0],
            minLat: bottomLeft[1],
            maxLat: topRight[1],
            center: center as [number, number],
            zoom: view.getZoom() || 0
        }

        this.lastViewport = bounds
        this.notifyViewportChange(bounds)
    }

    /**
     * Check if a point is in current viewport
     */
    isInViewport(location: [number, number], padding: number = 0.1): boolean {
        if (!this.lastViewport) return true // Assume visible if no viewport info

        const [lng, lat] = location
        const bounds = this.lastViewport

        // Add padding to viewport bounds
        const paddingLng = (bounds.maxLng - bounds.minLng) * padding
        const paddingLat = (bounds.maxLat - bounds.minLat) * padding

        return (
            lng >= bounds.minLng - paddingLng &&
            lng <= bounds.maxLng + paddingLng &&
            lat >= bounds.minLat - paddingLat &&
            lat <= bounds.maxLat + paddingLat
        )
    }

    /**
     * Calculate distance from viewport center
     */
    getDistanceFromCenter(location: [number, number]): number {
        if (!this.lastViewport) return 0

        const [lng, lat] = location
        const [centerLng, centerLat] = this.lastViewport.center

        // Simple distance calculation (Haversine would be more accurate)
        const dLng = lng - centerLng
        const dLat = lat - centerLat

        return Math.sqrt(dLng * dLng + dLat * dLat)
    }

    /**
     * Filter and prioritize species based on viewport
     */
    getVisibleSpecies(
        locations: Location[],
        allSpecies: Species[],
        options: {
            viewportPadding?: number
            maxDistance?: number
            priorityCount?: number
        } = {}
    ): {
        visible: VisibleMarker[]
        priority: VisibleMarker[]
        deferred: VisibleMarker[]
    } {
        const {
            viewportPadding = 0.2,
            maxDistance = 10, // degrees
            priorityCount = 50
        } = options

        const visible: VisibleMarker[] = []
        const outside: VisibleMarker[] = []

        // Categorize locations by viewport visibility
        locations.forEach((location) => {
            const species = allSpecies.find(
                (s) => s.speciesId === location.speciesId
            )
            if (!species) return

            const distance = this.getDistanceFromCenter(location.coordinates)
            const isVisible = this.isInViewport(
                location.coordinates,
                viewportPadding
            )

            const marker: VisibleMarker = {
                location,
                species,
                distance,
                priority: this.calculatePriority(location, distance, isVisible)
            }

            if (isVisible || distance < maxDistance) {
                visible.push(marker)
            } else {
                outside.push(marker)
            }
        })

        // Sort by priority (lower number = higher priority)
        visible.sort((a, b) => a.priority - b.priority)
        outside.sort((a, b) => a.priority - b.priority)

        return {
            visible: visible,
            priority: visible.slice(0, priorityCount),
            deferred: [...visible.slice(priorityCount), ...outside]
        }
    }

    /**
     * Calculate loading priority for a species
     */
    private calculatePriority(
        location: Location,
        distance: number,
        isVisible: boolean
    ): number {
        let priority = distance * 10 // Base on distance

        // Boost priority for visible markers
        if (isVisible) {
            priority *= 0.1
        }

        // Boost priority for locations (removing bloom probability for now)
        // Can be enhanced with real bloom probability data later

        // Boost priority based on zoom level
        if (this.lastViewport && this.lastViewport.zoom > 10) {
            priority *= 0.9
        }

        return priority
    }

    /**
     * Get optimized loading batches
     */
    getLoadingBatches(
        locations: Location[],
        allSpecies: Species[],
        batchSize: number = 10
    ): Location[][] {
        const { priority, deferred } = this.getVisibleSpecies(
            locations,
            allSpecies
        )

        const allMarkers = [...priority, ...deferred]
        const batches: Location[][] = []

        for (let i = 0; i < allMarkers.length; i += batchSize) {
            const batch = allMarkers
                .slice(i, i + batchSize)
                .map((marker) => marker.location)
            batches.push(batch)
        }

        return batches
    }

    /**
     * Subscribe to viewport changes
     */
    onViewportChange(callback: (bounds: ViewportBounds) => void): () => void {
        this.viewportChangeCallbacks.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.viewportChangeCallbacks.indexOf(callback)
            if (index > -1) {
                this.viewportChangeCallbacks.splice(index, 1)
            }
        }
    }

    /**
     * Notify all viewport change callbacks
     */
    private notifyViewportChange(bounds: ViewportBounds): void {
        this.viewportChangeCallbacks.forEach((callback) => {
            try {
                callback(bounds)
            } catch (error) {
                console.error("Error in viewport change callback:", error)
            }
        })
    }

    /**
     * Get current viewport bounds
     */
    getCurrentViewport(): ViewportBounds | null {
        return this.lastViewport
    }

    /**
     * Force update viewport
     */
    updateViewportNow(): void {
        this.updateViewport()
    }

    /**
     * Check if viewport has changed significantly
     */
    hasViewportChanged(threshold: number = 0.1): boolean {
        if (!this.map || !this.lastViewport) return true

        const view = this.map.getView()
        const currentCenter = view.getCenter()
        const currentZoom = view.getZoom() || 0

        if (!currentCenter) return true

        const [currentLng, currentLat] = transform(
            currentCenter,
            "EPSG:3857",
            "EPSG:4326"
        )
        const [lastLng, lastLat] = this.lastViewport.center

        const centerDistance = Math.sqrt(
            Math.pow(currentLng - lastLng, 2) +
                Math.pow(currentLat - lastLat, 2)
        )

        const zoomDiff = Math.abs(currentZoom - this.lastViewport.zoom)

        return centerDistance > threshold || zoomDiff > 0.5
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.viewportChangeCallbacks.length = 0
        this.lastViewport = null
        this.map = null
    }
}

export default ViewportManager
