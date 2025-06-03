import { useState, useRef, useEffect, useCallback } from 'react'
import { FocalImage } from '../types/canvas'

interface ImageManipulatorProps {
  image: FocalImage
  onOffsetChange: (offset: { x: number, y: number }) => void
  onSetFocalPoint?: (point: { x: number, y: number }) => void
  isActive: boolean
  isMarkingFocalPoint?: boolean
}

export default function ImageManipulator({
  image,
  onOffsetChange,
  onSetFocalPoint,
  isActive,
  isMarkingFocalPoint = false
}: ImageManipulatorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      render()
    }
    img.src = image.url
  }, [image.url, image.id])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    if (!canvas || !ctx || !img) return

    // Clear canvas
    ctx.clearRect(0, 0, 200, 200)

    // Set up clipping region
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, 200, 200)
    ctx.clip()

    // Calculate scaled dimensions
    const scale = 200 / Math.max(img.width, img.height)
    const width = img.width * scale
    const height = img.height * scale

    // Apply zoom and offset
    const zoom = image.imageZoom || 1
    const offset = image.imageOffset || { x: 0, y: 0 }
    
    const scaledOffset = {
      x: offset.x * scale,
      y: offset.y * scale
    }

    // Draw image
    ctx.drawImage(
      img,
      100 - (width * zoom) / 2 + scaledOffset.x,
      100 - (height * zoom) / 2 + scaledOffset.y,
      width * zoom,
      height * zoom
    )

    // Draw frame border
    ctx.restore()
    ctx.strokeStyle = isActive ? '#3b82f6' : '#e5e7eb'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 200, 200)

    // Draw focal point if exists
    if (image.focalPoint) {
      const fpX = 100 + (image.focalPoint.x - img.width / 2) * scale * zoom + scaledOffset.x
      const fpY = 100 + (image.focalPoint.y - img.height / 2) * scale * zoom + scaledOffset.y
      
      ctx.fillStyle = '#ef4444'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      
      ctx.beginPath()
      ctx.arc(fpX, fpY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    
    // Show crosshair if marking focal point
    if (isMarkingFocalPoint) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      // Vertical line
      ctx.beginPath()
      ctx.moveTo(100, 0)
      ctx.lineTo(100, 200)
      ctx.stroke()
      
      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(0, 100)
      ctx.lineTo(200, 100)
      ctx.stroke()
      
      ctx.setLineDash([])
    }
  }, [image, isActive, isMarkingFocalPoint])

  useEffect(() => {
    render()
  }, [render])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !imageRef.current) return

    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    if (isMarkingFocalPoint && onSetFocalPoint) {
      // Calculate the click position relative to the actual image
      const scale = 200 / Math.max(imageRef.current.width, imageRef.current.height)
      const zoom = image.imageZoom || 1
      const scaledOffset = {
        x: (image.imageOffset?.x || 0) * scale,
        y: (image.imageOffset?.y || 0) * scale
      }
      
      // Convert click to image coordinates
      const imageX = (mousePos.x - 100 - scaledOffset.x) / (scale * zoom) + imageRef.current.width / 2
      const imageY = (mousePos.y - 100 - scaledOffset.y) / (scale * zoom) + imageRef.current.height / 2
      
      onSetFocalPoint({ x: imageX, y: imageY })
    } else {
      setIsDragging(true)
      setDragStart(mousePos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const scale = 200 / Math.max(imageRef.current.width, imageRef.current.height)
    const delta = {
      x: (currentPos.x - dragStart.x) / scale,
      y: (currentPos.y - dragStart.y) / scale
    }

    const newOffset = {
      x: (image.imageOffset?.x || 0) + delta.x,
      y: (image.imageOffset?.y || 0) + delta.y
    }

    onOffsetChange(newOffset)
    setDragStart(currentPos)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className={`${
          isMarkingFocalPoint ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } bg-gray-100`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="text-xs text-gray-500 mt-1 text-center">
        {isMarkingFocalPoint ? 'Click to mark focal point' : 'Drag to reposition image in frame'}
      </div>
    </div>
  )
}