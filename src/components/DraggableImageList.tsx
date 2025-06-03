import { useState } from 'react'
import { FocalImage } from '../types/canvas'
import { Target, GripVertical } from 'lucide-react'

interface DraggableImageListProps {
  images: FocalImage[]
  selectedImageId: string | null
  onImageSelect: (imageId: string) => void
  onImageDelete: (imageId: string) => void
  onReorder: (images: FocalImage[]) => void
  onBringToFront?: (imageId: string) => void
}

export default function DraggableImageList({
  images,
  selectedImageId,
  onImageSelect,
  onImageDelete,
  onReorder,
  onBringToFront
}: DraggableImageListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedId(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, imageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedId && draggedId !== imageId) {
      setDragOverId(imageId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault()
    
    if (!draggedId || draggedId === dropTargetId) return

    const draggedIndex = images.findIndex(img => img.id === draggedId)
    const dropIndex = images.findIndex(img => img.id === dropTargetId)

    if (draggedIndex === -1 || dropIndex === -1) return

    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)

    // Update z-index based on new order
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      zIndex: index
    }))

    onReorder(reorderedImages)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="space-y-2">
      {images.map(img => (
        <div
          key={img.id}
          draggable
          onDragStart={(e) => handleDragStart(e, img.id)}
          onDragOver={(e) => handleDragOver(e, img.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, img.id)}
          onDragEnd={handleDragEnd}
          onClick={() => onImageSelect(img.id)}
          onDoubleClick={() => onBringToFront?.(img.id)}
          className={`p-2 rounded cursor-pointer flex items-center gap-2 transition-all ${
            img.id === selectedImageId 
              ? 'bg-blue-50 border-blue-300 border' 
              : 'hover:bg-gray-50'
          } ${
            dragOverId === img.id ? 'border-t-2 border-blue-400' : ''
          } ${
            draggedId === img.id ? 'opacity-50' : ''
          }`}
        >
          <div className="cursor-move">
            <GripVertical size={16} className="text-gray-400" />
          </div>
          <img
            src={img.url}
            alt=""
            className="w-12 h-12 object-cover rounded"
          />
          <div className="flex-1 text-sm">
            <div className="font-medium truncate flex items-center gap-1">
              {img.file.name}
              {img.focalPoint && <Target size={12} className="text-blue-600" />}
            </div>
            <div className="text-gray-500 text-xs">
              {Math.round(img.file.size / 1024)} KB
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onImageDelete(img.id)
            }}
            className="text-red-500 hover:text-red-600 text-xs"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}