import { useState, useRef, useEffect, useCallback } from 'react'
import { FocalImage } from '../types/canvas'

interface ImageManipulatorProps {
  image: FocalImage
  onOffsetChange: (offset: { x: number, y: number }) => void
  isActive: boolean
}

export default function ImageManipulator({
  image,
  onOffsetChange,
  isActive
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
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      const fpX = 100 + (image.focalPoint.x - img.width / 2) * scale * zoom + scaledOffset.x
      const fpY = 100 + (image.focalPoint.y - img.height / 2) * scale * zoom + scaledOffset.y
      ctx.arc(fpX, fpY, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [image, isActive])

  useEffect(() => {
    render()
  }, [render])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
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
        className={`cursor-${isDragging ? 'grabbing' : 'grab'} bg-gray-100`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="text-xs text-gray-500 mt-1 text-center">
        Drag to reposition image in frame
      </div>
    </div>
  )
}