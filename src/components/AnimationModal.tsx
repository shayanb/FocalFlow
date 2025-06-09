import { useState } from 'react'
import AnimationPlayer from './AnimationPlayer'
import { FocalImage } from '../types/canvas'
import { exportAnimation, downloadBlob } from '../utils/exportUtils'
import { X, Play, Pause, SkipBack, SkipForward, Download, Loader2 } from 'lucide-react'

interface AnimationModalProps {
  images: FocalImage[]
  isOpen: boolean
  onClose: () => void
}

export default function AnimationModal({
  images,
  isOpen,
  onClose
}: AnimationModalProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [fps, setFps] = useState(2)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [transition, setTransition] = useState<'none' | 'fade' | 'dissolve' | 'blend'>('fade')
  const transitionDuration = 0.3
  const [motionTrails, setMotionTrails] = useState(false)
  const [trailLength, setTrailLength] = useState(3)
  const [trailOpacity, setTrailOpacity] = useState(0.3)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState<'webm' | 'gif' | 'frames'>('gif')

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const blob = await exportAnimation(images, {
        format: exportFormat,
        width: 800,
        height: 600,
        fps,
        quality: 10,
        onProgress: setExportProgress,
        transition,
        motionTrails,
        trailLength,
        trailOpacity
      })

      // Determine file extension and name
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      let extension = exportFormat
      if (exportFormat === 'frames') extension = 'zip'
      
      const filename = `focalflow-${timestamp}.${extension}`
      downloadBlob(blob, filename)
      
      // Close export panel on success
      setShowExportPanel(false)
      
    } catch (error) {
      console.error('Export failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Export failed: ${errorMessage}`)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Animation Preview</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Animation Player */}
        <div className="flex-1 bg-gray-900 relative">
          <AnimationPlayer
            images={images}
            isPlaying={isPlaying}
            fps={fps}
            onFrameChange={setCurrentFrame}
            transition={transition}
            transitionDuration={transitionDuration}
            motionTrails={motionTrails}
            trailLength={trailLength}
            trailOpacity={trailOpacity}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentFrame(0)}
                className="p-2 hover:bg-gray-200 rounded"
                title="First frame"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => setCurrentFrame(images.length - 1)}
                className="p-2 hover:bg-gray-200 rounded"
                title="Last frame"
              >
                <SkipForward size={20} />
              </button>
              <button
                onClick={() => setShowExportPanel(!showExportPanel)}
                className={`p-2 text-white rounded ${
                  showExportPanel 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                title={showExportPanel ? "Close export" : "Export animation"}
              >
                {showExportPanel ? <X size={20} /> : <Download size={20} />}
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 mx-8">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">FPS: {fps < 1 ? fps.toFixed(1) : fps}</label>
                  <input
                    type="range"
                    min="0.2"
                    max="30"
                    step="0.1"
                    value={fps}
                    onChange={(e) => setFps(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.2</span>
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">Transition</label>
                  <select
                    value={transition}
                    onChange={(e) => setTransition(e.target.value as 'none' | 'fade' | 'dissolve' | 'blend')}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="blend">Blend</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={motionTrails}
                      onChange={(e) => setMotionTrails(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Motion Trails</span>
                  </label>
                  
                  {motionTrails && (
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Length: {trailLength}</label>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          value={trailLength}
                          onChange={(e) => setTrailLength(parseInt(e.target.value))}
                          className="w-16"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Opacity: {Math.round(trailOpacity * 100)}%</label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.1"
                          value={trailOpacity}
                          onChange={(e) => setTrailOpacity(parseFloat(e.target.value))}
                          className="w-16"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  Frame {currentFrame + 1} of {images.length}
                </div>
              </div>
            </div>

            {/* Export Panel */}
            {showExportPanel && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800">Export Animation</h3>
                  {isExporting && (
                    <span className="text-sm text-gray-600">{Math.round(exportProgress * 100)}%</span>
                  )}
                </div>

                {/* Format Selection */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setExportFormat('gif')}
                    className={`p-2 rounded text-sm ${
                      exportFormat === 'gif'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    GIF
                  </button>
                  <button
                    onClick={() => setExportFormat('webm')}
                    className={`p-2 rounded text-sm ${
                      exportFormat === 'webm'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    WebM
                  </button>
                  <button
                    onClick={() => setExportFormat('frames')}
                    className={`p-2 rounded text-sm ${
                      exportFormat === 'frames'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Frames
                  </button>
                </div>

                {/* Progress Bar */}
                {isExporting && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}