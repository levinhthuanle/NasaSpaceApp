/**
 * Image Cache and Canvas Manager for OpenLayers Markers
 * Caches processed images and canvas to improve performance
 * Uses WebWorkers for non-blocking canvas processing
 */

import { getCanvasWorkerManager } from "./canvas-worker-manager"

interface CachedImage {
    canvas: HTMLCanvasElement
    timestamp: number
}

interface ImageCacheConfig {
    maxCacheSize: number
    maxAge: number // milliseconds
}

class ImageCache {
    private cache = new Map<string, CachedImage>()
    private config: ImageCacheConfig
    private loadingPromises = new Map<string, Promise<HTMLCanvasElement>>()

    constructor(
        config: ImageCacheConfig = { maxCacheSize: 100, maxAge: 5 * 60 * 1000 }
    ) {
        this.config = config

        // Cleanup old cache entries periodically
        setInterval(() => this.cleanup(), this.config.maxAge / 2)
    }

    /**
     * Generate cache key based on image properties
     */
    private getCacheKey(
        imageUrl: string,
        size: number,
        borderWidth: number,
        scale: number,
        borderColor: string = "#FFFFFF"
    ): string {
        return `${imageUrl}:${size}:${borderWidth}:${scale}:${borderColor}`
    }

    /**
     * Create canvas with border for image using WebWorker
     */
    private async createCanvasWithBorder(
        imageUrl: string,
        size: number,
        borderWidth: number = 3,
        scale: number = 1.0,
        borderColor: string = "#FFFFFF"
    ): Promise<HTMLCanvasElement> {
        try {
            // Try WebWorker first for better performance
            return await getCanvasWorkerManager().createCanvas(
                imageUrl,
                size,
                borderWidth,
                scale
            )
        } catch (workerError) {
            console.warn(
                "WebWorker canvas creation failed, falling back to main thread:",
                workerError
            )

            // Fallback to main thread processing
            return new Promise((resolve, reject) => {
                const canvas = document.createElement("canvas")
                const finalSize = size * scale
                canvas.width = finalSize + borderWidth * 2
                canvas.height = finalSize + borderWidth * 2
                const ctx = canvas.getContext("2d")!

                const img = new Image()
                img.crossOrigin = "anonymous"

                img.onload = () => {
                    try {
                        // Draw border (circle) with dynamic color
                        ctx.beginPath()
                        ctx.arc(
                            canvas.width / 2,
                            canvas.height / 2,
                            finalSize / 2 + borderWidth,
                            0,
                            2 * Math.PI
                        )
                        ctx.fillStyle = borderColor
                        ctx.fill()

                        // Draw image in circular mask
                        ctx.save()
                        ctx.beginPath()
                        ctx.arc(
                            canvas.width / 2,
                            canvas.height / 2,
                            finalSize / 2,
                            0,
                            2 * Math.PI
                        )
                        ctx.clip()

                        ctx.drawImage(
                            img,
                            borderWidth,
                            borderWidth,
                            finalSize,
                            finalSize
                        )
                        ctx.restore()

                        resolve(canvas)
                    } catch (error) {
                        reject(error)
                    }
                }

                img.onerror = () => {
                    reject(new Error(`Failed to load image: ${imageUrl}`))
                }

                img.src = imageUrl
            })
        }
    }

    /**
     * Get cached canvas or create new one
     */
    async getCanvas(
        imageUrl: string,
        size: number,
        borderWidth: number = 3,
        scale: number = 1.0,
        borderColor: string = "#FFFFFF"
    ): Promise<HTMLCanvasElement> {
        const cacheKey = this.getCacheKey(
            imageUrl,
            size,
            borderWidth,
            scale,
            borderColor
        )

        // Check cache first
        const cached = this.cache.get(cacheKey)
        if (cached) {
            cached.timestamp = Date.now() // Update access time
            return cached.canvas
        }

        // Check if already loading
        const existingPromise = this.loadingPromises.get(cacheKey)
        if (existingPromise) {
            return existingPromise
        }

        // Create new canvas
        const promise = this.createCanvasWithBorder(
            imageUrl,
            size,
            borderWidth,
            scale,
            borderColor
        )
            .then((canvas) => {
                // Cache the result
                this.cache.set(cacheKey, {
                    canvas: canvas,
                    timestamp: Date.now()
                })

                // Clean up loading promise
                this.loadingPromises.delete(cacheKey)

                // Enforce cache size limit
                this.enforceCacheLimit()

                return canvas
            })
            .catch((error) => {
                // Clean up failed loading promise
                this.loadingPromises.delete(cacheKey)
                throw error
            })

        this.loadingPromises.set(cacheKey, promise)
        return promise
    }

    /**
     * Create fallback circle canvas using WebWorker when possible
     */
    async createFallbackCanvas(
        size: number,
        color: string,
        borderWidth: number = 3,
        scale: number = 1.0
    ): Promise<HTMLCanvasElement> {
        try {
            // Try WebWorker first
            return await getCanvasWorkerManager().createFallbackCanvas(
                size,
                color,
                borderWidth,
                scale
            )
        } catch (error) {
            // Fallback to main thread
            const canvas = document.createElement("canvas")
            const finalSize = size * scale
            canvas.width = finalSize + borderWidth * 2
            canvas.height = finalSize + borderWidth * 2
            const ctx = canvas.getContext("2d")!

            // Draw circle with border
            ctx.beginPath()
            ctx.arc(
                canvas.width / 2,
                canvas.height / 2,
                finalSize / 2 + borderWidth,
                0,
                2 * Math.PI
            )
            ctx.fillStyle = "#FFFFFF"
            ctx.fill()

            ctx.beginPath()
            ctx.arc(
                canvas.width / 2,
                canvas.height / 2,
                finalSize / 2,
                0,
                2 * Math.PI
            )
            ctx.fillStyle = color
            ctx.fill()

            return canvas
        }
    }

    /**
     * Preload images for better performance
     */
    async preloadImages(imageUrls: string[], size: number = 40): Promise<void> {
        const promises = imageUrls.map((url) =>
            this.getCanvas(url, size).catch(() => {
                // Ignore preload errors, fallback will be used when needed
                console.warn(`Failed to preload image: ${url}`)
            })
        )

        await Promise.allSettled(promises)
    }

    /**
     * Clean up old cache entries
     */
    private cleanup(): void {
        const now = Date.now()
        const keysToDelete: string[] = []

        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.config.maxAge) {
                keysToDelete.push(key)
            }
        }

        keysToDelete.forEach((key) => this.cache.delete(key))

        if (keysToDelete.length > 0) {
            console.log(
                `ImageCache: Cleaned up ${keysToDelete.length} old entries`
            )
        }
    }

    /**
     * Enforce cache size limit
     */
    private enforceCacheLimit(): void {
        if (this.cache.size <= this.config.maxCacheSize) {
            return
        }

        // Sort by timestamp and remove oldest entries
        const entries = Array.from(this.cache.entries()).sort(
            ([, a], [, b]) => a.timestamp - b.timestamp
        )

        const toRemove = entries.slice(
            0,
            this.cache.size - this.config.maxCacheSize
        )
        toRemove.forEach(([key]) => this.cache.delete(key))

        console.log(
            `ImageCache: Removed ${toRemove.length} entries to enforce size limit`
        )
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear()
        this.loadingPromises.clear()
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; loading: number } {
        return {
            size: this.cache.size,
            loading: this.loadingPromises.size
        }
    }
}

// Export singleton instance
export const imageCache = new ImageCache()
export default ImageCache
