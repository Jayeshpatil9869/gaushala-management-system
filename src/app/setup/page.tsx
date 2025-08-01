"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const runSetup = async () => {
    setIsLoading(true)
    setError(null)
    setMessages(['Starting database setup...'])
    
    try {
      // Step 1: Run the init-db endpoint
      const initResponse = await fetch('/api/init-db')
      const initData = await initResponse.json()
      
      if (initData.messages) {
        setMessages(prev => [...prev, ...initData.messages])
      }
      
      if (!initData.success) {
        setError(`Database initialization failed: ${initData.error || 'Unknown error'}`)
        setIsLoading(false)
        return
      }
      
      // Step 2: Create the SQL function for executing SQL
      setMessages(prev => [...prev, 'Creating SQL execution function...'])
      const createSqlFnResponse = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
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
        }),
      })
      
      const sqlFnResult = await createSqlFnResponse.json()
      if (sqlFnResult.error) {
        setMessages(prev => [...prev, `SQL function creation warning: ${sqlFnResult.error}`])
      } else {
        setMessages(prev => [...prev, 'SQL execution function created successfully'])
      }
      
      // Step 3: Add the age column directly
      setMessages(prev => [...prev, 'Adding age column to cows table...'])
      const addColumnResponse = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE IF EXISTS public.cows ADD COLUMN IF NOT EXISTS age NUMERIC;'
        }),
      })
      
      const addColumnResult = await addColumnResponse.json()
      if (addColumnResult.error) {
        setMessages(prev => [...prev, `Adding age column warning: ${addColumnResult.error}`])
      } else {
        setMessages(prev => [...prev, 'Age column added successfully'])
      }
      
      // Step 4: Create storage bucket policy
      setMessages(prev => [...prev, 'Setting up storage bucket policy...'])
      const bucketPolicyResponse = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
          BEGIN;
          -- Make sure storage is installed
          CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
          -- Create policy for public access to cow-images bucket
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES ('cow-images', 'cow-images', true, 5242880, '{image/jpeg,image/png,image/webp}')
          ON CONFLICT (id) DO UPDATE SET 
            public = true,
            file_size_limit = 5242880,
            allowed_mime_types = '{image/jpeg,image/png,image/webp}';
          
          -- Create policy for public access to objects
          CREATE POLICY IF NOT EXISTS "Public Access" 
          ON storage.objects FOR SELECT
          USING (bucket_id = 'cow-images');
          
          -- Create policy for authenticated users to upload
          CREATE POLICY IF NOT EXISTS "Authenticated users can upload" 
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          COMMIT;
          `
        }),
      })
      
      const bucketPolicyResult = await bucketPolicyResponse.json()
      if (bucketPolicyResult.error) {
        setMessages(prev => [...prev, `Bucket policy warning: ${bucketPolicyResult.error}`])
      } else {
        setMessages(prev => [...prev, 'Storage bucket policy set up successfully'])
      }
      
      setMessages(prev => [...prev, 'Database setup completed successfully!'])
      setIsLoading(false)
      
    } catch (err: any) {
      setError(`Setup failed: ${err.message || 'Unknown error'}`)
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gaushala Management System Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              This utility will set up your database and storage for the Gaushala Management System.
              Click the button below to initialize the system.
            </p>
            
            <Button 
              onClick={runSetup} 
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)',
                color: 'white'
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #2d4373 0%, #7a8bb8 100%)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Initialize System'
              )}
            </Button>
            
            {error && (
              <div className="p-4 mt-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Setup Progress</h3>
                <div className="p-4 bg-gray-50 border rounded-md overflow-auto max-h-80">
                  {messages.map((message, i) => (
                    <div key={i} className="text-sm mb-1">
                      {i + 1}. {message}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isLoading && messages.length > 0 && !error && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 