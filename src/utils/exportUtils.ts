import GIF from 'gif.js'
import { FocalImage } from '../types/canvas'

export interface ExportOptions {
  width: number
  height: number
  fps: number
  quality: number
  onProgress?: (progress: number) => void
  transition?: 'none' | 'fade' | 'dissolve' | 'blend'
  motionTrails?: boolean
}

export async function exportToGIF(
  images: FocalImage[],
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { width, height, fps, quality, onProgress } = options
    
    // Create GIF encoder
    const gif = new GIF({
      workers: 2,
      quality: quality,
      width: width,
      height: height,
      workerScript: '/gif.worker.js' // We'll need to copy this to public folder
    })

    // Sort images by timestamp
    const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp)
    
    // Create canvas for rendering frames
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Failed to create canvas context'))
      return
    }

    // Load all images first
    const imagePromises = sortedImages.map(img => {
      return new Promise<{ focalImage: FocalImage; htmlImage: HTMLImageElement }>((resolve, reject) => {
        const htmlImage = new Image()
        htmlImage.onload = () => resolve({ focalImage: img, htmlImage })
        htmlImage.onerror = reject
        htmlImage.src = img.url
      })
    })

    Promise.all(imagePromises).then(loadedImages => {
      // Render each frame
      loadedImages.forEach(({ focalImage, htmlImage }, index) => {
        // Clear canvas
        ctx.fillStyle = '#f3f4f6' // bg-gray-100
        ctx.fillRect(0, 0, width, height)
        
        // Save context
        ctx.save()
        
        // Apply transforms
        const centerX = width / 2 + focalImage.transform.position.x
        const centerY = height / 2 + focalImage.transform.position.y
        
        ctx.translate(centerX, centerY)
        ctx.rotate(focalImage.transform.rotation)
        ctx.scale(focalImage.transform.scale, focalImage.transform.scale)
        ctx.globalAlpha = focalImage.opacity
        
        // Set up clipping for frame
        ctx.beginPath()
        ctx.rect(-htmlImage.width / 2, -htmlImage.height / 2, htmlImage.width, htmlImage.height)
        ctx.clip()
        
        // Apply image zoom and offset
        const zoom = focalImage.imageZoom || 1
        const offset = focalImage.imageOffset || { x: 0, y: 0 }
        
        // Draw image
        ctx.drawImage(
          htmlImage,
          -htmlImage.width * zoom / 2 + offset.x,
          -htmlImage.height * zoom / 2 + offset.y,
          htmlImage.width * zoom,
          htmlImage.height * zoom
        )
        
        ctx.restore()
        
        // Add frame to GIF
        gif.addFrame(canvas, { delay: 1000 / fps, copy: true })
        
        if (onProgress) {
          onProgress((index + 1) / loadedImages.length * 0.8) // 80% for rendering
        }
      })

      // Handle GIF progress
      gif.on('progress', (p) => {
        if (onProgress) {
          onProgress(0.8 + p * 0.2) // Last 20% for encoding
        }
      })

      gif.on('finished', (blob) => {
        resolve(blob)
      })

      // Start encoding
      gif.render()
    }).catch(reject)
  })
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