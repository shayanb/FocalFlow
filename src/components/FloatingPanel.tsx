import { useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface FloatingPanelProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

export default function FloatingPanel({
  isOpen,
  onClose,
  children,
  title
}: FloatingPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!isOpen) return null

  return (
    <div 
      className={`fixed right-4 top-20 bg-white rounded-lg shadow-xl transition-all duration-300 z-50 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        {!isCollapsed && (
          <>
            <h3 className="font-medium">{title}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Collapse panel"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>
          </>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 hover:bg-gray-100 rounded w-full"
            title="Expand panel"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )
}