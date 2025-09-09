// Supabase Storage integration for New West Event Calendar
import { createClient } from '@supabase/supabase-js'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
}

// Get supabase client
const getSupabaseClient = async () => {
  if (!isSupabaseConfigured()) {
    return null
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Supabase client creation failed:', error)
    return null
  }
}

export interface FileUploadResult {
  path: string
  publicUrl: string
  fullPath: string
}

export interface FileUploadOptions {
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  generateUniqueName?: boolean
}

// Allowed file types for events
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Storage service
export const storageService = {
  // Upload event image
  async uploadEventImage(
    file: File, 
    eventId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.log('Cannot upload - Supabase not configured')
      return null
    }

    try {
      // Validate file
      const validation = this.validateFile(file, {
        maxSize: options.maxSize || MAX_FILE_SIZE,
        allowedTypes: options.allowedTypes || ALLOWED_IMAGE_TYPES
      })

      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Generate file path
      const fileExt = file.name.split('.').pop()
      const fileName = options.generateUniqueName !== false 
        ? `${eventId}_${Date.now()}.${fileExt}`
        : `${eventId}.${fileExt}`
      
      const filePath = `${options.folder || 'event-images'}/${fileName}`

      // Upload file
      const { data, error } = await supabase.storage
        .from('event-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('event-files')
        .getPublicUrl(filePath)

      return {
        path: fileName,
        publicUrl: publicData.publicUrl,
        fullPath: filePath
      }
    } catch (error) {
      console.error('Error uploading event image:', error)
      throw error
    }
  },

  // Upload event document/file
  async uploadEventDocument(
    file: File,
    eventId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> {
    return this.uploadEventImage(file, eventId, {
      ...options,
      folder: options.folder || 'event-documents',
      allowedTypes: options.allowedTypes || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    })
  },

  // Delete file
  async deleteFile(filePath: string): Promise<boolean> {
    const supabase = await getSupabaseClient()
    if (!supabase) return false

    try {
      const { error } = await supabase.storage
        .from('event-files')
        .remove([filePath])

      if (error) {
        console.error('Storage delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  },

  // List files for an event
  async listEventFiles(eventId: string, folder: string = 'event-images'): Promise<string[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) return []

    try {
      const { data, error } = await supabase.storage
        .from('event-files')
        .list(folder, {
          limit: 100,
          offset: 0,
          search: eventId
        })

      if (error) {
        console.error('Storage list error:', error)
        return []
      }

      return data?.map(file => `${folder}/${file.name}`) || []
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  },

  // Get file info
  async getFileInfo(filePath: string) {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    try {
      const { data: publicData } = supabase.storage
        .from('event-files')
        .getPublicUrl(filePath)

      return {
        publicUrl: publicData.publicUrl,
        path: filePath
      }
    } catch (error) {
      console.error('Error getting file info:', error)
      return null
    }
  },

  // Validate file before upload
  validateFile(
    file: File, 
    options: { maxSize?: number; allowedTypes?: string[] } = {}
  ): { isValid: boolean; error?: string } {
    const maxSize = options.maxSize || MAX_FILE_SIZE
    const allowedTypes = options.allowedTypes || ALLOWED_IMAGE_TYPES

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
      }
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes
        .map(type => type.split('/')[1])
        .join(', ')
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedExtensions}`
      }
    }

    return { isValid: true }
  },

  // Create optimized image variants (for future enhancement)
  async createImageVariants(
    originalPath: string,
    sizes: { width: number; height: number; suffix: string }[]
  ): Promise<FileUploadResult[]> {
    // This would use a service like Supabase Edge Functions or a third-party image service
    // For now, return the original
    console.log('Image variant creation not yet implemented')
    return []
  },

  // Batch upload multiple files
  async uploadMultipleFiles(
    files: File[],
    eventId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []
    
    for (const file of files) {
      try {
        const result = await this.uploadEventImage(file, eventId, options)
        if (result) {
          results.push(result)
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    return results
  }
}

// React hook for file uploads
export const useFileUpload = () => {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  const uploadFile = async (
    file: File,
    eventId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await storageService.uploadEventImage(file, eventId, options)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      return result
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
      return null
    } finally {
      setIsUploading(false)
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const uploadMultiple = async (
    files: File[],
    eventId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult[]> => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const results = await storageService.uploadMultipleFiles(files, eventId, options)
      setUploadProgress(100)
      return results
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
      return []
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  return {
    uploadFile,
    uploadMultiple,
    isUploading,
    uploadProgress,
    error,
    clearError: () => setError(null)
  }
}

// Add React import for the hook
import React from 'react'