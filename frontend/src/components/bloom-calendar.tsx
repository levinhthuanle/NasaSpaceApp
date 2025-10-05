"use client"
import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { Species, Location } from "@/types/api"

interface BloomCalendarProps {
    filteredLocations: Location[]
    onDateSelect: (dates: Date[]) => void
    onLocationFilter?: (locations: Location[], hasDateFilter: boolean) => void
    onClose?: () => void
}

type CalendarView = "month" | "year"

export default function BloomCalendar({
    filteredLocations,
    onDateSelect,
    onLocationFilter,
    onClose
}: BloomCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<Date | null>(null)
    const [calendarView, setCalendarView] = useState<CalendarView>("month")

    // Constants
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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target !== document.body) return // Only when no input is focused

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault()
                    if (calendarView === "month") {
                        navigateMonth("prev")
                    } else {
                        navigateYear("prev")
                    }
                    break
                case "ArrowRight":
                    e.preventDefault()
                    if (calendarView === "month") {
                        navigateMonth("next")
                    } else {
                        navigateYear("next")
                    }
                    break
                case "ArrowUp":
                    e.preventDefault()
                    setCalendarView(calendarView === "month" ? "year" : "month")
                    break
                case "ArrowDown":
                    e.preventDefault()
                    setCalendarView(calendarView === "year" ? "month" : "year")
                    break
                case "Home":
                    e.preventDefault()
                    setCurrentDate(new Date())
                    break
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [calendarView])

    // Parse date string (YYYY-MM-DD) to Date object
    const parseDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split("-").map(Number)
        return new Date(year, month - 1, day)
    }

    // Get bloom status for a specific date at a location
    const getBloomStatusForDate = (
        date: Date,
        location: Location
    ): "none" | "budding" | "blooming" | "peak" | "fading" => {
        const startDate = parseDate(location.bloomingPeriod.start)
        const peakDate = parseDate(location.bloomingPeriod.peak)
        const endDate = parseDate(location.bloomingPeriod.end)

        if (date < startDate || date > endDate) return "none"

        const peakPosition = peakDate.getTime() - startDate.getTime()
        const currentPosition = date.getTime() - startDate.getTime()

        if (Math.abs(date.getTime() - peakDate.getTime()) < 24 * 60 * 60 * 1000)
            return "peak"
        if (currentPosition < peakPosition * 0.3) return "budding"
        if (currentPosition < peakPosition * 0.8) return "blooming"
        if (currentPosition > peakPosition * 1.2) return "fading"
        return "blooming"
    }

    // Get filtered locations blooming on a specific date (chỉ những loài đã lọc)
    const getLocationsForDate = (date: Date): Location[] => {
        return filteredLocations.filter((location) => {
            const status = getBloomStatusForDate(date, location)
            return status !== "none"
        })
    }

    // Get bloom intensity for a date based on number of locations (0-1)
    const getBloomIntensity = (date: Date): number => {
        const bloomingLocations = getLocationsForDate(date)
        if (filteredLocations.length === 0) return 0

        // Calculate intensity based on number of blooming locations
        // More locations = darker color (higher opacity)
        const maxLocations = Math.max(1, filteredLocations.length)
        const intensity = Math.min(1, bloomingLocations.length / maxLocations)

        // Scale intensity for better visual effect
        // Min opacity: 0.1, Max opacity: 0.8
        return intensity === 0 ? 0 : 0.1 + intensity * 0.7
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

    const navigateYear = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            if (direction === "prev") {
                newDate.setFullYear(newDate.getFullYear() - 1)
            } else {
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
            return newDate
        })
    }

    const selectMonth = (monthIndex: number) => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            newDate.setMonth(monthIndex)
            return newDate
        })
        setCalendarView("month")
    }

    // Get calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
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

    // Calculate monthly statistics for year view
    const monthlyStats = useMemo(() => {
        const year = currentDate.getFullYear()
        const months = []

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const monthStart = new Date(year, monthIndex, 1)
            const monthEnd = new Date(year, monthIndex + 1, 0)

            // Count locations that have any blooming period in this month
            const bloomingLocationsCount = filteredLocations.filter(
                (location) => {
                    const startDate = parseDate(location.bloomingPeriod.start)
                    const endDate = parseDate(location.bloomingPeriod.end)

                    // Check if blooming period overlaps with this month
                    return startDate <= monthEnd && endDate >= monthStart
                }
            ).length

            months.push({
                index: monthIndex,
                name: monthNames[monthIndex],
                bloomingCount: bloomingLocationsCount
            })
        }

        return months
    }, [currentDate, filteredLocations, monthNames])

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

        // Filter locations based on selected dates
        if (newSelectedDates.length > 0) {
            const locationsInSelectedDates = filteredLocations.filter(
                (location) => {
                    return newSelectedDates.some((selectedDate) => {
                        const status = getBloomStatusForDate(
                            selectedDate,
                            location
                        )
                        return status !== "none"
                    })
                }
            )
            onLocationFilter?.(locationsInSelectedDates, true)
        } else {
            // No dates selected, show all filtered locations
            onLocationFilter?.(filteredLocations, false)
        }
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

            // Filter locations based on selected dates (for drag selection)
            if (newSelectedDates.length > 0) {
                const locationsInSelectedDates = filteredLocations.filter(
                    (location) => {
                        return newSelectedDates.some((selectedDate) => {
                            const status = getBloomStatusForDate(
                                selectedDate,
                                location
                            )
                            return status !== "none"
                        })
                    }
                )
                onLocationFilter?.(locationsInSelectedDates, true)
            } else {
                // No dates selected, show all filtered locations
                onLocationFilter?.(filteredLocations, false)
            }
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

        // Create a more visible gradient from light to dark based on location count
        // Use different shades of pink/purple for better visibility
        if (intensity <= 0.2) {
            // Very light pink for 1-2 locations
            return `rgba(252, 231, 243, 0.7)` // Pink-50 with opacity
        } else if (intensity <= 0.4) {
            // Light pink for few locations
            return `rgba(251, 207, 232, 0.8)` // Pink-200
        } else if (intensity <= 0.6) {
            // Medium pink for moderate locations
            return `rgba(244, 114, 182, 0.7)` // Pink-400
        } else {
            // Deep pink/purple for many locations
            return `rgba(219, 39, 119, 0.8)` // Pink-600
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-lg border p-4 text-black">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <h3 className="font-bold text-lg">Calendar</h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <button
                        onClick={() =>
                            setCalendarView(
                                calendarView === "month" ? "year" : "month"
                            )
                        }
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <span>{calendarView === "month" ? "📅" : "📆"}</span>
                        <span>
                            {calendarView === "month" ? "Month" : "Year"}
                        </span>
                        <span className="text-gray-500">⇄</span>
                    </button>
                    {selectedDates.length > 0 && (
                        <button
                            onClick={() => {
                                setSelectedDates([])
                                onDateSelect([])
                                onLocationFilter?.(filteredLocations, false)
                            }}
                            className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                            Clear ({selectedDates.length})
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            title="Close calendar"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() =>
                        calendarView === "month"
                            ? navigateMonth("prev")
                            : navigateYear("prev")
                    }
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                    {calendarView === "month" && (
                        <button
                            onClick={() => setCalendarView("year")}
                            className="font-semibold text-lg hover:bg-gray-100 px-3 py-1 rounded transition-colors"
                        >
                            {monthNames[currentDate.getMonth()]}
                        </button>
                    )}
                    <button
                        onClick={() =>
                            setCalendarView(
                                calendarView === "year" ? "month" : "year"
                            )
                        }
                        className="font-semibold text-lg hover:bg-gray-100 px-3 py-1 rounded transition-colors"
                    >
                        {currentDate.getFullYear()}
                    </button>
                </div>

                <button
                    onClick={() =>
                        calendarView === "month"
                            ? navigateMonth("next")
                            : navigateYear("next")
                    }
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Calendar Content */}
            {calendarView === "month" ? (
                <>
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
                            const locationsCount =
                                getLocationsForDate(day).length
                            const isCurrentMonth =
                                day.getMonth() === currentDate.getMonth()
                            const isSelected = isDateSelected(day)
                            const isToday =
                                day.toDateString() === new Date().toDateString()

                            return (
                                <button
                                    key={index}
                                    title={`${day.getDate()} ${day.toLocaleDateString(
                                        "en-US",
                                        { month: "long" }
                                    )} - ${locationsCount} location(s) blooming`}
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
                                    <div className="relative z-10">
                                        {day.getDate()}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </>
            ) : (
                /* Year View - Month Grid */
                <div className="grid grid-cols-3 gap-4">
                    {monthlyStats.map((month) => {
                        const maxLocations = Math.max(
                            ...monthlyStats.map((m) => m.bloomingCount),
                            1
                        )
                        const intensity =
                            maxLocations > 0
                                ? month.bloomingCount / maxLocations
                                : 0
                        const isCurrentMonth =
                            month.index === currentDate.getMonth()
                        const isCurrentRealMonth =
                            month.index === new Date().getMonth() &&
                            currentDate.getFullYear() ===
                                new Date().getFullYear()

                        return (
                            <button
                                key={month.index}
                                onClick={() => selectMonth(month.index)}
                                className={`
                                    relative p-4 rounded-lg text-center transition-all hover:scale-105 border-2
                                    ${
                                        isCurrentMonth
                                            ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                                            : isCurrentRealMonth
                                            ? "border-green-300 bg-green-50"
                                            : "border-transparent hover:bg-gray-50"
                                    }
                                `}
                                style={{
                                    backgroundColor:
                                        isCurrentMonth || isCurrentRealMonth
                                            ? undefined
                                            : getIntensityColor(intensity * 0.6)
                                }}
                                title={`${month.name}: ${month.bloomingCount} species blooming`}
                            >
                                <div
                                    className={`font-medium text-sm mb-1 ${
                                        isCurrentRealMonth
                                            ? "text-green-700"
                                            : ""
                                    }`}
                                >
                                    {month.name}
                                    {isCurrentRealMonth && (
                                        <span className="ml-1 text-green-600">
                                            ●
                                        </span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
