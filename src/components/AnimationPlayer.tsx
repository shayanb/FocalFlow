import { useRef, useEffect, useState, useCallback } from 'react'
import { FocalImage } from '../types/canvas'

interface AnimationPlayerProps {
  images: FocalImage[]
  isPlaying: boolean
  fps: number
  onFrameChange?: (frameIndex: number) => void
  transition?: 'none' | 'fade' | 'dissolve' | 'blend'
  transitionDuration?: number
  motionTrails?: boolean
  trailLength?: number
  trailOpacity?: number
}

export default function AnimationPlayer({
  images,
  isPlaying,
  fps = 24,
  onFrameChange,
  transition = 'none',
  transitionDuration = 0.3,
  motionTrails = false,
  trailLength = 3,
  trailOpacity = 0.3
}: AnimationPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const frameHistoryRef = useRef<number[]>([])

  // Sort images by timestamp
  const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)

  // Calculate canvas bounds to fit all images
  const calculateBounds = useCallback(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    sortedImages.forEach(img => {
      const loadedImg = loadedImagesRef.current.get(img.id)
      if (!loadedImg) return

      const halfWidth = (loadedImg.width * img.transform.scale) / 2
      const halfHeight = (loadedImg.height * img.transform.scale) / 2

      minX = Math.min(minX, img.transform.position.x - halfWidth)
      maxX = Math.max(maxX, img.transform.position.x + halfWidth)
      minY = Math.min(minY, img.transform.position.y - halfHeight)
      maxY = Math.max(maxY, img.transform.position.y + halfHeight)
    })

    return {
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: maxX - minX,
      height: maxY - minY
    }
  }, [sortedImages])

  // Load all images
  useEffect(() => {
    sortedImages.forEach(img => {
      if (!loadedImagesRef.current.has(img.id)) {
        const image = new Image()
        image.onload = () => {
          loadedImagesRef.current.set(img.id, image)
          renderFrame(currentFrame, 0)
        }
        image.src = img.url
      }
    })
  }, [sortedImages])

  const renderImage = useCallback((ctx: CanvasRenderingContext2D, img: FocalImage, alpha: number) => {
    const loadedImg = loadedImagesRef.current.get(img.id)
    if (!loadedImg || alpha === 0) return

    ctx.save()
    
    // Apply transforms
    ctx.translate(img.transform.position.x, img.transform.position.y)
    ctx.rotate(img.transform.rotation)
    ctx.scale(img.transform.scale, img.transform.scale)
    ctx.globalAlpha = alpha * img.opacity

    // Set up clipping for frame
    ctx.beginPath()
    ctx.rect(-loadedImg.width / 2, -loadedImg.height / 2, loadedImg.width, loadedImg.height)
    ctx.clip()

    // Apply image zoom and offset
    const zoom = img.imageZoom || 1
    const offset = img.imageOffset || { x: 0, y: 0 }

    // Draw image
    ctx.drawImage(
      loadedImg,
      -loadedImg.width * zoom / 2 + offset.x,
      -loadedImg.height * zoom / 2 + offset.y,
      loadedImg.width * zoom,
      loadedImg.height * zoom
    )

    ctx.restore()
  }, [])

  const renderFrame = useCallback((frameIndex: number, transitionAmount: number = 0) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !ctx || sortedImages.length === 0) return

    // Clear canvas with background
    ctx.fillStyle = '#1f2937' // bg-gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate bounds and scale to fit
    const bounds = calculateBounds()
    const padding = 50
    const scaleX = (canvas.width - padding * 2) / bounds.width
    const scaleY = (canvas.height - padding * 2) / bounds.height
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down

    // Calculate canvas center and apply global transform
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    ctx.translate(-bounds.center.x, -bounds.center.y)

    // Get current and next frame for transitions
    const currentImage = sortedImages[frameIndex % sortedImages.length]
    const nextIndex = (frameIndex + 1) % sortedImages.length
    const nextImage = sortedImages[nextIndex]

    // Render motion trails if enabled
    if (motionTrails && frameHistoryRef.current.length > 0) {
      const trailFrames = frameHistoryRef.current.slice(-trailLength)
      trailFrames.forEach((historicFrame, index) => {
        if (historicFrame !== frameIndex) {
          const trailImage = sortedImages[historicFrame % sortedImages.length]
          const trailAlpha = (trailOpacity * (index + 1)) / trailLength * 0.5
          renderImage(ctx, trailImage, trailAlpha)
        }
      })
    }

    // Render all images in their positions
    const sortedByZ = [...sortedImages].sort((a, b) => a.zIndex - b.zIndex)
    
    sortedByZ.forEach(img => {
      // Calculate opacity based on current frame and transition
      let alpha = 0
      if (img.id === currentImage.id) {
        alpha = transitionAmount === 0 ? 1 : 1 - transitionAmount
      } else if (transitionAmount > 0 && img.id === nextImage.id) {
        alpha = transitionAmount
      }
      
      if (alpha > 0) {
        renderImage(ctx, img, alpha)
      }
    })

    ctx.restore()

    // Draw frame indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '12px monospace'
    ctx.fillText(`Frame ${frameIndex + 1}/${sortedImages.length}`, 10, 20)
    if (motionTrails) {
      ctx.fillText('Motion Trails: ON', 10, 35)
    }
  }, [sortedImages, calculateBounds, renderImage, motionTrails, trailLength, trailOpacity])

  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return

    const elapsed = timestamp - lastTimeRef.current
    const frameInterval = 1000 / fps
    const transitionFrames = Math.max(1, Math.floor(fps * transitionDuration))
    const transitionInterval = frameInterval / transitionFrames

    if (elapsed >= transitionInterval) {
      if (transition !== 'none' && transitionProgress < transitionFrames - 1) {
        // Still in transition
        const progress = (transitionProgress + 1) / transitionFrames
        setTransitionProgress(transitionProgress + 1)
        renderFrame(currentFrame, progress)
      } else {
        // Move to next frame
        const nextFrame = (currentFrame + 1) % sortedImages.length
        setCurrentFrame(nextFrame)
        setTransitionProgress(0)
        
        // Update frame history for motion trails
        frameHistoryRef.current = [...frameHistoryRef.current, currentFrame].slice(-trailLength)
        
        renderFrame(nextFrame, 0)
        
        if (onFrameChange) {
          onFrameChange(nextFrame)
        }
      }

      lastTimeRef.current = timestamp - (elapsed % transitionInterval)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, currentFrame, sortedImages.length, fps, renderFrame, onFrameChange, transition, transitionDuration, transitionProgress, trailLength])

  useEffect(() => {
    if (isPlaying && sortedImages.length > 0) {
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      renderFrame(currentFrame, 0)
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
          renderFrame(currentFrame, 0)
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