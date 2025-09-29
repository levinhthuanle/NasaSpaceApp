"use client"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, MapPin, Calendar as CalendarIcon } from "lucide-react"
import L from "leaflet"
import { SpeciesData } from "@/types/api"
import SpeciesMarker from "./species-maker"
import BloomCalendar from "./bloom-calendar"

interface SearchResult {
    lat: string
    lon: string
    display_name: string
}

export default function MyMap() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [selectedLocation, setSelectedLocation] = useState<
        [number, number] | null
    >(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [filteredSpecies, setFilteredSpecies] =
        useState<SpeciesData[]>(speciesData)
    const mapRef = useRef<any>(null)
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Debounced search function
    const debouncedSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query
                )}&limit=5`
            )
            const data: SearchResult[] = await response.json()
            setSearchResults(data)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Effect to handle real-time search with debouncing
    useEffect(() => {
        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            debouncedSearch(searchQuery)
        }, 300) // 300ms delay

        // Cleanup timeout on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [searchQuery, debouncedSearch])

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery
                )}&limit=5`
            )
            const data: SearchResult[] = await response.json()
            setSearchResults(data)

            if (data.length > 0) {
                const firstResult = data[0]
                const newCenter: [number, number] = [
                    parseFloat(firstResult.lat),
                    parseFloat(firstResult.lon)
                ]
                setSelectedLocation(newCenter)

                // Move map to the new location
                if (mapRef.current) {
                    mapRef.current.setView(newCenter, 13)
                }
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleResultClick = (result: SearchResult) => {
        const newCenter: [number, number] = [
            parseFloat(result.lat),
            parseFloat(result.lon)
        ]
        setSelectedLocation(newCenter)
        setSearchResults([])
        setSearchQuery(result.display_name)

        if (mapRef.current) {
            mapRef.current.setView(newCenter, 13)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    // Handle calendar date selection
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
    }

    // Handle flower filtering based on selected date
    const handleFlowerFilter = (flowers: SpeciesData[]) => {
        setFilteredSpecies(flowers)
    }

    // Reset filters
    const resetFilters = () => {
        setSelectedDate(null)
        setFilteredSpecies(speciesData)
    }

    return (
        <div className="relative h-full w-full">
            {/* Control Panel */}
            <div className="absolute top-4 left-4 z-[1000] space-y-2">
                {/* Search Bar */}
                <div className="w-80">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Search locations..."
                            className="w-full px-4 py-2 pr-10 text-sm text-black bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                            {isSearching ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                            ) : (
                                <Search size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Calendar Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${
                            showCalendar
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                    >
                        <CalendarIcon size={16} className="inline mr-2" />
                        Calendar
                    </button>
                    {selectedDate && (
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                        >
                            Clear Filter ({filteredSpecies.length})
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="w-80">
                        <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((result, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleResultClick(result)}
                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium text-gray-800 truncate">
                                        {result.display_name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar Component */}
                {showCalendar && (
                    <div className="w-88">
                        <BloomCalendar
                            flowerData={speciesData}
                            onDateSelect={handleDateSelect}
                            onFlowerFilter={handleFlowerFilter}
                        />
                    </div>
                )}

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                onClick={() => handleResultClick(result)}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            >
                                <div className="font-medium text-gray-800 truncate">
                                    {result.display_name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Statistics Panel */}
            <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg border border-gray-300 w-72">
                <h4 className="font-bold text-sm mb-3">🌸 Bloom Statistics</h4>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span>Total species:</span>
                        <span className="font-medium">
                            {speciesData.length} species
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Currently showing:</span>
                        <span className="font-medium text-blue-600">
                            {filteredSpecies.length} species
                        </span>
                    </div>
                    {selectedDate && (
                        <div className="pt-2 border-t text-xs">
                            <div className="font-medium text-purple-700 mb-1">
                                Selected: {selectedDate?.toLocaleDateString()}
                            </div>
                            <div className="space-y-1">
                                {filteredSpecies.slice(0, 3).map((species) => (
                                    <div
                                        key={species.id}
                                        className="flex justify-between"
                                    >
                                        <span className="truncate">
                                            {species.name}
                                        </span>
                                        <span className="text-green-600">
                                            {species.bloomProbability}%
                                        </span>
                                    </div>
                                ))}
                                {filteredSpecies.length > 3 && (
                                    <div className="text-gray-500">
                                        +{filteredSpecies.length - 3} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MapContainer
                center={selectedLocation || [16.0544, 108.2022]}
                zoom={6}
                className="h-full w-full"
                ref={mapRef}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Display filtered flower markers */}
                {filteredSpecies.map((species) => (
                    <SpeciesMarker
                        key={species.id}
                        species={species}
                        imgurl={species.imageUrl}
                    />
                ))}

                {selectedLocation && (
                    <Marker position={selectedLocation}>
                        <Popup>
                            <div className="text-sm">
                                <p className="font-medium">Search Result</p>
                                <p className="text-gray-600">{searchQuery}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    )
} // Mock data cho các loài hoa
const speciesData: SpeciesData[] = [
    {
        id: 1,
        name: "Hoa Anh Đào",
        scientificName: "Prunus serrulata",
        location: [21.0285, 105.8542], // Hà Nội
        locationName: "Công viên Thống Nhất, Hà Nội",
        bloomingPeriod: {
            start: "15/03/2025",
            peak: "25/03/2025",
            end: "10/04/2025"
        },
        bloomProbability: 85,
        description: "Hoa anh đào Nhật Bản với màu hồng nhạt đặc trưng",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 2,
        name: "Hoa Ban",
        scientificName: "Bauhinia variegata",
        location: [21.3099, 103.0137], // Điện Biên
        locationName: "Cao nguyên Điện Biên",
        bloomingPeriod: {
            start: "01/03/2025",
            peak: "15/03/2025",
            end: "30/03/2025"
        },
        bloomProbability: 95,
        description: "Hoa ban trắng tinh khôi của vùng Tây Bắc",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 3,
        name: "Hoa Đỗ Quyên",
        scientificName: "Rhododendron simsii",
        location: [22.3364, 103.3438], // Lào Cai
        locationName: "Sa Pa, Lào Cai",
        bloomingPeriod: {
            start: "20/02/2025",
            peak: "10/03/2025",
            end: "25/03/2025"
        },
        bloomProbability: 98,
        description: "Hoa đỗ quyên đỏ rực trên núi cao Sa Pa",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 4,
        name: "Hoa Mai",
        scientificName: "Ochna integerrima",
        location: [10.8231, 106.6297], // TP.HCM
        locationName: "Công viên Tao Đàn, TP.HCM",
        bloomingPeriod: {
            start: "25/01/2025",
            peak: "10/02/2025",
            end: "28/02/2025"
        },
        bloomProbability: 45,
        description: "Hoa mai vàng truyền thống của miền Nam",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 5,
        name: "Hoa Phượng",
        scientificName: "Delonix regia",
        location: [16.0544, 108.2022], // Đà Nẵng
        locationName: "Bãi biển Mỹ Khê, Đà Nẵng",
        bloomingPeriod: {
            start: "15/04/2025",
            peak: "01/05/2025",
            end: "30/06/2025"
        },
        bloomProbability: 20,
        description: "Hoa phượng đỏ rực rỡ mùa hè",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 6,
        name: "Hoa Sen",
        scientificName: "Nelumbo nucifera",
        location: [20.9101, 106.161], // Ninh Bình
        locationName: "Đầm sen Tam Cốc, Ninh Bình",
        bloomingPeriod: {
            start: "15/05/2025",
            peak: "15/06/2025",
            end: "31/08/2025"
        },
        bloomProbability: 15,
        description: "Sen hồng thanh khiết trên mặt nước",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 7,
        name: "Hoa Súng",
        scientificName: "Nymphaea alba",
        location: [10.9804, 106.675], // Đồng Tháp
        locationName: "Đồng Tháp Mười",
        bloomingPeriod: {
            start: "01/04/2025",
            peak: "20/04/2025",
            end: "15/05/2025"
        },
        bloomProbability: 70,
        description: "Hoa súng trắng nở trên đồng ruộng",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    },
    {
        id: 8,
        name: "Hoa Đào",
        scientificName: "Prunus persica",
        location: [20.7537, 106.0131], // Hòa Bình
        locationName: "Thung lũng Mai Châu, Hòa Bình",
        bloomingPeriod: {
            start: "20/01/2025",
            peak: "05/02/2025",
            end: "20/02/2025"
        },
        bloomProbability: 35,
        description: "Hoa đào hồng nở rộ dịp Tết",
        imageUrl:
            "https://chinhgarden.com/wp-content/uploads/2022/06/hoa-dao-1.jpg"
    }
]
