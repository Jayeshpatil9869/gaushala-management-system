import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  // Use the correct Supabase project URL and key
  const supabaseUrl = 'https://dxkvwzuattslquqiuncq.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4a3Z3enVhdHRzbHF1cWl1bmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTk2MTEsImV4cCI6MjA4NDM5NTYxMX0.L9IEiIiz6PYzoH7G_eoVnTbDafNPGc7Dy4jzI5DjkJ8'

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 