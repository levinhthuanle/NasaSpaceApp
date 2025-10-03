"use client"
import { useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import ImageLayer from "ol/layer/Image"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import Static from "ol/source/ImageStatic"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { Circle, Fill, Stroke, Style, Icon, Text } from "ol/style"
import XYZ from "ol/source/XYZ"
import { fromLonLat, transform } from "ol/proj"
import { Pin, MapPin, X, Layers } from "lucide-react"
import { Species, Location, MapOverlay } from "@/types/api"
import MarkerManager from "@/utils/marker-manager"
import ViewportManager from "@/utils/viewport-manager"
import { imageCache } from "@/utils/image-cache"
import MarkerDetailPanel from "@/components/marker-detail-panel"
import { Zoom } from "ol/control"

interface OLMapProps {
    center?: [number, number] // [longitude, latitude]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    locations?: Location[]
    allSpecies?: Species[]
    selectedLocation?: Location | null
    onLocationClick?: (location: Location) => void
    className?: string
    style?: React.CSSProperties
    overlays?: MapOverlay[] // Array of map overlays from API
    overlayVisible?: boolean // Control overlay visibility
    onToggleOverlay?: () => void // Toggle overlay callback
}

export default function OLMap({
    center = [106.0, 16.0],
    zoom = 6,
    minZoom = 0,
    maxZoom = 18,
    locations = [],
    allSpecies = [],
    selectedLocation = null,
    onLocationClick,
    className = "h-full w-full",
    style,
    overlays = [],
    overlayVisible = true,
    onToggleOverlay
}: OLMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<Map | null>(null)
    const [selectedMarkerLocation, setSelectedMarkerLocation] =
        useState<Location | null>(null)

    const markerManagerRef = useRef<MarkerManager | null>(null)
    const viewportManagerRef = useRef<ViewportManager | null>(null)
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
    const overlayLayerRef = useRef<ImageLayer<Static> | null>(null) // Keep reference to overlay layer

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return

        // Create vector source and layer for markers
        const vectorSource = new VectorSource()
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 1000
        })

        // Create island labels layer
        const islandSource = new VectorSource()
        const islandLayer = new VectorLayer({
            source: islandSource,
            zIndex: 1500, // Higher than markers to ensure visibility
            declutter: false // Don't declutter labels
        })

        // Create island label features
        const createIslandLabel = (
            coordinates: [number, number],
            text: string
        ) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat(coordinates)),
                name: text,
                type: "island-label"
            })

            feature.setStyle(
                new Style({
                    text: new Text({
                        text: text,
                        font: "10px",
                        fill: new Fill({
                            color: "#FFFFFF"
                        }),
                        stroke: new Stroke({
                            color: "#000000",
                            width: 3
                        }),
                        offsetY: 0,
                        textAlign: "center",
                        textBaseline: "middle"
                    })
                })
            )

            return feature
        }

        // Add island labels with corrected coordinates
        const hoangSaLabel = createIslandLabel(
            [112.0, 16.5],
            "QUẦN ĐẢO HOÀNG SA"
        )
        const truongSaLabel = createIslandLabel(
            [114.0, 10.0],
            "QUẦN ĐẢO TRƯỜNG SA"
        )
        const bienDongLabel = createIslandLabel([113.0, 13.0], "BIỂN ĐÔNG")

        islandSource.addFeatures([hoangSaLabel, truongSaLabel, bienDongLabel])

        // Create combined overlay layer from API data (only once)
        const activeOverlays = overlays.filter((overlay) => overlay.isActive)

        if (activeOverlays.length > 0 && !overlayLayerRef.current) {
            // For simplicity, use the first active overlay as the combined layer
            // In production, you might want to merge images server-side or use a different approach
            const primaryOverlay = activeOverlays[0]
            overlayLayerRef.current = new ImageLayer({
                source: new Static({
                    url: primaryOverlay.imageUrl,
                    imageExtent: [
                        primaryOverlay.bounds.minLon,
                        primaryOverlay.bounds.minLat,
                        primaryOverlay.bounds.maxLon,
                        primaryOverlay.bounds.maxLat
                    ],
                    projection: "EPSG:4326"
                }),
                opacity: primaryOverlay.opacity || 0.7,
                zIndex: 500,
                properties: {
                    overlayType: "combined",
                    overlayCount: activeOverlays.length,
                    overlayNames: activeOverlays.map((o) => o.name).join(", ")
                }
            })
        }

        const olMap = new Map({
            target: mapRef.current,
            layers: [
                // Satellite base layer
                new TileLayer({
                    preload: Infinity,
                    source: new XYZ({
                        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                        maxZoom: 19
                    })
                }),
                // Labels overlay
                new TileLayer({
                    source: new XYZ({
                        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                        maxZoom: 19
                    })
                }),
                // Combined overlay layer (if exists)
                ...(overlayLayerRef.current ? [overlayLayerRef.current] : []),
                // Island labels layer
                islandLayer,
                // Marker layer
                vectorLayer
            ],
            view: new View({
                center: fromLonLat(center),
                zoom: zoom,
                minZoom: minZoom,
                maxZoom: maxZoom
            }),
            controls: [new Zoom()]
        })

        // Add click handler for markers only
        olMap.on("click", (event) => {
            const feature = olMap.forEachFeatureAtPixel(
                event.pixel,
                (feat) => feat
            )

            // Only handle clicks on markers (features with location data)
            if (feature) {
                const location = feature.get("location") as Location
                if (location && onLocationClick) {
                    setSelectedMarkerLocation(location)
                    onLocationClick(location)
                } else {
                    // This is not a marker (could be island label), ignore click
                    setSelectedMarkerLocation(null)
                }
            } else {
                // No feature clicked, clear selection
                setSelectedMarkerLocation(null)
            }
        })

        // Add hover handlers for markers
        let hoveredFeature: any = null

        olMap.on("pointermove", (event) => {
            const feature = olMap.forEachFeatureAtPixel(
                event.pixel,
                (feat) => feat
            )

            // Only process markers (features with location data), ignore island labels
            const isMarker = feature && feature.get("location")
            const markerFeature = isMarker ? feature : null

            // Handle hover out
            if (hoveredFeature && hoveredFeature !== markerFeature) {
                const speciesId = hoveredFeature._speciesId
                if (speciesId && markerManagerRef.current) {
                    markerManagerRef.current.setMarkerHover(speciesId, false)
                }
                hoveredFeature = null
            }

            // Handle hover in (only for markers)
            if (markerFeature && markerFeature !== hoveredFeature) {
                const speciesId = (markerFeature as any)._speciesId
                if (speciesId && markerManagerRef.current) {
                    markerManagerRef.current.setMarkerHover(speciesId, true)
                }
                hoveredFeature = markerFeature
            }

            // Change cursor style (only for markers)
            const target = olMap.getTarget()
            if (target && typeof target !== "string") {
                ;(target as HTMLElement).style.cursor = isMarker
                    ? "pointer"
                    : ""
            }
        })

        // Initialize managers
        const markerManager = new MarkerManager(
            vectorSource as VectorSource<Feature<Point>>
        )
        const viewportManager = new ViewportManager(olMap)

        markerManagerRef.current = markerManager
        viewportManagerRef.current = viewportManager

        // Add zoom listener for island labels visibility
        const handleZoomChange = () => {
            const currentZoom = olMap.getView().getZoom() || 0
            const showIslandLabels = currentZoom >= 5 // Show at lower zoom level

            console.log(
                "Current zoom:",
                currentZoom,
                "Show labels:",
                showIslandLabels
            )

            if (islandLayer) {
                islandLayer.setVisible(showIslandLabels)
            }
        }

        // Initial visibility check - always show initially for debugging
        islandLayer.setVisible(true)

        // Listen for zoom changes
        olMap.getView().on("change:resolution", handleZoomChange)

        setMap(olMap)

        return () => {
            // Cleanup
            olMap.getView().un("change:resolution", handleZoomChange)
            markerManager.destroy()
            viewportManager.destroy()
            imageCache.clear()
            olMap.setTarget(undefined)
        }
    }, [])

    // Update map center when center prop changes
    useEffect(() => {
        if (map) {
            const view = map.getView()
            view.setCenter(fromLonLat(center))
        }
    }, [map, center])

    // Update map zoom when zoom prop changes
    useEffect(() => {
        if (map) {
            const view = map.getView()
            view.setZoom(zoom)
        }
    }, [map, zoom])

    // Initialize overlay layer when map and overlays are first available
    useEffect(() => {
        if (map && overlays.length > 0 && !overlayLayerRef.current) {
            const activeOverlays = overlays.filter(
                (overlay) => overlay.isActive
            )

            if (activeOverlays.length > 0) {
                const primaryOverlay = activeOverlays[0]
                overlayLayerRef.current = new ImageLayer({
                    source: new Static({
                        url: primaryOverlay.imageUrl,
                        imageExtent: [
                            primaryOverlay.bounds.minLon,
                            primaryOverlay.bounds.minLat,
                            primaryOverlay.bounds.maxLon,
                            primaryOverlay.bounds.maxLat
                        ],
                        projection: "EPSG:4326"
                    }),
                    opacity: primaryOverlay.opacity || 0.7,
                    zIndex: 500,
                    properties: {
                        overlayType: "combined",
                        overlayCount: activeOverlays.length,
                        overlayNames: activeOverlays
                            .map((o) => o.name)
                            .join(", ")
                    }
                })

                // Insert at correct position (after base layers, before island labels)
                const insertIndex = 2 // After satellite and labels layers
                map.getLayers().insertAt(insertIndex, overlayLayerRef.current)
            }
        }
    }, [map, overlays.length]) // Only depend on map and overlays.length, not overlays content

    // Control overlay visibility
    useEffect(() => {
        if (overlayLayerRef.current) {
            overlayLayerRef.current.setVisible(overlayVisible)
        }
    }, [overlayVisible])

    // Optimized marker updates with debouncing and caching
    useEffect(() => {
        if (!markerManagerRef.current) return

        // Clear existing timer
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current)
        }

        // Debounce updates to avoid excessive re-renders
        updateTimerRef.current = setTimeout(async () => {
            try {
                await markerManagerRef.current!.updateMarkers(
                    locations,
                    allSpecies,
                    [], // pinnedSpeciesNames - removed pinning functionality
                    selectedLocation
                )
            } catch (error) {
                console.error("Error updating markers:", error)
            }
        }, 100) // 100ms debounce

        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current)
            }
        }
    }, [locations, allSpecies, selectedLocation])

    return (
        <div className={className} style={style}>
            <div ref={mapRef} className="h-full w-full" />

            {/* Overlay Toggle Button */}
            {onToggleOverlay && (
                <button
                    onClick={onToggleOverlay}
                    className={`absolute bottom-65 left-4 z-[1000] p-2 rounded-lg shadow-lg transition-all duration-200 ${
                        overlayVisible
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    title={`${overlayVisible ? "Hide" : "Show"} overlay layer`}
                >
                    <Layers size={20} />
                </button>
            )}

            {/* Marker Detail Panel */}
            {selectedMarkerLocation &&
                (() => {
                    // Find the corresponding species for the selected location
                    const species = allSpecies.find(
                        (s) => s.speciesId === selectedMarkerLocation.speciesId
                    )
                    if (!species) return null

                    return (
                        <MarkerDetailPanel
                            species={species}
                            location={selectedMarkerLocation}
                            onClose={() => setSelectedMarkerLocation(null)}
                        />
                    )
                })()}
        </div>
    )
}
