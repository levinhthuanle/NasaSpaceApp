"use client"
import { Plus, Minus, Calendar as CalendarIcon } from "lucide-react"

interface MapControlsProps {
    onZoomIn: () => void
    onZoomOut: () => void
    onToggleCalendar: () => void
    showCalendar: boolean
    className?: string
}

export default function MapControls({
    onZoomIn,
    onZoomOut,
    onToggleCalendar,
    showCalendar,
    className = "absolute left-4 top-1/2 transform -translate-y-1/2 z-[1000] flex flex-col gap-2"
}: MapControlsProps) {
    return (
        <div className={className}>
            {/* Zoom In Button */}
            <button
                onClick={onZoomIn}
                className="w-10 h-10 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Zoom In"
            >
                <Plus size={20} />
            </button>

            {/* Zoom Out Button */}
            <button
                onClick={onZoomOut}
                className="w-10 h-10 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Zoom Out"
            >
                <Minus size={20} />
            </button>

            {/* Calendar Toggle Button */}
            <button
                onClick={onToggleCalendar}
                className={`w-10 h-10 rounded-lg shadow-md transition-colors flex items-center justify-center ${
                    showCalendar
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
                title="Toggle Calendar"
            >
                <CalendarIcon size={18} />
            </button>
        </div>
    )
}
