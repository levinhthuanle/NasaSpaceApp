/**
 * Web Worker for Canvas Processing
 * Handles image processing and canvas creation off the main thread
 */

interface CanvasWorkerMessage {
    id: string
    type: "createCanvas" | "createFallback"
    data: any
}

interface CreateCanvasData {
    imageUrl: string
    size: number
    borderWidth: number
    scale: number
    borderColor?: string
}

interface CreateFallbackData {
    size: number
    color: string
    borderWidth: number
    scale: number
}

interface CanvasWorkerResponse {
    id: string
    type: "success" | "error"
    canvas?: ImageBitmap
    error?: string
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<CanvasWorkerMessage>) => {
    const { id, type, data } = event.data

    try {
        switch (type) {
            case "createCanvas":
                await handleCreateCanvas(id, data as CreateCanvasData)
                break
            case "createFallback":
                await handleCreateFallback(id, data as CreateFallbackData)
                break
            default:
                throw new Error(`Unknown message type: ${type}`)
        }
    } catch (error) {
        const errorResponse: CanvasWorkerResponse = {
            id,
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error"
        }
        ;(self as any).postMessage(errorResponse)
    }
}

/**
 * Create canvas with image and white border
 */
async function handleCreateCanvas(id: string, data: CreateCanvasData) {
    const { imageUrl, size, borderWidth, scale, borderColor = "#FFFFFF" } = data

    // Create offscreen canvas
    const canvas = new OffscreenCanvas(
        size * scale + borderWidth * 2,
        size * scale + borderWidth * 2
    )
    const ctx = canvas.getContext("2d")!

    try {
        // Load image
        const fetchResponse = await fetch(imageUrl)
        if (!fetchResponse.ok) {
            throw new Error(
                `Failed to fetch image: ${fetchResponse.statusText}`
            )
        }

        const blob = await fetchResponse.blob()
        const imageBitmap = await createImageBitmap(blob)

        const finalSize = size * scale

        // Draw white border (circle)
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
            imageBitmap,
            borderWidth,
            borderWidth,
            finalSize,
            finalSize
        )
        ctx.restore()

        // Convert to ImageBitmap for efficient transfer
        const resultBitmap = await createImageBitmap(canvas)

        // Clean up
        imageBitmap.close()

        const workerResponse: CanvasWorkerResponse = {
            id,
            type: "success",
            canvas: resultBitmap
        }

        // Transfer the ImageBitmap
        ;(self as any).postMessage(workerResponse, { transfer: [resultBitmap] })
    } catch (error) {
        throw new Error(
            `Image processing failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        )
    }
}

/**
 * Create fallback circle canvas
 */
async function handleCreateFallback(id: string, data: CreateFallbackData) {
    const { size, color, borderWidth, scale } = data

    const finalSize = size * scale
    const canvas = new OffscreenCanvas(
        finalSize + borderWidth * 2,
        finalSize + borderWidth * 2
    )
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
    ctx.arc(canvas.width / 2, canvas.height / 2, finalSize / 2, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    // Convert to ImageBitmap
    const resultBitmap = await createImageBitmap(canvas)

    const workerResponse: CanvasWorkerResponse = {
        id,
        type: "success",
        canvas: resultBitmap
    }

    ;(self as any).postMessage(workerResponse, { transfer: [resultBitmap] })
}

// Export type definitions for TypeScript
export type {
    CanvasWorkerMessage,
    CanvasWorkerResponse,
    CreateCanvasData,
    CreateFallbackData
}
