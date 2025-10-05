"use client"
import { Calendar } from "lucide-react"

interface OLMapControlsProps {
    onCalendarToggle?: () => void
    showCalendar?: boolean
    className?: string
}

export default function OLMapControls({
    onCalendarToggle,
    showCalendar = false,
    className = "absolute left-4 top-1/2 transform -translate-y-1/2 z-[1000]"
}: OLMapControlsProps) {
    return (
        <div className={className}>
            <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
                {/* Calendar Toggle - if callback is provided */}
                {onCalendarToggle && (
                    <button
                        onClick={onCalendarToggle}
                        className={`p-2 hover:bg-gray-50 transition-colors ${
                            showCalendar
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700"
                        }`}
                        title={showCalendar ? "Hide Calendar" : "Show Calendar"}
                    >
                        <Calendar size={20} />
                    </button>
                )}
            </div>
        </div>
    )
}
