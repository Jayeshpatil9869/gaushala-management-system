import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { writeFile } from 'fs/promises'

export const maxDuration = 60 // Set maximum duration for API route

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filePath = formData.get('path') as string || `cow-${Date.now()}.${file.name.split('.').pop()}`
    const useFilesystemFallback = formData.get('useFilesystemFallback') === 'true'
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // If filesystem fallback is explicitly requested, skip other methods
    if (useFilesystemFallback) {
      const fsPath = await storeInFilesystem(file, filePath)
      if (fsPath) {
        return NextResponse.json({ success: true, photoUrl: fsPath })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Filesystem storage failed' 
        }, { status: 500 })
      }
    }

    // Try multiple methods to upload the image
    try {
      // Method 1: Direct upload to Supabase storage
      const photoUrl = await tryDirectUpload(file, filePath)
      if (photoUrl) {
        return NextResponse.json({ success: true, photoUrl })
      }
      
      // Method 2: Try signed URL upload
      const signedUrl = await trySignedUrlUpload(file, filePath)
      if (signedUrl) {
        return NextResponse.json({ success: true, photoUrl: signedUrl })
      }
      
      // Method 3: Fallback to filesystem storage
      console.log('Supabase storage methods failed, falling back to filesystem storage')
      const fsPath = await storeInFilesystem(file, filePath)
      if (fsPath) {
        return NextResponse.json({ success: true, photoUrl: fsPath })
      }
      
      throw new Error('All upload methods failed')
    } catch (error: any) {
      console.error('Upload error:', error)
      
      // Final attempt - try filesystem storage even if previous attempt failed
      try {
        const fsPath = await storeInFilesystem(file, filePath)
        if (fsPath) {
          return NextResponse.json({ 
            success: true, 
            photoUrl: fsPath,
            message: 'Used filesystem fallback after other methods failed'
          })
        }
      } catch (fsError) {
        console.error('Filesystem fallback failed:', fsError)
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Upload failed: ${error.message}` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    }, { status: 500 })
  }
}

async function tryDirectUpload(file: File, filePath: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Ensure bucket exists
    await ensureBucketExists(supabase)
    
    // Convert File to Buffer for server-side upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload file
    const { data, error } = await supabase.storage
      .from('cow-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      console.error('Direct upload error:', error)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cow-images')
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in direct upload:', error)
    return null
  }
}

async function trySignedUrlUpload(file: File, filePath: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Ensure bucket exists
    await ensureBucketExists(supabase)
    
    // Get signed URL
    const { data, error } = await supabase.storage
      .from('cow-images')
      .createSignedUploadUrl(filePath)
    
    if (error) {
      console.error('Signed URL error:', error)
      return null
    }
    
    // Convert File to Buffer for server-side upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload using signed URL
    const uploadResponse = await fetch(data.signedUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type,
      }
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Signed URL upload failed: ${uploadResponse.statusText}`)
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cow-images')
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in signed URL upload:', error)
    return null
  }
}

async function storeInFilesystem(file: File, filePath: string): Promise<string | null> {
  try {
    // Generate a unique filename
    const uniqueId = uuidv4()
    const fileExt = file.name.split('.').pop()
    const fileName = `cow-${uniqueId}.${fileExt}`
    
    // Define the directory path (in the public folder)
    const dirPath = path.join(process.cwd(), 'public', 'uploads')
    
    // Ensure directory exists
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
    } catch (error) {
      console.error('Error creating directory:', error)
    }
    
    // Define file path
    const fullPath = path.join(dirPath, fileName)
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Write file to filesystem
    await writeFile(fullPath, buffer)
    
    // Return public URL path
    return `/uploads/${fileName}`
  } catch (error) {
    console.error('Error storing in filesystem:', error)
    return null
  }
}

async function ensureBucketExists(supabase: any) {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    
    if (!buckets?.find((bucket: any) => bucket.name === 'cow-images')) {
      // Create the bucket
      await supabase.storage.createBucket('cow-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })
      
      // Try to set up RLS policies
      try {
        // Execute SQL to set up RLS policies
        await supabase.rpc('execute_sql', {
          sql_query: `
            -- Enable RLS on storage.objects
            ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
            
            -- Create policy to allow public read access
            DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
            CREATE POLICY "Allow public read access" 
              ON storage.objects 
              FOR SELECT 
              USING (bucket_id = 'cow-images');
            
            -- Create policy to allow authenticated users to insert objects
            DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
            CREATE POLICY "Allow authenticated insert" 
              ON storage.objects 
              FOR INSERT 
              WITH CHECK (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          `
        })
      } catch (rlsError) {
        console.error('Failed to set up RLS policies:', rlsError)
        // Continue anyway - we'll use fallback methods if needed
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    // Continue anyway - we'll use fallback methods if needed
  }
} 