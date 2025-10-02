# OpenLayers Components for Species Map

Bộ components OpenLayers cho việc hiển thị bản đồ các loài hoa với các tính năng tương tác.

## 📦 Components

### 1. **OLMarker** - Marker cơ bản

```tsx
import OLMarker from "@/components/ol-marker"

;<OLMarker
    map={map}
    position={[106.0, 16.0]} // [longitude, latitude]
    icon="/marker-icon.png"
    size={[25, 41]}
    popupContent={<div>Popup content</div>}
    onClick={() => console.log("Clicked")}
/>
```

### 2. **OLSpeciesMarker** - Marker chuyên dụng cho species

```tsx
import OLSpeciesMarker from "@/components/ol-species-marker"

;<OLSpeciesMarker
    map={map}
    species={speciesData}
    isPinned={false}
    isSelected={false}
    onClick={(species) => console.log(species)}
    onPin={(species) => console.log("Pin:", species)}
/>
```

### 3. **OLMap** - Map container với species management

```tsx
import OLMap from "@/components/ol-map"

;<OLMap
    center={[106.0, 16.0]}
    zoom={6}
    species={speciesArray}
    pinnedSpeciesNames={pinnedNames}
    selectedSpecies={selected}
    onSpeciesClick={(species) => handleClick(species)}
    onSpeciesPin={(species) => handlePin(species)}
/>
```

### 4. **OLMapControls** - Điều khiển map

```tsx
import OLMapControls from "@/components/ol-map-controls"

;<OLMapControls
    onZoomIn={() => setZoom(zoom + 1)}
    onZoomOut={() => setZoom(zoom - 1)}
    onFitToSpecies={() => fitToAll()}
    onResetView={() => resetView()}
/>
```

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies:

```bash
npm install ol @types/ol
```

### 2. Import CSS:

```tsx
import "ol/ol.css"
import "@/styles/ol-custom.css"
```

### 3. Sử dụng OLMapExample:

```tsx
import OLMapExample from "@/components/ol-map-example"

export default function Page() {
    return <OLMapExample className="h-screen" />
}
```

## 🎨 Features

### ✅ **Marker Features:**

-   **Custom styling** cho từng trạng thái (pinned, selected, normal)
-   **Interactive popups** với thông tin chi tiết species
-   **Click handlers** và pin functionality
-   **Responsive design** với Tailwind CSS

### ✅ **Map Features:**

-   **Satellite imagery** từ ArcGIS
-   **Labels overlay** cho địa danh
-   **Zoom controls** và fit-to-species
-   **Smooth animations** khi di chuyển

### ✅ **Species Management:**

-   **Pin/unpin** species yêu thích
-   **Select** species để xem chi tiết
-   **Popup info** với hình ảnh và mô tả
-   **Bloom probability** và thời gian nở hoa

## 🎯 Props Reference

### **OLMap Props:**

-   `center`: [lon, lat] - Tọa độ trung tâm map
-   `zoom`: number - Mức zoom
-   `species`: SpeciesData[] - Mảng dữ liệu species
-   `pinnedSpeciesNames`: string[] - Tên các species đã pin
-   `selectedSpecies`: SpeciesData - Species đang được chọn
-   `onSpeciesClick`: (species) => void - Handler khi click marker
-   `onSpeciesPin`: (species) => void - Handler khi pin/unpin

### **OLSpeciesMarker Props:**

-   `map`: Map - Instance của OpenLayers Map
-   `species`: SpeciesData - Dữ liệu species
-   `isPinned`: boolean - Trạng thái pinned
-   `isSelected`: boolean - Trạng thái selected
-   `onClick`: (species) => void - Click handler
-   `onPin`: (species) => void - Pin handler

## 🎨 Styling

Sử dụng Tailwind CSS classes và custom CSS trong `ol-custom.css`:

```css
.ol-popup {
    /* Custom popup styling */
}

.ol-species-marker.pinned {
    animation: pulse 2s infinite;
}
```

## 📍 Tọa độ Việt Nam

```tsx
const vietnamLocations = {
    hanoi: [105.8542, 21.0285],
    hcm: [106.7009, 10.7769],
    danang: [108.2022, 16.0544],
    halong: [106.6881, 20.8449],
    sapa: [103.3438, 22.3364]
}
```

## 🌺 Example Species Data

```tsx
const speciesData: SpeciesData = {
    id: 1,
    name: "Hoa Anh Đào",
    scientificName: "Prunus serrulata",
    location: [105.8542, 21.0285],
    locationName: "Công viên Thống Nhất, Hà Nội",
    bloomingPeriod: {
        start: "15/03/2025",
        peak: "25/03/2025",
        end: "10/04/2025"
    },
    bloomProbability: 85,
    description: "Hoa anh đào Nhật Bản...",
    imageUrl: "https://..."
}
```
