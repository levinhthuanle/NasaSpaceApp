export interface SpeciesData {
    id: number
    name: string
    scientificName: string
    location: [number, number]
    locationName: string
    bloomingPeriod: {
        start: string
        peak: string
        end: string
    }
    bloomProbability: number
    description: string
    imageUrl: string
    bloomTime?: string // Thời gian nở (e.g., "Tháng 3-5")
    color?: string // Màu hoa (e.g., "Hồng, trắng")
    habitat?: string // Môi trường sống
    characteristics?: string // Đặc điểm nhận dạng
}

// New interface for grouped species
export interface SpeciesGroup {
    name: string
    scientificName: string
    locations: SpeciesData[]
    totalLocations: number
    averageBloomProbability: number
    imageUrl: string
}

// For managing pinned species by name
export interface PinnedSpecies {
    name: string
    scientificName: string
    locations: SpeciesData[]
}

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
