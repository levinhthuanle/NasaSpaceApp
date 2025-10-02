# Fix: ReactDOMClient.createRoot() Warning

## Vấn đề

```
ol-map.tsx:254 You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.
```

## Nguyên nhân

Trong implementation trước, mỗi lần `renderPopup()` được gọi, chúng ta tạo một `createRoot()` mới trên cùng một DOM element:

```typescript
// ❌ Code cũ - tạo root mới mỗi lần render
const renderPopup = () => {
    const element = overlayRef.current.getElement()!
    const root = createRoot(element) // Tạo root mới mỗi lần!
    root.render(<PopupContent />)
}

useEffect(() => {
    renderPopup() // Được gọi mỗi khi popup hoặc pinnedSpeciesNames thay đổi
}, [popup, pinnedSpeciesNames])
```

**Vấn đề:** `useEffect` chạy lại mỗi khi `popup` hoặc `pinnedSpeciesNames` thay đổi, và mỗi lần đó `createRoot()` được gọi trên cùng một DOM element.

## Giải pháp

### 1. Lưu trữ Root instance

```typescript
const rootRef = useRef<Root | null>(null)
```

### 2. Tạo Root chỉ một lần

```typescript
// ✅ Code mới - tạo root một lần và tái sử dụng
const renderPopup = () => {
    if (!popup?.show || !overlayRef.current?.getElement()) return null

    const element = overlayRef.current.getElement()!

    // Chỉ tạo root một lần
    if (!rootRef.current) {
        rootRef.current = createRoot(element)
    }

    // Tái sử dụng root đã tạo
    rootRef.current.render(<PopupContent />)
}
```

### 3. Proper Cleanup

```typescript
// Clear content khi popup ẩn
useEffect(() => {
    if (popup?.show) {
        renderPopup()
    } else if (rootRef.current) {
        // Xóa nội dung popup khi ẩn
        rootRef.current.render(<div></div>)
    }
}, [popup, pinnedSpeciesNames])

// Cleanup khi component unmount
useEffect(() => {
    return () => {
        if (rootRef.current) {
            rootRef.current.unmount()
            rootRef.current = null
        }
    }
}, [])
```

## So sánh Before vs After

| Aspect               | Before (❌)    | After (✅)    |
| -------------------- | -------------- | ------------- |
| **Root creation**    | Mỗi lần render | Chỉ một lần   |
| **Performance**      | Tốn memory     | Tối ưu        |
| **Console warnings** | Có warning     | Không warning |
| **Memory leaks**     | Có thể xảy ra  | Được cleanup  |
| **Code clarity**     | Confusing      | Clear intent  |

## Workflow mới

```
1. Component mount
   └── rootRef.current = null

2. First popup show
   └── rootRef.current = createRoot(element)
   └── rootRef.current.render(<PopupContent />)

3. Subsequent renders
   └── rootRef.current.render(<PopupContent />) // Tái sử dụng

4. Popup hide
   └── rootRef.current.render(<div></div>) // Clear content

5. Component unmount
   └── rootRef.current.unmount() // Cleanup
   └── rootRef.current = null
```

## Benefits

### 🚀 Performance

-   Không tạo root instances dư thừa
-   Giảm memory usage
-   Faster re-renders

### 🐛 Bug fixes

-   Loại bỏ React warnings
-   Proper lifecycle management
-   Memory leak prevention

### 💻 Developer Experience

-   Clean console output
-   Better debugging
-   Clearer code intent

## Type Safety

```typescript
import { createRoot, Root } from "react-dom/client"

const rootRef = useRef<Root | null>(null)
```

Với fix này, popup sẽ hoạt động mượt mà hơn và không còn warning trong console! 🎉
