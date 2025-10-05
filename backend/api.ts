// Review System Interfaces
// GET /Species/all // SpeciesListResponse OK
// GET /Species/{speciesId} // SpeciesDetailResponse OK
// POST /Species //  OK

// GET /Location/All // LocationResponse OK
// GET /Location/{speciesId} // LocationResponse OK
// POST /Location OK

// GET /Reviews/all // List[UserReview]
// GET /Reviews/ReviewStats/{speciesId}/{LocationId} // speciesId ?= null
// POST /Reviews/SubmitReview // ReviewSubmission
// POST /Reviews/ReviewImage 


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
    userId: string
    userName: string
    userAvatar?: string
    rating: number // 1-5 stars
    comment: string
    images: ReviewImage[]
    timestamp: string // ISO date string
    isVerified: boolean // Verified by admin/expert
    helpfulCount: number // Number of users who found this review helpful
    visitDate: string // When user visited the location
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
    rating: number
    comment: string
    images: File[]
    visitDate: string
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

// Combined data type for UI components
export interface SpeciesWithLocations {
    species: Species
    locations: Location[]
}

// Map overlay data
export interface MapOverlay {
    id: number
    name: string
    imageUrl: string
    bounds: {
        minLon: number
        maxLon: number
        minLat: number
        maxLat: number
    }
    opacity?: number
    zIndex?: number
    isActive?: boolean
}
