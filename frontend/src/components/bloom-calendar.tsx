"use client"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react"
import { SpeciesData } from "@/types/api"

interface BloomCalendarProps {
    flowerData: SpeciesData[]
    onDateSelect?: (date: Date) => void
    onFlowerFilter?: (flowers: SpeciesData[]) => void
}

export default function BloomCalendar({
    flowerData,
    onDateSelect,
    onFlowerFilter
}: BloomCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [viewMode, setViewMode] = useState<"calendar" | "timeline">(
        "calendar"
    )

    // Parse date string (DD/MM/YYYY) to Date object
    const parseDate = (dateStr: string): Date => {
        const [day, month, year] = dateStr.split("/").map(Number)
        return new Date(year, month - 1, day)
    }

    // Get bloom status for a specific date
    const getBloomStatusForDate = (
        date: Date,
        flower: SpeciesData
    ): "none" | "budding" | "blooming" | "peak" | "fading" => {
        const startDate = parseDate(flower.bloomingPeriod.start)
        const peakDate = parseDate(flower.bloomingPeriod.peak)
        const endDate = parseDate(flower.bloomingPeriod.end)

        if (date < startDate || date > endDate) return "none"

        const totalDuration = endDate.getTime() - startDate.getTime()
        const peakPosition = peakDate.getTime() - startDate.getTime()
        const currentPosition = date.getTime() - startDate.getTime()

        if (Math.abs(date.getTime() - peakDate.getTime()) < 24 * 60 * 60 * 1000)
            return "peak"
        if (currentPosition < peakPosition * 0.3) return "budding"
        if (currentPosition < peakPosition * 0.8) return "blooming"
        if (currentPosition > peakPosition * 1.2) return "fading"
        return "blooming"
    }

    // Get flowers blooming on a specific date
    const getFlowersForDate = (date: Date): SpeciesData[] => {
        return flowerData.filter((flower) => {
            const status = getBloomStatusForDate(date, flower)
            return status !== "none"
        })
    }

    // Get bloom intensity for a date (0-100)
    const getBloomIntensity = (date: Date): number => {
        const bloomingFlowers = getFlowersForDate(date)
        if (flowerData.length === 0) return 0

        return Math.min(100, bloomingFlowers.length / flowerData.length)
    }

    // Calendar navigation
    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            if (direction === "prev") {
                newDate.setMonth(newDate.getMonth() - 1)
            } else {
                newDate.setMonth(newDate.getMonth() + 1)
            }
            return newDate
        })
    }

    // Get calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())

        const days = []
        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
        return days
    }, [currentDate])

    // Handle date selection
    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        onDateSelect?.(date)
        const flowersOnDate = getFlowersForDate(date)
        onFlowerFilter?.(flowersOnDate)
    }

    // Get intensity color - single pink color with varying opacity
    const getIntensityColor = (intensity: number): string => {
        if (intensity === 0) return "transparent"

        // Use a single pink color (255, 105, 180) with varying opacity based on intensity
        const opacity = Math.max(0.1, intensity)
        return `rgba(255, 105, 180, ${opacity})`
    }

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className="bg-white rounded-lg shadow-lg border p-4 text-black">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <h3 className="font-bold text-lg">Bloom Calendar</h3>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <h4 className="font-semibold text-lg">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                </h4>
                <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-600 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const intensity = getBloomIntensity(day)
                    const flowersCount = getFlowersForDate(day).length
                    const isCurrentMonth =
                        day.getMonth() === currentDate.getMonth()
                    const isSelected =
                        selectedDate &&
                        day.toDateString() === selectedDate.toDateString()
                    const isToday =
                        day.toDateString() === new Date().toDateString()

                    return (
                        <button
                            key={index}
                            onClick={() => handleDateClick(day)}
                            className={`
                                        relative h-10 rounded text-xs font-medium transition-all hover:scale-105
                                        ${isToday ? "ring-1 ring-blue-200" : ""}
                                        ${
                                            isCurrentMonth
                                                ? "text-gray-900"
                                                : "text-gray-400"
                                        }
                                        ${
                                            isSelected
                                                ? "ring-2 ring-blue-500"
                                                : ""
                                        }
                                        ${
                                            !isToday && !isSelected
                                                ? "hover:bg-gray-100"
                                                : ""
                                        }
                                    `}
                            style={{
                                backgroundColor: getIntensityColor(intensity)
                            }}
                        >
                            <div className="relative z-10">{day.getDate()}</div>
                        </button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t">
                <h5 className="text-xs font-medium text-gray-600 mb-2">
                    Bloom Intensity
                </h5>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 rounded"
                            style={{
                                backgroundColor: "rgba(255, 105, 180, 0.2)"
                            }}
                        ></div>
                        <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 rounded"
                            style={{
                                backgroundColor: "rgba(255, 105, 180, 0.4)"
                            }}
                        ></div>
                        <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 rounded"
                            style={{
                                backgroundColor: "rgba(255, 105, 180, 0.7)"
                            }}
                        ></div>
                        <span>High</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 rounded"
                            style={{
                                backgroundColor: "rgba(255, 105, 180, 1.0)"
                            }}
                        ></div>
                        <span>Peak</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
