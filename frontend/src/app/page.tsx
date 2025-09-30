"use client"
import dynamic from "next/dynamic"

// Dynamically import the map component to prevent SSR issues with Leaflet
const MyMap = dynamic(() => import("@/components/my-map"), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-full flex items-center justify-center">
            <div className="text-lg">Loading map...</div>
        </div>
    )
})

export default function Home() {
    return (
        <div className="h-full">
            <MyMap />
        </div>
    )
}
