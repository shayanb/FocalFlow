import { useRef, useEffect, useState, useCallback } from 'react'
import { FocalImage } from '../types/canvas'

interface AnimationPlayerProps {
  images: FocalImage[]
  isPlaying: boolean
  fps: number
  onFrameChange?: (frameIndex: number) => void
}

export default function AnimationPlayer({
  images,
  isPlaying,
  fps = 24,
  onFrameChange
}: AnimationPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  // Sort images by timestamp
  const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)

  // Load all images
  useEffect(() => {
    sortedImages.forEach(img => {
      if (!loadedImagesRef.current.has(img.id)) {
        const image = new Image()
        image.onload = () => {
          loadedImagesRef.current.set(img.id, image)
        }
        image.src = img.url
      }
    })
  }, [sortedImages])

  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || sortedImages.length === 0) return

    const currentImage = sortedImages[frameIndex % sortedImages.length]
    const img = loadedImagesRef.current.get(currentImage.id)
    if (!img) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate canvas center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Save context
    ctx.save()

    // Apply transforms
    ctx.translate(
      centerX + currentImage.transform.position.x,
      centerY + currentImage.transform.position.y
    )
    ctx.rotate(currentImage.transform.rotation)
    ctx.scale(currentImage.transform.scale, currentImage.transform.scale)
    ctx.globalAlpha = currentImage.opacity

    // Set up clipping for frame
    ctx.beginPath()
    ctx.rect(-img.width / 2, -img.height / 2, img.width, img.height)
    ctx.clip()

    // Apply image zoom and offset
    const zoom = currentImage.imageZoom || 1
    const offset = currentImage.imageOffset || { x: 0, y: 0 }

    // Draw image
    ctx.drawImage(
      img,
      -img.width * zoom / 2 + offset.x,
      -img.height * zoom / 2 + offset.y,
      img.width * zoom,
      img.height * zoom
    )

    ctx.restore()

    // Draw frame indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.font = '12px monospace'
    ctx.fillText(`Frame ${frameIndex + 1}/${sortedImages.length}`, 10, 20)
  }, [sortedImages])

  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return

    const elapsed = timestamp - lastTimeRef.current
    const frameInterval = 1000 / fps

    if (elapsed >= frameInterval) {
      const nextFrame = (currentFrame + 1) % sortedImages.length
      setCurrentFrame(nextFrame)
      renderFrame(nextFrame)
      
      if (onFrameChange) {
        onFrameChange(nextFrame)
      }

      lastTimeRef.current = timestamp - (elapsed % frameInterval)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, currentFrame, sortedImages.length, fps, renderFrame, onFrameChange])

  useEffect(() => {
    if (isPlaying && sortedImages.length > 0) {
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      renderFrame(currentFrame)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animate, currentFrame, renderFrame])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          canvasRef.current.width = container.clientWidth
          canvasRef.current.height = container.clientHeight
          renderFrame(currentFrame)
        }
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentFrame, renderFrame])

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}