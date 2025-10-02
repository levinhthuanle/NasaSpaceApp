# OpenLayers Single Layer Marker Implementation

## Vấn đề trước đây

Trước khi thay đổi, mỗi `OLSpeciesMarker` component tạo ra một `VectorLayer` riêng biệt:

```typescript
// Trong OLSpeciesMarker (cũ)
const vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: isPinned ? 1000 : isSelected ? 900 : 800
})
map.addLayer(vectorLayer) // Mỗi marker = 1 layer riêng
```

**Vấn đề:**

-   Nhiều layer trên map (tối đa = số lượng marker)
-   Khó quản lý và tối ưu hóa performance
-   Có thể gây lag khi có nhiều marker
-   Phức tạp trong việc xử lý events và interactions

## Giải pháp mới

Tất cả markers giờ đây nằm trên cùng một `VectorLayer`:

### 1. Tạo một layer duy nhất trong OLMap

```typescript
// Tạo vector source và layer cho tất cả markers
const vectorSource = new VectorSource()
const vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: 1000 // Một zIndex duy nhất cho toàn bộ layer
})
```

### 2. Thêm tất cả markers vào cùng một source

```typescript
species.forEach((speciesItem) => {
    const marker = new Feature({
        geometry: new Point(fromLonLat(speciesItem.location))
    })

    // Style cho từng marker riêng lẻ
    marker.setStyle(markerStyle)
    marker.set("speciesData", speciesItem)

    // Thêm vào cùng một source
    vectorSource.addFeature(marker)
})
```

### 3. Xử lý events tập trung

```typescript
// Một event handler duy nhất cho toàn bộ map
olMap.on("click", (event) => {
    const feature = olMap.forEachFeatureAtPixel(event.pixel, (feat) => feat)
    if (feature) {
        const speciesData = feature.get("speciesData") as SpeciesData
        // Xử lý click...
    }
})
```

## Ưu điểm của approach mới

### 🚀 Performance

-   **Chỉ 1 layer** thay vì N layers (N = số marker)
-   **Rendering tối ưu** hơn từ OpenLayers
-   **Memory usage** giảm đáng kể
-   **Faster updates** khi thay đổi marker state

### 🎯 Quản lý đơn giản

-   **Centralized control** cho tất cả markers
-   **Consistent z-index** cho toàn bộ layer
-   **Easier event handling** với một handler duy nhất
-   **Cleaner code structure**

### 🔄 Updates hiệu quả

```typescript
// Cập nhật tất cả markers cùng lúc
useEffect(() => {
    const vectorSource = markerLayer.getSource()!
    vectorSource.clear() // Clear tất cả

    // Re-add với state mới
    species.forEach((speciesItem) => {
        const marker = createMarker(speciesItem)
        vectorSource.addFeature(marker)
    })
}, [species, pinnedSpeciesNames, selectedSpecies])
```

## Cách sử dụng

### Basic Usage

```tsx
<OLMap
    center={[106.0, 16.0]}
    zoom={6}
    species={speciesData}
    pinnedSpeciesNames={pinnedNames}
    selectedSpecies={selectedSpecies}
    onSpeciesClick={handleClick}
    onSpeciesPin={handlePin}
/>
```

### Test Component

Đã tạo `test-ol-map.tsx` để test functionality:

-   Hiển thị 3 markers test trên cùng một layer
-   Demo pin/unpin functionality
-   Demo selection states
-   Popup với thông tin chi tiết

## Code Structure

```
ol-map.tsx                 // Main map component với single layer
├── VectorLayer            // Một layer duy nhất cho tất cả markers
│   └── VectorSource       // Source chứa tất cả marker features
│       ├── Feature 1      // Cherry Blossom marker
│       ├── Feature 2      // Sunflower marker
│       └── Feature N      // Other species markers
├── TileLayer (Satellite)  // Base map layer
├── TileLayer (Labels)     // Labels overlay
└── Overlay (Popup)        // Popup cho marker info
```

## Migration Notes

### Removed Components

-   `OLSpeciesMarker` component không còn cần thiết
-   Mỗi marker giờ là `Feature` objects thay vì React components

### New Features

-   **Integrated popup system** với React rendering
-   **Centralized event handling** cho tất cả markers
-   **State-driven styling** cho marker appearance
-   **Better performance** với single layer architecture

### Breaking Changes

-   `OLSpeciesMarker` props không còn tương thích
-   Event handling được move vào `OLMap` component
-   Popup rendering sử dụng `createRoot` thay vì component mounting

## Performance Benefits

| Metric         | Before (Multi-layer) | After (Single layer) |
| -------------- | -------------------- | -------------------- |
| Layers created | N markers            | 1 layer              |
| Event handlers | N handlers           | 1 handler            |
| DOM elements   | N overlays           | 1 overlay            |
| Re-render cost | O(N)                 | O(1)                 |
| Memory usage   | High                 | Low                  |
| Update speed   | Slow                 | Fast                 |

Với approach mới này, ứng dụng sẽ có performance tốt hơn đáng kể, đặc biệt khi số lượng markers tăng lên.
