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
    
    // 1. Set up filesystem fallback directory
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
    
    // 2. Check if the bucket exists
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        results.messages.push(`Error checking buckets: ${bucketError.message}`)
      } else {
        const bucketExists = buckets?.some(bucket => bucket.name === 'cow-images')
        
        if (bucketExists) {
          results.messages.push('Bucket "cow-images" already exists')
        } else {
          results.messages.push('Bucket "cow-images" does not exist, will create it')
          
          // Create the bucket
          const { error: createError } = await supabase.storage.createBucket('cow-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })
      
          if (createError) {
            results.messages.push(`Error creating bucket: ${createError.message}`)
            
            // Try direct SQL approach as fallback
            try {
              await supabase.rpc('execute_sql', { 
                sql_query: `INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
                           VALUES ('cow-images', 'cow-images', auth.uid(), now(), now(), true)
                           ON CONFLICT (id) DO NOTHING;`
              });
              results.messages.push('Created bucket via direct SQL (fallback)');
            } catch (sqlError: any) {
              results.messages.push(`SQL bucket creation failed: ${sqlError.message}`);
            }
          } else {
            results.messages.push('Bucket created successfully')
          }
        }
      }
    } catch (bucketError: any) {
      results.messages.push(`Bucket check error: ${bucketError.message}`)
    }
    
    // 3. Apply RLS policies using execute_sql function
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
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
          
          -- Create policy to allow authenticated users to update their own objects
          DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
          CREATE POLICY "Allow authenticated update" 
            ON storage.objects 
            FOR UPDATE 
            USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          -- Create policy to allow authenticated users to delete their own objects
          DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
          CREATE POLICY "Allow authenticated delete" 
            ON storage.objects 
            FOR DELETE 
            USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          -- Enable RLS on storage.buckets
          ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
          
          -- Create policy to allow authenticated users to create buckets
          DROP POLICY IF EXISTS "Allow authenticated create buckets" ON storage.buckets;
          CREATE POLICY "Allow authenticated create buckets" 
            ON storage.buckets 
            FOR INSERT 
            WITH CHECK (auth.role() = 'authenticated');
          
          -- Create policy to allow public read access to buckets
          DROP POLICY IF EXISTS "Allow public read buckets" ON storage.buckets;
          CREATE POLICY "Allow public read buckets" 
            ON storage.buckets 
            FOR SELECT 
            USING (true);
        `
      })
      
      if (error) {
        results.messages.push(`Error setting up RLS: ${error.message}`)
        } else {
        results.messages.push('Storage RLS policies applied successfully')
      }
    } catch (rlsError: any) {
      results.messages.push(`RLS function error: ${rlsError.message}`)
    }
    
    // 4. Test filesystem fallback
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
        results.messages.push(`Filesystem storage verified: /uploads/${testFileName}`)
        
        // Clean up
        fs.unlinkSync(path.join(dirPath, testFileName))
        results.messages.push('Test file cleaned up')
      } else {
        results.messages.push('Filesystem storage failed: File not created')
      }
    } catch (fsError: any) {
      results.messages.push(`Filesystem test error: ${fsError.message}`)
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Fix storage error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 })
  }
} 