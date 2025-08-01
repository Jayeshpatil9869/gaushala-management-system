import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import SummaryCards from '@/components/dashboard/summary-cards'
import CowSearchList from '@/components/dashboard/cow-search-list'
import HealthStatusCards from '@/components/dashboard/health-status-cards'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch all cows for reports
  const { data: cows, error: cowsError } = await supabase
    .from('cows')
    .select('*')
  
  if (cowsError) {
    console.error('Error fetching cows:', cowsError)
  }
  
  // Generate reports data
  const totalCows = cows?.length || 0
  
  // Health status report
  const healthStatusCounts = {
    healthy: cows?.filter(cow => cow.health_status === 'healthy').length || 0,
    sick: cows?.filter(cow => cow.health_status === 'sick').length || 0,
    under_treatment: cows?.filter(cow => cow.health_status === 'under_treatment').length || 0,
    quarantine: cows?.filter(cow => cow.health_status === 'quarantine').length || 0,
  }
  
  // Gender report
  const genderCounts = {
    female: cows?.filter(cow => cow.gender === 'female').length || 0,
    male: cows?.filter(cow => cow.gender === 'male').length || 0,
    calf: cows?.filter(cow => cow.gender === 'calf').length || 0,
  }
  
  // Source report
  const sourceCounts = {
    donation: cows?.filter(cow => cow.source === 'donation').length || 0,
    rescue: cows?.filter(cow => cow.source === 'rescue').length || 0,
    birth: cows?.filter(cow => cow.source === 'birth').length || 0,
    stray: cows?.filter(cow => cow.source === 'stray').length || 0,
    transferred: cows?.filter(cow => cow.source === 'transferred').length || 0,
  }
  
  // Calculate cows needing care
  const needCareCows = healthStatusCounts.sick + healthStatusCounts.under_treatment + healthStatusCounts.quarantine
  
  // Monthly registrations
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  
  const monthlyRegistrations = {
    thisMonth: cows?.filter(cow => {
      const createdAt = new Date(cow.created_at)
      return createdAt >= thisMonth
    }).length || 0,
    lastMonth: cows?.filter(cow => {
      const createdAt = new Date(cow.created_at)
      return createdAt >= lastMonth && createdAt < thisMonth
    }).length || 0,
    twoMonthsAgo: cows?.filter(cow => {
      const createdAt = new Date(cow.created_at)
      return createdAt >= twoMonthsAgo && createdAt < lastMonth
    }).length || 0,
  }
  
  // Get maximum value for registration trend
  const maxRegistration = Math.max(
    monthlyRegistrations.thisMonth,
    monthlyRegistrations.lastMonth,
    monthlyRegistrations.twoMonthsAgo,
    1 // Prevent divide by zero
  )
  
  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{background: 'linear-gradient(90deg, #dfe3ee 0%, #f7f7f7 100%)', border: '1px solid #dfe3ee'}}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{background: 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)'}}>
            <span className="text-white text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Reports</h1>
            <p className="text-sm font-medium" style={{color: '#3b5998'}}>View statistics about the gaushala</p>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .reports-tab-trigger {
            color: #3b5998;
          }
          .reports-tab-trigger[data-state="active"] {
            background: linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%) !important;
            color: white !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
        `
      }} />
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm rounded-xl p-0.5 shadow-md h-11" style={{border: '1px solid #dfe3ee'}}>
          <TabsTrigger 
            value="all" 
            className="reports-tab-trigger rounded-lg font-medium text-[10px] sm:text-sm transition-all duration-200 hover:bg-gray-50 px-0.5 sm:px-3 leading-tight"
          >
            <span className="hidden sm:inline">📈 </span>All
          </TabsTrigger>
          <TabsTrigger 
            value="health" 
            className="reports-tab-trigger rounded-lg font-medium text-[10px] sm:text-sm transition-all duration-200 hover:bg-gray-50 px-0.5 sm:px-3 leading-tight"
          >
            <span className="hidden sm:inline">💚 </span>Health
          </TabsTrigger>
          <TabsTrigger 
            value="demographics" 
            className="reports-tab-trigger rounded-lg font-medium text-[10px] sm:text-sm transition-all duration-200 hover:bg-gray-50 px-0.5 sm:px-3 leading-tight"
          >
            <span className="hidden sm:inline">👥 </span>Demographics
          </TabsTrigger>
          <TabsTrigger 
            value="registrations" 
            className="reports-tab-trigger rounded-lg font-medium text-[10px] sm:text-sm transition-all duration-200 hover:bg-gray-50 px-0.5 sm:px-3 leading-tight"
          >
            <span className="hidden sm:inline">📅 </span>Registrations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4 space-y-4 animate-in fade-in-50">
          <SummaryCards 
            totalCows={totalCows}
            healthyCows={healthStatusCounts.healthy}
            needCareCows={needCareCows}
            thisMonthCows={monthlyRegistrations.thisMonth}
          />
          
          <CowSearchList cows={cows || []} />
        </TabsContent>
        
        <TabsContent value="health" className="mt-4 space-y-4 animate-in fade-in-50">
          <HealthStatusCards 
            healthStatusCounts={healthStatusCounts}
          />
          
          <Card className="shadow-lg" style={{border: '1px solid #dfe3ee'}}>
            <CardHeader style={{borderBottom: '1px solid #dfe3ee'}}>
              <CardTitle style={{color: '#3b5998'}}>Health Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pt-4">
              <div className="w-full max-w-md">
                <div className="h-10 w-full flex rounded-lg overflow-hidden shadow">
                  {totalCows > 0 ? (
                    <>
                      <div 
                        className="transition-all duration-700" 
                        style={{ 
                          width: `${(healthStatusCounts.healthy / totalCows) * 100}%`,
                          backgroundColor: '#22c55e'
                        }}
                        title={`Healthy: ${healthStatusCounts.healthy}`}
                      />
                      <div 
                        className="bg-yellow-500 transition-all duration-700" 
                        style={{ width: `${(healthStatusCounts.sick / totalCows) * 100}%` }}
                        title={`Sick: ${healthStatusCounts.sick}`}
                      />
                      <div 
                        className="bg-blue-500 transition-all duration-700" 
                        style={{ width: `${(healthStatusCounts.under_treatment / totalCows) * 100}%` }}
                        title={`Under Treatment: ${healthStatusCounts.under_treatment}`}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-700" 
                        style={{ width: `${(healthStatusCounts.quarantine / totalCows) * 100}%` }}
                        title={`Quarantine: ${healthStatusCounts.quarantine}`}
                      />
                    </>
                  ) : (
                    <div className="bg-gray-200 w-full" />
                  )}
                </div>
                <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1 rounded-full" style={{backgroundColor: '#16a34a'}} />
                    Healthy
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 mr-1 rounded-full" />
                    Sick
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 mr-1 rounded-full" />
                    Treatment
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 mr-1 rounded-full" />
                    Quarantine
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demographics" className="mt-6 space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-blue-800">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-4">
                <div className="w-full max-w-md">
                  <div className="h-12 w-full flex rounded-lg overflow-hidden shadow">
                    {totalCows > 0 ? (
                      <>
                        <div 
                          className="bg-pink-400 transition-all duration-700" 
                          style={{ width: `${(genderCounts.female / totalCows) * 100}%` }}
                          title={`Female: ${genderCounts.female}`}
                        />
                        <div 
                          className="bg-blue-400 transition-all duration-700" 
                          style={{ width: `${(genderCounts.male / totalCows) * 100}%` }}
                          title={`Male: ${genderCounts.male}`}
                        />
                        <div 
                          className="bg-purple-400 transition-all duration-700" 
                          style={{ width: `${(genderCounts.calf / totalCows) * 100}%` }}
                          title={`Calf: ${genderCounts.calf}`}
                        />
                      </>
                    ) : (
                      <div className="bg-gray-200 w-full" />
                    )}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-pink-400 mr-1 rounded-full" />
                      Female
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-400 mr-1 rounded-full" />
                      Male
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-400 mr-1 rounded-full" />
                      Calf
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-purple-800">Source Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 mr-2 rounded-full"></div>
                      <span>Donation</span>
                    </div>
                    <span className="font-medium">{sourceCounts.donation}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${totalCows > 0 ? (sourceCounts.donation / totalCows) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 mr-2 rounded-full"></div>
                      <span>Rescue</span>
                    </div>
                    <span className="font-medium">{sourceCounts.rescue}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500" 
                      style={{ width: `${totalCows > 0 ? (sourceCounts.rescue / totalCows) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#16a34a'}}></div>
                      <span>Birth</span>
                    </div>
                    <span className="font-medium">{sourceCounts.birth}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full" 
                      style={{
                        backgroundColor: '#16a34a',
                        width: `${totalCows > 0 ? (sourceCounts.birth / totalCows) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 mr-2 rounded-full"></div>
                      <span>Stray</span>
                    </div>
                    <span className="font-medium">{sourceCounts.stray}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${totalCows > 0 ? (sourceCounts.stray / totalCows) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 mr-2 rounded-full"></div>
                      <span>Transferred</span>
                    </div>
                    <span className="font-medium">{sourceCounts.transferred}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${totalCows > 0 ? (sourceCounts.transferred / totalCows) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="registrations" className="mt-6 space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-purple-800">Registration Trend</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-4">
                <div className="w-full max-w-md">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 text-center">
                      <p className="text-xs text-purple-600 font-medium">This Month</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {monthlyRegistrations.thisMonth}
                      </p>
                      <div className="h-32 flex items-end justify-center pt-2">
                        <div 
                          className="w-12 bg-purple-500 rounded-t-lg transition-all duration-700" 
                          style={{ height: `${(monthlyRegistrations.thisMonth / maxRegistration) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 text-center">
                      <p className="text-xs text-purple-600 font-medium">Last Month</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {monthlyRegistrations.lastMonth}
                      </p>
                      <div className="h-32 flex items-end justify-center pt-2">
                        <div 
                          className="w-12 bg-purple-400 rounded-t-lg transition-all duration-700" 
                          style={{ height: `${(monthlyRegistrations.lastMonth / maxRegistration) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 text-center">
                      <p className="text-xs text-purple-600 font-medium">2 Months Ago</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {monthlyRegistrations.twoMonthsAgo}
                      </p>
                      <div className="h-32 flex items-end justify-center pt-2">
                        <div 
                          className="w-12 bg-purple-300 rounded-t-lg transition-all duration-700" 
                          style={{ height: `${(monthlyRegistrations.twoMonthsAgo / maxRegistration) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 