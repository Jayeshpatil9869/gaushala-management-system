export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cows: {
        Row: {
          id: string
          tracking_id: string
          gender: 'male' | 'female' | 'calf'
          health_status: 'healthy' | 'sick' | 'under_treatment' | 'quarantine'
          source: 'rescue' | 'donation' | 'birth' | 'stray' | 'donated' | 'rescued' | 'transferred'
          adopter_name: string | null
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          profiles?: {
            email: string
            full_name: string | null
          } | null
        }
        Insert: {
          id?: string
          tracking_id: string
          gender: 'male' | 'female' | 'calf'
          health_status?: 'healthy' | 'sick' | 'under_treatment' | 'quarantine'
          source: 'rescue' | 'donation' | 'birth' | 'stray' | 'donated' | 'rescued' | 'transferred'
          adopter_name?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tracking_id?: string
          gender?: 'male' | 'female' | 'calf'
          health_status?: 'healthy' | 'sick' | 'under_treatment' | 'quarantine'
          source?: 'rescue' | 'donation' | 'birth' | 'stray' | 'donated' | 'rescued' | 'transferred'
          adopter_name?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager'
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'manager'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          action: string
          user_id: string | null
          cow_id: string | null
          details: Json | null
          created_at: string
          profiles?: {
            email: string
            full_name: string | null
          } | null
        }
        Insert: {
          id?: string
          action: string
          user_id?: string | null
          cow_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          user_id?: string | null
          cow_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}

export type Cow = Database['public']['Tables']['cows']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Log = Database['public']['Tables']['logs']['Row'] 