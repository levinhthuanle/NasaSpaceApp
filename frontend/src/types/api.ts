export interface SpeciesData {
    id: number
    name: string
    scientificName: string
    location: [number, number]
    locationName: string
    bloomingPeriod: {
        start: string
        peak: string
        end: string
    }
    bloomProbability: number
    description: string
    imageUrl: string
}
