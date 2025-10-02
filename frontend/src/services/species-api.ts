/**
 * Species API Service
 * Handles fetching species and locations data with 4 main endpoints:
 * 1. getAllSpecies() - Lấy thông tin tất cả các loài
 * 2. getAllLocations() - Lấy vị trí của tất cả các loài
 * 3. getLocationsBySpecies(speciesId) - Lấy vị trí của loài cụ thể
 * 4. getSpeciesById(speciesId) - Lấy thông tin của một loài cụ thể
 */

import {
    Species,
    Location,
    SpeciesListResponse,
    LocationsResponse,
    SpeciesDetailResponse,
    SpeciesWithLocations
} from "@/types/api"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_ENDPOINTS = {
    species: "/api/species",
    locations: "/api/locations",
    speciesDetail: "/api/species",
    speciesLocations: "/api/species"
}

/**
 * 1. Lấy thông tin tất cả các loài
 */
export async function getAllSpecies(): Promise<Species[]> {
    try {
        // For development, using mock implementation
        return await mockGetAllSpecies()

        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.species}`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: SpeciesListResponse = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch species')
        }
        
        return data.data
        */
    } catch (error) {
        console.error("Error fetching all species:", error)
        return []
    }
}

/**
 * 2. Lấy vị trí của tất cả các loài
 */
export async function getAllLocations(): Promise<Location[]> {
    try {
        // For development, using mock implementation
        return await mockGetAllLocations()

        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.locations}`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: LocationsResponse = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch locations')
        }
        
        return data.data
        */
    } catch (error) {
        console.error("Error fetching all locations:", error)
        return []
    }
}

/**
 * 3. Lấy vị trí của loài cụ thể
 */
export async function getLocationsBySpecies(
    speciesId: number
): Promise<Location[]> {
    try {
        // For development, using mock implementation
        return await mockGetLocationsBySpecies(speciesId)

        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.speciesLocations}/${speciesId}/locations`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: LocationsResponse = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch species locations')
        }
        
        return data.data
        */
    } catch (error) {
        console.error(
            `Error fetching locations for species ${speciesId}:`,
            error
        )
        return []
    }
}

/**
 * 4. Lấy thông tin của một loài cụ thể
 */
export async function getSpeciesById(
    speciesId: number
): Promise<Species | null> {
    try {
        // For development, using mock implementation
        return await mockGetSpeciesById(speciesId)

        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.speciesDetail}/${speciesId}`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: SpeciesDetailResponse = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch species detail')
        }
        
        return data.data
        */
    } catch (error) {
        console.error(`Error fetching species ${speciesId}:`, error)
        return null
    }
}

/**
 * Helper function: Lấy species và locations kết hợp
 */
export async function getSpeciesWithLocations(
    speciesId: number
): Promise<SpeciesWithLocations | null> {
    try {
        const [species, locations] = await Promise.all([
            getSpeciesById(speciesId),
            getLocationsBySpecies(speciesId)
        ])

        if (!species) {
            return null
        }

        return {
            species,
            locations
        }
    } catch (error) {
        console.error(
            `Error fetching species with locations ${speciesId}:`,
            error
        )
        return null
    }
}

/**
 * Helper function: Lấy tất cả species và locations (cho map view)
 */
export async function getAllSpeciesAndLocations(): Promise<{
    species: Species[]
    locations: Location[]
}> {
    try {
        const [species, locations] = await Promise.all([
            getAllSpecies(),
            getAllLocations()
        ])

        return {
            species,
            locations
        }
    } catch (error) {
        console.error("Error fetching all species and locations:", error)
        return {
            species: [],
            locations: []
        }
    }
}

// =============================================================================
// MOCK IMPLEMENTATIONS FOR DEVELOPMENT
// =============================================================================

async function mockGetAllSpecies(): Promise<Species[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    return [
        {
            id: 1,
            speciesId: 1,
            name: "Cherry Blossom",
            scientificName: "Prunus serrulata",
            description:
                "Beautiful pink cherry blossoms that create a stunning canopy during spring.",
            imageUrl:
                "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
            bloomTime: "March - April",
            color: "Pink, White",
            habitat: "Temperate regions, parks, gardens",
            characteristics: "Delicate 5-petaled flowers, serrated leaves"
        },
        {
            id: 2,
            speciesId: 2,
            name: "Sunflower",
            scientificName: "Helianthus annuus",
            description:
                "Large bright yellow flowers that turn to face the sun throughout the day.",
            imageUrl:
                "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
            bloomTime: "June - September",
            color: "Yellow, Golden",
            habitat: "Open fields, gardens, prairies",
            characteristics:
                "Large composite flower head, thick stem, heart-shaped leaves"
        },
        {
            id: 3,
            speciesId: 3,
            name: "Lotus",
            scientificName: "Nelumbo nucifera",
            description:
                "Sacred lotus flowers blooming on water surfaces with unique water-repelling leaves.",
            imageUrl:
                "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400",
            bloomTime: "May - August",
            color: "Pink, White",
            habitat: "Ponds, lakes, water gardens",
            characteristics:
                "Large round leaves, multi-layered petals, grows on water"
        },
        {
            id: 4,
            speciesId: 4,
            name: "Lavender",
            scientificName: "Lavandula angustifolia",
            description:
                "Aromatic purple flowers known for their calming fragrance and medicinal properties.",
            imageUrl:
                "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
            bloomTime: "June - August",
            color: "Purple, Violet",
            habitat: "Mediterranean climate, dry soil, hillsides",
            characteristics:
                "Small clustered flowers on spikes, narrow gray-green leaves, strong fragrance"
        },
        {
            id: 5,
            speciesId: 5,
            name: "Rose",
            scientificName: "Rosa rubiginosa",
            description:
                "Classic roses with thorny stems and fragrant, layered petals in various colors.",
            imageUrl:
                "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
            bloomTime: "April - October",
            color: "Red, Pink, White, Yellow",
            habitat: "Gardens, parks, temperate climates",
            characteristics:
                "Layered petals, thorny stems, compound leaves, strong fragrance"
        }
    ]
}

async function mockGetAllLocations(): Promise<Location[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    return [
        // Cherry Blossom locations
        {
            id: 1,
            speciesId: 1,
            locationName: "Hanoi Cherry Garden",
            coordinates: [105.8542, 21.0285],
            bloomingPeriod: {
                start: "2025-03-15",
                peak: "2025-04-05",
                end: "2025-04-25"
            }
        },
        {
            id: 2,
            speciesId: 1,
            locationName: "Hue Imperial City",
            coordinates: [108.2022, 16.0545],
            bloomingPeriod: {
                start: "2025-03-10",
                peak: "2025-03-30",
                end: "2025-04-20"
            }
        },
        {
            id: 3,
            speciesId: 1,
            locationName: "Ho Chi Minh City Park",
            coordinates: [106.6297, 10.8231],
            bloomingPeriod: {
                start: "2025-02-20",
                peak: "2025-03-15",
                end: "2025-04-10"
            }
        },

        // Sunflower locations
        {
            id: 4,
            speciesId: 2,
            locationName: "Dong Anh Sunflower Field",
            coordinates: [105.6189, 21.0245],
            bloomingPeriod: {
                start: "2025-06-01",
                peak: "2025-07-15",
                end: "2025-09-15"
            }
        },
        {
            id: 5,
            speciesId: 2,
            locationName: "Quang Tri Sunflower Valley",
            coordinates: [107.565, 16.4637],
            bloomingPeriod: {
                start: "2025-05-15",
                peak: "2025-07-01",
                end: "2025-08-30"
            }
        },
        {
            id: 6,
            speciesId: 2,
            locationName: "Binh Duong Sunflower Farm",
            coordinates: [106.978, 10.8142],
            bloomingPeriod: {
                start: "2025-06-10",
                peak: "2025-08-01",
                end: "2025-09-20"
            }
        },

        // Lotus locations
        {
            id: 7,
            speciesId: 3,
            locationName: "West Lake Lotus Pond",
            coordinates: [105.8019, 20.9801],
            bloomingPeriod: {
                start: "2025-05-01",
                peak: "2025-07-01",
                end: "2025-08-31"
            }
        },
        {
            id: 8,
            speciesId: 3,
            locationName: "Perfume River Lotus",
            coordinates: [108.1435, 16.4621],
            bloomingPeriod: {
                start: "2025-04-20",
                peak: "2025-06-15",
                end: "2025-08-15"
            }
        },
        {
            id: 9,
            speciesId: 3,
            locationName: "Mekong Delta Lotus Field",
            coordinates: [105.7851, 10.0451],
            bloomingPeriod: {
                start: "2025-05-10",
                peak: "2025-07-20",
                end: "2025-09-05"
            }
        },

        // Lavender locations
        {
            id: 10,
            speciesId: 4,
            locationName: "Da Lat Lavender Farm",
            coordinates: [108.4265, 15.8742],
            bloomingPeriod: {
                start: "2025-06-15",
                peak: "2025-07-20",
                end: "2025-08-30"
            }
        },
        {
            id: 11,
            speciesId: 4,
            locationName: "Sapa Lavender Garden",
            coordinates: [103.97, 22.4856],
            bloomingPeriod: {
                start: "2025-06-01",
                peak: "2025-07-10",
                end: "2025-08-20"
            }
        },

        // Rose locations
        {
            id: 12,
            speciesId: 5,
            locationName: "Hanoi Rose Garden",
            coordinates: [105.8445, 21.0325],
            bloomingPeriod: {
                start: "2025-04-01",
                peak: "2025-06-01",
                end: "2025-10-31"
            }
        },
        {
            id: 13,
            speciesId: 5,
            locationName: "Hue Royal Rose Park",
            coordinates: [108.2208, 16.0578],
            bloomingPeriod: {
                start: "2025-03-20",
                peak: "2025-05-15",
                end: "2025-11-10"
            }
        },
        {
            id: 14,
            speciesId: 5,
            locationName: "Saigon Rose Valley",
            coordinates: [106.7009, 10.7756],
            bloomingPeriod: {
                start: "2025-04-10",
                peak: "2025-06-20",
                end: "2025-10-20"
            }
        },
        {
            id: 15,
            speciesId: 5,
            locationName: "Da Lat Rose Garden",
            coordinates: [108.4582, 15.8654],
            bloomingPeriod: {
                start: "2025-03-25",
                peak: "2025-05-30",
                end: "2025-11-05"
            }
        }
    ]
}

async function mockGetLocationsBySpecies(
    speciesId: number
): Promise<Location[]> {
    const allLocations = await mockGetAllLocations()
    return allLocations.filter((location) => location.speciesId === speciesId)
}

async function mockGetSpeciesById(speciesId: number): Promise<Species | null> {
    const allSpecies = await mockGetAllSpecies()
    return allSpecies.find((species) => species.speciesId === speciesId) || null
}

export type { Species, Location, SpeciesWithLocations }
