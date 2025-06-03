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
  const [fps, setFps] = useState(24)
  const [currentFrame, setCurrentFrame] = useState(0)

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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">FPS:</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value) || 24)}
                  className="w-16 px-2 py-1 border rounded"
                />
              </div>
              <div className="text-sm text-gray-600">
                Frame {currentFrame + 1} of {images.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}