import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()
    const testContent = `Test file created at ${new Date().toISOString()}`
    const testFileName = `verify-test-${Date.now()}.txt`
    
    // Test bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to list buckets: ${bucketError.message}` 
      })
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'cow-images')
    if (!bucketExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bucket "cow-images" does not exist' 
      })
    }
    
    // Try to upload a test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cow-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      return NextResponse.json({ 
        success: false, 
        error: `Upload failed: ${uploadError.message}` 
      })
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('cow-images')
      .getPublicUrl(uploadData.path)
    
    // Clean up - delete the test file
    await supabase.storage
      .from('cow-images')
      .remove([testFileName])
    
    return NextResponse.json({ 
      success: true, 
      message: 'Storage verification successful', 
      testUrl: urlData.publicUrl 
    })
  } catch (error: any) {
    console.error('Verify storage error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 })
  }
} 