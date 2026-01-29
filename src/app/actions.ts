'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function createBucketIfNotExists() {
  const supabase = await createClient()
  
  try {
    // The bucket already exists with proper RLS policies
    // Just verify we can access it
    try {
      const { data } = supabase.storage.from('cow-images').getPublicUrl('test.txt')
      if (!data) {
        return { success: false, error: 'Failed to verify bucket access' }
      }
    } catch (accessError: unknown) {
      console.error('Error testing bucket access:', accessError)
      return { success: false, error: 'Failed to verify bucket access' }
    }
    
    return { success: true }
    } catch (error: unknown) {
    console.error('Error in createBucketIfNotExists:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function uploadImage(file: File) {
  const supabase = await createClient()
  
  try {
    // The bucket already exists with proper RLS policies
    // No need to check or create it - just proceed with upload
    
    if (!file || file.size === 0) {
      return { success: true, photoUrl: null }
    }
    
    // Generate a unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const filePath = `cow-${timestamp}.${fileExt}`
    
    // Method 1: Try direct upload first
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cow-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        throw uploadError
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('cow-images')
        .getPublicUrl(uploadData.path)
      
      return { success: true, photoUrl: urlData.publicUrl }
    } catch (uploadError: unknown) {
      console.error('Direct upload failed:', uploadError)
      
      // Method 2: Try using a presigned URL
      try {
        // Get a presigned URL for upload
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('cow-images')
          .createSignedUploadUrl(filePath)
        
        if (signedUrlError) {
          throw signedUrlError
        }
        
        // Upload using the signed URL
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadResponse = await fetch(signedUrlData.signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          }
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`)
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('cow-images')
          .getPublicUrl(signedUrlData.path)
        
        return { success: true, photoUrl: urlData.publicUrl }
      } catch (signedError: unknown) {
        console.error('Error with signed URL upload:', signedError)
        
        // Method 3: Try server-side upload API - use absolute path that works in both client and server
        try {
          // Create a form data object to send the file
          const formData = new FormData()
          formData.append('file', file)
          formData.append('path', filePath)
          
          // Send to our server-side upload endpoint with a path that works in both client and server
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          if (!data.success) {
            throw new Error(data.error || 'Server upload failed')
          }
          
          return { success: true, photoUrl: data.photoUrl }
        } catch (serverError: unknown) {
          console.error('Error with server upload:', serverError)
          
          // Method 4: Last resort - direct filesystem fallback
          try {
            // Create a form data object to send the file
            const fallbackFormData = new FormData()
            fallbackFormData.append('file', file)
            fallbackFormData.append('path', filePath)
            fallbackFormData.append('useFilesystemFallback', 'true')
            
            const fallbackResponse = await fetch('/api/upload-image', {
              method: 'POST',
              body: fallbackFormData,
            })
            
            const fallbackData = await fallbackResponse.json()
            
            if (fallbackData.success) {
              return { success: true, photoUrl: fallbackData.photoUrl }
            }
            
            return { success: false, error: 'All upload methods failed. Please try again later.' }
          } catch (fallbackError: unknown) {
            console.error('Fallback upload error:', fallbackError)
            return { success: false, error: 'All upload methods failed. Please try again later.' }
          }
        }
      }
    }
  } catch (error: unknown) {
    console.error('Error in uploadImage:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function registerCowAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  try {
    const trackingId = formData.get('tracking_id') as string
    const gender = formData.get('gender') as string
    const healthStatus = formData.get('health_status') as string
    const source = formData.get('source') as string
    const notes = formData.get('notes') as string || null
    const adopterName = formData.get('adopter_name') as string || null
    const photoFile = formData.get('photo') as File
    const dateTimeInput = formData.get('date_time') as string || null
    
    // Generate a 12-digit unique ID if tracking_id is not provided
    let finalTrackingId = trackingId
    if (!trackingId || trackingId.trim() === '') {
      // Generate a 12-digit unique ID
      const timestamp = Date.now().toString().slice(-10);
      const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      finalTrackingId = timestamp + randomDigits;
    }

    // Handle date_time field - use current time if not provided
    const registrationDate = dateTimeInput && dateTimeInput.trim() !== '' 
      ? new Date(dateTimeInput).toISOString()
      : new Date().toISOString();

    // Upload image if provided
    let photoUrl = null
    if (photoFile && photoFile.size > 0) {
      // Try using our uploadImage function
      const uploadResult = await uploadImage(photoFile)
      
      if (!uploadResult.success) {
        // If all methods in uploadImage failed, return the error
        return { success: false, error: `Failed to upload image: ${uploadResult.error}` }
      }
      
      photoUrl = uploadResult.photoUrl
    }
    
    // Validate required fields based on database schema
    if (!gender) {
      return { success: false, error: 'Gender is required' }
    }
    
    if (!source) {
      return { success: false, error: 'Source is required' }
    }
    
    // Insert cow record
    const { data: cow, error } = await supabase
      .from('cows')
      .insert({
        tracking_id: finalTrackingId,
        gender,
        health_status: healthStatus || 'healthy',
        source,
        notes,
        photo_url: photoUrl,
        adopter_name: adopterName || null,
        created_by: user.id,
        created_at: registrationDate,
        updated_at: registrationDate
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error registering cow:', error)
      return { success: false, error: error.message }
    }
    
    // Log activity
    try {
      await supabase.from('logs').insert({
        action: 'cow_registration',
        user_id: user.id,
        cow_id: cow.id,
        details: {
          tracking_id: finalTrackingId,
          registration_date: registrationDate
        },
        created_at: new Date().toISOString()
      })
    } catch (logError: unknown) {
      console.error('Error logging activity:', logError)
      // Continue execution even if logging fails
    }
    
    revalidatePath('/dashboard')
    return { success: true, cowId: cow.id }
    
  } catch (error: unknown) {
    console.error('Error in registerCowAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateCowAction(cowId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  try {
    const gender = formData.get('gender') as string
    const healthStatus = formData.get('health_status') as string
    const source = formData.get('source') as string
    const notes = formData.get('notes') as string || null
    const adopterName = formData.get('adopter_name') as string || null
    const photoFile = formData.get('photo') as File
    const dateTimeInput = formData.get('date_time') as string || null
    
    // Get existing cow data
    const { data: existingCow } = await supabase
      .from('cows')
      .select('photo_url, tracking_id, created_at')
      .eq('id', cowId)
      .single()
    
    let photoUrl = existingCow?.photo_url || null
    
    // Upload new image if provided
    if (photoFile && photoFile.size > 0) {
      // Use our improved uploadImage function
      const uploadResult = await uploadImage(photoFile)
      
      if (!uploadResult.success) {
        // If all methods in uploadImage failed, return the error
        return { success: false, error: `Failed to upload image: ${uploadResult.error}` }
      }
      
      photoUrl = uploadResult.photoUrl
    }
    
    // Handle date_time field - use the provided time or keep the existing one
    const updateDate = dateTimeInput && dateTimeInput.trim() !== '' 
      ? new Date(dateTimeInput).toISOString()
      : existingCow?.created_at || new Date().toISOString();
    
    // Update cow record
    const { data: cow, error } = await supabase
      .from('cows')
      .update({
        gender,
        health_status: healthStatus,
        source,
        notes,
        photo_url: photoUrl,
        adopter_name: adopterName,
        created_at: updateDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', cowId)
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Log activity
    try {
      await supabase.from('logs').insert({
        action: 'cow_update',
        user_id: user.id,
        cow_id: cowId,
        details: {
          tracking_id: cow.tracking_id,
          update_date: new Date().toISOString()
        }
      })
    } catch (logError: unknown) {
      console.error('Error logging activity:', logError)
      // Continue execution even if logging fails
    }
    
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/cows/${cowId}`)
    return { success: true }
    
  } catch (error: unknown ) {
    console.error('Error in updateCowAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 