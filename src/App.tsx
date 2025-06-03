import { useState, useCallback } from 'react'
import MultiImageUploader from './components/MultiImageUploader'
import ExpandableCanvas from './components/ExpandableCanvas'
import ImageManipulator from './components/ImageManipulator'
import AnimationModal from './components/AnimationModal'
import FloatingPanel from './components/FloatingPanel'
import ExportModal from './components/ExportModal'
import DraggableImageList from './components/DraggableImageList'
import { FocalImage } from './types/canvas'
import { autoAlignImages } from './core/alignmentEngine'
import { Grid, Move, Zap, Download, Play, RefreshCw, Target, Wand2 } from 'lucide-react'

function App() {
  const [images, setImages] = useState<FocalImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [mode, setMode] = useState<'quick' | 'precision'>('quick')
  const [isMarkingFocalPoints, setIsMarkingFocalPoints] = useState(false)
  const [showAnimationModal, setShowAnimationModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const handleImagesLoad = useCallback((files: File[]) => {
    // Sort files by name first, then by lastModified
    const sortedFiles = [...files].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name)
      if (nameCompare !== 0) return nameCompare
      return a.lastModified - b.lastModified
    })

    const newImages: FocalImage[] = sortedFiles.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      naturalSize: { width: 0, height: 0 },
      transform: {
        position: { 
          x: (index % 5) * 200 - 400, 
          y: Math.floor(index / 5) * 200 - 200 
        },
        scale: 0.5,
        rotation: 0
      },
      opacity: 1,
      timestamp: Date.now() + index,
      imageZoom: 1,
      imageOffset: { x: 0, y: 0 },
      zIndex: images.length + index
    }))

    setImages(prev => [...prev, ...newImages])

    // Load image dimensions
    newImages.forEach(img => {
      const image = new Image()
      image.onload = () => {
        setImages(prev => prev.map(i => 
          i.id === img.id 
            ? { ...i, naturalSize: { width: image.width, height: image.height } }
            : i
        ))
      }
      image.src = img.url
    })
  }, [])

  const handleImageTransform = useCallback((imageId: string, transform: Partial<FocalImage['transform']>) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, transform: { ...img.transform, ...transform } }
        : img
    ))
  }, [])

  const handleDeleteImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
    if (selectedImageId === imageId) {
      setSelectedImageId(null)
    }
  }, [selectedImageId])

  const handleClearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.url))
    setImages([])
    setSelectedImageId(null)
  }, [images])

  const handleResetPositions = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all image positions to their initial layout?')) {
      setImages(prev => prev.map((img, index) => ({
        ...img,
        transform: {
          position: { 
            x: (index % 5) * 200 - 400, 
            y: Math.floor(index / 5) * 200 - 200 
          },
          scale: 0.5,
          rotation: 0
        },
        opacity: 1,
        imageZoom: 1,
        imageOffset: { x: 0, y: 0 },
        zIndex: index
      })))
    }
  }, [])

  const handleSetFocalPoint = useCallback((imageId: string, point: { x: number, y: number }) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, focalPoint: point }
        : img
    ))
  }, [])

  const handleAlignImages = useCallback(() => {
    const alignedImages = autoAlignImages(images)
    setImages(alignedImages)
    setIsMarkingFocalPoints(false)
  }, [images])

  const handleImageZoom = useCallback((imageId: string, zoom: number) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, imageZoom: zoom }
        : img
    ))
  }, [])

  const handleImageOffset = useCallback((imageId: string, offset: { x: number, y: number }) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, imageOffset: offset }
        : img
    ))
  }, [])

  const handleAlignToFocalPoint = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (!image || !image.focalPoint || !image.naturalSize) return

    // Calculate the offset needed to center the focal point
    // The focal point is stored in image coordinates (0,0 at top-left)
    // We need to move it to the center of the frame
    const zoom = image.imageZoom || 1
    
    // Distance from image center to focal point
    const focalOffsetX = image.focalPoint.x - image.naturalSize.width / 2
    const focalOffsetY = image.focalPoint.y - image.naturalSize.height / 2
    
    // Offset needed to center the focal point (inverse of the focal offset, scaled by zoom)
    const offset = {
      x: -focalOffsetX * zoom,
      y: -focalOffsetY * zoom
    }
    
    handleImageOffset(imageId, offset)
  }, [images, handleImageOffset])

  const handleBringToFront = useCallback((imageId: string) => {
    setImages(prev => {
      const maxZ = Math.max(...prev.map(img => img.zIndex))
      return prev.map(img => 
        img.id === imageId 
          ? { ...img, zIndex: maxZ + 1 }
          : img
      )
    })
    setSelectedImageId(imageId)
  }, [])

  const selectedImage = images.find(img => img.id === selectedImageId)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FocalFlow</h1>
              <p className="text-sm text-gray-600">Create mesmerizing animations with stationary focal points</p>
            </div>
            <div className="flex items-center gap-4">
              {images.length > 0 && (
                <button
                  onClick={handleResetPositions}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="Reset all positions"
                >
                  <RefreshCw size={20} />
                </button>
              )}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Toggle grid"
              >
                <Grid size={20} />
              </button>
              <div className="flex bg-gray-100 rounded">
                <button
                  onClick={() => setMode('quick')}
                  className={`px-3 py-1 rounded ${mode === 'quick' ? 'bg-white shadow' : ''}`}
                >
                  <Zap size={16} className="inline mr-1" />
                  Quick
                </button>
                <button
                  onClick={() => setMode('precision')}
                  className={`px-3 py-1 rounded ${mode === 'precision' ? 'bg-white shadow' : ''}`}
                >
                  <Move size={16} className="inline mr-1" />
                  Precision
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Images ({images.length}/50)</h2>
            
            <MultiImageUploader
              onImagesLoad={handleImagesLoad}
              maxImages={50}
              currentImageCount={images.length}
            />

            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Image List</h3>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <DraggableImageList
                  images={images}
                  selectedImageId={selectedImageId}
                  onImageSelect={setSelectedImageId}
                  onImageDelete={handleDeleteImage}
                  onReorder={setImages}
                />
              </div>
            )}

            {images.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h3 className="font-medium mb-3">Focal Point Alignment</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Mark the same object in each image to align them
                </p>
                <button
                  onClick={() => setIsMarkingFocalPoints(!isMarkingFocalPoints)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${
                    isMarkingFocalPoints 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Target size={16} />
                  {isMarkingFocalPoints ? 'Click images to mark focal points' : 'Start marking focal points'}
                </button>
                <div className="mt-3 text-xs text-gray-600">
                  {images.filter(img => img.focalPoint).length} of {images.length} focal points marked
                </div>
                {images.filter(img => img.focalPoint).length >= 2 && (
                  <button
                    onClick={handleAlignImages}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Wand2 size={16} />
                    Align Images
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <ExpandableCanvas
            images={images}
            selectedImageId={selectedImageId}
            onImageSelect={setSelectedImageId}
            onImageTransform={handleImageTransform}
            onSetFocalPoint={handleSetFocalPoint}
            onBringToFront={handleBringToFront}
            gridSize={50}
            showGrid={showGrid}
            mode={mode}
            isMarkingFocalPoints={isMarkingFocalPoints}
          />

          {/* Animation Controls */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 flex items-center gap-4">
              <button
                onClick={() => setShowAnimationModal(true)}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Play size={20} />
              </button>
              <div className="text-sm text-gray-600">
                {images.length} frames
              </div>
              <button 
                onClick={() => setShowExportModal(true)}
                className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <Download size={20} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Animation Modal */}
      <AnimationModal
        images={images}
        isOpen={showAnimationModal}
        onClose={() => setShowAnimationModal(false)}
      />

      {/* Export Modal */}
      <ExportModal
        images={images}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Floating Transform Controls */}
      <FloatingPanel
        isOpen={!!selectedImage}
        onClose={() => setSelectedImageId(null)}
        title={selectedImage ? selectedImage.file.name : 'Transform Controls'}
      >
        {selectedImage && (
          <div className="space-y-3">
            <div className="pb-2 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Frame</h4>
              <div>
                <label className="text-sm text-gray-600">Frame Size</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={selectedImage.transform.scale}
                  onChange={(e) => handleImageTransform(selectedImageId!, { scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{(selectedImage.transform.scale * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="pb-2 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Image</h4>
              <div className="space-y-2">
                <ImageManipulator
                  image={selectedImage}
                  onOffsetChange={(offset) => handleImageOffset(selectedImageId!, offset)}
                  isActive={true}
                />
                <div>
                  <label className="text-sm text-gray-600">Image Zoom</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={selectedImage.imageZoom}
                    onChange={(e) => handleImageZoom(selectedImageId!, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{(selectedImage.imageZoom * 100).toFixed(0)}%</span>
                </div>
                {selectedImage.focalPoint && (
                  <button
                    onClick={() => handleAlignToFocalPoint(selectedImageId!)}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 w-full"
                  >
                    Center on Focal Point
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Rotation</label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={selectedImage.transform.rotation * 180 / Math.PI}
                onChange={(e) => handleImageTransform(selectedImageId!, { rotation: parseFloat(e.target.value) * Math.PI / 180 })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(selectedImage.transform.rotation * 180 / Math.PI)}°</span>
            </div>
            
            <div>
              <label className="text-sm text-gray-600">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedImage.opacity}
                onChange={(e) => {
                  setImages(prev => prev.map(img => 
                    img.id === selectedImageId 
                      ? { ...img, opacity: parseFloat(e.target.value) }
                      : img
                  ))
                }}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(selectedImage.opacity * 100)}%</span>
            </div>
          </div>
        )}
      </FloatingPanel>
    </div>
  )
}

export default App