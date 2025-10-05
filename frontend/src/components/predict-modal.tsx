"use client"
import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"

interface PredictModalProps {
    isOpen: boolean
    onClose: () => void
    predictUrls: string[]
    overlayName: string
}

export default function PredictModal({
    isOpen,
    onClose,
    predictUrls,
    overlayName
}: PredictModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    // Reset index when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0)
        }
    }, [isOpen])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!isOpen) return

            switch (event.key) {
                case "Escape":
                    onClose()
                    break
                case "ArrowLeft":
                    goToPrevious()
                    break
                case "ArrowRight":
                    goToNext()
                    break
            }
        }

        document.addEventListener("keydown", handleKeyPress)
        return () => document.removeEventListener("keydown", handleKeyPress)
    }, [isOpen, currentIndex])

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % predictUrls.length)
    }

    const goToPrevious = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + predictUrls.length) % predictUrls.length
        )
    }

    const handleThumbnailClick = (index: number) => {
        setCurrentIndex(index)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement
        img.src = "/placeholder-prediction.svg" // Fallback image
    }

    if (!isOpen || !predictUrls.length) return null

    const currentUrl = predictUrls[currentIndex]

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Predictions - {overlayName}
                        </h2>
                        <span className="text-sm text-gray-500">
                            ({currentIndex + 1} of {predictUrls.length})
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    {/* Main Prediction Display */}
                    <div className="relative flex-1 flex items-center justify-center bg-gray-50 rounded-lg mb-4 min-h-[400px]">
                        <img
                            src={currentUrl}
                            alt={`Prediction ${
                                currentIndex + 1
                            } for ${overlayName}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onError={handleImageError}
                        />

                        {/* Navigation Arrows */}
                        {predictUrls.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                                    aria-label="Previous prediction"
                                >
                                    <ChevronLeft
                                        size={24}
                                        className="text-gray-700"
                                    />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                                    aria-label="Next prediction"
                                >
                                    <ChevronRight
                                        size={24}
                                        className="text-gray-700"
                                    />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Navigation */}
                    {predictUrls.length > 1 && (
                        <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                            {predictUrls.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleThumbnailClick(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        index === currentIndex
                                            ? "border-purple-500 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <img
                                        src={url}
                                        alt={`Prediction ${
                                            index + 1
                                        } thumbnail`}
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <div className="text-center text-sm text-gray-600">
                        <p>
                            Use arrow keys or click thumbnails to navigate •
                            Press Esc to close
                        </p>
                        {predictUrls.length > 1 && (
                            <p className="mt-1">
                                Showing prediction {currentIndex + 1} of{" "}
                                {predictUrls.length}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
