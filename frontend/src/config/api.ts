/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API Base Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    TIMEOUT: 10000, // 10 seconds
    USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false" // Default to true for development
}

// API Endpoints
export const API_ENDPOINTS = {
    // Species endpoints
    SPECIES: "/api/species",

    // Location endpoints
    LOCATIONS: "/api/locations",
    LOCATION_BY_ID: (id: number) => `/api/locations/${id}`,
    LOCATIONS_BY_SPECIES: (speciesId: number) =>
        `/api/locations?speciesId=${speciesId}`,

    // Review endpoints
    REVIEWS: "/api/reviews",
    REVIEW_STATS: "/api/reviews/stats",
    REVIEW_IMAGES: "/api/reviews/upload",

    // Map overlay endpoints
    MAP_OVERLAYS: "/api/overlays"
} as const

// HTTP Methods
export const HTTP_METHODS = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE"
} as const

// Common headers
export const DEFAULT_HEADERS = {
    "Content-Type": "application/json"
} as const

/**
 * Helper function to build full API URL
 */
export function buildApiUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

/**
 * Helper function to create fetch options with default settings
 */
export function createFetchOptions(
    method: string = HTTP_METHODS.GET,
    body?: any,
    additionalHeaders?: Record<string, string>
): RequestInit {
    const options: RequestInit = {
        method,
        headers: {
            ...DEFAULT_HEADERS,
            ...additionalHeaders
        }
    }

    if (
        body &&
        (method === HTTP_METHODS.POST ||
            method === HTTP_METHODS.PUT ||
            method === HTTP_METHODS.PATCH)
    ) {
        options.body = JSON.stringify(body)
    }

    return options
}

/**
 * Environment-specific settings
 */
export const ENV_CONFIG = {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    enableDebugLogs: process.env.NEXT_PUBLIC_DEBUG_API === "true"
} as const

/**
 * API Response types for standardized responses
 */
export interface StandardApiResponse<T = any> {
    success: boolean
    data: T
    message?: string
    error?: string
}

export interface PaginatedResponse<T = any> extends StandardApiResponse<T[]> {
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}
