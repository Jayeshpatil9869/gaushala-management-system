"use client"

import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { X, Upload } from "lucide-react"

interface ImageUploadProps {
  name: string
  defaultValue?: string
  onChange?: (file: File | null) => void
}

export default function ImageUpload({ name, defaultValue, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set default value on mount
  useEffect(() => {
    if (defaultValue) {
      setPreview(defaultValue)
    }
  }, [defaultValue])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5MB.")
        return
      }

      setUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setUploading(false)
        if (onChange) onChange(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onChange) onChange(null)
  }

  return (
    <div className="space-y-2">
      <div 
        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors"
        style={{
          borderColor: '#dfe3ee',
          backgroundColor: '#f7f7f7'
        }}
        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8b9dc3'}
        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#dfe3ee'}
        onClick={handleClick}
      >
        {preview ? (
          <div className="relative w-full h-64 mb-2">
            <Image 
              src={preview} 
              alt="Preview" 
              fill
              className="object-contain rounded-md"
            />
            <button 
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{borderColor: '#3b5998'}}></div>
                <p className="mt-2 text-sm" style={{color: '#8b9dc3'}}>Uploading...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7f7f7'}}>
                  <Upload size={28} style={{color: '#3b5998'}} />
                </div>
                <p className="mt-4 text-sm font-medium" style={{color: '#3b5998'}}>Click to upload an image of the cow</p>
                <p className="text-xs mt-1" style={{color: '#8b9dc3'}}>PNG, JPG, WEBP up to 5MB</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <Input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        key={preview ? 'file-input-with-preview' : 'file-input-no-preview'}
      />
    </div>
  )
} 