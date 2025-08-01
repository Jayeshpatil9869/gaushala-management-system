import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClientBrowser() {
  // Use the environment variables directly
  const supabaseUrl = 'https://enpplseddbfstmefufee.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHBsc2VkZGJmc3RtZWZ1ZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTgyMDUsImV4cCI6MjA2NTYzNDIwNX0.TxFqh1lGx91iKIOIZC-qnjT6n0s1jnBGH9R8SXMwCAE'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
} 