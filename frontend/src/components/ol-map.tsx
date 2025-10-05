"use client"
import { useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import ImageLayer from "ol/layer/Image"
import VectorLayer from "ol/layer/Vector"
import LayerGroup from "ol/layer/Group"
import VectorSource from "ol/source/Vector"
import Static from "ol/source/ImageStatic"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { Fill, Stroke, Style, Text, Icon } from "ol/style"
import XYZ from "ol/source/XYZ"
import { fromLonLat, transform } from "ol/proj"
import { Layers, MapPin } from "lucide-react"
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
    onAddLocation?: (coordinates: [number, number]) => void // Handler for adding new location
    searchLocation?: {
        coordinates: [number, number]
        displayName: string
    } | null // Search result location with marker
    className?: string
    style?: React.CSSProperties
    overlays?: MapOverlay[] // Array of map overlays from API
    overlayVisible?: boolean // Control overlay visibility
    onToggleOverlay?: () => void // Toggle overlay callback
    selectedOverlayIds?: number[] // IDs of selected overlays to show
    focusOnBounds?: {
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    } | null // Bounds to focus on
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
    onAddLocation,
    searchLocation = null,
    className = "h-full w-full",
    style,
    overlays = [],
    overlayVisible = true,
    onToggleOverlay,
    selectedOverlayIds = [],
    focusOnBounds = null
}: OLMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<Map | null>(null)
    const [selectedMarkerLocation, setSelectedMarkerLocation] =
        useState<Location | null>(null)
    const [currentZoom, setCurrentZoom] = useState<number>(zoom)

    const markerManagerRef = useRef<MarkerManager | null>(null)
    const viewportManagerRef = useRef<ViewportManager | null>(null)
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
    const overlayLayerGroupRef = useRef<LayerGroup | null>(null) // Group of overlay layers
    const searchVectorSourceRef = useRef<VectorSource | null>(null) // Search marker layer

    // Initialize map
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!mapRef.current) return

        // Create vector source and layer for markers
        const vectorSource = new VectorSource()
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 1000
        })

        // Create search marker layer
        const searchVectorSource = new VectorSource()
        searchVectorSourceRef.current = searchVectorSource
        const searchLayer = new VectorLayer({
            source: searchVectorSource,
            zIndex: 1200 // Higher than normal markers
        })

        // Create overlay layer group
        const overlayGroup = new LayerGroup({
            layers: []
        })
        overlayLayerGroupRef.current = overlayGroup

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

        // Overlays will be added dynamically based on selection

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
                // Overlay layer group
                overlayGroup,
                // Island labels layer
                islandLayer,
                // Marker layer
                vectorLayer,
                // Search marker layer
                searchLayer
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

        // Add double-click handler for adding new locations at max zoom
        olMap.on("dblclick", (event) => {
            const currentZoom = olMap.getView().getZoom() || 0

            // Only allow adding locations at zoom level 18
            if (currentZoom >= 18 && onAddLocation) {
                // Get coordinates from click position
                const coordinate = olMap.getCoordinateFromPixel(event.pixel)
                const lonLat = transform(coordinate, "EPSG:3857", "EPSG:4326")

                // Call the handler with longitude and latitude
                onAddLocation([lonLat[0], lonLat[1]])

                // Prevent map zoom on double-click
                event.preventDefault()
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

        // Add zoom listener for island labels visibility and zoom state
        const handleZoomChange = () => {
            const zoomLevel = olMap.getView().getZoom() || 0
            const showIslandLabels = zoomLevel >= 5 // Show at lower zoom level

            console.log(
                "Current zoom:",
                zoomLevel,
                "Show labels:",
                showIslandLabels
            )

            // Update zoom state
            setCurrentZoom(zoomLevel)

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

    // Focus on bounds when focusOnBounds prop changes
    useEffect(() => {
        if (map && focusOnBounds) {
            const view = map.getView()
            const { minLon, maxLon, minLat, maxLat } = focusOnBounds

            // Calculate center of bounds
            const centerLon = (minLon + maxLon) / 2
            const centerLat = (minLat + maxLat) / 2

            // Set center and zoom level 10 as requested
            view.animate({
                center: fromLonLat([centerLon, centerLat]),
                zoom: 10,
                duration: 1000 // Smooth animation over 1 second
            })
        }
    }, [map, focusOnBounds])

    // Initialize overlay layer when map and overlays are first available

    // Control overlay visibility
    useEffect(() => {
        if (overlayLayerGroupRef.current) {
            overlayLayerGroupRef.current.setVisible(overlayVisible)
        }
    }, [overlayVisible])

    // Update overlay layers when selected overlays change
    useEffect(() => {
        if (!overlayLayerGroupRef.current) return

        const layerGroup = overlayLayerGroupRef.current
        const existingLayers = layerGroup
            .getLayers()
            .getArray() as ImageLayer<Static>[]

        // Get currently selected overlay IDs
        const selectedOverlaySet = new Set(selectedOverlayIds)

        // Find existing overlay IDs
        const existingOverlayIds = existingLayers
            .map((layer) => layer.get("overlayId"))
            .filter((id) => id !== undefined)
        const existingOverlaySet = new Set(existingOverlayIds)

        // Remove layers for overlays that are no longer selected
        const layersToRemove = existingLayers.filter((layer) => {
            const overlayId = layer.get("overlayId")
            return overlayId && !selectedOverlaySet.has(overlayId)
        })

        layersToRemove.forEach((layer) => {
            layerGroup.getLayers().remove(layer)
        })

        // Add layers for newly selected overlays
        const overlaysToAdd = overlays.filter(
            (overlay) =>
                selectedOverlaySet.has(overlay.id) &&
                !existingOverlaySet.has(overlay.id)
        )

        overlaysToAdd.forEach((overlay, index) => {
            const overlayLayer = new ImageLayer({
                source: new Static({
                    url: overlay.imageUrl,
                    imageExtent: [
                        overlay.bounds.minLon,
                        overlay.bounds.minLat,
                        overlay.bounds.maxLon,
                        overlay.bounds.maxLat
                    ],
                    projection: "EPSG:4326"
                }),
                opacity: 0.7,
                zIndex: existingLayers.length + index,
                properties: {
                    overlayType: "selected",
                    overlayId: overlay.id,
                    overlayName: overlay.name
                }
            })

            // Add to layer group
            layerGroup.getLayers().push(overlayLayer)
        })
    }, [selectedOverlayIds, overlays])

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

    // Handle search marker
    useEffect(() => {
        if (!searchVectorSourceRef.current) return

        // Clear existing search markers
        searchVectorSourceRef.current.clear()

        if (searchLocation) {
            // Create search marker feature
            const searchMarker = new Feature({
                geometry: new Point(fromLonLat(searchLocation.coordinates)),
                name: searchLocation.displayName,
                type: "search"
            })

            // Style for search marker (different from regular markers)
            const searchStyle = new Style({
                image: new Icon({
                    src: "/marker-icon.png",
                    scale: 1.2, // Slightly larger than regular markers
                    anchor: [0.5, 1],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction"
                })
            })

            searchMarker.setStyle(searchStyle)
            searchVectorSourceRef.current.addFeature(searchMarker)
        }
    }, [searchLocation])

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

            {/* Add Location Notification */}
            {currentZoom >= 18 && onAddLocation && (
                <div className="absolute top-4 right-4 z-[1100] bg-green-100 border border-green-400 text-green-800 p-3 rounded-lg shadow-lg max-w-xs">
                    <div className="flex items-start space-x-2">
                        <MapPin
                            className="text-green-600 mt-0.5 flex-shrink-0"
                            size={16}
                        />
                        <div className="text-sm">
                            <p className="font-medium">Thêm địa điểm mới</p>
                            <p>
                                Double-click trên bản đồ để thêm địa điểm hoa
                                mới
                            </p>
                        </div>
                    </div>
                </div>
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
