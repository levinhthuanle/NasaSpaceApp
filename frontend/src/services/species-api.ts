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
    SpeciesWithLocations,
    MapOverlay,
    LocationCreate
} from "@/types/api"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_ENDPOINTS = {
    species: "/api/v1/species/all",
    locations_all: "/api/v1/locations/all",
    locations: "/api/v1/locations",
    speciesDetail: "/api/v1/species",
    speciesLocations: "/api/v1/locations"
}

/**
 * 1. Lấy thông tin tất cả các loài
 */
export async function getAllSpecies(): Promise<Species[]> {
    try {
        // For development, using mock implementation
        return await mockGetAllSpecies()

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.species}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: SpeciesListResponse = await response.json()
        console.log("Fetched species data:", data)

        if (!data.success) {
            throw new Error(data.message || "Failed to fetch species")
        }
        return data.data
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
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.locations_all}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: LocationsResponse = await response.json()
        console.log("Fetched locations data:", data)

        if (!data.success) {
            throw new Error(data.message || "Failed to fetch locations")
        }

        return data.data
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
        // return await mockGetLocationsBySpecies(speciesId)

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.speciesLocations}/${speciesId}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: LocationsResponse = await response.json()

        if (!data.success) {
            throw new Error(data.message || "Failed to fetch species locations")
        }

        return data.data
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
        // return await mockGetSpeciesById(speciesId)

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.speciesDetail}/${speciesId}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: SpeciesDetailResponse = await response.json()

        if (!data.success) {
            throw new Error(data.message || "Failed to fetch species detail")
        }

        return data.data
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

/**
 * Tạo location mới
 */
export async function createLocation(locationData: LocationCreate): Promise<{
    success: boolean
    data: Location | null
    message: string
}> {
    try {
        // For development, using mock implementation
        return await mockCreateLocation(locationData)

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.locations}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(locationData)
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return {
            success: true,
            data: result,
            message: result.message || "Location created successfully"
        }
    } catch (error) {
        console.error("Error creating location:", error)
        return {
            success: false,
            data: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to create location"
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
            id: 59549,
            speciesId: 59549,
            name: "Large-leaved lupine",
            scientificName: "Lupinus polyphyllus",
            description: "http://en.wikipedia.org/wiki/Lupinus_polyphyllus",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/135866080/medium.jpg",
            bloomTime: "Late Spring to Summer (May-September)",
            color: "Purple, blue, pink, white, or combinations thereof",
            habitat:
                "Roadsides, meadows, woodland clearings, and disturbed areas. Often found in moist, well-drained soils.",
            characteristics:
                "Tall plant with a prominent flower spike, palmate leaves with 9-17 leaflets, nitrogen-fixing capabilities."
        },
        {
            id: 49564,
            speciesId: 49564,
            name: "Texas bluebonnet",
            scientificName: "Lupinus texensis",
            description: "http://en.wikipedia.org/wiki/Lupinus_texensis",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/1447028/medium.JPG",
            bloomTime: "Spring (March-May)",
            color: "Blue, with a white tip (sometimes pink or maroon)",
            habitat:
                "Well-drained sandy or gravelly soils, roadsides, pastures, and open fields of Central Texas",
            characteristics:
                "Showy racemes of blue flowers, five-petaled, the 'banner' petal often having a white tip that may turn reddish-purple with age, important for attracting pollinators, state flower of Texas"
        },
        {
            id: 50614,
            speciesId: 50614,
            name: "Miniature Lupine",
            scientificName: "Lupinus bicolor",
            description: "http://en.wikipedia.org/wiki/Lupinus_bicolor",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/184064245/medium.jpg",
            bloomTime: "Spring",
            color: "Blue, Purple, White",
            habitat:
                "Open, disturbed areas, grasslands, coastal scrub, chaparral",
            characteristics:
                "Small annual herb, often with a bicolored flower (standard usually white, wings blue or purple), palmate leaves"
        },
        {
            id: 61010,
            speciesId: 61010,
            name: "coastal bush lupine",
            scientificName: "Lupinus arboreus",
            description: "http://en.wikipedia.org/wiki/Lupinus_arboreus",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/120260472/medium.jpg",
            bloomTime: "Spring to Summer",
            color: "Yellow, sometimes cream or blue",
            habitat:
                "Coastal dunes, scrubland, disturbed areas, often near the coast",
            characteristics:
                "Shrubby habit, nitrogen-fixing properties, rapid growth, can be invasive"
        },
        {
            id: 62691,
            speciesId: 62691,
            name: "silvery lupine",
            scientificName: "Lupinus argenteus",
            description: "http://en.wikipedia.org/wiki/Lupinus_argenteus",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/18421301/medium.jpg",
            bloomTime: "Late Spring to Late Summer (May-September)",
            color: "Blue, Purple, Pink, White",
            habitat:
                "Sagebrush steppe, Ponderosa Pine forests, Mountain meadows, Dry open areas, Woodlands",
            characteristics:
                "Silvery-green foliage, densely hairy stems and leaves, variable flower color, nitrogen-fixing capabilities"
        },
        {
            id: 48225,
            speciesId: 48225,
            name: "California poppy",
            scientificName: "Eschscholzia californica",
            videoUrl: "/Garden_Blooming_VR_Video_Generation.mp4",
            description:
                "http://en.wikipedia.org/wiki/Eschscholzia_californica",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/67227218/medium.jpg",
            bloomTime: "Spring to Summer (February - September)",
            color: "Orange, Yellow, Reddish-Orange, rarely Pink or White",
            habitat:
                "Grasslands, open areas, disturbed sites, chaparral, coastal dunes, and foothills",
            characteristics:
                "Cup-shaped flowers, bluish-green foliage, drought-tolerant, self-seeding"
        },
        {
            id: 50987,
            speciesId: 50987,
            name: "California goldfields",
            scientificName: "Lasthenia californica",
            description: "http://en.wikipedia.org/wiki/Lasthenia_californica",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/7229972/medium.jpeg",
            bloomTime: "Spring",
            color: "Yellow",
            habitat:
                "Grasslands, vernal pools, coastal meadows, disturbed areas",
            characteristics:
                "Forms extensive carpets of bright yellow flowers, annual herb, tolerant of serpentine soils."
        },
        {
            id: 542062,
            speciesId: 542062,
            name: "Rock Purslane",
            scientificName: "Cistanthe grandiflora",
            description: "",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/355482388/medium.jpg",
            bloomTime: "Summer",
            color: "Rose-pink to magenta",
            habitat:
                "Rocky slopes and cliffs, especially in California and Oregon",
            characteristics:
                "Succulent perennial with large, showy flowers; drought-tolerant"
        },
        {
            id: 76661,
            speciesId: 76661,
            name: "trailing African daisy",
            scientificName: "Dimorphotheca fruticosa",
            description:
                "https://en.wikipedia.org/wiki/Dimorphotheca_fruticosa",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/195549687/medium.jpg",
            bloomTime: "Year-round",
            color: "Yellow",
            habitat: "Coastal regions, sand dunes, disturbed areas",
            characteristics:
                "Drought-tolerant, low-growing shrub, suitable for ground cover, attracts pollinators"
        },
        {
            id: 76660,
            speciesId: 76660,
            name: "blue-and-white daisybush",
            scientificName: "Dimorphotheca ecklonis",
            description: "http://en.wikipedia.org/wiki/Dimorphotheca_ecklonis",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/15848074/medium.jpg",
            bloomTime: "Spring to Autumn",
            color: "White, Purple, Yellow",
            habitat: "Grasslands, Coastal areas, Disturbed ground",
            characteristics:
                "Drought-tolerant, attracts pollinators, forms a dense shrub"
        },
        {
            id: 76662,
            speciesId: 76662,
            name: "Cape marigold",
            scientificName: "Dimorphotheca sinuata",
            description: "http://en.wikipedia.org/wiki/Dimorphotheca_sinuata",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/6486656/medium.jpeg",
            bloomTime: "Spring",
            color: "Orange, Yellow, White (with a dark central disc)",
            habitat:
                "Sandy or gravelly soils, often in disturbed areas or along roadsides",
            characteristics:
                "Annual herb, showy daisy-like flowers, drought-tolerant"
        },
        {
            id: 119207,
            speciesId: 119207,
            name: "rain daisy",
            scientificName: "Dimorphotheca pluvialis",
            description: "http://en.wikipedia.org/wiki/Dimorphotheca_pluvialis",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/97754149/medium.jpg",
            bloomTime: "Spring",
            color: "White with a yellow center, sometimes pale yellow or cream",
            habitat:
                "Sandy flats, coastal dunes, and disturbed areas in the Western Cape of South Africa",
            characteristics:
                "Flowers close on cloudy days and at night, ray florets are typically white with purple undersides, disc florets are yellow."
        },
        {
            id: 569596,
            speciesId: 569596,
            name: "Cape daisy",
            scientificName: "Dimorphotheca jucunda",
            description: "https://en.wikipedia.org/wiki/Dimorphotheca_jucunda",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/12207464/medium.jpeg",
            bloomTime: "Spring",
            color: "Purple-pink with a darker center",
            habitat: "Rocky slopes and grasslands",
            characteristics:
                "Drought-tolerant, forms mats, flowers open in sunlight and close in shade"
        },
        {
            id: 50164,
            speciesId: 50164,
            name: "desert sand verbena",
            scientificName: "Abronia villosa",
            description: "http://en.wikipedia.org/wiki/Abronia_villosa",
            imageUrl:
                "https://inaturalist-open-data.s3.amazonaws.com/photos/117389013/medium.jpg",
            bloomTime: "Spring (primarily March-May)",
            color: "Magenta to pink, sometimes white or purple",
            habitat: "Sandy deserts, dunes, and washes",
            characteristics:
                "Fragrant, sticky leaves and stems, prostrate growth habit, drought-tolerant, attracts pollinators"
        }
    ]
}

async function mockGetAllLocations(): Promise<Location[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    return [
        // ====================================================================
        // REGION 1: Anza-Borrego Desert State Park, Antelope Valley (2024 April)
        // Bounds: minLon: -118.4182, maxLon: -118.3138, minLat: 34.6969, maxLat: 34.7929
        // Species: California Poppy (48225), Goldfields (50987)
        // ====================================================================
        {
            id: 1,
            speciesId: 48225, // California poppy
            locationName: "Antelope Valley Poppy Reserve West",
            coordinates: [-118.3901, 34.7511],
            bloomingPeriod: {
                start: "2024-03-15",
                peak: "2024-04-09",
                end: "2024-05-15"
            }
        },
        {
            id: 2,
            speciesId: 48225, // California poppy
            locationName: "Anza-Borrego Poppy Field Central",
            coordinates: [-118.3654, 34.7412],
            bloomingPeriod: {
                start: "2024-03-20",
                peak: "2024-04-09",
                end: "2024-05-10"
            }
        },
        {
            id: 3,
            speciesId: 50987, // California goldfields
            locationName: "Antelope Valley Goldfields North",
            coordinates: [-118.3423, 34.7687],
            bloomingPeriod: {
                start: "2024-03-25",
                peak: "2024-04-09",
                end: "2024-04-30"
            }
        },
        {
            id: 4,
            speciesId: 50987, // California goldfields
            locationName: "Desert State Park Goldfields",
            coordinates: [-118.3789, 34.7789],
            bloomingPeriod: {
                start: "2024-03-30",
                peak: "2024-04-09",
                end: "2024-05-05"
            }
        },
        {
            id: 5,
            speciesId: 48225, // California poppy
            locationName: "Anza-Borrego Poppy Meadow East",
            coordinates: [-118.3298, 34.7534],
            bloomingPeriod: {
                start: "2024-04-01",
                peak: "2024-04-09",
                end: "2024-05-20"
            }
        },
        {
            id: 6,
            speciesId: 48225, // California poppy
            locationName: "Antelope Valley Poppy Ridge South",
            coordinates: [-118.4067, 34.7678],
            bloomingPeriod: {
                start: "2024-03-18",
                peak: "2024-04-09",
                end: "2024-05-12"
            }
        },
        {
            id: 7,
            speciesId: 50987, // California goldfields
            locationName: "Desert Park Goldfield Plains",
            coordinates: [-118.3567, 34.7798],
            bloomingPeriod: {
                start: "2024-04-02",
                peak: "2024-04-09",
                end: "2024-05-08"
            }
        },
        {
            id: 8,
            speciesId: 48225, // California poppy
            locationName: "Anza Valley Poppy Slopes",
            coordinates: [-118.3555, 34.7256],
            bloomingPeriod: {
                start: "2024-03-22",
                peak: "2024-04-09",
                end: "2024-05-18"
            }
        },
        {
            id: 9,
            speciesId: 50987, // California goldfields
            locationName: "Borrego Goldfield Canyon",
            coordinates: [-118.4123, 34.7567],
            bloomingPeriod: {
                start: "2024-03-28",
                peak: "2024-04-09",
                end: "2024-05-02"
            }
        },

        // ====================================================================
        // REGION 3: Walker Canyon, Lake Elsinore (2019 March)
        // Bounds: minLon: -117.4612, maxLon: -117.3359, minLat: 33.71, maxLat: 33.7994
        // Species: Lupine (50614, 61010, 62691), Phacelia/Canterbury Bells (569596)
        // ====================================================================
        {
            id: 18,
            speciesId: 50614, // Miniature Lupine
            locationName: "Walker Canyon Lupine Trail North",
            coordinates: [-117.4234, 33.7654],
            bloomingPeriod: {
                start: "2019-02-15",
                peak: "2019-03-25",
                end: "2019-04-30"
            }
        },
        {
            id: 19,
            speciesId: 61010, // coastal bush lupine
            locationName: "Lake Elsinore Lupine Hills",
            coordinates: [-117.3876, 33.7432],
            bloomingPeriod: {
                start: "2019-03-01",
                peak: "2019-03-25",
                end: "2019-05-10"
            }
        },
        {
            id: 20,
            speciesId: 62691, // silvery lupine
            locationName: "Walker Canyon Silvery Lupine Field",
            coordinates: [-117.4089, 33.7789],
            bloomingPeriod: {
                start: "2019-03-10",
                peak: "2019-03-25",
                end: "2019-05-15"
            }
        },
        {
            id: 21,
            speciesId: 569596, // Cape daisy (representing Canterbury Bells)
            locationName: "Elsinore Canterbury Bells Meadow",
            coordinates: [-117.37, 33.72],
            bloomingPeriod: {
                start: "2019-03-05",
                peak: "2019-03-25",
                end: "2019-04-25"
            }
        },
        {
            id: 22,
            speciesId: 50614, // Miniature Lupine
            locationName: "Walker Canyon Blue Lupine Valley",
            coordinates: [-117.4456, 33.7876],
            bloomingPeriod: {
                start: "2019-03-15",
                peak: "2019-03-25",
                end: "2019-05-01"
            }
        },
        {
            id: 23,
            speciesId: 61010, // coastal bush lupine
            locationName: "Lake Elsinore Coastal Lupine Ridge",
            coordinates: [-117.3567, 33.7923],
            bloomingPeriod: {
                start: "2019-02-28",
                peak: "2019-03-25",
                end: "2019-05-08"
            }
        },
        {
            id: 24,
            speciesId: 62691, // silvery lupine
            locationName: "Walker Canyon Silver Lupine Mesa",
            coordinates: [-117.4312, 33.7789],
            bloomingPeriod: {
                start: "2019-03-12",
                peak: "2019-03-25",
                end: "2019-05-12"
            }
        },
        {
            id: 25,
            speciesId: 569596, // Cape daisy (representing Canterbury Bells)
            locationName: "Elsinore Canterbury Bell Slopes East",
            coordinates: [-117.3498, 33.7845],
            bloomingPeriod: {
                start: "2019-03-08",
                peak: "2019-03-25",
                end: "2019-04-28"
            }
        },
        {
            id: 26,
            speciesId: 50614, // Miniature Lupine
            locationName: "Walker Canyon Miniature Lupine Garden",
            coordinates: [-117.4123, 33.7345],
            bloomingPeriod: {
                start: "2019-03-18",
                peak: "2019-03-25",
                end: "2019-05-03"
            }
        },
        {
            id: 27,
            speciesId: 61010, // coastal bush lupine
            locationName: "Lake Elsinore Bush Lupine Canyon",
            coordinates: [-117.3723, 33.7567],
            bloomingPeriod: {
                start: "2019-02-25",
                peak: "2019-03-25",
                end: "2019-05-15"
            }
        },

        // ====================================================================
        // REGION 4: Anza-Borrego (2019 February)
        // Bounds: minLon: -116.3545, maxLon: -116.2726, minLat: 33.1534, maxLat: 33.2137
        // Species: Desert Sand Verbena (50164), Desert Lily (using 542062 Rock Purslane as similar)
        // ====================================================================
        {
            id: 28,
            speciesId: 50164, // desert sand verbena
            locationName: "Anza-Borrego Sand Verbena Wash",
            coordinates: [-116.3234, 33.1823],
            bloomingPeriod: {
                start: "2019-01-20",
                peak: "2019-02-15",
                end: "2019-04-10"
            }
        },
        {
            id: 29,
            speciesId: 50164, // desert sand verbena
            locationName: "Borrego Desert Verbena Dunes",
            coordinates: [-116.2987, 33.1967],
            bloomingPeriod: {
                start: "2019-02-01",
                peak: "2019-02-15",
                end: "2019-03-30"
            }
        },
        {
            id: 30,
            speciesId: 542062, // Rock Purslane (representing Desert Lily)
            locationName: "Anza-Borrego Desert Lily Grove",
            coordinates: [-116.3123, 33.1611],
            bloomingPeriod: {
                start: "2019-02-10",
                peak: "2019-02-15",
                end: "2019-04-15"
            }
        },
        {
            id: 31,
            speciesId: 542062, // Rock Purslane (representing Desert Lily)
            locationName: "Borrego Springs Desert Lily Field",
            coordinates: [-116.2834, 33.2023],
            bloomingPeriod: {
                start: "2019-01-25",
                peak: "2019-02-15",
                end: "2019-03-25"
            }
        },
        {
            id: 32,
            speciesId: 50164, // desert sand verbena
            locationName: "Anza Desert Verbena Canyon East",
            coordinates: [-116.2789, 33.1756],
            bloomingPeriod: {
                start: "2019-01-28",
                peak: "2019-02-15",
                end: "2019-04-05"
            }
        },
        {
            id: 33,
            speciesId: 542062, // Rock Purslane (representing Desert Lily)
            locationName: "Borrego Desert Lily Valley North",
            coordinates: [-116.3456, 33.2089],
            bloomingPeriod: {
                start: "2019-02-05",
                peak: "2019-02-15",
                end: "2019-04-12"
            }
        },
        {
            id: 34,
            speciesId: 50164, // desert sand verbena
            locationName: "Anza-Borrego Sand Verbena Mesa",
            coordinates: [-116.3378, 33.1589],
            bloomingPeriod: {
                start: "2019-01-22",
                peak: "2019-02-15",
                end: "2019-03-28"
            }
        },
        {
            id: 35,
            speciesId: 542062, // Rock Purslane (representing Desert Lily)
            locationName: "Borrego Springs Lily Garden South",
            coordinates: [-116.2923, 33.1609],
            bloomingPeriod: {
                start: "2019-02-08",
                peak: "2019-02-15",
                end: "2019-04-18"
            }
        },

        // ====================================================================
        // REGION 5: Atacama Desert, Chile (2019 July)
        // Bounds: minLon: -69.4799, maxLon: -69.4125, minLat: -23.9835, maxLat: -23.9303
        // Species: Pata de Guanaco (using 76662 Cape marigold), Suspiro de Campo (using 119207 rain daisy)
        // Note: Coordinates corrected to negative values for Chile (Western & Southern Hemisphere)
        // ====================================================================
        {
            id: 36,
            speciesId: 76662, // Cape marigold (representing Pata de Guanaco)
            locationName: "Atacama Pata de Guanaco Valley",
            coordinates: [-69.4456, -23.9567], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-06-15",
                peak: "2019-07-25",
                end: "2019-09-10"
            }
        },
        {
            id: 37,
            speciesId: 76662, // Cape marigold (representing Pata de Guanaco)
            locationName: "Atacama Desert Guanaco Flower Field",
            coordinates: [-69.452, -23.94], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-07-01",
                peak: "2019-07-25",
                end: "2019-08-30"
            }
        },
        {
            id: 38,
            speciesId: 119207, // rain daisy (representing Suspiro de Campo)
            locationName: "Atacama Suspiro de Campo Plains",
            coordinates: [-69.4612, -23.9678], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-07-10",
                peak: "2019-07-25",
                end: "2019-09-05"
            }
        },
        {
            id: 39,
            speciesId: 119207, // rain daisy (representing Suspiro de Campo)
            locationName: "Atacama White Flower Meadow",
            coordinates: [-69.4389, -23.9512], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-07-05",
                peak: "2019-07-25",
                end: "2019-08-25"
            }
        },
        {
            id: 40,
            speciesId: 76662, // Cape marigold (representing Pata de Guanaco)
            locationName: "Atacama Guanaco Flower Plateau West",
            coordinates: [-69.4689, -23.9398], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-06-20",
                peak: "2019-07-25",
                end: "2019-09-05"
            }
        },
        {
            id: 41,
            speciesId: 119207, // rain daisy (representing Suspiro de Campo)
            locationName: "Atacama Suspiro Desert Garden",
            coordinates: [-69.4298, -23.9734], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-07-12",
                peak: "2019-07-25",
                end: "2019-08-28"
            }
        },
        {
            id: 42,
            speciesId: 76662, // Cape marigold (representing Pata de Guanaco)
            locationName: "Atacama Pata de Guanaco Mesa East",
            coordinates: [-69.4167, -23.9333], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-06-28",
                peak: "2019-07-25",
                end: "2019-09-12"
            }
        },
        {
            id: 43,
            speciesId: 119207, // rain daisy (representing Suspiro de Campo)
            locationName: "Atacama Suspiro Valley North",
            coordinates: [-69.453, -23.9334], // Corrected to negative for Chile
            bloomingPeriod: {
                start: "2019-07-08",
                peak: "2019-07-25",
                end: "2019-09-02"
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

/**
 * 5. Lấy thông tin map overlays
 */
export async function getMapOverlays(): Promise<MapOverlay[]> {
    try {
        // For development, using mock implementation
        return await mockGetMapOverlays()

        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}/api/overlays`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch overlays')
        }
        
        return data.data
        */
    } catch (error) {
        console.error("Error fetching map overlays:", error)
        throw error
    }
}

async function mockGetMapOverlays(): Promise<MapOverlay[]> {
    // Mock data for map overlays
    return [
        {
            id: 1,
            name: "Anza-Borrego Desert State Park, Antelope Valley",
            address: "California, USA",
            imageUrl: "/region1/cluster_mask.svg",
            startDate: "2024-04-01",
            endDate: "2024-09-30",
            reportUrl: "/region1/report.pdf",
            chartUrls: ["region1/ndvi.gif"],
            predictUrls: [],
            bounds: {
                minLon: -118.4182,
                maxLon: -118.3138,
                minLat: 34.6969,
                maxLat: 34.7929
            }
        },
        {
            id: 3,
            name: "Walker Canyon, Lake Elsinore",
            address: "California, USA",
            imageUrl: "/region3/cluster_mask.svg",
            startDate: "2019-03-01",
            endDate: "2019-03-31",
            chartUrls: ["region3/ndvi.gif"],
            bounds: {
                minLon: -117.4612,
                maxLon: -117.3359,
                minLat: 33.71,
                maxLat: 33.7994
            }
        },
        {
            id: 4,
            name: "Anza-Borrego",
            address: "California, USA",
            imageUrl: "/region4/cluster_mask.svg",
            startDate: "2019-02-01",
            endDate: "2019-02-28",
            chartUrls: ["region4/ndvi.gif"],
            bounds: {
                minLon: -116.3545,
                maxLon: -116.2726,
                minLat: 33.1534,
                maxLat: 33.2137
            }
        },
        {
            id: 5,
            name: "Atacama Desert",
            address: "Chile",
            imageUrl: "/region5/cluster_mask.svg",
            startDate: "2019-07-01",
            endDate: "2019-07-31",
            chartUrls: ["region5/ndvi.gif"],
            bounds: {
                minLon: -69.4799,
                maxLon: -69.4125,
                minLat: -23.9835,
                maxLat: -23.9303
            }
        }
    ]
}

async function mockCreateLocation(locationData: LocationCreate): Promise<{
    success: boolean
    data: Location | null
    message: string
}> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
        // Validate required fields
        if (
            !locationData.speciesId ||
            !locationData.locationName ||
            !locationData.coordinates ||
            !locationData.bloomingPeriod
        ) {
            return {
                success: false,
                data: null,
                message: "Thiếu thông tin bắt buộc"
            }
        }

        // Validate coordinates
        if (
            !Array.isArray(locationData.coordinates) ||
            locationData.coordinates.length !== 2
        ) {
            return {
                success: false,
                data: null,
                message: "Tọa độ không hợp lệ"
            }
        }

        // Validate blooming period
        const { bloomingPeriod } = locationData
        if (
            !bloomingPeriod.start ||
            !bloomingPeriod.peak ||
            !bloomingPeriod.end
        ) {
            return {
                success: false,
                data: null,
                message: "Thời gian nở hoa không hợp lệ"
            }
        }

        // Validate date order
        const startDate = new Date(bloomingPeriod.start)
        const peakDate = new Date(bloomingPeriod.peak)
        const endDate = new Date(bloomingPeriod.end)

        if (peakDate < startDate || endDate < peakDate) {
            return {
                success: false,
                data: null,
                message: "Thứ tự thời gian nở hoa không hợp lệ"
            }
        }

        // Generate new ID (in a real app, this would be handled by the database)
        const newId = Math.floor(Math.random() * 10000) + 1000

        const newLocation: Location = {
            id: newId,
            speciesId: locationData.speciesId,
            locationName: locationData.locationName.trim(),
            coordinates: [
                parseFloat(locationData.coordinates[0].toString()),
                parseFloat(locationData.coordinates[1].toString())
            ],
            bloomingPeriod: {
                start: bloomingPeriod.start,
                peak: bloomingPeriod.peak,
                end: bloomingPeriod.end
            }
        }

        // In a real implementation, you would store this in a database
        // For now, we'll just return the created location
        return {
            success: true,
            data: newLocation,
            message: "Địa điểm đã được tạo thành công"
        }
    } catch (error) {
        console.error("Mock create location error:", error)
        return {
            success: false,
            data: null,
            message: "Lỗi khi tạo địa điểm mới"
        }
    }
}

export type { Species, Location, SpeciesWithLocations, MapOverlay }
