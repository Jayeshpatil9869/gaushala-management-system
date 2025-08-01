"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function FixBucketPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)
  
  // Run fix automatically on page load
  useEffect(() => {
    runFix()
  }, [])
  
  const runFix = async () => {
    setIsLoading(true)
    setError(null)
    setMessages(['Starting storage bucket fix...'])
    
    try {
      // Try the new setup-db endpoint first
      setMessages(prev => [...prev, 'Calling setup-db endpoint...'])
      const setupResponse = await fetch('/api/setup-db')
      const setupData = await setupResponse.json()
      
      if (setupData.success) {
        setMessages(prev => [...prev, 'Storage bucket setup completed successfully!'])
        setSetupComplete(true)
        setIsLoading(false)
        return
      } else {
        setMessages(prev => [...prev, `Setup-db failed: ${setupData.error || 'Unknown error'}`])
      }
      
      // If that fails, try the fix-storage endpoint
      setMessages(prev => [...prev, 'Trying fix-storage endpoint...'])
      const response = await fetch('/api/fix-storage')
      const data = await response.json()
      
      if (data.messages) {
        setMessages(prev => [...prev, ...data.messages])
      }
      
      if (!data.success) {
        setError(`Fix failed: ${data.error || 'Unknown error'}`)
        setIsLoading(false)
        return
      }
      
      // Test if the bucket is working
      setMessages(prev => [...prev, 'Testing bucket access...'])
      try {
        const testResponse = await fetch('/api/test-bucket')
        const testData = await testResponse.json()
        
        if (testData.success) {
          setMessages(prev => [...prev, 'Bucket access test successful!'])
        } else {
          setMessages(prev => [...prev, `Bucket test failed: ${testData.error || 'Unknown error'}`])
          setError('Storage bucket fix completed but access test failed. Please try again.')
          setIsLoading(false)
          return
        }
      } catch (testError: any) {
        setMessages(prev => [...prev, `Bucket test error: ${testError.message || 'Unknown error'}`])
      }
      
      setMessages(prev => [...prev, 'Storage bucket fix completed successfully!'])
      setSetupComplete(true)
      setIsLoading(false)
    } catch (err: any) {
      setError(`Fix failed: ${err.message || 'Unknown error'}`)
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Fix Storage Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              This utility will fix the storage bucket and RLS policies for the Gaushala Management System.
            </p>
            
            <Button 
              onClick={runFix} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Run Fix Again'
              )}
            </Button>
            
            {error && (
              <div className="p-4 mt-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Progress</h3>
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
                  onClick={() => window.location.href = '/dashboard/register'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Register Cow
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 