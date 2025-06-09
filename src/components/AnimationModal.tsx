import { useState } from 'react'
import AnimationPlayer from './AnimationPlayer'
import ExportModal from './ExportModal'
import { FocalImage } from '../types/canvas'
import { X, Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react'

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
  const [showExportModal, setShowExportModal] = useState(false)

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
                onClick={() => setShowExportModal(true)}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                title="Export animation"
              >
                <Download size={20} />
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
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        images={images}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        animationSettings={{
          fps,
          transition,
          transitionDuration,
          motionTrails,
          trailLength,
          trailOpacity
        }}
      />
    </div>
  )
}