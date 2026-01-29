"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setError(null)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      setResult(data)
      
      if (!data.success) {
        setError(data.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="mb-4"
              />
              
              {preview && (
                <div className="relative w-full h-64 mb-4">
                  <Image 
                    src={preview} 
                    alt="Preview" 
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
            
            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Upload Result</h3>
                <div className="p-4 bg-gray-50 border rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                  
                  {result.success && result.photoUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Uploaded Image:</p>
                      <div className="relative w-full h-64">
                        <Image 
                          src={result.photoUrl} 
                          alt="Uploaded" 
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 