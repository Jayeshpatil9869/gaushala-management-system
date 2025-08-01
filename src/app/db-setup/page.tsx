"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function DbSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)
  
  // Run setup automatically on page load
  useEffect(() => {
    runSetup()
  }, [])
  
  const runSetup = async () => {
    setIsLoading(true)
    setError(null)
    setMessages(['Starting database setup...'])
    
    try {
      // Run the direct setup endpoint
      const setupResponse = await fetch('/api/direct-setup')
      const setupData = await setupResponse.json()
      
      if (setupData.messages) {
        setMessages(prev => [...prev, ...setupData.messages])
      }
      
      if (!setupData.success) {
        setError(`Setup failed: ${setupData.error || 'Unknown error'}`)
        setIsLoading(false)
        return
      }
      
      // Test creating the bucket directly
      setMessages(prev => [...prev, 'Testing bucket creation...'])
      const bucketResponse = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
          -- Make sure storage extension is enabled
          CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
          
          -- Ensure bucket exists in storage.buckets
          INSERT INTO storage.buckets (id, name, public, file_size_limit)
          VALUES ('cow-images', 'cow-images', true, 10485760)
          ON CONFLICT (id) DO UPDATE SET 
            public = true,
            file_size_limit = 10485760;
          `
        }),
      })
      
      const bucketData = await bucketResponse.json()
      if (bucketData.error) {
        setMessages(prev => [...prev, `Bucket creation warning: ${bucketData.error}`])
      } else {
        setMessages(prev => [...prev, 'Bucket creation successful'])
      }
      
      setMessages(prev => [...prev, 'Database setup completed successfully!'])
      setSetupComplete(true)
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
          <CardTitle>Database Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              This utility will set up your database and storage for the Gaushala Management System.
            </p>
            
            <Button 
              onClick={runSetup} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Run Setup Again'
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
            
            {setupComplete && (
              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard/register'}
                  variant="outline"
                >
                  Register Cow
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
