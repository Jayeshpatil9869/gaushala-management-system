import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxkvwzuattslquqiuncq.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4a3Z3enVhdHRzbHF1cWl1bmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgxOTYxMSwiZXhwIjoyMDg0Mzk1NjExfQ.Is4oNhJN84YtOTxBVUGx96r1iRM7E35TZHTPxUaktKc'
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured. Please set SUPABASE_SERVICE_ROLE_KEY in environment variables.' },
        { status: 500 }
      )
    }

    // Use admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const adminEmail = 'admin@gaushala.com'
    const adminPassword = 'admin@123'

    // Get the admin user
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 }
      )
    }

    const adminUser = users?.users?.find(u => u.email === adminEmail)

    if (adminUser) {
      // Update existing user's password
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        {
          password: adminPassword,
          email_confirm: true,
        }
      )

      if (updateError) {
        console.error('Error updating user password:', updateError)
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Admin password updated successfully',
        user: updateData.user?.email 
      })
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
        },
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 500 }
        )
      }

      // Create profile
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user!.id,
          email: adminEmail,
          full_name: 'Admin User',
          role: 'admin',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      return NextResponse.json({ 
        success: true, 
        message: 'Admin user created successfully',
        user: newUser.user?.email 
      })
    }
  } catch (error) {
    console.error('Error in reset-admin-password:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
