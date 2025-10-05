// Review System Interfaces
export interface ReviewImage {
    id: string
    url: string
    thumbnailUrl: string
    originalName: string
    uploadedAt: string
    size: number // File size in bytes
}

export interface UserReview {
    id: string
    speciesId: number
    locationId: number
    userName: string
    rating: number
    comment: string
    images: ReviewImage[]
    timestamp: string
}

export interface ReviewStats {
    averageRating: number
    totalReviews: number
    ratingDistribution: {
        5: number
        4: number
        3: number
        2: number
        1: number
    }
}

export interface ReviewSubmission {
    speciesId: number
    locationId: number
    userName: string
    rating: number
    comment: string
    images: File[]
}

export interface ReviewResponse {
    success: boolean
    data: UserReview | null
    message?: string
}

export interface Species {
    id: number
    speciesId: number
    name: string
    scientificName: string
    description: string
    imageUrl: string
    videoUrl?: string
    bloomTime?: string
    color?: string
    habitat?: string
    characteristics?: string
}

export interface Location {
    id: number
    speciesId: number
    locationName: string
    coordinates: [number, number]
    bloomingPeriod: {
        start: string
        peak: string
        end: string
    }
}

// API Response Types
export interface SpeciesListResponse {
    success: boolean
    data: Species[]
    message?: string
}

export interface LocationsResponse {
    success: boolean
    data: Location[]
    message?: string
}

export interface SpeciesDetailResponse {
    success: boolean
    data: Species | null
    message?: string
}

export interface LocationCreate {
    speciesId: number
    locationName: string
    coordinates: [number, number]
    bloomingPeriod: {
        start: string
        peak: string
        end: string
    }
}

export interface LocationCreateResponse {
    success: boolean
    data: Location | null
    message: string
}

// Combined data type for UI components
export interface SpeciesWithLocations {
    species: Species
    locations: Location[]
}

// Map overlay data
export interface MapOverlay {
    id: number
    name: string
    address: string
    imageUrl: string
    startDate: string
    endDate: string
    reportUrl?: string
    chartUrls?: string[] // Array of chart URLs (images and GIFs)
    predictUrls?: string[] // Array of prediction image URLs
    bounds: {
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    }
}
