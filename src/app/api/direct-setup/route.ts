import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()
    const results = { success: true, messages: [] as string[] }
    
    // 1. Create cow table with age column if it doesn't exist
    try {
      const { error: tableError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.cows (
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
          
          -- Set up RLS if table was just created
          ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
          
          -- Create policies if they don't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'cows' AND policyname = 'Enable read access for all users'
            ) THEN
              CREATE POLICY "Enable read access for all users" ON public.cows
                FOR SELECT USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'cows' AND policyname = 'Enable insert for authenticated users'
            ) THEN
              CREATE POLICY "Enable insert for authenticated users" ON public.cows
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'cows' AND policyname = 'Enable update for authenticated users'
            ) THEN
              CREATE POLICY "Enable update for authenticated users" ON public.cows
                FOR UPDATE USING (auth.role() = 'authenticated');
            END IF;
          END $$;
        `
      })
      
      if (tableError) {
        results.messages.push(`Error creating table: ${tableError.message}`)
      } else {
        results.messages.push('Cow table setup successful')
      }
    } catch (tableError: any) {
      results.messages.push(`Table setup error: ${tableError.message}`)
    }
    
    // 2. Create activity_logs table if it doesn't exist
    try {
      const { error: logsError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            activity_type TEXT NOT NULL,
            description TEXT NOT NULL,
            entity_id UUID,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Set up RLS if table was just created
          ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
          
          -- Create policies if they don't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'activity_logs' AND policyname = 'Enable read access for authenticated users'
            ) THEN
              CREATE POLICY "Enable read access for authenticated users" ON public.activity_logs
                FOR SELECT USING (auth.role() = 'authenticated');
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'activity_logs' AND policyname = 'Enable insert for authenticated users'
            ) THEN
              CREATE POLICY "Enable insert for authenticated users" ON public.activity_logs
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            END IF;
          END $$;
        `
      })
      
      if (logsError) {
        results.messages.push(`Error creating logs table: ${logsError.message}`)
      } else {
        results.messages.push('Activity logs table setup successful')
      }
    } catch (logsError: any) {
      results.messages.push(`Logs table setup error: ${logsError.message}`)
    }
    
    // 3. Create execute_sql function if it doesn't exist
    try {
      const { error: funcError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
          RETURNS JSONB AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE sql_query;
            result := '{"success": true}'::JSONB;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := jsonb_build_object(
              'success', false,
              'error', SQLERRM,
              'detail', SQLSTATE
            );
            RETURN result;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      })
      
      if (funcError) {
        results.messages.push(`Error creating SQL function: ${funcError.message}`)
      } else {
        results.messages.push('SQL execution function created successfully')
      }
    } catch (funcError: any) {
      results.messages.push(`Function setup error: ${funcError.message}`)
    }
    
    // 4. Create bucket for cow images
    try {
      // First try to create the bucket
      await supabase.storage.createBucket('cow-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })
      results.messages.push('Storage bucket created or already exists')
      
      // Now set up public access policy
      const { error: policyError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Create policy for public access to objects in cow-images bucket
          BEGIN;
          
          -- Create policy for public access
          INSERT INTO storage.policies (name, bucket_id, definition)
          VALUES (
            'Public Access',
            'cow-images',
            '(bucket_id = ''cow-images'')'
          )
          ON CONFLICT (name, bucket_id) DO NOTHING;
          
          -- Create policy for authenticated users to upload
          INSERT INTO storage.policies (name, bucket_id, definition, operation)
          VALUES (
            'Authenticated users can upload',
            'cow-images',
            '(bucket_id = ''cow-images'' AND auth.role() = ''authenticated'')',
            'INSERT'
          )
          ON CONFLICT (name, bucket_id, operation) DO NOTHING;
          
          COMMIT;
        `
      })
      
      if (policyError) {
        results.messages.push(`Warning - policy setup: ${policyError.message}`)
      } else {
        results.messages.push('Storage policies created successfully')
      }
    } catch (bucketError: any) {
      // If bucket already exists, this is fine
      if (bucketError.message && bucketError.message.includes('already exists')) {
        results.messages.push('Storage bucket already exists')
      } else {
        results.messages.push(`Bucket setup error: ${bucketError.message}`)
      }
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Direct setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { type } = await request.json()
    
    if (type === 'storage') {
      // Create the bucket if it doesn't exist
      try {
        const { data: buckets } = await supabase.storage.listBuckets()
        
        if (!buckets?.find(bucket => bucket.name === 'cow-images')) {
          await supabase.storage.createBucket('cow-images', {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          })
        }
      } catch (error) {
        console.error('Error creating bucket:', error)
        // Continue execution even if this fails
      }
      
      // Apply SQL directly using the DB setup endpoint
      try {
        const response = await fetch('/api/db-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `
              -- Enable RLS on buckets table
              ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
              
              -- Create bucket policies
              BEGIN;
              DROP POLICY IF EXISTS "Allow public access" ON storage.buckets;
              CREATE POLICY "Allow public access" ON storage.buckets FOR SELECT USING (true);
              
              DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
              CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
              
              -- Enable RLS on objects table
              ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
              
              -- Create object policies
              DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
              CREATE POLICY "Allow public read access" ON storage.objects
                FOR SELECT USING (bucket_id = 'cow-images');
              
              DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
              CREATE POLICY "Allow authenticated insert" ON storage.objects
                FOR INSERT WITH CHECK (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
              
              DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
              CREATE POLICY "Allow authenticated update" ON storage.objects
                FOR UPDATE USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
              
              DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
              CREATE POLICY "Allow authenticated delete" ON storage.objects
                FOR DELETE USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
              COMMIT;
            `
          }),
        })
        
        const data = await response.json()
        if (!data.success) {
          return NextResponse.json({
            success: false,
            error: `DB setup failed: ${data.error || 'Unknown error'}`
          }, { status: 500 })
        }
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `DB setup error: ${error.message || 'Unknown error'}`
        }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid setup type'
    }, { status: 400 })
  } catch (error: any) {
    console.error('Direct setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
} 