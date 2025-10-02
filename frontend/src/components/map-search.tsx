"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search } from "lucide-react"

interface SearchResult {
    lat: string
    lon: string
    display_name: string
}

interface MapSearchProps {
    onLocationSelect: (location: [number, number], displayName: string) => void
    className?: string
}

export default function MapSearch({
    onLocationSelect,
    className = "w-80"
}: MapSearchProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
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
                onLocationSelect(newCenter, firstResult.display_name)
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
        setSearchResults([])
        setSearchQuery(result.display_name)
        onLocationSelect(newCenter, result.display_name)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (searchQuery.trim()) {
                handleSearch()
            } else {
                onLocationSelect([16.0544, 108.2022], "")
            }
        }
    }

    return (
        <div className={className}>
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Search locations..."
                    className="w-full px-4 py-2 pr-10 text-sm bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
                <div className="mt-2">
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
        </div>
    )
}
