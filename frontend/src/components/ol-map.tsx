"use client"
import { useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { Circle, Fill, Stroke, Style, Icon, Text } from "ol/style"
import XYZ from "ol/source/XYZ"
import { fromLonLat } from "ol/proj"
import { Pin, MapPin, X } from "lucide-react"
import { SpeciesData } from "@/types/api"
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
    species?: SpeciesData[]
    pinnedSpeciesNames?: string[]
    selectedSpecies?: SpeciesData | null
    onSpeciesClick?: (species: SpeciesData) => void
    onSpeciesPin?: (species: SpeciesData) => void
    className?: string
    style?: React.CSSProperties
}

export default function OLMap({
    center = [106.0, 16.0],
    zoom = 6,
    minZoom = 0,
    maxZoom = 18,
    species = [],
    pinnedSpeciesNames = [],
    selectedSpecies = null,
    onSpeciesClick,
    onSpeciesPin,
    className = "h-full w-full",
    style
}: OLMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<Map | null>(null)
    const [selectedMarkerSpecies, setSelectedMarkerSpecies] =
        useState<SpeciesData | null>(null)

    const markerManagerRef = useRef<MarkerManager | null>(null)
    const viewportManagerRef = useRef<ViewportManager | null>(null)
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

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

            // Only handle clicks on markers (features with speciesData)
            if (feature) {
                const speciesData = feature.get("speciesData") as SpeciesData
                if (speciesData) {
                    // This is a marker, handle the click
                    setSelectedMarkerSpecies(speciesData)
                    if (onSpeciesClick) {
                        onSpeciesClick(speciesData)
                    }
                } else {
                    // This is not a marker (could be island label), ignore click
                    setSelectedMarkerSpecies(null)
                }
            } else {
                // No feature clicked, clear selection
                setSelectedMarkerSpecies(null)
            }
        })

        // Add hover handlers for markers
        let hoveredFeature: any = null

        olMap.on("pointermove", (event) => {
            const feature = olMap.forEachFeatureAtPixel(
                event.pixel,
                (feat) => feat
            )

            // Only process markers (features with speciesData), ignore island labels
            const isMarker = feature && feature.get("speciesData")
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
                    species,
                    pinnedSpeciesNames,
                    selectedSpecies
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
    }, [species, pinnedSpeciesNames, selectedSpecies])

    return (
        <div className={className} style={style}>
            <div ref={mapRef} className="h-full w-full" />

            {/* Marker Detail Panel */}
            <MarkerDetailPanel
                species={selectedMarkerSpecies}
                onClose={() => setSelectedMarkerSpecies(null)}
            />
        </div>
    )
}
