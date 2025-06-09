import { useState, useEffect } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { FocalImage } from '../types/canvas'
import { exportAnimation, downloadBlob } from '../utils/exportUtils'

interface AnimationSettings {
  fps: number
  transition: 'none' | 'fade' | 'dissolve' | 'blend'
  transitionDuration: number
  motionTrails: boolean
  trailLength: number
  trailOpacity: number
}

interface ExportModalProps {
  images: FocalImage[]
  isOpen: boolean
  onClose: () => void
  animationSettings?: AnimationSettings
}

export default function ExportModal({
  images,
  isOpen,
  onClose,
  animationSettings
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportSettings, setExportSettings] = useState({
    format: 'webm' as 'webm' | 'gif' | 'frames',
    width: 800,
    height: 600,
    fps: 24,
    quality: 10 // Quality (1-30, lower is better)
  })

  // Update export settings when animation settings change
  useEffect(() => {
    if (animationSettings) {
      setExportSettings(prev => ({
        ...prev,
        fps: animationSettings.fps
      }))
    }
  }, [animationSettings])

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      const blob = await exportAnimation(images, {
        ...exportSettings,
        onProgress: setProgress,
        transition: animationSettings?.transition || 'none',
        motionTrails: animationSettings?.motionTrails || false,
        trailLength: animationSettings?.trailLength || 3,
        trailOpacity: animationSettings?.trailOpacity || 0.3
      })

      // Determine file extension based on format
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      let extension = exportSettings.format
      let formatName = ''
      
      switch (exportSettings.format) {
        case 'webm':
          extension = 'webm'
          formatName = 'WebM video'
          break
        case 'gif':
          extension = 'gif'
          formatName = 'GIF animation'
          break
        case 'frames':
          extension = 'zip'
          formatName = 'PNG frames ZIP'
          break
      }

      const filename = `focalflow-${timestamp}.${extension}`
      downloadBlob(blob, filename)
      
      // Show success message with format info
      alert(`Export successful! Downloaded as ${formatName}: ${filename}`)
      
    } catch (error) {
      console.error('Export failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Export failed: ${errorMessage}. Please try again with different settings.`)
    } finally {
      setIsExporting(false)
      setProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Animation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Animation Settings Display */}
          {animationSettings && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview Settings</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div>FPS: {animationSettings.fps}</div>
                <div>Transition: {animationSettings.transition}</div>
                <div>Motion Trails: {animationSettings.motionTrails ? 'On' : 'Off'}</div>
                {animationSettings.motionTrails && (
                  <div>Trail Length: {animationSettings.trailLength}</div>
                )}
              </div>
            </div>
          )}
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setExportSettings(prev => ({ ...prev, format: 'webm' }))}
                className={`p-3 rounded border text-left ${
                  exportSettings.format === 'webm'
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${exportSettings.format === 'webm' ? 'text-blue-800' : 'text-gray-800'}`}>
                      WebM Video
                    </h4>
                    <p className={`text-sm ${exportSettings.format === 'webm' ? 'text-blue-600' : 'text-gray-600'}`}>
                      High quality video, smaller file size, smooth playback
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setExportSettings(prev => ({ ...prev, format: 'gif' }))}
                className={`p-3 rounded border text-left ${
                  exportSettings.format === 'gif'
                    ? 'bg-green-50 border-green-300'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${exportSettings.format === 'gif' ? 'text-green-800' : 'text-gray-800'}`}>
                      GIF Animation
                    </h4>
                    <p className={`text-sm ${exportSettings.format === 'gif' ? 'text-green-600' : 'text-gray-600'}`}>
                      Universal compatibility, auto-loops, larger file size
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setExportSettings(prev => ({ ...prev, format: 'frames' }))}
                className={`p-3 rounded border text-left ${
                  exportSettings.format === 'frames'
                    ? 'bg-purple-50 border-purple-300'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${exportSettings.format === 'frames' ? 'text-purple-800' : 'text-gray-800'}`}>
                      PNG Frames
                    </h4>
                    <p className={`text-sm ${exportSettings.format === 'frames' ? 'text-purple-600' : 'text-gray-600'}`}>
                      Individual images for custom video editing
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Size Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={exportSettings.width}
                onChange={(e) => setExportSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                className="w-full px-3 py-1 border rounded"
                min="100"
                max="1920"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                value={exportSettings.height}
                onChange={(e) => setExportSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                className="w-full px-3 py-1 border rounded"
                min="100"
                max="1080"
              />
            </div>
          </div>

          {/* FPS Setting */}
          <div>
            <label className="block text-sm font-medium mb-1">FPS</label>
            <input
              type="number"
              value={exportSettings.fps}
              onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) || 24 }))}
              className="w-full px-3 py-1 border rounded"
              min="1"
              max="60"
            />
          </div>

          {/* Video Quality Setting */}
          <div>
            <label className="block text-sm font-medium mb-1">Quality</label>
            <input
              type="range"
              value={exportSettings.quality}
              onChange={(e) => setExportSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
              className="w-full"
              min="1"
              max="30"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Best (Larger)</span>
              <span>Fastest (Smaller)</span>
            </div>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Exporting...</span>
                <span className="text-sm text-gray-600">{Math.round(progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}