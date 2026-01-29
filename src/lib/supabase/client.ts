import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClientBrowser() {
  // Use the correct Supabase project URL and key
  const supabaseUrl = 'https://dxkvwzuattslquqiuncq.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4a3Z3enVhdHRzbHF1cWl1bmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTk2MTEsImV4cCI6MjA4NDM5NTYxMX0.L9IEiIiz6PYzoH7G_eoVnTbDafNPGc7Dy4jzI5DjkJ8'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
} 