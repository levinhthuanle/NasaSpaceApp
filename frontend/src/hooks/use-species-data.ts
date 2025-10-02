import { useState, useMemo } from "react"
import { SpeciesData, SpeciesGroup, PinnedSpecies } from "@/types/api"

// Mock data for species - Expanded with multiple locations per species
// convert to [long, lat] format
const mockSpeciesData: SpeciesData[] = [
    // ===== HOA ANH ĐÀO - Multiple locations =====
    {
        id: 1,
        name: "Hoa Anh Đào",
        scientificName: "Prunus serrulata",
        location: [105.8542, 21.0285], // Hà Nội
        locationName: "Công viên Thống Nhất, Hà Nội",
        bloomingPeriod: {
            start: "15/03/2025",
            peak: "25/03/2025",
            end: "10/04/2025"
        },
        bloomProbability: 85,
        description: "Hoa anh đào Nhật Bản với màu hồng nhạt đặc trưng",
        imageUrl:
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
        bloomTime: "Mùa xuân (tháng 3-4)",
        color: "Hồng nhạt, trắng tinh khôi",
        habitat: "Vùng ôn đới, thích hợp khí hậu mát mẻ của miền Bắc",
        characteristics:
            "Cánh hoa 5 múi, có mùi thơm nhẹ, thường nở từ cuống lá trước khi lá mọc"
    },
    {
        id: 2,
        name: "Hoa Anh Đào",
        scientificName: "Prunus serrulata",
        location: [106.6881, 20.8449], // Hạ Long
        locationName: "Công viên Hạ Long, Quảng Ninh",
        bloomingPeriod: {
            start: "20/03/2025",
            peak: "30/03/2025",
            end: "15/04/2025"
        },
        bloomProbability: 78,
        description: "Hoa anh đào nở rộ tại thành phố biển Hạ Long",
        imageUrl:
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
        bloomTime: "Mùa xuân (tháng 3-4)",
        color: "Hồng phấn, có chút pha trắng",
        habitat: "Thích hợp khí hậu ven biển, độ ẩm cao",
        characteristics:
            "Thích nghi tốt với môi trường nhiễm mặn, hoa nở muộn hơn vùng nội địa"
    },
    {
        id: 3,
        name: "Hoa Anh Đào",
        scientificName: "Prunus serrulata",
        location: [108.2022, 16.0544], // Đà Nẵng
        locationName: "Công viên 29/3, Đà Nẵng",
        bloomingPeriod: {
            start: "10/03/2025",
            peak: "20/03/2025",
            end: "05/04/2025"
        },
        bloomProbability: 90,
        description: "Hoa anh đào nở sớm tại miền Trung",
        imageUrl:
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
        bloomTime: "Cuối mùa đông - đầu mùa xuân (tháng 3)",
        color: "Hồng đậm, rực rỡ",
        habitat: "Khí hậu nhiệt đới gió mùa, nắng nóng quanh năm",
        characteristics:
            "Nở sớm nhất trong các vùng, thích nghi với nhiệt độ cao"
    },
    {
        id: 4,
        name: "Hoa Anh Đào",
        scientificName: "Prunus serrulata",
        location: [106.7009, 10.7769], // TP.HCM
        locationName: "Công viên Tao Đàn, TP.HCM",
        bloomingPeriod: {
            start: "05/03/2025",
            peak: "15/03/2025",
            end: "30/03/2025"
        },
        bloomProbability: 72,
        description: "Hoa anh đào Nhật trong lòng Sài Gòn",
        imageUrl:
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
        bloomTime: "Mùa khô (tháng 3)",
        color: "Hồng nhạt, dễ tàn trong nắng nóng",
        habitat: "Thích nghi khó khăn với khí hậu nhiệt đới Nam Bộ",
        characteristics:
            "Cần chăm sóc đặc biệt, thời gian nở ngắn do thời tiết nóng ẩm"
    },

    // ===== HOA BAN - Multiple locations =====
    {
        id: 5,
        name: "Hoa Ban",
        scientificName: "Bauhinia variegata",
        location: [103.0137, 21.3099], // Điện Biên
        locationName: "Cao nguyên Điện Biên",
        bloomingPeriod: {
            start: "01/03/2025",
            peak: "15/03/2025",
            end: "30/03/2025"
        },
        bloomProbability: 95,
        description: "Hoa ban trắng tinh khôi của vùng Tây Bắc",
        imageUrl:
            "https://images.unsplash.com/photo-1583542225715-473a32c9b0ef?w=400",
        bloomTime: "Cuối mùa đông - đầu mùa xuân (tháng 3)",
        color: "Trắng tinh khôi, có vân tím nhẹ",
        habitat: "Vùng núi cao Tây Bắc, khí hậu ôn đới lạnh",
        characteristics:
            "Biểu tượng của vùng Tây Bắc, nở thành từng cụm lớn, thơm ngát"
    },
    {
        id: 6,
        name: "Hoa Ban",
        scientificName: "Bauhinia variegata",
        location: [103.9707, 22.1428], // Lai Châu
        locationName: "Thung lũng Mường Lay, Lai Châu",
        bloomingPeriod: {
            start: "28/02/2025",
            peak: "12/03/2025",
            end: "25/03/2025"
        },
        bloomProbability: 88,
        description: "Hoa ban nở rộ trên đỉnh núi Lai Châu",
        imageUrl:
            "https://images.unsplash.com/photo-1583542225715-473a32c9b0ef?w=400",
        bloomTime: "Mùa xuân sớm (cuối tháng 2 - tháng 3)",
        color: "Trắng muốt, có điểm vàng nhạt ở tim hoa",
        habitat: "Vùng núi cao biên giới, khí hậu lạnh quanh năm",
        characteristics:
            "Nở sớm nhất trong năm, chịu được giá rét, hoa to và dày"
    },
    {
        id: 7,
        name: "Hoa Ban",
        scientificName: "Bauhinia variegata",
        location: [103.914, 21.5209], // Sơn La
        locationName: "Cao nguyên Mộc Châu, Sơn La",
        bloomingPeriod: {
            start: "05/03/2025",
            peak: "18/03/2025",
            end: "02/04/2025"
        },
        bloomProbability: 92,
        description: "Hoa ban trắng muốt trên cao nguyên Mộc Châu",
        imageUrl:
            "https://images.unsplash.com/photo-1583542225715-473a32c9b0ef?w=400",
        bloomTime: "Mùa xuân (tháng 3 - đầu tháng 4)",
        color: "Trắng trong suốt, có ánh bạc dưới ánh nắng",
        habitat: "Cao nguyên Mộc Châu, khí hậu ôn đới cao nguyên",
        characteristics:
            "Nở thành những thác hoa trắng tuyệt đẹp, thời gian nở lâu nhất"
    },

    // ===== HOA ĐỖ QUYÊN - Multiple locations =====
    {
        id: 8,
        name: "Hoa Đỗ Quyên",
        scientificName: "Rhododendron simsii",
        location: [103.3438, 22.3364], // Lào Cai
        locationName: "Sa Pa, Lào Cai",
        bloomingPeriod: {
            start: "20/02/2025",
            peak: "10/03/2025",
            end: "25/03/2025"
        },
        bloomProbability: 98,
        description: "Hoa đỗ quyên đỏ rực trên núi cao Sa Pa",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
        bloomTime: "Cuối mùa đông - đầu mùa xuân (tháng 2-3)",
        color: "Đỏ rực rỡ, có loại hồng và tím",
        habitat: "Vùng núi cao trên 1500m, khí hậu ôn đới lạnh",
        characteristics:
            "Chịu được giá rét, nở thành những cụm hoa lớn, rất bền màu"
    },
    {
        id: 9,
        name: "Hoa Đỗ Quyên",
        scientificName: "Rhododendron simsii",
        location: [103.4619, 22.8025], // Hà Giang
        locationName: "Cao nguyên đá Đồng Văn, Hà Giang",
        bloomingPeriod: {
            start: "15/02/2025",
            peak: "05/03/2025",
            end: "20/03/2025"
        },
        bloomProbability: 94,
        description: "Hoa đỗ quyên nở rộ trên cao nguyên đá",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
        bloomTime: "Mùa xuân sớm (tháng 2-3)",
        color: "Tím đậm, có loại đỏ thẫm",
        habitat: "Cao nguyên đá vôi, khí hậu khắc nghiệt",
        characteristics:
            "Thích nghi với đất đá vôi, nở sớm và chịu được gió lạnh cao nguyên"
    },
    {
        id: 10,
        name: "Hoa Đỗ Quyên",
        scientificName: "Rhododendron simsii",
        location: [108.4583, 11.9404], // Đà Lạt
        locationName: "Thành phố Đà Lạt, Lâm Đồng",
        bloomingPeriod: {
            start: "01/03/2025",
            peak: "15/03/2025",
            end: "30/03/2025"
        },
        bloomProbability: 86,
        description: "Hoa đỗ quyên nở trong thành phố ngàn hoa",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
        bloomTime: "Mùa xuân (tháng 3)",
        color: "Hồng phấn, đỏ cam, trắng",
        habitat: "Khí hậu ôn đới cao nguyên Đà Lạt",
        characteristics: "Được trồng làm cảnh quan, nhiều màu sắc, nở lâu"
    },

    // ===== HOA MAI - Multiple locations =====
    {
        id: 11,
        name: "Hoa Mai",
        scientificName: "Ochna integerrima",
        location: [106.6297, 10.8231], // TP.HCM
        locationName: "Công viên Tao Đàn, TP.HCM",
        bloomingPeriod: {
            start: "25/01/2025",
            peak: "10/02/2025",
            end: "28/02/2025"
        },
        bloomProbability: 88,
        description: "Hoa mai vàng truyền thống của miền Nam",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
        bloomTime: "Tết Nguyên Đán (tháng 1-2 âm lịch)",
        color: "Vàng rực rỡ, có tâm vàng đậm",
        habitat: "Khí hậu nhiệt đới Nam Bộ, ưa ẩm",
        characteristics:
            "Biểu tượng Tết miền Nam, hoa 5 cánh, thơm nhẹ, nở rộ dịp Tết"
    },
    {
        id: 12,
        name: "Hoa Mai",
        scientificName: "Ochna integerrima",
        location: [105.7469, 10.0452], // Cần Thơ
        locationName: "Bến Ninh Kiều, Cần Thơ",
        bloomingPeriod: {
            start: "20/01/2025",
            peak: "05/02/2025",
            end: "25/02/2025"
        },
        bloomProbability: 92,
        description: "Hoa mai vàng ươm bên bờ sông Hậu",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
        bloomTime: "Cuối năm - Tết Nguyên Đán (tháng 1-2)",
        color: "Vàng óng ánh như nắng miền Tây",
        habitat: "Đồng bằng sông Cửu Long, gần sông nước",
        characteristics: "Nở sớm nhất vùng ĐBSCL, hoa to và vàng đậm, sống lâu"
    },
    {
        id: 13,
        name: "Hoa Mai",
        scientificName: "Ochna integerrima",
        location: [106.675, 10.9804], // Đồng Tháp
        locationName: "Vườn quốc gia Tràm Chim, Đồng Tháp",
        bloomingPeriod: {
            start: "15/01/2025",
            peak: "30/01/2025",
            end: "20/02/2025"
        },
        bloomProbability: 85,
        description: "Hoa mai hoang dại trong vườn quốc gia",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },

    // ===== HOA PHƯỢNG - Multiple locations =====
    {
        id: 14,
        name: "Hoa Phượng",
        scientificName: "Delonix regia",
        location: [108.2022, 16.0544], // Đà Nẵng
        locationName: "Bãi biển Mỹ Khê, Đà Nẵng",
        bloomingPeriod: {
            start: "15/04/2025",
            peak: "01/05/2025",
            end: "30/06/2025"
        },
        bloomProbability: 75,
        description: "Hoa phượng đỏ rực rỡ mùa hè bên biển",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },
    {
        id: 15,
        name: "Hoa Phượng",
        scientificName: "Delonix regia",
        location: [105.8542, 21.0285], // Hà Nội
        locationName: "Phố cổ Hà Nội",
        bloomingPeriod: {
            start: "20/04/2025",
            peak: "10/05/2025",
            end: "15/07/2025"
        },
        bloomProbability: 68,
        description: "Hoa phượng đỏ trên những con phố cổ kính",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },
    {
        id: 16,
        name: "Hoa Phượng",
        scientificName: "Delonix regia",
        location: [106.7009, 10.7769], // TP.HCM
        locationName: "Đại học Bách Khoa, TP.HCM",
        bloomingPeriod: {
            start: "10/04/2025",
            peak: "25/04/2025",
            end: "20/06/2025"
        },
        bloomProbability: 82,
        description: "Hoa phượng nở rộ trong khuôn viên trường học",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },

    // ===== HOA SEN - Multiple locations =====
    {
        id: 17,
        name: "Hoa Sen",
        scientificName: "Nelumbo nucifera",
        location: [106.161, 20.9101], // Ninh Bình
        locationName: "Đầm sen Tam Cốc, Ninh Bình",
        bloomingPeriod: {
            start: "15/05/2025",
            peak: "15/06/2025",
            end: "31/08/2025"
        },
        bloomProbability: 96,
        description: "Sen hồng thanh khiết trên mặt nước trong xanh",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },
    {
        id: 18,
        name: "Hoa Sen",
        scientificName: "Nelumbo nucifera",
        location: [105.8542, 21.0285], // Hà Nội
        locationName: "Hồ Tây, Hà Nội",
        bloomingPeriod: {
            start: "20/05/2025",
            peak: "20/06/2025",
            end: "05/09/2025"
        },
        bloomProbability: 89,
        description: "Sen trắng thanh tao trên hồ Tây thơ mộng",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },
    {
        id: 19,
        name: "Hoa Sen",
        scientificName: "Nelumbo nucifera",
        location: [107.5909, 16.4637], // Huế
        locationName: "Hoàng cung Huế, Thừa Thiên Huế",
        bloomingPeriod: {
            start: "10/05/2025",
            peak: "10/06/2025",
            end: "25/08/2025"
        },
        bloomProbability: 93,
        description: "Sen hoàng gia trong cung đình cổ kính",
        imageUrl:
            "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
    },

    // ===== HOA ĐÀO - Multiple locations =====
    {
        id: 20,
        name: "Hoa Đào",
        scientificName: "Prunus persica",
        location: [106.0131, 20.7537], // Hòa Bình
        locationName: "Thung lũng Mai Châu, Hòa Bình",
        bloomingPeriod: {
            start: "20/01/2025",
            peak: "05/02/2025",
            end: "20/02/2025"
        },
        bloomProbability: 87,
        description: "Hoa đào hồng nở rộ trong thung lũng Mai Châu",
        imageUrl:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"
    },
    {
        id: 21,
        name: "Hoa Đào",
        scientificName: "Prunus persica",
        location: [105.8542, 21.0285], // Hà Nội
        locationName: "Làng Nhật Tân, Hà Nội",
        bloomingPeriod: {
            start: "25/01/2025",
            peak: "10/02/2025",
            end: "25/02/2025"
        },
        bloomProbability: 94,
        description: "Hoa đào Nhật Tân nổi tiếng của Hà Nội",
        imageUrl:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"
    },
    {
        id: 22,
        name: "Hoa Đào",
        scientificName: "Prunus persica",
        location: [103.3438, 22.3364], // Sa Pa
        locationName: "Bản Cát Cát, Sa Pa, Lào Cai",
        bloomingPeriod: {
            start: "15/01/2025",
            peak: "01/02/2025",
            end: "15/02/2025"
        },
        bloomProbability: 91,
        description: "Đào phai Sa Pa nở sớm trên núi cao",
        imageUrl:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"
    },

    // ===== HOA SÚNG - Multiple locations =====
    {
        id: 23,
        name: "Hoa Súng",
        scientificName: "Nymphaea alba",
        location: [106.675, 10.9804], // Đồng Tháp
        locationName: "Đồng Tháp Mười",
        bloomingPeriod: {
            start: "01/04/2025",
            peak: "20/04/2025",
            end: "15/05/2025"
        },
        bloomProbability: 89,
        description: "Hoa súng trắng nở trên đồng ruộng mênh mông",
        imageUrl:
            "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=400"
    },
    {
        id: 24,
        name: "Hoa Súng",
        scientificName: "Nymphaea alba",
        location: [105.7469, 10.0452], // Cần Thơ
        locationName: "Chợ nổi Cái Răng, Cần Thơ",
        bloomingPeriod: {
            start: "25/03/2025",
            peak: "15/04/2025",
            end: "10/05/2025"
        },
        bloomProbability: 76,
        description: "Súng nở bên chợ nổi sông nước miền Tây",
        imageUrl:
            "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=400"
    },

    // ===== HOA BƯỞI - Multiple locations =====
    {
        id: 25,
        name: "Hoa Bưởi",
        scientificName: "Citrus grandis",
        location: [105.9519, 10.276], // Bến Tre
        locationName: "Vườn trái cây Bến Tre",
        bloomingPeriod: {
            start: "15/02/2025",
            peak: "01/03/2025",
            end: "20/03/2025"
        },
        bloomProbability: 82,
        description: "Hoa bưởi thơm ngát trong vườn trái cây",
        imageUrl:
            "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400"
    },
    {
        id: 26,
        name: "Hoa Bưởi",
        scientificName: "Citrus grandis",
        location: [105.7469, 10.0452], // Cần Thơ
        locationName: "Cồn Phụng, Cần Thơ",
        bloomingPeriod: {
            start: "20/02/2025",
            peak: "05/03/2025",
            end: "25/03/2025"
        },
        bloomProbability: 78,
        description: "Bưởi da xanh nở hoa trắng tinh khôi",
        imageUrl:
            "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400"
    },
    {
        id: 27,
        name: "Hoa Bưởi",
        scientificName: "Citrus grandis",
        location: [105.7469, 10.0452], // Cần Thơ
        locationName: "Cồn Phụng, Cần Thơ",
        bloomingPeriod: {
            start: "20/02/2025",
            peak: "05/03/2025",
            end: "25/03/2025"
        },
        bloomProbability: 78,
        description: "Bưởi da xanh nở hoa trắng tinh khôi",
        imageUrl:
            "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400"
    }
]

export interface UseSpeciesDataReturn {
    allSpecies: SpeciesData[]
    speciesGroups: SpeciesGroup[]
    filteredSpeciesGroups: SpeciesGroup[]
    selectedDates: Date[]
    pinnedSpeciesNames: string[]
    pinnedSpeciesData: PinnedSpecies[]
    allLocationsOfPinnedSpecies: SpeciesData[]
    setSelectedDates: (dates: Date[]) => void
    handleDateSelect: (dates: Date[]) => void
    handleFlowerFilter: (flowers: SpeciesData[]) => void
    handlePinSpecies: (speciesName: string) => void
    resetFilters: () => void
}

export function useSpeciesData(): UseSpeciesDataReturn {
    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [filteredSpecies, setFilteredSpecies] =
        useState<SpeciesData[]>(mockSpeciesData)
    const [pinnedSpeciesNames, setPinnedSpeciesNames] = useState<string[]>([])

    // Group species by name
    const speciesGroups = useMemo((): SpeciesGroup[] => {
        const groupMap = new Map<string, SpeciesData[]>()

        mockSpeciesData.forEach((species) => {
            const existing = groupMap.get(species.name) || []
            existing.push(species)
            groupMap.set(species.name, existing)
        })

        return Array.from(groupMap.entries()).map(([name, locations]) => {
            const firstLocation = locations[0]
            const avgBloomProbability = Math.round(
                locations.reduce((sum, loc) => sum + loc.bloomProbability, 0) /
                    locations.length
            )

            return {
                name,
                scientificName: firstLocation.scientificName,
                locations,
                totalLocations: locations.length,
                averageBloomProbability: avgBloomProbability,
                imageUrl: firstLocation.imageUrl
            }
        })
    }, [])

    // Filter species groups based on filtered species
    const filteredSpeciesGroups = useMemo((): SpeciesGroup[] => {
        const filteredNames = new Set(filteredSpecies.map((s) => s.name))
        return speciesGroups.filter((group) => filteredNames.has(group.name))
    }, [speciesGroups, filteredSpecies])

    // Get pinned species data
    const pinnedSpeciesData = useMemo((): PinnedSpecies[] => {
        return pinnedSpeciesNames
            .map((name) => {
                const group = speciesGroups.find((g) => g.name === name)
                return {
                    name,
                    scientificName: group?.scientificName || "",
                    locations: group?.locations || []
                }
            })
            .filter((p) => p.locations.length > 0)
    }, [pinnedSpeciesNames, speciesGroups])

    // Get all locations of pinned species (for map display)
    const allLocationsOfPinnedSpecies = useMemo((): SpeciesData[] => {
        return pinnedSpeciesData.flatMap((species) => species.locations)
    }, [pinnedSpeciesData])

    // Handle calendar date selection
    const handleDateSelect = (dates: Date[]) => {
        setSelectedDates(dates)
    }

    // Handle flower filtering based on selected dates
    const handleFlowerFilter = (flowers: SpeciesData[]) => {
        setFilteredSpecies(flowers)
    }

    // Handle pin/unpin species by name
    const handlePinSpecies = (speciesName: string) => {
        setPinnedSpeciesNames((prev) => {
            if (prev.includes(speciesName)) {
                return prev.filter((name) => name !== speciesName)
            } else {
                return [...prev, speciesName]
            }
        })
    }

    // Reset filters
    const resetFilters = () => {
        setSelectedDates([])
        setFilteredSpecies(mockSpeciesData)
    }

    return {
        allSpecies: mockSpeciesData,
        speciesGroups,
        filteredSpeciesGroups,
        selectedDates,
        pinnedSpeciesNames,
        pinnedSpeciesData,
        allLocationsOfPinnedSpecies,
        setSelectedDates,
        handleDateSelect,
        handleFlowerFilter,
        handlePinSpecies,
        resetFilters
    }
}
