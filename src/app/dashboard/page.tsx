import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SearchCows from '@/components/dashboard/search-cows'
import StatsCards from '@/components/dashboard/stats-cards'
import RecentCows from '@/components/dashboard/recent-cows'
import { Suspense } from 'react'

// Add caching - revalidate every 30 seconds
export const revalidate = 30
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // OPTIMIZED: Use count instead of fetching all cows
  const { count: totalCows } = await supabase
    .from('cows')
    .select('*', { count: 'exact', head: true })

  // OPTIMIZED: Get health status counts efficiently
  const { data: healthData } = await supabase
    .from('cows')
    .select('health_status')

  const healthyCows = healthData?.filter(cow => cow.health_status === 'healthy').length || 0
  const underTreatment = healthData?.filter(cow => 
    cow.health_status === 'under_treatment' || 
    cow.health_status === 'sick' || 
    cow.health_status === 'quarantine'
  ).length || 0
  
  // OPTIMIZED: Get this month's registrations with count
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  
  const { count: thisMonthCows } = await supabase
    .from('cows')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth)

  // Get activity logs (keep as is, only fetching 5)
  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles (
        email,
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl p-6" style={{background: 'linear-gradient(90deg, #dfe3ee 0%, #f7f7f7 100%)', border: '1px solid #dfe3ee'}}>
        <div className="flex items-center space-x-4">
          
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Dashboard</h1>
            <p className="font-medium" style={{color: '#3b5998'}}>
              Welcome back, <span className="font-semibold">{profile?.name || profile?.email}</span> 
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold uppercase" style={{backgroundColor: '#dfe3ee', color: '#3b5998'}}>
                {profile?.role}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchCows />

      {/* Stat Cards */}
      <StatsCards 
        totalCows={totalCows || 0}
        healthyCows={healthyCows}
        needCareCows={underTreatment}
        newRegistrations={thisMonthCows || 0}
      />

      {/* Recent Cows Section */}
      <div className="grid gap-6">
        <div className="grid gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
           
          </h2>
          <p className="text-muted-foreground">
           
          </p>
        </div>
        <Suspense fallback={<div>Loading recent cows...</div>}>
          <RecentCows />
        </Suspense>
      </div>
    </div>
  )
} 