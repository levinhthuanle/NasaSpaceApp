"use client"
import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react"
import { SpeciesData } from "@/types/api"

interface BloomCalendarProps {
    flowerData: SpeciesData[]
    onDateSelect: (dates: Date[]) => void
    onFlowerFilter: (flowers: SpeciesData[]) => void
    onClearFilter: () => void
}

export default function BloomCalendar({
    flowerData,
    onDateSelect,
    onFlowerFilter,
    onClearFilter
}: BloomCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<Date | null>(null)

    // Handle global mouse up to end drag selection
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false)
                setDragStart(null)
            }
        }

        document.addEventListener("mouseup", handleGlobalMouseUp)
        return () =>
            document.removeEventListener("mouseup", handleGlobalMouseUp)
    }, [isDragging])

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

    // Handle date selection with toggle support - click to select/deselect
    const handleDateClick = (date: Date) => {
        let newSelectedDates: Date[]

        // Check if date is already selected
        const existingIndex = selectedDates.findIndex(
            (d) => d.toDateString() === date.toDateString()
        )

        if (existingIndex >= 0) {
            // Date is selected: remove it (deselect)
            newSelectedDates = selectedDates.filter(
                (_, i) => i !== existingIndex
            )
        } else {
            // Date not selected: add it (select)
            newSelectedDates = [...selectedDates, date]
        }

        setSelectedDates(newSelectedDates)
        onDateSelect(newSelectedDates)

        // Filter flowers based on all selected dates
        const allFlowers = newSelectedDates.flatMap((d) => getFlowersForDate(d))
        const uniqueFlowers = allFlowers.filter(
            (flower, index, arr) =>
                arr.findIndex((f) => f.id === flower.id) === index
        )
        onFlowerFilter?.(uniqueFlowers)
    }

    // Handle mouse down for drag selection
    const handleMouseDown = (date: Date) => {
        setIsDragging(true)
        setDragStart(date)
        handleDateClick(date)
    }

    // Handle mouse enter during drag
    const handleMouseEnter = (date: Date) => {
        if (isDragging && dragStart) {
            // Create range from dragStart to current date
            const startDate = new Date(
                Math.min(dragStart.getTime(), date.getTime())
            )
            const endDate = new Date(
                Math.max(dragStart.getTime(), date.getTime())
            )

            const newSelectedDates = [...selectedDates]
            const current = new Date(startDate)

            while (current <= endDate) {
                const existingIndex = newSelectedDates.findIndex(
                    (d) => d.toDateString() === current.toDateString()
                )
                if (existingIndex < 0) {
                    newSelectedDates.push(new Date(current))
                }
                current.setDate(current.getDate() + 1)
            }

            setSelectedDates(newSelectedDates)
            onDateSelect(newSelectedDates)

            // Filter flowers for the range
            const allFlowers = newSelectedDates.flatMap((d) =>
                getFlowersForDate(d)
            )
            const uniqueFlowers = allFlowers.filter(
                (flower, index, arr) =>
                    arr.findIndex((f) => f.id === flower.id) === index
            )
            onFlowerFilter(uniqueFlowers)
        }
    }

    // Handle mouse up to end drag
    const handleMouseUp = () => {
        setIsDragging(false)
        setDragStart(null)
    }

    // Check if date is selected
    const isDateSelected = (date: Date): boolean => {
        return selectedDates.some(
            (d) => d.toDateString() === date.toDateString()
        )
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
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <h3 className="font-bold text-lg">Bloom Calendar</h3>
                </div>
                {selectedDates.length > 0 && (
                    <button
                        onClick={() => {
                            setSelectedDates([])
                            onDateSelect([])
                            onFlowerFilter?.(flowerData)
                            onClearFilter?.()
                        }}
                        className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        Clear ({selectedDates.length})
                    </button>
                )}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-2">
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
            <div className="grid grid-cols-7 gap-1 mb-1">
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
                    const isSelected = isDateSelected(day)
                    const isToday =
                        day.toDateString() === new Date().toDateString()

                    return (
                        <button
                            key={index}
                            // onClick={() => handleDateClick(day)}
                            onMouseDown={() => handleMouseDown(day)}
                            onMouseEnter={() => handleMouseEnter(day)}
                            onMouseUp={handleMouseUp}
                            className={`
                                        relative h-10 rounded text-xs font-medium transition-all hover:scale-105 select-none
                                        ${isToday ? "ring-1 ring-blue-200" : ""}
                                        ${
                                            isCurrentMonth
                                                ? "text-gray-900"
                                                : "text-gray-400"
                                        }
                                        ${
                                            isSelected
                                                ? "ring-2 ring-blue-500 bg-blue-100"
                                                : ""
                                        }
                                        ${
                                            !isToday && !isSelected
                                                ? "hover:bg-gray-100"
                                                : ""
                                        }
                                        ${
                                            isDragging
                                                ? "cursor-grabbing"
                                                : "cursor-pointer"
                                        }
                                    `}
                            style={{
                                backgroundColor: isSelected
                                    ? undefined
                                    : getIntensityColor(intensity)
                            }}
                        >
                            <div className="relative z-10">{day.getDate()}</div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
