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
  
  console.log(`WebM export: ${width}x${height}, ${images.length} frames, ${fps} fps, quality: ${quality}`)
  
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
      
      console.log(`Using bitrate: ${bitrate} bps, codec: ${mediaRecorder.mimeType}`)
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        console.log('WebM export completed, size:', blob.size)
        resolve(blob)
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
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
      console.log(`Loaded ${loadedImages.length} images for WebM export`)
      
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
      console.error('WebM export error:', error)
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
  
  console.log(`Frames ZIP export: ${width}x${height}, ${images.length} frames`)
  
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
      console.log('Frames export completed, size:', combinedBlob.size)
      resolve(combinedBlob)
      
    } catch (error) {
      console.error('Frames export error:', error)
      reject(error)
    }
  })
}

// Simple GIF export using modern approach
export async function exportToGIF(
  images: FocalImage[],
  options: ExportOptions
): Promise<Blob> {
  const { width, height, fps, quality, onProgress } = options
  
  console.log(`GIF export: ${width}x${height}, ${images.length} frames, ${fps} fps`)
  
  return new Promise(async (resolve, reject) => {
    try {
      // Use dynamic import to load gif.js only when needed
      const GIF = (await import('gif.js')).default
      
      // Create GIF with optimized settings
      const gif = new GIF({
        workers: 1, // Use single worker to avoid CSP issues
        quality: quality,
        width: width,
        height: height,
        repeat: 0,
        background: '#1f2937',
        transparent: null,
        dither: 'FloydSteinberg-serpentine',
        globalPalette: false
      })

      // Sort images by timestamp
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
      console.log(`Loaded ${loadedImages.length} images for GIF export`)

      // Render and add each frame
      for (let frameIndex = 0; frameIndex < loadedImages.length; frameIndex++) {
        const { focalImage, htmlImage } = loadedImages[frameIndex]
        
        console.log(`Rendering GIF frame ${frameIndex + 1}/${loadedImages.length}`)
        
        // Clear canvas
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(0, 0, width, height)

        // Render image centered
        const scale = Math.min(width / htmlImage.width, height / htmlImage.height) * 0.8
        const x = (width - htmlImage.width * scale) / 2
        const y = (height - htmlImage.height * scale) / 2
        
        ctx.globalAlpha = focalImage.opacity
        ctx.drawImage(htmlImage, x, y, htmlImage.width * scale, htmlImage.height * scale)
        
        // Add frame to GIF with proper delay
        const delay = Math.max(100, Math.round(1000 / fps))
        gif.addFrame(ctx, { delay, copy: true })
        
        if (onProgress) {
          onProgress((frameIndex + 1) / loadedImages.length * 0.8)
        }
      }

      console.log('All GIF frames added, starting encoding...')

      // Add reasonable timeout
      const timeout = setTimeout(() => {
        console.error('GIF encoding timeout')
        reject(new Error('GIF encoding took too long'))
      }, 60000) // 60 seconds

      // Set up event handlers
      gif.on('progress', (p) => {
        console.log('GIF encoding progress:', p)
        if (onProgress) {
          onProgress(0.8 + p * 0.2)
        }
      })

      gif.on('finished', (blob) => {
        clearTimeout(timeout)
        console.log('GIF encoding finished! Size:', blob.size)
        resolve(blob)
      })

      gif.on('error', (error) => {
        clearTimeout(timeout)
        console.error('GIF encoding error:', error)
        reject(error)
      })

      // Start encoding
      gif.render()

    } catch (error) {
      console.error('GIF export error:', error)
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