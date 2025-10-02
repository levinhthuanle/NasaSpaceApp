# Refactored Component Structure

## Overview

The MyMap component has been completely refactored into a modular, maintainable architecture with clear separation of concerns.

## New Component Structure

### Core Components

1. **MyMap (Main Orchestrator)**

    - `src/components/my-map.tsx`
    - Manages overall state and coordinates between child components
    - Uses custom hooks for data management
    - Implements clean component composition

2. **MapLayout (Layout Management)**
    - `src/components/map-layout.tsx`
    - Handles all UI positioning and layout logic
    - Provides consistent spacing and z-index management
    - Separates layout concerns from business logic

### UI Control Components

3. **MapSearch (Search Functionality)**

    - `src/components/map-search.tsx`
    - Handles location search with debounced input
    - Manages search results and user interaction
    - Provides callback-based communication

4. **MapControls (Zoom & Navigation)**

    - `src/components/map-controls.tsx`
    - Manages zoom in/out functionality
    - Handles calendar toggle button
    - Clean, reusable button interfaces

5. **StatisticsPanel (Data Display)**
    - `src/components/statistics-panel.tsx`
    - Shows species and bloom statistics
    - Displays filtered data information
    - Responsive date selection display

### Map & Data Components

6. **MapContainerComponent (Map Rendering)**
    - `src/components/map-container.tsx`
    - Handles Leaflet map rendering
    - Manages species markers and popups
    - Encapsulates map-specific logic

### Data Management

7. **useSpeciesData Hook**
    - `src/hooks/use-species-data.ts`
    - Centralized species data management
    - Handles filtering and date selection logic
    - Provides clean API for data operations

## Benefits of Refactoring

### 1. **Separation of Concerns**

-   Each component has a single, clear responsibility
-   UI logic separated from business logic
-   Data management isolated in custom hooks

### 2. **Reusability**

-   Components can be easily reused in different contexts
-   Props-based configuration allows flexibility
-   Clean interfaces make testing easier

### 3. **Maintainability**

-   Smaller, focused components are easier to debug
-   Changes to one area don't affect others
-   Clear file organization improves navigation

### 4. **Scalability**

-   Easy to add new features without modifying existing components
-   Component composition allows for flexible layouts
-   Hook-based data management scales well

### 5. **Type Safety**

-   All components fully typed with TypeScript
-   Clear interfaces for props and data structures
-   Better IDE support and error detection

## File Structure

```
src/
├── components/
│   ├── my-map.tsx              # Main orchestrator
│   ├── map-layout.tsx          # Layout management
│   ├── map-search.tsx          # Search functionality
│   ├── map-controls.tsx        # Zoom/navigation controls
│   ├── statistics-panel.tsx    # Statistics display
│   ├── map-container.tsx       # Map rendering
│   ├── bloom-calendar.tsx      # Calendar (existing)
│   ├── chatbot.tsx             # Chatbot (existing)
│   └── species-maker.tsx       # Species markers (existing)
├── hooks/
│   └── use-species-data.ts     # Species data management
└── types/
    └── api.ts                  # Type definitions
```

## Usage Example

The refactored components work together seamlessly:

```tsx
// Main component uses composition
<MapLayout
  searchComponent={<MapSearch onLocationSelect={handleLocationSelect} />}
  controlsComponent={<MapControls onZoomIn={handleZoomIn} ... />}
  statsComponent={<StatisticsPanel stats={statsData} />}
  mapComponent={<MapContainerComponent ... />}
  calendarComponent={showCalendar ? <BloomCalendar ... /> : undefined}
  chatbotComponent={<Chatbot ... />}
/>
```

This architecture makes the codebase much more maintainable and scalable for future development.
