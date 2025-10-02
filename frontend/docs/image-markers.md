# OpenLayers Image Markers với Viền Trắng

## Tổng quan

Thay vì sử dụng các marker hình tròn đơn giản, giờ đây markers sẽ hiển thị hình ảnh thật của các loài hoa với:

-   ✅ **Hiển thị imageUrl** từ SpeciesData
-   ✅ **Viền trắng** bao quanh hình ảnh
-   ✅ **Scale 105%** khi được selected
-   ✅ **Kích thước lớn hơn** cho pinned markers
-   ✅ **Fallback** về circle marker nếu hình ảnh lỗi

## Implementation

### 1. Icon Style với Custom Canvas

```typescript
// Tạo custom canvas với viền trắng
const createIconWithBorder = () => {
    const canvas = document.createElement("canvas")
    const size = finalSize * scale
    const borderWidth = 3
    canvas.width = size + borderWidth * 2
    canvas.height = size + borderWidth * 2
    const ctx = canvas.getContext("2d")!

    // Vẽ viền trắng (hình tròn)
    ctx.beginPath()
    ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        size / 2 + borderWidth,
        0,
        2 * Math.PI
    )
    ctx.fillStyle = "#FFFFFF"
    ctx.fill()

    // Vẽ hình ảnh trong mask tròn
    ctx.save()
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, 2 * Math.PI)
    ctx.clip()

    ctx.drawImage(img, borderWidth, borderWidth, size, size)
    ctx.restore()
}
```

### 2. Scaling Logic

```typescript
const baseSize = 40
const scale = isSelected ? 1.05 : 1.0 // 105% khi selected
const finalSize = isPinned ? baseSize * 1.2 : baseSize // Lớn hơn khi pinned
```

### 3. OpenLayers Icon Style

```typescript
const customStyle = new Style({
    image: new Icon({
        img: canvas,
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction"
    })
})
```

## Marker States

### 🔴 **Normal State**

-   **Size:** 40px
-   **Scale:** 1.0 (100%)
-   **Border:** Viền trắng 3px
-   **Image:** Hiển thị từ imageUrl

### 🟡 **Pinned State**

-   **Size:** 48px (40px \* 1.2)
-   **Scale:** 1.0 (100%)
-   **Border:** Viền trắng 3px
-   **Image:** Hiển thị từ imageUrl
-   **Effect:** Lớn hơn để nổi bật

### 🔵 **Selected State**

-   **Size:** 40px hoặc 48px (nếu cũng pinned)
-   **Scale:** 1.05 (105%)
-   **Border:** Viền trắng 3px
-   **Image:** Hiển thị từ imageUrl
-   **Effect:** Tăng 5% để highlight

### 🟢 **Selected + Pinned**

-   **Size:** 48px (40px \* 1.2)
-   **Scale:** 1.05 (105%)
-   **Border:** Viền trắng 3px
-   **Image:** Hiển thị từ imageUrl
-   **Effect:** Vừa lớn vừa scale up

## Error Handling

### Fallback Mechanism

```typescript
img.onerror = () => {
    // Fallback về circle marker
    const fallbackStyle = new Style({
        image: new Circle({
            radius: size / 2,
            fill: new Fill({
                color: isPinned ? "#FCD34D" : isSelected ? "#3B82F6" : "#10B981"
            }),
            stroke: new Stroke({
                color: "#FFFFFF",
                width: borderWidth
            })
        })
    })
    marker.setStyle(fallbackStyle)
}
```

### Image Loading

-   **CORS Support:** `crossOrigin: 'anonymous'`
-   **Placeholder:** Fallback về circle nếu load lỗi
-   **Async Loading:** Canvas được update sau khi image load xong

## Test Data

### Unsplash Images

Sử dụng Unsplash API với crop để đảm bảo hình vuông:

```typescript
const testSpecies: SpeciesData[] = [
    {
        imageUrl:
            "https://images.unsplash.com/photo-1522551388100-27eebfc58988?w=100&h=100&fit=crop&crop=center"
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1597848212624-e40eb1d23b83?w=100&h=100&fit=crop&crop=center"
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1540206395-68808572332f?w=100&h=100&fit=crop&crop=center"
    }
]
```

## Performance Considerations

### Canvas Caching

-   Mỗi marker tạo một canvas riêng
-   Canvas được tạo async khi image load xong
-   Có thể optimize bằng cách cache canvas theo imageUrl

### Memory Usage

-   Canvas elements được tạo cho mỗi marker
-   Cần cleanup khi markers bị remove
-   Consider image preloading cho better UX

### Loading States

-   Initial render với basic icon
-   Update với image sau khi load xong
-   Graceful fallback nếu image fail

## Visual Hierarchy

| State           | Size | Scale | Visual Weight |
| --------------- | ---- | ----- | ------------- |
| Normal          | 40px | 100%  | Base          |
| Selected        | 40px | 105%  | +Attention    |
| Pinned          | 48px | 100%  | +Importance   |
| Selected+Pinned | 48px | 105%  | Max Priority  |

## Usage Example

```tsx
<OLMap
    species={speciesData}
    pinnedSpeciesNames={pinnedNames}
    selectedSpecies={selectedSpecies}
    onSpeciesClick={handleSelect}
    onSpeciesPin={handlePin}
/>
```

Với implementation này, markers sẽ trở nên sinh động và informative hơn rất nhiều! 🌸🌻🪷
