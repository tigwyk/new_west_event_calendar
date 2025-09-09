"use client"
import React, { useState, useCallback } from 'react'
import { useFileUpload, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../lib/storage'

interface EventImageUploadProps {
  eventId: string
  existingImages?: string[]
  onImagesChange?: (images: string[]) => void
  maxImages?: number
  allowMultiple?: boolean
  disabled?: boolean
}

const EventImageUpload: React.FC<EventImageUploadProps> = ({
  eventId,
  existingImages = [],
  onImagesChange,
  maxImages = 5,
  allowMultiple = true,
  disabled = false
}) => {
  const [images, setImages] = useState<string[]>(existingImages)
  const [dragActive, setDragActive] = useState(false)
  const { uploadFile, uploadMultiple, isUploading, uploadProgress, error, clearError } = useFileUpload()

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    if (disabled || isUploading) return

    clearError()
    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed the maximum
    if (images.length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`)
      return
    }

    try {
      let results
      if (fileArray.length === 1) {
        const result = await uploadFile(fileArray[0], eventId, {
          folder: 'event-images',
          generateUniqueName: true
        })
        results = result ? [result] : []
      } else {
        results = await uploadMultiple(fileArray, eventId, {
          folder: 'event-images',
          generateUniqueName: true
        })
      }

      if (results.length > 0) {
        const newImageUrls = results.map(r => r.publicUrl)
        const updatedImages = [...images, ...newImageUrls]
        setImages(updatedImages)
        onImagesChange?.(updatedImages)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    }
  }, [eventId, images, maxImages, disabled, isUploading, uploadFile, uploadMultiple, onImagesChange, clearError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files)
    }
    // Reset input value to allow uploading the same file again
    e.target.value = ''
  }, [handleImageUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files).filter(file => 
      ALLOWED_IMAGE_TYPES.includes(file.type)
    )
    
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }, [disabled, isUploading, handleImageUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setDragActive(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const removeImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
  }, [images, onImagesChange])

  const canUploadMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && document.getElementById('image-upload-input')?.click()}
        >
          <input
            id="image-upload-input"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            multiple={allowMultiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="space-y-3">
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {dragActive ? 'Drop images here' : 'Upload event images'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP up to {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB
                  {allowMultiple && ` (max ${maxImages - images.length} more)`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Event Images ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={imageUrl}
                  alt={`Event image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Primary image indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reorder hint */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The first image will be used as the primary event image. Drag to reorder (coming soon).
          </p>
        </div>
      )}

      {/* Max images reached */}
      {!canUploadMore && (
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Maximum number of images reached ({maxImages}). Remove an image to add a new one.
          </p>
        </div>
      )}
    </div>
  )
}

export default EventImageUpload