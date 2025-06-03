# FocalFlow Architecture

## Core Concepts

FocalFlow is built around the idea of "object-centric animation" - keeping a recurring element stationary while the world moves around it. This creates unique visual storytelling opportunities.

## System Architecture

### 1. Canvas Grid System
- **Infinite Canvas**: Virtual space larger than viewport
- **Grid Snapping**: Helps align images precisely
- **Viewport Navigation**: Pan/zoom controls
- **Layer Management**: Z-index control for overlapping images

### 2. Image Processing Pipeline
```
Input Images → Feature Detection → Alignment Points → Transform Calculation → Rendering
```

### 3. Core Modules

#### ImageManager
- Handles image loading and caching
- Maintains image metadata (dimensions, position, scale)
- Manages up to 50 images efficiently

#### AlignmentEngine
- **Manual Mode**: User clicks to mark focal points
- **Automatic Mode**: Feature detection (experimental)
- **Grid Locks**: Snap-to-grid for precise alignment
- **Transform Matrix**: Calculates position/scale/rotation

#### AnimationRenderer
- Frame sequencing
- Motion trail generation
- Transition effects
- Export pipeline (GIF/MP4)

#### CanvasController
- Handles user interactions (pan, zoom, drag)
- Image selection and manipulation
- Grid rendering and snapping

### 4. Data Flow

```typescript
interface FocalImage {
  id: string
  file: File
  url: string
  position: { x: number, y: number }
  scale: number
  rotation: number
  focalPoint?: { x: number, y: number }
  opacity: number
}

interface AnimationConfig {
  fps: number
  duration: number
  motionTrails: boolean
  trailOpacity: number
  transition: 'none' | 'fade' | 'blur'
}

interface CanvasState {
  images: FocalImage[]
  selectedImageId: string | null
  viewport: { x: number, y: number, zoom: number }
  gridSize: number
  showGrid: boolean
  mode: 'quick' | 'precision'
}
```

### 5. User Interaction Flow

1. **Image Import**
   - Drag & drop multiple images
   - Images appear on expandable canvas
   
2. **Focal Point Selection**
   - Click on first image to mark focal object
   - System suggests alignment for other images
   - User fine-tunes with grid assistance

3. **Animation Preview**
   - Real-time preview as images are aligned
   - Adjust timing and effects
   - Preview motion trails

4. **Export**
   - Choose format (GIF/MP4)
   - Set resolution and quality
   - Generate final animation

### 6. Technical Decisions

- **No Backend**: All processing client-side for privacy
- **WebWorkers**: Heavy computations off main thread
- **Canvas API**: Primary rendering engine
- **IndexedDB**: Cache processed images
- **Progressive Enhancement**: Core features work everywhere

### 7. Performance Considerations

- Lazy load images
- Downsample for preview, full res for export
- Virtual scrolling for image list
- Debounced canvas updates
- Efficient transform calculations

## Implementation Phases

### Phase 1: Core Canvas System
- Expandable canvas with pan/zoom
- Image loading and positioning
- Basic grid system

### Phase 2: Alignment Engine
- Manual focal point marking
- Transform calculations
- Image alignment preview

### Phase 3: Animation System
- Frame sequencing
- Basic GIF export
- Preview controls

### Phase 4: Enhanced Features
- Motion trails
- Perspective correction
- MP4 export
- Effect templates