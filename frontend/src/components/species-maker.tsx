import { SpeciesData } from "@/types/api"
import { Popup } from "react-leaflet/Popup"
import { Marker } from "react-leaflet/Marker"
import L from "leaflet"

export default function SpeciesMarker({
    species,
    imgurl
}: {
    species: SpeciesData
    imgurl: string
}) {
    function createIconMarker(imgUrl: string) {
        return L.divIcon({
            className: "",
            html: `
      <div style="
        width: 50px;
        height: 50px;
        border: 3px solid white;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        background-image: url(${imgUrl});
        background-size: cover;
        background-position: center;
        transition: transform 0.2s ease;
      " class="fancy-marker"></div>
    `,
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [0, -50]
        })
    }
    return (
        <Marker position={species.location} icon={createIconMarker(imgurl)}>
            <Popup maxWidth={320}>
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-800">
                            {species.name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 italic mb-3">
                        {species.scientificName}
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white shadow">
                                Probability
                            </span>
                            <span className="ml-auto text-sm font-bold text-green-600">
                                {species.bloomProbability}%
                            </span>
                        </div>

                        <div className="text-sm border-t pt-2">
                            <div className="flex items-center gap-1 mb-1">
                                <span>📍</span>
                                <strong>Location:</strong>{" "}
                                {species.locationName}
                            </div>
                        </div>

                        <div className="text-sm bg-gray-50 p-2 rounded">
                            <strong>📅 Blooming Schedule:</strong>
                            <div className="mt-1 space-y-1">
                                <div className="flex justify-between">
                                    <span>🌱 Start:</span>
                                    <span className="font-medium">
                                        {species.bloomingPeriod.start}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🌸 Peak:</span>
                                    <span className="font-medium text-red-600">
                                        {species.bloomingPeriod.peak}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🍂 End:</span>
                                    <span className="font-medium">
                                        {species.bloomingPeriod.end}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm">
                            <strong>ℹ️ Description:</strong>
                            <p className="mt-1 text-gray-600">
                                {species.description}
                            </p>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}
