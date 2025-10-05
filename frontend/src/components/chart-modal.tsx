"use client"
import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"

interface ChartModalProps {
    isOpen: boolean
    onClose: () => void
    chartUrls: string[]
    overlayName: string
}

export default function ChartModal({
    isOpen,
    onClose,
    chartUrls,
    overlayName
}: ChartModalProps) {
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
        setCurrentIndex((prev) => (prev + 1) % chartUrls.length)
    }

    const goToPrevious = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + chartUrls.length) % chartUrls.length
        )
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000]">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={24} className="text-blue-600" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Charts for {overlayName}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {currentIndex + 1} of {chartUrls.length}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close (ESC)"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Chart Display Area */}
                <div className="flex-1 flex items-center justify-center p-4 min-h-[400px]">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Previous Button */}
                        {chartUrls.length > 1 && (
                            <button
                                onClick={goToPrevious}
                                className="absolute left-4 z-10 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                                title="Previous chart (←)"
                            >
                                <ChevronLeft
                                    size={24}
                                    className="text-gray-700"
                                />
                            </button>
                        )}

                        {/* Chart Image/GIF */}
                        <div className="max-w-full max-h-full flex items-center justify-center">
                            <img
                                src={chartUrls[currentIndex]}
                                alt={`Chart ${
                                    currentIndex + 1
                                } for ${overlayName}`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                onError={(e) => {
                                    console.error(
                                        "Error loading chart:",
                                        chartUrls[currentIndex]
                                    )
                                    e.currentTarget.src =
                                        "/placeholder-chart.png" // Fallback image
                                }}
                            />
                        </div>

                        {/* Next Button */}
                        {chartUrls.length > 1 && (
                            <button
                                onClick={goToNext}
                                className="absolute right-4 z-10 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                                title="Next chart (→)"
                            >
                                <ChevronRight
                                    size={24}
                                    className="text-gray-700"
                                />
                            </button>
                        )}
                    </div>
                </div>

                {/* Thumbnails/Dots Navigation */}
                {chartUrls.length > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 max-w-full overflow-x-auto">
                            {chartUrls.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                                        index === currentIndex
                                            ? "border-blue-500 shadow-md"
                                            : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    title={`Go to chart ${index + 1}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "/placeholder-chart.png"
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div className="px-4 pb-4 text-center">
                    <p className="text-xs text-gray-500">
                        Use arrow keys or click thumbnails to navigate • ESC to
                        close
                    </p>
                </div>
            </div>
        </div>
    )
}
