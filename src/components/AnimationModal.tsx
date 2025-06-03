import { useState } from 'react'
import AnimationPlayer from './AnimationPlayer'
import { FocalImage } from '../types/canvas'
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react'

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
  const [fps, setFps] = useState(12)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [transition, setTransition] = useState<'none' | 'fade' | 'dissolve' | 'blend'>('fade')
  const transitionDuration = 0.3
  const [motionTrails, setMotionTrails] = useState(false)

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
            </div>

            <div className="flex flex-col gap-3 flex-1 mx-8">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">FPS: {fps}</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>15</span>
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={motionTrails}
                    onChange={(e) => setMotionTrails(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Motion Trails</span>
                </label>
                
                <div className="text-sm text-gray-600">
                  Frame {currentFrame + 1} of {images.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}