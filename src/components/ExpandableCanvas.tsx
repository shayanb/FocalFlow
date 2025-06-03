import { useRef, useEffect, useState, useCallback } from 'react'
import { Point, FocalImage, Viewport } from '../types/canvas'

interface ExpandableCanvasProps {
  images: FocalImage[]
  selectedImageId: string | null
  onImageSelect: (imageId: string | null) => void
  onImageTransform: (imageId: string, transform: Partial<FocalImage['transform']>) => void
  onSetFocalPoint?: (imageId: string, point: { x: number, y: number }) => void
  onBringToFront?: (imageId: string) => void
  gridSize: number
  showGrid: boolean
  mode: 'quick' | 'precision'
  isMarkingFocalPoints?: boolean
}

export default function ExpandableCanvas({
  images,
  selectedImageId,
  onImageSelect,
  onImageTransform,
  onSetFocalPoint,
  onBringToFront,
  gridSize = 50,
  showGrid = true,
  mode,
  isMarkingFocalPoints = false
}: ExpandableCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Viewport>({
    position: { x: 0, y: 0 },
    zoom: 1,
    size: { width: 0, height: 0 }
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  // Load images
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    images.forEach(img => {
      if (!loadedImages.current.has(img.id)) {
        const image = new Image()
        image.onload = () => {
          loadedImages.current.set(img.id, image)
          render()
        }
        image.src = img.url
      }
    })
  }, [images])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
        setViewport(prev => ({
          ...prev,
          size: { width: rect.width, height: rect.height }
        }))
        render()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Convert world coordinates to screen coordinates
  const worldToScreen = (point: Point): Point => {
    return {
      x: (point.x - viewport.position.x) * viewport.zoom + viewport.size.width / 2,
      y: (point.y - viewport.position.y) * viewport.zoom + viewport.size.height / 2
    }
  }

  // Convert screen coordinates to world coordinates
  const screenToWorld = (point: Point): Point => {
    return {
      x: (point.x - viewport.size.width / 2) / viewport.zoom + viewport.position.x,
      y: (point.y - viewport.size.height / 2) / viewport.zoom + viewport.position.y
    }
  }

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1

      const gridWorldSize = gridSize / viewport.zoom
      const startX = Math.floor((viewport.position.x - viewport.size.width / viewport.zoom / 2) / gridWorldSize) * gridWorldSize
      const startY = Math.floor((viewport.position.y - viewport.size.height / viewport.zoom / 2) / gridWorldSize) * gridWorldSize
      const endX = viewport.position.x + viewport.size.width / viewport.zoom / 2
      const endY = viewport.position.y + viewport.size.height / viewport.zoom / 2

      for (let x = startX; x <= endX; x += gridWorldSize) {
        const screenX = worldToScreen({ x, y: 0 }).x
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, canvas.height)
        ctx.stroke()
      }

      for (let y = startY; y <= endY; y += gridWorldSize) {
        const screenY = worldToScreen({ x: 0, y }).y
        ctx.beginPath()
        ctx.moveTo(0, screenY)
        ctx.lineTo(canvas.width, screenY)
        ctx.stroke()
      }
    }

    // Draw images sorted by z-index
    const sortedImages = [...images].sort((a, b) => a.zIndex - b.zIndex)
    sortedImages.forEach(focalImage => {
      const img = loadedImages.current.get(focalImage.id)
      if (!img) return

      ctx.save()

      const screenPos = worldToScreen(focalImage.transform.position)
      ctx.translate(screenPos.x, screenPos.y)
      ctx.rotate(focalImage.transform.rotation)
      ctx.scale(focalImage.transform.scale * viewport.zoom, focalImage.transform.scale * viewport.zoom)
      ctx.globalAlpha = focalImage.opacity

      // Set up clipping region for the frame
      const frameWidth = img.width
      const frameHeight = img.height
      ctx.beginPath()
      ctx.rect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight)
      ctx.clip()

      // Apply image zoom and offset
      const zoom = focalImage.imageZoom || 1
      const offset = focalImage.imageOffset || { x: 0, y: 0 }
      
      // Draw image with zoom and offset
      ctx.drawImage(
        img,
        -img.width * zoom / 2 + offset.x,
        -img.height * zoom / 2 + offset.y,
        img.width * zoom,
        img.height * zoom
      )

      // Draw selection border
      if (focalImage.id === selectedImageId) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3 / (focalImage.transform.scale * viewport.zoom)
        ctx.strokeRect(
          -img.width / 2,
          -img.height / 2,
          img.width,
          img.height
        )
      }

      // Draw focal point if set
      if (focalImage.focalPoint) {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(
          focalImage.focalPoint.x - img.width / 2,
          focalImage.focalPoint.y - img.height / 2,
          5 / (focalImage.transform.scale * viewport.zoom),
          0,
          Math.PI * 2
        )
        ctx.fill()
      }

      ctx.restore()
    })
  }, [images, viewport, showGrid, gridSize, selectedImageId])

  useEffect(() => {
    render()
  }, [render])

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    const worldPos = screenToWorld(mousePos)

    // Check if clicking on an image
    let clickedImage: FocalImage | null = null
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i]
      const loadedImg = loadedImages.current.get(img.id)
      if (!loadedImg) continue

      const halfWidth = (loadedImg.width * img.transform.scale) / 2
      const halfHeight = (loadedImg.height * img.transform.scale) / 2

      if (
        worldPos.x >= img.transform.position.x - halfWidth &&
        worldPos.x <= img.transform.position.x + halfWidth &&
        worldPos.y >= img.transform.position.y - halfHeight &&
        worldPos.y <= img.transform.position.y + halfHeight
      ) {
        clickedImage = img
        break
      }
    }

    if (clickedImage) {
      onImageSelect(clickedImage.id)
      
      if (isMarkingFocalPoints && onSetFocalPoint) {
        // Calculate the click position relative to the image
        const loadedImg = loadedImages.current.get(clickedImage.id)
        if (loadedImg) {
          const relativeX = (worldPos.x - clickedImage.transform.position.x) / clickedImage.transform.scale + loadedImg.width / 2
          const relativeY = (worldPos.y - clickedImage.transform.position.y) / clickedImage.transform.scale + loadedImg.height / 2
          onSetFocalPoint(clickedImage.id, { x: relativeX, y: relativeY })
        }
      } else {
        setIsDragging(true)
        // Calculate offset from image center to click point
        setDragOffset({
          x: worldPos.x - clickedImage.transform.position.x,
          y: worldPos.y - clickedImage.transform.position.y
        })
      }
    } else if (e.shiftKey || e.button === 1) {
      setIsPanning(true)
      setPanStart(mousePos)
      onImageSelect(null)
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    if (isDragging && selectedImageId) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const worldPos = screenToWorld(mousePos)
        const selectedImage = images.find(img => img.id === selectedImageId)
        if (selectedImage) {
          let newX = worldPos.x - dragOffset.x
          let newY = worldPos.y - dragOffset.y

          // Snap to grid in precision mode
          if (mode === 'precision' && showGrid) {
            const gridWorldSize = gridSize
            newX = Math.round(newX / gridWorldSize) * gridWorldSize
            newY = Math.round(newY / gridWorldSize) * gridWorldSize
          }

          onImageTransform(selectedImageId, {
            position: { x: newX, y: newY }
          })
        }
      })
    } else if (isPanning) {
      const dx = (mousePos.x - panStart.x) / viewport.zoom
      const dy = (mousePos.y - panStart.y) / viewport.zoom
      setViewport(prev => ({
        ...prev,
        position: {
          x: prev.position.x - dx,
          y: prev.position.y - dy
        }
      }))
      setPanStart(mousePos)
    }
  }, [isDragging, isPanning, selectedImageId, dragOffset, images, screenToWorld, mode, showGrid, gridSize, viewport.zoom, panStart, onImageTransform])

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsPanning(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    const worldPos = screenToWorld(mousePos)

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scaleFactor))

    // Zoom towards mouse position
    const newViewportPos = {
      x: worldPos.x - (mousePos.x - viewport.size.width / 2) / newZoom,
      y: worldPos.y - (mousePos.y - viewport.size.height / 2) / newZoom
    }

    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      position: newViewportPos
    }))
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    const worldPos = screenToWorld(mousePos)

    // Find clicked image (in reverse order to get topmost)
    const sortedImages = [...images].sort((a, b) => b.zIndex - a.zIndex)
    for (const img of sortedImages) {
      const loadedImg = loadedImages.current.get(img.id)
      if (!loadedImg) continue

      const halfWidth = (loadedImg.width * img.transform.scale) / 2
      const halfHeight = (loadedImg.height * img.transform.scale) / 2

      if (
        worldPos.x >= img.transform.position.x - halfWidth &&
        worldPos.x <= img.transform.position.x + halfWidth &&
        worldPos.y >= img.transform.position.y - halfHeight &&
        worldPos.y <= img.transform.position.y + halfHeight
      ) {
        if (onBringToFront) {
          onBringToFront(img.id)
        }
        break
      }
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${isMarkingFocalPoints ? 'cursor-crosshair' : 'cursor-move'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-2 text-sm">
        <div>Zoom: {Math.round(viewport.zoom * 100)}%</div>
        <div>Mode: {mode}</div>
      </div>
    </div>
  )
}