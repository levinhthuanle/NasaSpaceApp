"use client"
import { useState, useEffect } from "react"
import {
    X,
    MapPin,
    Flower,
    Star,
    MessageCircle,
    Camera,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { UserReview, ReviewStats, Species, Location } from "@/types/api"
import { getReviews, getReviewStats } from "@/services/review-api"
import ReviewForm from "./review-form"

// Component props interface
interface MarkerDetailPanelProps {
    species: Species | null
    location: Location | null
    onClose: () => void
    className?: string
}

export default function MarkerDetailPanel({
    species,
    location,
    onClose,
    className = "fixed top-4 right-4 w-88 bg-white rounded-lg shadow-lg border border-gray-300 z-[1100] max-h-[90vh] overflow-y-auto"
}: MarkerDetailPanelProps) {
    if (!species || !location) return null

    // Default bloom probability (can be enhanced with real data later)
    const bloomProbability = 80

    // Review system state
    const [reviews, setReviews] = useState<UserReview[]>([])
    const [reviewStats, setReviewStats] = useState<ReviewStats>({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    })
    const [reviewsLoading, setReviewsLoading] = useState(true)
    const [showAllReviews, setShowAllReviews] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)

    // Load review data
    useEffect(() => {
        const loadReviews = async () => {
            try {
                setReviewsLoading(true)

                // Generate locationId from coordinates (same as bloom prediction)
                const locationId = location.id

                const [reviewsData, statsData] = await Promise.all([
                    getReviews(species.speciesId, locationId),
                    getReviewStats(species.speciesId, locationId)
                ])

                setReviews(reviewsData)
                setReviewStats(statsData)
            } catch (err) {
                console.error("Failed to load reviews:", err)
            } finally {
                setReviewsLoading(false)
            }
        }

        loadReviews()
    }, [species.speciesId, location.id])

    // Function to refresh reviews after submission
    const refreshReviews = async () => {
        const locationId = location.id

        const [reviewsData, statsData] = await Promise.all([
            getReviews(species.speciesId, locationId),
            getReviewStats(species.speciesId, locationId)
        ])

        setReviews(reviewsData)
        setReviewStats(statsData)
    }

    // Helper function to render star rating
    const renderStars = (rating: number, size = 16) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                size={size}
                className={`${
                    index < rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                }`}
            />
        ))
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                        {species.name}
                    </h3>
                    <p className="text-sm text-gray-600 italic">
                        {species.scientificName}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>
                            {location.coordinates[1].toFixed(4)},{" "}
                            {location.coordinates[0].toFixed(4)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close panel"
                >
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Species Image */}
            {species.imageUrl && (
                <div className="p-4 border-b border-gray-200">
                    <img
                        src={species.imageUrl}
                        alt={species.name}
                        className="w-full h-48 object-cover rounded-lg"
                    />
                </div>
            )}

            {/* Species Info */}
            <div className="p-4 border-b border-gray-200">
                <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Bloom Time:</span>
                        <p className="font-medium">
                            {species.bloomTime ||
                                `${location.bloomingPeriod.start} - ${location.bloomingPeriod.end}`}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium">{location.locationName}</p>
                    </div>

                    {species.color && (
                        <div>
                            <span className="text-gray-500">Flower Color:</span>
                            <p className="font-medium">{species.color}</p>
                        </div>
                    )}

                    {species.habitat && (
                        <div>
                            <span className="text-gray-500">Habitat:</span>
                            <p className="font-medium">{species.habitat}</p>
                        </div>
                    )}

                    <div>
                        <span className="text-gray-500">Description:</span>
                        <p className="font-medium">{species.description}</p>
                    </div>

                    {species.characteristics && (
                        <div>
                            <span className="text-gray-500">
                                Characteristics:
                            </span>
                            <p className="font-medium">
                                {species.characteristics}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews & Ratings Section */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <Star
                        size={18}
                        className="text-yellow-500 fill-yellow-500"
                    />
                    <h4 className="font-semibold text-gray-900">
                        Reviews & Ratings
                    </h4>
                </div>

                {reviewsLoading ? (
                    <div className="text-center py-4">
                        <div className="text-gray-500">Loading reviews...</div>
                    </div>
                ) : (
                    <>
                        {/* Review Stats Summary */}
                        {reviewStats.totalReviews > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900">
                                            {reviewStats.averageRating.toFixed(
                                                1
                                            )}
                                        </span>
                                        <div className="flex">
                                            {renderStars(
                                                Math.round(
                                                    reviewStats.averageRating
                                                ),
                                                16
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {reviewStats.totalReviews} review
                                        {reviewStats.totalReviews !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </div>

                                {/* Rating Distribution */}
                                <div className="space-y-1">
                                    {[5, 4, 3, 2, 1].map((rating) => {
                                        const count =
                                            reviewStats.ratingDistribution[
                                                rating as keyof typeof reviewStats.ratingDistribution
                                            ]
                                        const percentage =
                                            reviewStats.totalReviews > 0
                                                ? (count /
                                                      reviewStats.totalReviews) *
                                                  100
                                                : 0
                                        return (
                                            <div
                                                key={rating}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span className="w-3 text-gray-600">
                                                    {rating}
                                                </span>
                                                <Star
                                                    size={12}
                                                    className="text-yellow-400 fill-yellow-400"
                                                />
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-yellow-400 h-1.5 rounded-full transition-all"
                                                        style={{
                                                            width: `${percentage}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-6 text-gray-500">
                                                    {count}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Recent Reviews */}
                        {reviews.length > 0 ? (
                            <div className="space-y-3">
                                <h5 className="font-medium text-gray-800">
                                    Recent Reviews
                                </h5>

                                {/* Show first 2 reviews or all if showAllReviews is true */}
                                {(showAllReviews
                                    ? reviews
                                    : reviews.slice(0, 2)
                                ).map((review) => (
                                    <div
                                        key={review.id}
                                        className="border-l-2 border-blue-200 pl-3 py-2"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {review.userAvatar && (
                                                    <img
                                                        src={review.userAvatar}
                                                        alt={review.userName}
                                                        className="w-6 h-6 rounded-full"
                                                    />
                                                )}
                                                <span className="font-medium text-sm text-gray-900">
                                                    {review.userName}
                                                </span>
                                                {review.isVerified && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {renderStars(review.rating, 12)}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700 mb-2">
                                            {review.comment}
                                        </p>

                                        {/* Review Images */}
                                        {review.images.length > 0 && (
                                            <div className="flex gap-2 mb-2">
                                                {review.images
                                                    .slice(0, 3)
                                                    .map((image) => (
                                                        <img
                                                            key={image.id}
                                                            src={
                                                                image.thumbnailUrl
                                                            }
                                                            alt="Review"
                                                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                                                            onClick={() =>
                                                                window.open(
                                                                    image.url,
                                                                    "_blank"
                                                                )
                                                            }
                                                        />
                                                    ))}
                                                {review.images.length > 3 && (
                                                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                                        +
                                                        {review.images.length -
                                                            3}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                Visited:{" "}
                                                {formatDate(review.visitDate)}
                                            </span>
                                            <span>
                                                {formatDate(review.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Show More/Less Button */}
                                {reviews.length > 2 && (
                                    <button
                                        onClick={() =>
                                            setShowAllReviews(!showAllReviews)
                                        }
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {showAllReviews ? (
                                            <>
                                                <ChevronUp size={16} />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} />
                                                Show All {reviews.length}{" "}
                                                Reviews
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <MessageCircle
                                    size={24}
                                    className="mx-auto mb-2 opacity-50"
                                />
                                <p>No reviews yet</p>
                                <p className="text-sm">
                                    Be the first to share your experience!
                                </p>
                            </div>
                        )}

                        {/* Add Review Button/Form */}
                        {!showReviewForm ? (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Camera size={16} />
                                    Add Your Review
                                </button>
                            </div>
                        ) : (
                            <ReviewForm
                                speciesId={species.speciesId}
                                locationId={location.id}
                                onClose={() => setShowReviewForm(false)}
                                onSubmitted={refreshReviews}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
