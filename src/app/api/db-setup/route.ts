import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This is a simplified replacement for the deleted db-setup route
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Just return success since the actual setup is handled by direct-setup
    return NextResponse.json({ 
      success: true, 
      messages: ['Database setup initialized']
    })
  } catch (error: any) {
    console.error('Error in database setup:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Database setup failed: ${error.message}`,
      messages: [`Error: ${error.message}`]
    }, { status: 500 })
  }
}

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

// Handle POST requests for SQL execution
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({ 
        success: false, 
        error: 'SQL statement is required' 
      }, { status: 400 })
    }
    
    // Forward the request to execute-sql endpoint
    const response = await fetch(new URL('/api/execute-sql', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    })
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in DB setup POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Database operation failed: ${error.message}` 
    }, { status: 500 })
  }
} 