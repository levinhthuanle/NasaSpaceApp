/**
 * Species API Service
 * Handles species data, locations, and flower information
 */

import { SpeciesData, SpeciesGroup, PinnedSpecies } from "@/types/api"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_ENDPOINTS = {
    species: "/api/species",
    speciesById: "/api/species/{id}",
    speciesGroup: "/api/species/group",
    nearbySpecies: "/api/species/nearby"
}

/**
 * Get all species data
 */
export async function getAllSpecies(): Promise<SpeciesData[]> {
    try {
        // For development, using mock implementation
        return await mockGetAllSpecies()
        
        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.species}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.species || []
        */
    } catch (error) {
        console.error('Error fetching species:', error)
        return []
    }
}

/**
 * Get species by ID
 */
export async function getSpeciesById(id: number): Promise<SpeciesData | null> {
    try {
        // For development, using mock implementation
        return await mockGetSpeciesById(id)
        
        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.speciesById.replace('{id}', id.toString())}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.species || null
        */
    } catch (error) {
        console.error('Error fetching species by ID:', error)
        return null
    }
}

/**
 * Get species grouped by name
 */
export async function getSpeciesGroups(): Promise<SpeciesGroup[]> {
    try {
        // For development, using mock implementation
        return await mockGetSpeciesGroups()
        
        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.speciesGroup}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.groups || []
        */
    } catch (error) {
        console.error('Error fetching species groups:', error)
        return []
    }
}

/**
 * Get nearby species by coordinates
 */
export async function getNearbySpecies(
    latitude: number, 
    longitude: number, 
    radius: number = 50
): Promise<SpeciesData[]> {
    try {
        // For development, using mock implementation
        return await mockGetNearbySpecies(latitude, longitude, radius)
        
        // Production implementation (uncomment when backend is ready):
        /*
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.nearbySpecies}?lat=${latitude}&lng=${longitude}&radius=${radius}`
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.species || []
        */
    } catch (error) {
        console.error('Error fetching nearby species:', error)
        return []
    }
}

// Mock implementations for development
async function mockGetAllSpecies(): Promise<SpeciesData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return generateMockSpecies()
}

async function mockGetSpeciesById(id: number): Promise<SpeciesData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const allSpecies = generateMockSpecies()
    return allSpecies.find(species => species.id === id) || null
}

async function mockGetSpeciesGroups(): Promise<SpeciesGroup[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const allSpecies = generateMockSpecies()
    const groups: { [key: string]: SpeciesData[] } = {}
    
    // Group species by name
    allSpecies.forEach(species => {
        if (!groups[species.name]) {
            groups[species.name] = []
        }
        groups[species.name].push(species)
    })
    
    // Convert to SpeciesGroup format
    return Object.entries(groups).map(([name, locations]) => ({
        name,
        scientificName: locations[0].scientificName,
        locations,
        totalLocations: locations.length,
        averageBloomProbability: Math.round(
            locations.reduce((sum, loc) => sum + loc.bloomProbability, 0) / locations.length
        ),
        imageUrl: locations[0].imageUrl
    }))
}

async function mockGetNearbySpecies(
    latitude: number, 
    longitude: number, 
    radius: number
): Promise<SpeciesData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const allSpecies = generateMockSpecies()
    
    // Simple distance calculation (for demo purposes)
    return allSpecies.filter(species => {
        const distance = calculateDistance(
            latitude, longitude,
            species.location[1], species.location[0]
        )
        return distance <= radius
    })
}

function generateMockSpecies(): SpeciesData[] {
    const vietnamFlowers = [
        {
            name: "Hoa Anh Đào",
            scientificName: "Prunus serrulata",
            locations: [
                [106.6297, 10.8231], // Ho Chi Minh City
                [105.8542, 21.0285], // Hanoi
                [108.2022, 16.0471]  // Da Nang
            ],
            locationNames: ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
            color: "Hồng, trắng",
            habitat: "Vườn công viên, khu đô thị",
            characteristics: "Cánh hoa 5 lá, mọc thành chùm, có mùi thơm nhẹ"
        },
        {
            name: "Hoa Ban",
            scientificName: "Bauhinia variegata",
            locations: [
                [103.9156, 22.4856], // Dien Bien
                [104.9784, 21.5805], // Son La
                [103.0138, 21.5613]  // Lai Chau
            ],
            locationNames: ["Điện Biên", "Sơn La", "Lai Châu"],
            color: "Trắng, tím nhạt",
            habitat: "Vùng núi cao, khí hậu ôn đới",
            characteristics: "Hoa có 5 cánh, hình bướm, lá hình tim"
        },
        {
            name: "Hoa Đỗ Quyên",
            scientificName: "Rhododendron simsii",
            locations: [
                [103.8439, 22.3363], // Sa Pa
                [105.3381, 21.4657], // Tam Dao
                [108.9935, 11.9404]  // Da Lat
            ],
            locationNames: ["Sa Pa", "Tam Đảo", "Đà Lạt"],
            color: "Đỏ, hồng, trắng",
            habitat: "Vùng núi cao, khí hậu mát mẻ",
            characteristics: "Hoa có 5 cánh, lá dày và bóng"
        },
        {
            name: "Hoa Sen",
            scientificName: "Nelumbo nucifera",
            locations: [
                [105.8542, 21.0285], // West Lake, Hanoi
                [106.7017, 10.7769], // Ho Chi Minh City
                [105.7563, 10.0452]  // Can Tho
            ],
            locationNames: ["Hồ Tây, Hà Nội", "TP. Hồ Chí Minh", "Cần Thơ"],
            color: "Hồng, trắng",
            habitat: "Ao hồ, đầm lầy",
            characteristics: "Hoa lớn, nhiều cánh, lá tròn nổi trên mặt nước"
        },
        {
            name: "Hoa Phượng Vĩ",
            scientificName: "Delonix regia",
            locations: [
                [106.6297, 10.8231], // Ho Chi Minh City
                [108.2022, 16.0471], // Da Nang
                [109.1967, 12.2585]  // Nha Trang
            ],
            locationNames: ["TP. Hồ Chí Minh", "Đà Nẵng", "Nha Trang"],
            color: "Đỏ cam, vàng",
            habitat: "Khu đô thị, công viên, đường phố",
            characteristics: "Hoa có 4 cánh đỏ và 1 cánh có đốm, lá kép lông chim"
        },
        {
            name: "Hoa Mai Vàng",
            scientificName: "Ochna integerrima",
            locations: [
                [106.6297, 10.8231], // Ho Chi Minh City
                [105.7563, 10.0452], // Can Tho
                [106.3639, 9.3019]   // My Tho
            ],
            locationNames: ["TP. Hồ Chí Minh", "Cần Thơ", "Mỹ Tho"],
            color: "Vàng",
            habitat: "Miền Nam Việt Nam, vùng đồng bằng",
            characteristics: "Hoa 5 cánh màu vàng, lá bầu dục, cành dẻo"
        }
    ]

    const mockSpecies: SpeciesData[] = []
    let idCounter = 1

    vietnamFlowers.forEach(flower => {
        flower.locations.forEach((location, index) => {
            mockSpecies.push({
                id: idCounter++,
                name: flower.name,
                scientificName: flower.scientificName,
                location: location as [number, number],
                locationName: flower.locationNames[index],
                bloomingPeriod: generateBloomingPeriod(flower.name),
                bloomProbability: Math.floor(Math.random() * 30) + 70, // 70-100%
                description: generateDescription(flower.name),
                imageUrl: generateImageUrl(flower.name),
                bloomTime: generateBloomTime(flower.name),
                color: flower.color,
                habitat: flower.habitat,
                characteristics: flower.characteristics
            })
        })
    })

    return mockSpecies
}

function generateBloomingPeriod(flowerName: string) {
    const periods = {
        "Hoa Anh Đào": { start: "March", peak: "April", end: "May" },
        "Hoa Ban": { start: "February", peak: "March", end: "April" },
        "Hoa Đỗ Quyên": { start: "February", peak: "March", end: "April" },
        "Hoa Sen": { start: "June", peak: "July", end: "September" },
        "Hoa Phượng Vĩ": { start: "May", peak: "June", end: "August" },
        "Hoa Mai Vàng": { start: "January", peak: "February", end: "March" }
    }
    
    return periods[flowerName as keyof typeof periods] || { start: "March", peak: "April", end: "May" }
}

function generateBloomTime(flowerName: string): string {
    const times = {
        "Hoa Anh Đào": "Tháng 3-5",
        "Hoa Ban": "Tháng 2-4", 
        "Hoa Đỗ Quyên": "Tháng 2-4",
        "Hoa Sen": "Tháng 6-9",
        "Hoa Phượng Vĩ": "Tháng 5-8",
        "Hoa Mai Vàng": "Tháng 1-3"
    }
    
    return times[flowerName as keyof typeof times] || "Tháng 3-5"
}

function generateDescription(flowerName: string): string {
    const descriptions = {
        "Hoa Anh Đào": "Biểu tượng của mùa xuân với sắc hồng dịu dàng, thường nở rộ trong các công viên và khu đô thị.",
        "Hoa Ban": "Loài hoa đặc trưng của vùng Tây Bắc, nở trắng muốt trên những cành cây cao, báo hiệu mùa xuân về.",
        "Hoa Đỗ Quyên": "Nổi tiếng với màu đỏ rực rỡ, thường nở trên những sườn núi cao vào đầu năm.",
        "Hoa Sen": "Quốc hoa Việt Nam với vẻ đẹp thanh khiết, nở trên mặt nước trong mùa hè.",
        "Hoa Phượng Vĩ": "Được mệnh danh là 'nữ hoàng của các loài hoa', nở rực rỡ trong mùa hè.",
        "Hoa Mai Vàng": "Biểu tượng của Tết Nguyên Đán miền Nam với màu vàng rực rỡ."
    }
    
    return descriptions[flowerName as keyof typeof descriptions] || "Một loài hoa đẹp của Việt Nam."
}

function generateImageUrl(flowerName: string): string {
    // Using placeholder images for demo
    const imageMap = {
        "Hoa Anh Đào": "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop",
        "Hoa Ban": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop",
        "Hoa Đỗ Quyên": "https://images.unsplash.com/photo-1583532452513-a02186582ccd?w=400&h=300&fit=crop",
        "Hoa Sen": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=300&fit=crop",
        "Hoa Phượng Vĩ": "https://images.unsplash.com/photo-1597848212624-e593dc1bf2eb?w=400&h=300&fit=crop",
        "Hoa Mai Vàng": "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop"
    }
    
    return imageMap[flowerName as keyof typeof imageMap] || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in kilometers
    return distance
}