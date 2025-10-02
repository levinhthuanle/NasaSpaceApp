/**
 * Canvas Worker Manager
 * Manages WebWorker instances for canvas processing
 */

import type {
    CanvasWorkerMessage,
    CanvasWorkerResponse,
    CreateCanvasData,
    CreateFallbackData
} from "@/workers/canvas-worker"

interface PendingRequest {
    resolve: (canvas: HTMLCanvasElement) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
}

class CanvasWorkerManager {
    private workers: Worker[] = []
    private currentWorkerIndex = 0
    private pendingRequests = new Map<string, PendingRequest>()
    private requestCounter = 0
    private maxWorkers: number
    private requestTimeout: number

    private initializationAttempted = false

    constructor(maxWorkers: number = 2, requestTimeout: number = 10000) {
        this.maxWorkers = maxWorkers
        this.requestTimeout = requestTimeout
        // Don't initialize immediately - do it lazily when needed
    }

    /**
     * Initialize worker pool
     */
    private initializeWorkers(): void {
        // Check if Worker is available (client-side only)
        if (typeof Worker === "undefined") {
            console.warn(
                "WebWorkers not available, will use main thread fallback"
            )
            return
        }

        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = new Worker(
                    new URL("../workers/canvas-worker.ts", import.meta.url),
                    { type: "module" }
                )

                worker.onmessage = (
                    event: MessageEvent<CanvasWorkerResponse>
                ) => {
                    this.handleWorkerResponse(event.data)
                }

                worker.onerror = (error) => {
                    console.error(`Canvas worker ${i} error:`, error)
                }

                this.workers.push(worker)
            } catch (error) {
                console.warn(`Failed to create canvas worker ${i}:`, error)
            }
        }

        if (this.workers.length === 0) {
            console.warn(
                "No canvas workers available, falling back to main thread processing"
            )
        }
    }

    /**
     * Handle worker response
     */
    private handleWorkerResponse(response: CanvasWorkerResponse): void {
        const pending = this.pendingRequests.get(response.id)
        if (!pending) return

        clearTimeout(pending.timeout)
        this.pendingRequests.delete(response.id)

        if (response.type === "success" && response.canvas) {
            // Convert ImageBitmap back to HTMLCanvasElement
            const canvas = document.createElement("canvas")
            canvas.width = response.canvas.width
            canvas.height = response.canvas.height
            const ctx = canvas.getContext("2d")!
            ctx.drawImage(response.canvas, 0, 0)

            // Close the ImageBitmap to free memory
            response.canvas.close()

            pending.resolve(canvas)
        } else {
            pending.reject(new Error(response.error || "Unknown worker error"))
        }
    }

    /**
     * Get next available worker
     */
    private getNextWorker(): Worker | null {
        if (this.workers.length === 0) return null

        const worker = this.workers[this.currentWorkerIndex]
        this.currentWorkerIndex =
            (this.currentWorkerIndex + 1) % this.workers.length
        return worker
    }

    /**
     * Generate unique request ID
     */
    private generateRequestId(): string {
        return `canvas_${++this.requestCounter}_${Date.now()}`
    }

    /**
     * Create canvas with image and border using WebWorker
     */
    async createCanvas(
        imageUrl: string,
        size: number,
        borderWidth: number = 3,
        scale: number = 1.0,
        borderColor: string = "#FFFFFF"
    ): Promise<HTMLCanvasElement> {
        // Lazy initialization - try to initialize workers if not done yet
        if (
            !this.initializationAttempted &&
            typeof window !== "undefined" &&
            typeof Worker !== "undefined"
        ) {
            this.initializationAttempted = true
            this.initializeWorkers()
        }

        const worker = this.getNextWorker()

        // Fallback to main thread if no workers available
        if (!worker) {
            return this.createCanvasMainThread(
                imageUrl,
                size,
                borderWidth,
                scale,
                borderColor
            )
        }

        const requestId = this.generateRequestId()

        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId)
                reject(new Error("Canvas creation timeout"))
            }, this.requestTimeout)

            // Store pending request
            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout
            })

            // Send message to worker
            const message: CanvasWorkerMessage = {
                id: requestId,
                type: "createCanvas",
                data: {
                    imageUrl,
                    size,
                    borderWidth,
                    scale,
                    borderColor
                } as CreateCanvasData
            }

            worker.postMessage(message)
        })
    }

    /**
     * Create fallback canvas using WebWorker
     */
    async createFallbackCanvas(
        size: number,
        color: string,
        borderWidth: number = 3,
        scale: number = 1.0
    ): Promise<HTMLCanvasElement> {
        const worker = this.getNextWorker()

        // Fallback to main thread if no workers available
        if (!worker) {
            return this.createFallbackCanvasMainThread(
                size,
                color,
                borderWidth,
                scale
            )
        }

        const requestId = this.generateRequestId()

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId)
                reject(new Error("Fallback canvas creation timeout"))
            }, this.requestTimeout)

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout
            })

            const message: CanvasWorkerMessage = {
                id: requestId,
                type: "createFallback",
                data: {
                    size,
                    color,
                    borderWidth,
                    scale
                } as CreateFallbackData
            }

            worker.postMessage(message)
        })
    }

    /**
     * Fallback canvas creation on main thread
     */
    private async createCanvasMainThread(
        imageUrl: string,
        size: number,
        borderWidth: number,
        scale: number,
        borderColor: string = "#FFFFFF"
    ): Promise<HTMLCanvasElement> {
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
                    // Draw border with dynamic color
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

    /**
     * Fallback circle canvas creation on main thread
     */
    private createFallbackCanvasMainThread(
        size: number,
        color: string,
        borderWidth: number,
        scale: number
    ): Promise<HTMLCanvasElement> {
        const canvas = document.createElement("canvas")
        const finalSize = size * scale
        canvas.width = finalSize + borderWidth * 2
        canvas.height = finalSize + borderWidth * 2
        const ctx = canvas.getContext("2d")!

        // Draw white border
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

        // Draw colored circle
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

        return Promise.resolve(canvas)
    }

    /**
     * Get worker pool statistics
     */
    getStats(): {
        workerCount: number
        pendingRequests: number
        isAvailable: boolean
    } {
        return {
            workerCount: this.workers.length,
            pendingRequests: this.pendingRequests.size,
            isAvailable: this.workers.length > 0
        }
    }

    /**
     * Cleanup workers and pending requests
     */
    destroy(): void {
        // Clear pending requests
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout)
            pending.reject(new Error("Canvas worker manager destroyed"))
        }
        this.pendingRequests.clear()

        // Terminate workers
        this.workers.forEach((worker) => {
            worker.terminate()
        })
        this.workers.length = 0
    }
}

// Lazy singleton instance
let _canvasWorkerManager: CanvasWorkerManager | null = null

export function getCanvasWorkerManager(): CanvasWorkerManager {
    if (!_canvasWorkerManager) {
        _canvasWorkerManager = new CanvasWorkerManager()
    }
    return _canvasWorkerManager
}

// For backward compatibility
export const canvasWorkerManager = {
    createCanvas: (
        imageUrl: string,
        size: number,
        borderWidth?: number,
        scale?: number,
        borderColor?: string
    ) =>
        getCanvasWorkerManager().createCanvas(
            imageUrl,
            size,
            borderWidth,
            scale,
            borderColor
        ),
    createFallbackCanvas: (
        size: number,
        color: string,
        borderWidth?: number,
        scale?: number
    ) =>
        getCanvasWorkerManager().createFallbackCanvas(
            size,
            color,
            borderWidth,
            scale
        ),
    destroy: () => getCanvasWorkerManager().destroy()
}

export default CanvasWorkerManager
