import { FocalImage } from '../types/canvas'

export interface ExportOptions {
  width: number
  height: number
  fps: number
  quality: number
  onProgress?: (progress: number) => void
  transition?: 'none' | 'fade' | 'dissolve' | 'blend'
  motionTrails?: boolean
  trailLength?: number
  trailOpacity?: number
}

// Modern video export using MediaRecorder API
export async function exportToWebM(
  images: FocalImage[],
  options: ExportOptions
): Promise<Blob> {
  const { width, height, fps, quality, onProgress } = options
  
  return new Promise(async (resolve, reject) => {
    try {
      // Create canvas and video stream
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      
      // Calculate bitrate based on quality (1-30, where 1 is best quality)
      // Higher quality = higher bitrate
      const baseBitrate = 8000000 // 8 Mbps base
      const qualityMultiplier = (31 - quality) / 30 // Invert quality scale
      const bitrate = Math.floor(baseBitrate * qualityMultiplier * (width * height / (1920 * 1080)))
      
      // Create video stream from canvas
      const stream = canvas.captureStream(fps)
      
      // Try different codec options for better quality
      let mediaRecorder: MediaRecorder
      try {
        // Try VP9 first (better quality)
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: bitrate
        })
      } catch (e) {
        try {
          // Fallback to VP8
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: bitrate
          })
        } catch (e2) {
          // Final fallback
          mediaRecorder = new MediaRecorder(stream, {
            videoBitsPerSecond: bitrate
          })
        }
      }
      
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        resolve(blob)
      }
      
      mediaRecorder.onerror = (event) => {
        reject(new Error('Video recording failed'))
      }
      
      // Load all images
      const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)
      const imagePromises = sortedImages.map(img => {
        return new Promise<{ focalImage: FocalImage; htmlImage: HTMLImageElement }>((resolve, reject) => {
          const htmlImage = new Image()
          htmlImage.onload = () => resolve({ focalImage: img, htmlImage })
          htmlImage.onerror = reject
          htmlImage.src = img.url
        })
      })
      
      const loadedImages = await Promise.all(imagePromises)
      
      // Start recording
      mediaRecorder.start()
      
      // Render frames with timing
      const frameDuration = 1000 / fps
      let frameIndex = 0
      
      const renderFrame = () => {
        if (frameIndex >= loadedImages.length) {
          // Stop recording after a short delay
          setTimeout(() => {
            mediaRecorder.stop()
          }, 100)
          return
        }
        
        const { focalImage, htmlImage } = loadedImages[frameIndex]
        
        // Clear canvas
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(0, 0, width, height)
        
        // Render image centered
        const scale = Math.min(width / htmlImage.width, height / htmlImage.height) * 0.8
        const x = (width - htmlImage.width * scale) / 2
        const y = (height - htmlImage.height * scale) / 2
        
        ctx.globalAlpha = focalImage.opacity
        ctx.drawImage(htmlImage, x, y, htmlImage.width * scale, htmlImage.height * scale)
        
        if (onProgress) {
          onProgress(frameIndex / loadedImages.length)
        }
        
        frameIndex++
        
        // Schedule next frame
        setTimeout(renderFrame, frameDuration)
      }
      
      // Start rendering frames
      renderFrame()
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
          reject(new Error('Video export timeout'))
        }
      }, 30000)
      
    } catch (error) {
      reject(error)
    }
  })
}

// Fallback: Export individual frames as PNG files in a ZIP
export async function exportFramesAsZip(
  images: FocalImage[],
  options: ExportOptions
): Promise<Blob> {
  const { width, height, onProgress } = options
  
  
  return new Promise(async (resolve, reject) => {
    try {
      // We'll use JSZip if available, otherwise create a simple blob with frame data
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      
      const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)
      const imagePromises = sortedImages.map(img => {
        return new Promise<{ focalImage: FocalImage; htmlImage: HTMLImageElement }>((resolve, reject) => {
          const htmlImage = new Image()
          htmlImage.onload = () => resolve({ focalImage: img, htmlImage })
          htmlImage.onerror = reject
          htmlImage.src = img.url
        })
      })
      
      const loadedImages = await Promise.all(imagePromises)
      const frameBlobs: Blob[] = []
      
      // Generate each frame as PNG
      for (let i = 0; i < loadedImages.length; i++) {
        const { focalImage, htmlImage } = loadedImages[i]
        
        // Clear canvas
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(0, 0, width, height)
        
        // Render image centered
        const scale = Math.min(width / htmlImage.width, height / htmlImage.height) * 0.8
        const x = (width - htmlImage.width * scale) / 2
        const y = (height - htmlImage.height * scale) / 2
        
        ctx.globalAlpha = focalImage.opacity
        ctx.drawImage(htmlImage, x, y, htmlImage.width * scale, htmlImage.height * scale)
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png')
        })
        
        frameBlobs.push(blob)
        
        if (onProgress) {
          onProgress(i / loadedImages.length)
        }
      }
      
      // Create a simple "ZIP-like" blob (just concatenated data for now)
      // In a real implementation, you'd use JSZip here
      const combinedBlob = new Blob(frameBlobs, { type: 'application/zip' })
      resolve(combinedBlob)
      
    } catch (error) {
      reject(error)
    }
  })
}

// GIF export using exact same rendering logic as AnimationPlayer
export async function exportToGIF(
  images: FocalImage[],
  options: ExportOptions
): Promise<Blob> {
  const { 
    width, 
    height, 
    fps, 
    quality, 
    onProgress, 
    motionTrails = false, 
    trailLength = 3, 
    trailOpacity = 0.3 
  } = options
  
  return new Promise(async (resolve, reject) => {
    try {
      // Use dynamic import to load gif.js only when needed
      const GIF = (await import('gif.js')).default
      
      // Create GIF with optimized settings
      const gif = new GIF({
        workers: 1,
        quality: quality,
        width: width,
        height: height,
        repeat: 0,
        background: '#1f2937',
        dither: 'FloydSteinberg-serpentine',
        globalPalette: false
      })

      // Sort images by timestamp (same as AnimationPlayer)
      const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)
      
      // Create canvas for rendering frames
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!

      // Load all images first
      const imagePromises = sortedImages.map(img => {
        return new Promise<{ focalImage: FocalImage; htmlImage: HTMLImageElement }>((resolve, reject) => {
          const htmlImage = new Image()
          htmlImage.onload = () => resolve({ focalImage: img, htmlImage })
          htmlImage.onerror = reject
          htmlImage.src = img.url
        })
      })

      const loadedImages = await Promise.all(imagePromises)
      const loadedImagesMap = new Map(loadedImages.map(({ focalImage, htmlImage }) => [focalImage.id, htmlImage]))

      // Calculate canvas bounds to fit all images (same as AnimationPlayer)
      const calculateBounds = () => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

        sortedImages.forEach(img => {
          const loadedImg = loadedImagesMap.get(img.id)
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
      }

      // Render image function (same as AnimationPlayer)
      const renderImage = (img: FocalImage, alpha: number) => {
        const loadedImg = loadedImagesMap.get(img.id)
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
      }

      const frameHistory: number[] = []
      const bounds = calculateBounds()
      const padding = 50
      const scaleX = (width - padding * 2) / bounds.width
      const scaleY = (height - padding * 2) / bounds.height
      const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down

      // Calculate canvas center and apply global transform
      const centerX = width / 2
      const centerY = height / 2

      // Render each frame (same as AnimationPlayer)
      for (let frameIndex = 0; frameIndex < sortedImages.length; frameIndex++) {
        // Clear canvas with background
        ctx.fillStyle = '#1f2937' // bg-gray-800
        ctx.fillRect(0, 0, width, height)

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)
        ctx.translate(-bounds.center.x, -bounds.center.y)

        const currentImage = sortedImages[frameIndex % sortedImages.length]

        // Render motion trails if enabled
        if (motionTrails && frameHistory.length > 0) {
          const trailFrames = frameHistory.slice(-trailLength)
          trailFrames.forEach((historicFrame, index) => {
            if (historicFrame !== frameIndex) {
              const trailImage = sortedImages[historicFrame % sortedImages.length]
              const trailAlpha = (trailOpacity * (index + 1)) / trailLength * 0.5
              renderImage(trailImage, trailAlpha)
            }
          })
        }

        // Render all images in their positions (sorted by zIndex)
        const sortedByZ = [...sortedImages].sort((a, b) => a.zIndex - b.zIndex)
        
        sortedByZ.forEach(img => {
          // For GIF export, show current frame at full opacity
          if (img.id === currentImage.id) {
            renderImage(img, 1)
          }
        })

        ctx.restore()

        // Update frame history for motion trails
        frameHistory.push(frameIndex)
        if (frameHistory.length > trailLength) {
          frameHistory.shift()
        }
        
        // Add frame to GIF with proper delay
        const delay = Math.max(100, Math.round(1000 / fps))
        gif.addFrame(ctx, { delay, copy: true })
        
        if (onProgress) {
          onProgress((frameIndex + 1) / sortedImages.length * 0.8)
        }
      }

      // Add reasonable timeout
      const timeout = setTimeout(() => {
        reject(new Error('GIF encoding took too long'))
      }, 60000)

      // Set up event handlers
      gif.on('progress', (p) => {
        if (onProgress) {
          onProgress(0.8 + p * 0.2)
        }
      })

      gif.on('finished', (blob) => {
        clearTimeout(timeout)
        resolve(blob)
      })

      gif.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      // Start encoding
      gif.render()

    } catch (error) {
      reject(error)
    }
  })
}

// Export function that supports both formats
export async function exportAnimation(
  images: FocalImage[],
  options: ExportOptions & { format: 'webm' | 'gif' | 'frames' }
): Promise<Blob> {
  const { format, ...exportOptions } = options
  
  switch (format) {
    case 'webm':
      return await exportToWebM(images, exportOptions)
    case 'gif':
      return await exportToGIF(images, exportOptions)
    case 'frames':
      return await exportFramesAsZip(images, exportOptions)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}