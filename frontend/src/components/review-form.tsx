"use client"
import { useState, useRef } from "react"
import { Star, Camera, X, Upload, Check } from "lucide-react"
import { ReviewSubmission } from "@/types/api"
import { submitReview, uploadReviewImages } from "@/services/review-api"

interface ReviewFormProps {
    speciesId: number
    locationId: number
    onClose: () => void
    onSubmitted: () => void
    className?: string
}

export default function ReviewForm({
    speciesId,
    locationId,
    onClose,
    onSubmitted,
    className = "bg-white border border-gray-200 rounded-lg p-4 mt-3"
}: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [userName, setUserName] = useState("")
    const [comment, setComment] = useState("")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle star rating click
    const handleStarClick = (starRating: number) => {
        setRating(starRating)
    }

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        addFiles(files)
    }

    // Add files with validation
    const addFiles = (files: File[]) => {
        const validFiles = files.filter((file) => {
            // Validate file type (images only)
            if (!file.type.startsWith("image/")) {
                alert(`${file.name} is not a valid image file`)
                return false
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large. Maximum size is 5MB`)
                return false
            }

            return true
        })

        if (selectedFiles.length + validFiles.length > 5) {
            alert("Maximum 5 images allowed")
            return
        }

        const newFiles = [...selectedFiles, ...validFiles]
        setSelectedFiles(newFiles)

        // Create previews
        const newPreviews = [...previews]
        validFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                newPreviews.push(e.target?.result as string)
                if (newPreviews.length === newFiles.length) {
                    setPreviews(newPreviews)
                }
            }
            reader.readAsDataURL(file)
        })
    }

    // Remove file
    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)
        setSelectedFiles(newFiles)
        setPreviews(newPreviews)
    }

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const files = Array.from(e.dataTransfer.files)
        addFiles(files)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            alert("Please select a rating")
            return
        }

        if (!userName.trim()) {
            alert("Please enter your name")
            return
        }

        if (!comment.trim()) {
            alert("Please add a comment")
            return
        }

        setIsSubmitting(true)

        try {
            const reviewData: ReviewSubmission = {
                speciesId,
                locationId,
                userName: userName.trim(),
                rating,
                comment: comment.trim(),
                images: selectedFiles
            }

            const result = await submitReview(reviewData)

            if (result.success) {
                setSubmitSuccess(true)
                setTimeout(() => {
                    onSubmitted()
                    onClose()
                }, 1500)
            } else {
                alert(result.message || "Failed to submit review")
            }
        } catch (error) {
            console.error("Error submitting review:", error)
            alert("Failed to submit review. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitSuccess) {
        return (
            <div className={className}>
                <div className="text-center py-6">
                    <Check size={48} className="text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Review Submitted!
                    </h3>
                    <p className="text-gray-600">
                        Thank you for sharing your experience
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Add Your Review</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating *
                    </label>
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, index) => {
                            const starValue = index + 1
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleStarClick(starValue)}
                                    onMouseEnter={() =>
                                        setHoveredRating(starValue)
                                    }
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 hover:scale-110 transition-transform"
                                >
                                    <Star
                                        size={24}
                                        className={`${
                                            starValue <=
                                            (hoveredRating || rating)
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                        } transition-colors`}
                                    />
                                </button>
                            )
                        })}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent"}
                        </p>
                    )}
                </div>

                {/* User Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={50}
                        required
                    />
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Experience *
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share details about your visit, the flowers, accessibility, best viewing spots..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        maxLength={1000}
                        required
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                        {comment.length}/1000 characters
                    </div>
                </div>

                {/* Image Upload
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos (Optional)
                    </label>

                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors"
                    >
                        <Camera
                            size={32}
                            className="mx-auto text-gray-400 mb-2"
                        />
                        <p className="text-sm text-gray-600 mb-2">
                            Drag & drop photos here or
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            browse files
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                            Max 5 images, 5MB each. JPG, PNG, WEBP
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div> */}

                {/* Submit Button */}
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            rating === 0 ||
                            !userName.trim() ||
                            !comment.trim()
                        }
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Submit Review
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
