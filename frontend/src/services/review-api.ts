/**
 * Review API Service
 * Handles user reviews, ratings, and image uploads for flower locations
 */

import {
    UserReview,
    ReviewStats,
    ReviewSubmission,
    ReviewResponse,
    ReviewImage
} from "@/types/api"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_ENDPOINTS = {
    reviews: "/api/v1/reviews/all",
    reviews_post: "/api/v1/reviews/submit",
    uploadImage: "/api/v1/reviews/upload",
    reviewStats: "/api/v1/reviews/stats"
}

/**
 * Submit a new review for a species location
 */
export async function submitReview(
    review: ReviewSubmission
): Promise<ReviewResponse> {
    try {
        // For development, using mock implementation
        // return await mockSubmitReview(review)

        // Production implementation (uncomment when backend is ready):
        const formData = new FormData()
        formData.append("speciesId", review.speciesId.toString())
        formData.append("locationId", review.locationId.toString())
        formData.append("rating", review.rating.toString())
        formData.append("comment", review.comment)
        formData.append("userName", review.userName)
        review.images.forEach((image, index) => {
            formData.append(`images`, image)
        })

        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.reviews_post}`,
            {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error("Error submitting review:", error)
        return {
            success: false,
            data: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to submit review"
        }
    }
}

/**
 * Get reviews for a specific species location
 */
export async function getReviews(
    speciesId: number,
    locationId: number
): Promise<UserReview[]> {
    try {
        // For development, using mock implementation
        // return await mockGetReviews(speciesId, locationId)

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.reviews}?speciesId=${speciesId}&locationId=${locationId}`,
            {
                method: "GET"
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetch response:", data)
        return data || []
    } catch (error) {
        console.error("Error fetching reviews:", error)
        return []
    }
}

/**
 * Get review statistics for a species location
 */
export async function getReviewStats(
    speciesId: number,
    locationId: number
): Promise<ReviewStats> {
    try {
        // For development, using mock implementation
        // return await mockGetReviewStats(speciesId, locationId)

        // Production implementation (uncomment when backend is ready):
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.reviewStats}?speciesId=${speciesId}&locationId=${locationId}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetch review stats response:", data)
        return data
    } catch (error) {
        console.error("Error fetching review stats:", error)
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
    }
}

/**
 * Upload images and get URLs (for form preview)
 */
export async function uploadReviewImages(
    files: File[]
): Promise<ReviewImage[]> {
    try {
        // For development, using mock implementation
        // return await mockUploadImages(files)

        // Production implementation (uncomment when backend is ready):
        const formData = new FormData()
        files.forEach((file) => {
            formData.append("images", file)
        })

        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.uploadImage}`,
            {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.images || []
    } catch (error) {
        console.error("Error uploading images:", error)
        return []
    }
}

// Mock implementations for development
async function mockSubmitReview(
    review: ReviewSubmission
): Promise<ReviewResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Upload images first
    const uploadedImages = await mockUploadImages(review.images)

    // Server automatically sets visitDate to current datetime
    const currentDateTime = new Date().toISOString()

    const newReview: UserReview = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        speciesId: review.speciesId,
        locationId: review.locationId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        images: uploadedImages,
        timestamp: currentDateTime
    }

    // Store in localStorage for persistence during development
    const existingReviews = JSON.parse(
        localStorage.getItem("mockReviews") || "[]"
    )
    existingReviews.push(newReview)
    localStorage.setItem("mockReviews", JSON.stringify(existingReviews))

    return {
        success: true,
        data: newReview,
        message: "Review submitted successfully"
    }
}

async function mockGetReviews(
    speciesId: number,
    locationId: number
): Promise<UserReview[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get from localStorage
    const storedReviews = JSON.parse(
        localStorage.getItem("mockReviews") || "[]"
    )
    const locationReviews = storedReviews.filter(
        (r: UserReview) =>
            r.speciesId === speciesId && r.locationId === locationId
    )

    // Generate some mock reviews if none exist
    if (locationReviews.length === 0) {
        const mockReviews = generateMockReviews(speciesId, locationId)
        const allReviews = [...storedReviews, ...mockReviews]
        localStorage.setItem("mockReviews", JSON.stringify(allReviews))
        return mockReviews
    }

    return locationReviews.sort(
        (a: UserReview, b: UserReview) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
}

async function mockGetReviewStats(
    speciesId: number,
    locationId: number
): Promise<ReviewStats> {
    const reviews = await mockGetReviews(speciesId, locationId)

    if (reviews.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
    }

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let totalRating = 0

    reviews.forEach((review) => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++
        totalRating += review.rating
    })

    return {
        averageRating: totalRating / reviews.length,
        totalReviews: reviews.length,
        ratingDistribution
    }
}

async function mockUploadImages(files: File[]): Promise<ReviewImage[]> {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    return files.map((file) => ({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: URL.createObjectURL(file), // For preview only
        thumbnailUrl: URL.createObjectURL(file), // In production, would be a smaller version
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size
    }))
}

function generateMockReviews(
    speciesId: number,
    locationId: number
): UserReview[] {
    const mockUserNames = [
        "Nature Lover",
        "Garden Explorer",
        "Flower Photographer",
        "Botanical Student",
        "Weekend Hiker",
        "Travel Blogger",
        "Local Resident",
        "Photography Enthusiast"
    ]

    const mockComments = [
        "Absolutely stunning flowers! The colors were so vibrant, especially in the morning light.",
        "Perfect timing for the bloom season. The area was well-maintained and accessible.",
        "Beautiful flowers, but the location was quite crowded during peak hours.",
        "Amazing place for photography. The flowers created a magical atmosphere.",
        "Great spot for nature walks. The bloom was at its peak when I visited.",
        "Lovely flowers and peaceful environment. Perfect for a family outing.",
        "The flowers exceeded my expectations. Definitely worth the trip!",
        "Good location but could use better parking facilities."
    ]

    const reviewCount = Math.floor(Math.random() * 5) + 2 // 2-6 reviews
    const reviews: UserReview[] = []

    for (let i = 0; i < reviewCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30) + 1
        const visitDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

        reviews.push({
            id: `mock_review_${speciesId}_${locationId}_${i}`,
            speciesId,
            locationId,
            userName: mockUserNames[i % mockUserNames.length],
            rating: Math.floor(Math.random() * 2) + 4, // Mostly 4-5 stars
            comment: mockComments[i % mockComments.length],
            images: [], // No images for initial mock reviews
            timestamp: visitDate.toISOString()
        })
    }

    return reviews
}

// Helper function to get auth token (implement based on your auth system)
function getAuthToken(): string {
    // For development, return a mock token
    return "mock_token_123"

    // Production implementation:
    // return localStorage.getItem('authToken') || ''
}
