"use client"
import { useState } from "react"
import { X, MapPin, Save, Flower } from "lucide-react"
import { Species, Location, LocationCreate } from "@/types/api"

interface AddLocationFormProps {
    coordinates: [number, number] // [longitude, latitude]
    allSpecies: Species[]
    onSave: (newLocation: LocationCreate) => void
    onCancel: () => void
    className?: string
}

export default function AddLocationForm({
    coordinates,
    allSpecies,
    onSave,
    onCancel,
    className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-xl border border-gray-300 z-[1200] max-h-[90vh] overflow-y-auto"
}: AddLocationFormProps) {
    const [selectedSpeciesId, setSelectedSpeciesId] = useState<number>(0)
    const [locationName, setLocationName] = useState("")
    const [bloomStart, setBloomStart] = useState("")
    const [bloomPeak, setBloomPeak] = useState("")
    const [bloomEnd, setBloomEnd] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{
        species?: string
        name?: string
        bloomStart?: string
        bloomPeak?: string
        bloomEnd?: string
    }>({})

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!selectedSpeciesId || selectedSpeciesId === 0) {
            newErrors.species = "Vui lòng chọn loài hoa"
        }

        if (!locationName.trim()) {
            newErrors.name = "Vui lòng nhập tên địa điểm"
        }

        if (!bloomStart) {
            newErrors.bloomStart = "Vui lòng nhập thời gian bắt đầu nở hoa"
        }

        if (!bloomPeak) {
            newErrors.bloomPeak = "Vui lòng nhập thời gian nở hoa rộ"
        } else if (bloomStart && new Date(bloomPeak) < new Date(bloomStart)) {
            newErrors.bloomPeak = "Thời gian nở rộ phải sau thời gian bắt đầu"
        }

        if (!bloomEnd) {
            newErrors.bloomEnd = "Vui lòng nhập thời gian kết thúc nở hoa"
        } else if (bloomPeak && new Date(bloomEnd) <= new Date(bloomPeak)) {
            newErrors.bloomEnd = "Thời gian kết thúc phải sau thời gian nở rộ"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const newLocation: Omit<Location, "id"> = {
                speciesId: selectedSpeciesId,
                locationName: locationName.trim(),
                coordinates: coordinates,
                bloomingPeriod: {
                    start: bloomStart,
                    peak: bloomPeak,
                    end: bloomEnd
                }
            }

            await onSave(newLocation)
        } catch (error) {
            console.error("Error saving location:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const selectedSpecies = allSpecies.find(
        (s) => s.speciesId === selectedSpeciesId
    )

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <MapPin className="text-green-500" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Thêm Địa Điểm Mới
                    </h3>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    disabled={isLoading}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Coordinates Display */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tọa độ
                    </label>
                    <p className="text-sm text-gray-600">
                        Vĩ độ: {coordinates[1].toFixed(6)}, Kinh độ:{" "}
                        {coordinates[0].toFixed(6)}
                    </p>
                </div>

                {/* Species Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loài hoa *
                    </label>
                    <select
                        value={selectedSpeciesId}
                        onChange={(e) =>
                            setSelectedSpeciesId(Number(e.target.value))
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            errors.species
                                ? "border-red-500"
                                : "border-gray-300"
                        }`}
                        disabled={isLoading}
                    >
                        <option value={0}>Chọn loài hoa...</option>
                        {allSpecies.map((species) => (
                            <option
                                key={species.speciesId}
                                value={species.speciesId}
                            >
                                {species.name} ({species.scientificName})
                            </option>
                        ))}
                    </select>
                    {errors.species && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.species}
                        </p>
                    )}
                </div>

                {/* Selected Species Preview */}
                {selectedSpecies && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Flower className="text-green-600" size={20} />
                            <div>
                                <p className="font-medium text-green-900">
                                    {selectedSpecies.name}
                                </p>
                                <p className="text-sm text-green-700">
                                    {selectedSpecies.scientificName}
                                </p>
                                {selectedSpecies.color && (
                                    <p className="text-sm text-green-600">
                                        Màu: {selectedSpecies.color}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên địa điểm *
                    </label>
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Ví dụ: Vườn hoa công viên Tao Đàn"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Blooming Period */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                        Thời gian nở hoa
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bắt đầu nở hoa *
                            </label>
                            <input
                                type="date"
                                value={bloomStart}
                                onChange={(e) => setBloomStart(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.bloomStart
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                disabled={isLoading}
                            />
                            {errors.bloomStart && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.bloomStart}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nở hoa rộ *
                            </label>
                            <input
                                type="date"
                                value={bloomPeak}
                                onChange={(e) => setBloomPeak(e.target.value)}
                                min={bloomStart}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.bloomPeak
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                disabled={isLoading}
                            />
                            {errors.bloomPeak && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.bloomPeak}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kết thúc nở hoa *
                            </label>
                            <input
                                type="date"
                                value={bloomEnd}
                                onChange={(e) => setBloomEnd(e.target.value)}
                                min={bloomPeak}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.bloomEnd
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                disabled={isLoading}
                            />
                            {errors.bloomEnd && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.bloomEnd}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        <Save size={16} />
                        <span>
                            {isLoading ? "Đang lưu..." : "Lưu địa điểm"}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    )
}
