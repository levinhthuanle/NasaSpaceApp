"use client"
import { useEffect, useRef } from "react"
import Map from "ol/Map"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import { Icon, Style } from "ol/style"
import { fromLonLat } from "ol/proj"
import Overlay from "ol/Overlay"

interface OLMarkerProps {
    map: Map | null
    position: [number, number] // [longitude, latitude]
    icon?: string
    size?: [number, number]
    anchor?: [number, number]
    popupContent?: React.ReactNode
    onClick?: () => void
    className?: string
    id?: string
}

export default function OLMarker({
    map,
    position,
    icon = "/marker-icon.png",
    size = [25, 41],
    anchor = [0.5, 1],
    popupContent,
    onClick,
    className = "",
    id
}: OLMarkerProps) {
    const markerRef = useRef<Feature<Point> | null>(null)
    const layerRef = useRef<VectorLayer<VectorSource> | null>(null)
    const overlayRef = useRef<Overlay | null>(null)
    const popupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!map) return

        // Create marker feature
        const marker = new Feature({
            geometry: new Point(fromLonLat(position))
        })

        // Set marker style
        const markerStyle = new Style({
            image: new Icon({
                src: icon,
                size: size,
                anchor: anchor,
                anchorXUnits: "fraction",
                anchorYUnits: "fraction"
            })
        })

        marker.setStyle(markerStyle)
        marker.setId(id || `marker-${Date.now()}`)

        // Create vector layer for the marker
        const vectorSource = new VectorSource({
            features: [marker]
        })

        const vectorLayer = new VectorLayer({
            source: vectorSource
        })

        // Add layer to map
        map.addLayer(vectorLayer)

        // Store references
        markerRef.current = marker
        layerRef.current = vectorLayer

        // Add click handler
        if (onClick) {
            const clickHandler = (event: any) => {
                const feature = map.forEachFeatureAtPixel(
                    event.pixel,
                    (feat) => feat
                )
                if (feature === marker) {
                    onClick()
                }
            }
            map.on("click", clickHandler)
        }

        // Cleanup function
        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current)
            }
            if (overlayRef.current) {
                map.removeOverlay(overlayRef.current)
            }
        }
    }, [map, position, icon, size, anchor, onClick, id])

    // Handle popup
    useEffect(() => {
        if (!map || !popupContent) return

        const popupElement = document.createElement("div")
        popupElement.className = `ol-popup bg-white rounded-lg shadow-lg border border-gray-300 p-3 max-w-xs ${className}`

        const overlay = new Overlay({
            element: popupElement,
            positioning: "bottom-center",
            stopEvent: false,
            offset: [0, -10]
        })

        map.addOverlay(overlay)
        overlayRef.current = overlay

        return () => {
            if (overlay) {
                map.removeOverlay(overlay)
            }
        }
    }, [map, popupContent, className])

    // Update marker position
    useEffect(() => {
        if (markerRef.current) {
            const geometry = markerRef.current.getGeometry()
            if (geometry) {
                geometry.setCoordinates(fromLonLat(position))
            }
        }
    }, [position])

    return null
}
