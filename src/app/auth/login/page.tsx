'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientBrowser()

  useEffect(() => {
    // Initialize database setup
    const initDb = async () => {
      try {
        await fetch('/api/direct-setup')
      } catch (error) {
        console.error('Error initializing database:', error)
      }
    }
    
    initDb()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        router.refresh()
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 px-4 py-8" style={{backgroundColor: '#f7f7f7'}}>
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              Gaushala Management
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Sign in to access the cow management system
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 border-2 rounded-xl transition-all duration-200 focus:bg-white"
                  style={{
                    borderColor: '#dfe3ee',
                    backgroundColor: '#f7f7f7'
                  }}
                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b5998'}
                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#dfe3ee'}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 border-2 rounded-xl transition-all duration-200 focus:bg-white"
                  style={{
                    borderColor: '#dfe3ee',
                    backgroundColor: '#f7f7f7'
                  }}
                  onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b5998'}
                  onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#dfe3ee'}
                  required
                />
              </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
              <Button
                type="submit"
                className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'linear-gradient(90deg, #2d4373 0%, #7a8bb8 100%)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)'}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
          </form>
          
            <div className="mt-8 p-6 rounded-xl border" style={{background: 'linear-gradient(90deg, #dfe3ee 0%, #f7f7f7 100%)', borderColor: '#dfe3ee'}}>
              <h3 className="font-semibold text-sm mb-3 flex items-center" style={{color: '#3b5998'}}>
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: '#3b5998'}}></span>
                Test Credentials
              </h3>
              <div className="text-sm space-y-2" style={{color: '#000000'}}>
                <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                  <span className="font-medium">Admin:</span>
                  <span className="text-xs font-mono">admin@gaushala.com / Admin@123</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                  <span className="font-medium">Manager:</span>
                  <span className="text-xs font-mono">manager@gaushala.com / Manager@123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 