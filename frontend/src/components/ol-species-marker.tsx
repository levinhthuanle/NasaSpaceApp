"use client"
import { useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import { Icon, Style, Circle, Fill, Stroke } from "ol/style"
import { fromLonLat } from "ol/proj"
import Overlay from "ol/Overlay"
import { createRoot } from "react-dom/client"
import { Pin, MapPin } from "lucide-react"
import { SpeciesData } from "@/types/api"

interface OLSpeciesMarkerProps {
    map: Map | null
    species: SpeciesData
    isPinned?: boolean
    isSelected?: boolean
    onClick?: (species: SpeciesData) => void
    onPin?: (species: SpeciesData) => void
    className?: string
}

export default function OLSpeciesMarker({
    map,
    species,
    isPinned = false,
    isSelected = false,
    onClick,
    onPin,
    className = ""
}: OLSpeciesMarkerProps) {
    const markerRef = useRef<Feature<Point> | null>(null)
    const layerRef = useRef<VectorLayer<VectorSource> | null>(null)
    const overlayRef = useRef<Overlay | null>(null)
    const [showPopup, setShowPopup] = useState(false)

    useEffect(() => {
        if (!map) return

        // Create marker feature
        const marker = new Feature({
            geometry: new Point(fromLonLat(species.location))
        })

        // Create custom marker style based on state
        const getMarkerStyle = () => {
            const color = isPinned
                ? "#FCD34D"
                : isSelected
                ? "#3B82F6"
                : "#10B981"
            const size = isPinned ? 16 : isSelected ? 14 : 12

            return new Style({
                image: new Circle({
                    radius: size,
                    fill: new Fill({
                        color: color
                    }),
                    stroke: new Stroke({
                        color: "#FFFFFF",
                        width: 2
                    })
                })
            })
        }

        marker.setStyle(getMarkerStyle())
        marker.setId(`species-marker-${species.id}`)
        marker.set("speciesData", species)

        // Create vector layer
        const vectorSource = new VectorSource({
            features: [marker]
        })

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: isPinned ? 1000 : isSelected ? 900 : 800
        })

        // Add layer to map
        map.addLayer(vectorLayer)

        // Store references
        markerRef.current = marker
        layerRef.current = vectorLayer

        // Add click handler
        const clickHandler = (event: any) => {
            const feature = map.forEachFeatureAtPixel(
                event.pixel,
                (feat) => feat
            )
            if (feature === marker) {
                setShowPopup(true)
                if (onClick) {
                    onClick(species)
                }
            } else {
                setShowPopup(false)
            }
        }

        map.on("click", clickHandler)

        // Cleanup function
        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current)
            }
            if (overlayRef.current) {
                map.removeOverlay(overlayRef.current)
            }
        }
    }, [map, species, isPinned, isSelected, onClick])

    // Handle popup overlay
    useEffect(() => {
        if (!map || !showPopup) {
            if (overlayRef.current) {
                map?.removeOverlay(overlayRef.current)
                overlayRef.current = null
            }
            return
        }

        // Create popup element
        const popupElement = document.createElement("div")
        popupElement.className = `ol-popup ${className}`

        // Create React root and render popup content
        const root = createRoot(popupElement)
        root.render(
            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-3 max-w-xs">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-800">
                            {species.name}
                        </h4>
                        <p className="text-xs text-gray-500 italic">
                            {species.scientificName}
                        </p>
                    </div>
                    {onPin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onPin(species)
                            }}
                            className={`p-1 rounded transition-colors ${
                                isPinned
                                    ? "text-yellow-500 hover:text-yellow-600"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                            title={isPinned ? "Unpin species" : "Pin species"}
                        >
                            <Pin size={14} />
                        </button>
                    )}
                </div>

                <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={12} />
                        <span>{species.locationName}</span>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                        {species.bloomProbability}% bloom probability
                    </div>
                    <div className="text-xs text-gray-600">
                        Peak: {species.bloomingPeriod.peak}
                    </div>
                </div>

                {species.imageUrl && (
                    <div className="mb-2">
                        <img
                            src={species.imageUrl}
                            alt={species.name}
                            className="w-full h-20 object-cover rounded"
                            loading="lazy"
                        />
                    </div>
                )}

                <p className="text-xs text-gray-600 line-clamp-2">
                    {species.description}
                </p>

                {isPinned && (
                    <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        📌 Pinned Species
                    </div>
                )}
            </div>
        )

        // Create overlay
        const overlay = new Overlay({
            element: popupElement,
            positioning: "bottom-center",
            stopEvent: true,
            offset: [0, -15]
        })

        overlay.setPosition(fromLonLat(species.location))
        map.addOverlay(overlay)
        overlayRef.current = overlay

        return () => {
            root.unmount()
            if (overlay) {
                map.removeOverlay(overlay)
            }
        }
    }, [map, showPopup, species, isPinned, onPin, className])

    return null
}
