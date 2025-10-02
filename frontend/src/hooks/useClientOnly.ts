/**
 * Hook to ensure code only runs on client side
 */
import { useEffect, useState } from "react"

export function useClientOnly() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return isClient
}
