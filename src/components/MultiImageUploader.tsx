import { useCallback } from 'react'
import { Upload } from 'lucide-react'

interface MultiImageUploaderProps {
  onImagesLoad: (files: File[]) => void
  maxImages?: number
  currentImageCount: number
}

export default function MultiImageUploader({ 
  onImagesLoad, 
  maxImages = 50,
  currentImageCount 
}: MultiImageUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, maxImages - currentImageCount)
    
    if (files.length > 0) {
      onImagesLoad(files)
    }
  }, [onImagesLoad, maxImages, currentImageCount])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
      .filter(file => file.type.startsWith('image/'))
      .slice(0, maxImages - currentImageCount)
    
    if (files.length > 0) {
      onImagesLoad(files)
    }
  }, [onImagesLoad, maxImages, currentImageCount])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const remainingSlots = maxImages - currentImageCount

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop images here, or click to select
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {remainingSlots > 0 
          ? `You can add up to ${remainingSlots} more images`
          : 'Maximum images reached'}
      </p>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={remainingSlots === 0}
      />
      <label
        htmlFor="file-upload"
        className={`mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
          remainingSlots === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        Select Images
      </label>
    </div>
  )
}