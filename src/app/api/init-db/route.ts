import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()
    const results = { success: true, messages: [] as string[] }
    
    // 1. Create storage bucket for cow images
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      
      if (!buckets?.find(bucket => bucket.name === 'cow-images')) {
        const { error } = await supabase.storage.createBucket('cow-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
        })
        
        if (error) {
          results.messages.push(`Error creating bucket: ${error.message}`)
        } else {
          results.messages.push('Created cow-images bucket successfully')
          
          // Set bucket to public
          try {
            await supabase.storage.from('cow-images').getPublicUrl('test.txt')
            // If no error is thrown, the bucket is public
          } catch (policyError: any) {
            results.messages.push(`Warning: Could not verify bucket public access: ${policyError.message}`)
          }
        }
      } else {
        results.messages.push('Cow images bucket already exists')
      }
    } catch (bucketError: any) {
      results.messages.push(`Bucket setup error: ${bucketError.message || JSON.stringify(bucketError)}`)
    }
    
    // 2. Create cows table with all required fields if it doesn't exist
    try {
      // Check if table exists
      const { data: tables } = await supabase.from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'cows')
      
      if (!tables || tables.length === 0) {
        // Table doesn't exist, create it
        const { error: tableError } = await supabase.rpc('create_cow_table_if_not_exists')
        
        if (tableError) {
          results.messages.push(`Error creating cows table: ${tableError.message}`)
        } else {
          results.messages.push('Created cows table successfully')
        }
      } else {
        results.messages.push('Cows table already exists')
        
        // Check if age column exists
        const { error: columnCheckError } = await supabase.from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'cows')
          .eq('column_name', 'age')
        
        if (columnCheckError) {
          results.messages.push(`Error checking age column: ${columnCheckError.message}`)
        } else {
          // Add age column if needed
          const { error: ageColumnError } = await supabase.rpc('add_age_column_if_not_exists')
          
          if (ageColumnError) {
            results.messages.push(`Error adding age column: ${ageColumnError.message}`)
          } else {
            results.messages.push('Age column setup complete')
          }
        }
      }
    } catch (tableError: any) {
      results.messages.push(`Table setup error: ${tableError.message || JSON.stringify(tableError)}`)
    }
    
    // 3. Execute a direct SQL query to add the age column if it doesn't exist
    try {
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: "ALTER TABLE IF EXISTS public.cows ADD COLUMN IF NOT EXISTS age NUMERIC;"
      })
      
      if (sqlError) {
        results.messages.push(`SQL execution error: ${sqlError.message}`)
      } else {
        results.messages.push('Direct SQL execution successful')
      }
    } catch (sqlError: any) {
      results.messages.push(`SQL execution error: ${sqlError.message || JSON.stringify(sqlError)}`)
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred during database initialization' 
    }, { status: 500 })
  }
} 