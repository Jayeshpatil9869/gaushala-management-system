import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  // Use the environment variables directly
  const supabaseUrl = 'https://enpplseddbfstmefufee.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHBsc2VkZGJmc3RtZWZ1ZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTgyMDUsImV4cCI6MjA2NTYzNDIwNX0.TxFqh1lGx91iKIOIZC-qnjT6n0s1jnBGH9R8SXMwCAE'

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