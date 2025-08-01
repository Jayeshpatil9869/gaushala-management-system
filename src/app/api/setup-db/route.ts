import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()
    const results = { success: true, messages: [] as string[] }
    
    // Create helper functions to check table/column existence
    try {
    await supabase.rpc('create_helper_functions')
      results.messages.push('Created helper functions')
    } catch (error: any) {
      results.messages.push(`Error creating helper functions: ${error.message}`)
    }
    
    // Create the cows table if it doesn't exist
    try {
    await supabase.rpc('create_cow_table_if_not_exists')
      results.messages.push('Ensured cows table exists')
    } catch (error: any) {
      results.messages.push(`Error creating cows table: ${error.message}`)
    }
    
    // Add age column if it doesn't exist
    try {
    await supabase.rpc('add_age_column_if_not_exists')
      results.messages.push('Ensured age column exists')
    } catch (error: any) {
      results.messages.push(`Error adding age column: ${error.message}`)
    }
    
    // Ensure the activity_logs table exists
    try {
    await supabase.rpc('create_activity_logs_table_if_not_exists')
      results.messages.push('Ensured activity_logs table exists')
    } catch (error: any) {
      results.messages.push(`Error creating activity_logs table: ${error.message}`)
    }
    
    // Set up storage bucket and RLS policies
    try {
      // First try the RPC function
      try {
        const { data, error } = await supabase.rpc('setup_storage_rls')
        
        if (error) {
          results.messages.push(`Error setting up storage RLS via RPC: ${error.message}`)
        } else {
          results.messages.push('Storage RLS policies applied successfully')
        }
      } catch (rpcError: any) {
        results.messages.push(`RPC error: ${rpcError.message}`)
      }
      
      // Create the bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets()
      
      if (!buckets?.find(bucket => bucket.name === 'cow-images')) {
        const { error: createError } = await supabase.storage.createBucket('cow-images', {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        })
        
        if (createError) {
          results.messages.push(`Error creating bucket: ${createError.message}`)
        } else {
          results.messages.push('Created cow-images bucket')
        }
      } else {
        results.messages.push('cow-images bucket already exists')
      }
    } catch (storageError: any) {
      results.messages.push(`Storage setup error: ${storageError.message}`)
    }
    
    // Set up filesystem fallback directory
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
        results.messages.push('Created filesystem fallback directory')
      } else {
        results.messages.push('Filesystem fallback directory already exists')
      }
    } catch (fsError: any) {
      results.messages.push(`Filesystem setup error: ${fsError.message}`)
    }
    
    // Test storage methods
    const testResults = await testStorageMethods(supabase)
    results.messages.push(...testResults.messages)
    
    if (testResults.success) {
      results.messages.push('At least one storage method is working')
    } else {
      results.success = false
      results.messages.push('All storage methods failed')
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error in database setup:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Database setup failed: ${error.message}`,
      messages: [`Fatal error: ${error.message}`]
    }, { status: 500 })
  }
}

async function testStorageMethods(supabase: any) {
  const results = { success: false, messages: [] as string[], methods: {} as Record<string, boolean> }
  
  // Test method 1: Direct Supabase upload
  try {
    const testBlob = new Blob(['test content'], { type: 'text/plain' })
    const testFileName = `test-direct-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cow-images')
      .upload(testFileName, testBlob, { upsert: true })
    
    if (uploadError) {
      results.messages.push(`Direct upload failed: ${uploadError.message}`)
      results.methods.direct = false
    } else {
      const { data: urlData } = supabase.storage
        .from('cow-images')
        .getPublicUrl(uploadData.path)
      
      results.messages.push(`Direct upload successful: ${urlData.publicUrl}`)
      results.methods.direct = true
      
      // Clean up
      await supabase.storage.from('cow-images').remove([uploadData.path])
    }
  } catch (directError: any) {
    results.messages.push(`Direct upload error: ${directError.message}`)
    results.methods.direct = false
  }
  
  // Test method 2: Signed URL upload
  try {
    const testFileName = `test-signed-${Date.now()}.txt`
    
    const { data: signedData, error: signedError } = await supabase.storage
      .from('cow-images')
      .createSignedUploadUrl(testFileName)
    
    if (signedError) {
      results.messages.push(`Signed URL creation failed: ${signedError.message}`)
      results.methods.signed = false
    } else {
      const testBlob = new Blob(['test content'], { type: 'text/plain' })
      
      const uploadResponse = await fetch(signedData.signedUrl, {
        method: 'PUT',
        body: testBlob,
        headers: {
          'Content-Type': 'text/plain',
        }
      })
      
      if (!uploadResponse.ok) {
        results.messages.push(`Signed URL upload failed: ${uploadResponse.statusText}`)
        results.methods.signed = false
      } else {
        const { data: urlData } = supabase.storage
          .from('cow-images')
          .getPublicUrl(signedData.path)
        
        results.messages.push(`Signed URL upload successful: ${urlData.publicUrl}`)
        results.methods.signed = true
        
        // Clean up
        await supabase.storage.from('cow-images').remove([signedData.path])
      }
    }
  } catch (signedError: any) {
    results.messages.push(`Signed URL error: ${signedError.message}`)
    results.methods.signed = false
  }
  
  // Test method 3: Filesystem storage
  try {
    const testFileName = `test-fs-${Date.now()}.txt`
    const dirPath = path.join(process.cwd(), 'public', 'uploads')
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    // Write test file
    fs.writeFileSync(path.join(dirPath, testFileName), 'test content')
    
    // Verify file exists
    if (fs.existsSync(path.join(dirPath, testFileName))) {
      results.messages.push(`Filesystem storage successful: /uploads/${testFileName}`)
      results.methods.filesystem = true
      
      // Clean up
      fs.unlinkSync(path.join(dirPath, testFileName))
    } else {
      results.messages.push('Filesystem storage failed: File not created')
      results.methods.filesystem = false
    }
  } catch (fsError: any) {
    results.messages.push(`Filesystem error: ${fsError.message}`)
    results.methods.filesystem = false
  }
  
  // Determine overall success
  results.success = results.methods.direct || results.methods.signed || results.methods.filesystem
  
  return results;
}

// Define the SQL functions in Supabase:
/*
-- Function to create helper functions for checking table/column existence
CREATE OR REPLACE FUNCTION create_helper_functions()
RETURNS void AS $$
BEGIN
  -- Function to check if a table exists
  CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = table_name
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function to check if a column exists
  CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = check_column_exists.table_name
      AND column_name = check_column_exists.column_name
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Function to add age column
  CREATE OR REPLACE FUNCTION add_age_column()
  RETURNS void AS $$
  BEGIN
    ALTER TABLE public.cows ADD COLUMN IF NOT EXISTS age NUMERIC;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Function to create cow table
  CREATE OR REPLACE FUNCTION create_cow_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE public.cows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tracking_id TEXT NOT NULL,
      gender TEXT NOT NULL,
      health_status TEXT NOT NULL DEFAULT 'healthy',
      source TEXT NOT NULL,
      adopter_name TEXT,
      photo_url TEXT,
      notes TEXT,
      age NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      created_by UUID REFERENCES auth.users(id)
    );
    
    -- Set up RLS
    ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable read access for all users" ON public.cows
      FOR SELECT USING (true);
      
    CREATE POLICY "Enable insert for authenticated users" ON public.cows
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
    CREATE POLICY "Enable update for authenticated users" ON public.cows
      FOR UPDATE USING (auth.role() = 'authenticated');
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create cows table if it doesn't exist
CREATE OR REPLACE FUNCTION create_cow_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the cows table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cows') THEN
    -- Create the cows table
    CREATE TABLE public.cows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tracking_id TEXT NOT NULL,
      gender TEXT NOT NULL,
      health_status TEXT NOT NULL DEFAULT 'healthy',
      source TEXT NOT NULL,
      adopter_name TEXT,
      photo_url TEXT,
      notes TEXT,
      age NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      created_by UUID REFERENCES auth.users(id)
    );
    
    -- Set up RLS
    ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable read access for all users" ON public.cows
      FOR SELECT USING (true);
      
    CREATE POLICY "Enable insert for authenticated users" ON public.cows
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
    CREATE POLICY "Enable update for authenticated users" ON public.cows
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add age column if it doesn't exist
CREATE OR REPLACE FUNCTION add_age_column_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the age column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cows' 
    AND column_name = 'age'
  ) THEN
    -- Add the age column
    ALTER TABLE public.cows ADD COLUMN age NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create activity_logs table if it doesn't exist
CREATE OR REPLACE FUNCTION create_activity_logs_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the activity_logs table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    -- Create the activity_logs table
    CREATE TABLE public.activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      entity_id UUID,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Set up RLS
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable read access for authenticated users" ON public.activity_logs
      FOR SELECT USING (auth.role() = 'authenticated');
      
    CREATE POLICY "Enable insert for authenticated users" ON public.activity_logs
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END;
$$ LANGUAGE plpgsql;
*/ 