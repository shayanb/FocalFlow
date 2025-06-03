export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Transform {
  position: Point
  scale: number
  rotation: number
}

export interface FocalImage {
  id: string
  file: File
  url: string
  naturalSize: Size
  transform: Transform
  focalPoint?: Point
  opacity: number
  timestamp: number
  imageZoom: number
  imageOffset: Point
  zIndex: number
}

export interface Viewport {
  position: Point
  zoom: number
  size: Size
}

export interface CanvasState {
  images: FocalImage[]
  selectedImageId: string | null
  viewport: Viewport
  gridSize: number
  showGrid: boolean
  mode: 'quick' | 'precision'
  isDragging: boolean
  isPanning: boolean
}

export interface AnimationConfig {
  fps: number
  duration: number
  motionTrails: boolean
  trailOpacity: number
  trailLength: number
  transition: 'none' | 'fade' | 'blur' | 'dissolve'
  loop: boolean
}

export interface AlignmentMode {
  type: 'manual' | 'automatic'
  confidence?: number
  suggestedPoints?: Point[]
}