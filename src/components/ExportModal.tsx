import { useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { FocalImage } from '../types/canvas'
import { exportToGIF, downloadBlob } from '../utils/exportUtils'

interface ExportModalProps {
  images: FocalImage[]
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({
  images,
  isOpen,
  onClose
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportSettings, setExportSettings] = useState({
    format: 'gif' as 'gif' | 'mp4',
    width: 800,
    height: 600,
    fps: 24,
    quality: 10 // GIF quality (1-30, lower is better)
  })

  if (!isOpen) return null

  const handleExport = async () => {
    if (exportSettings.format === 'gif') {
      setIsExporting(true)
      setProgress(0)

      try {
        const blob = await exportToGIF(images, {
          ...exportSettings,
          onProgress: setProgress
        })

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        downloadBlob(blob, `focalflow-${timestamp}.gif`)
      } catch (error) {
        console.error('Export failed:', error)
        alert('Failed to export GIF. Please try again.')
      } finally {
        setIsExporting(false)
        setProgress(0)
      }
    } else {
      alert('MP4 export coming soon!')
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
            disabled={isExporting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportSettings(prev => ({ ...prev, format: 'gif' }))}
                className={`p-2 rounded border ${
                  exportSettings.format === 'gif'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                GIF
              </button>
              <button
                onClick={() => setExportSettings(prev => ({ ...prev, format: 'mp4' }))}
                className={`p-2 rounded border ${
                  exportSettings.format === 'mp4'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                MP4 (Coming Soon)
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

          {/* Quality Setting (GIF only) */}
          {exportSettings.format === 'gif' && (
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
                <span>Best</span>
                <span>Smallest</span>
              </div>
            </div>
          )}

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
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportSettings.format === 'mp4'}
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