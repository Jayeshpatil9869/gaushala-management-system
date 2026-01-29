import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

export default async function LogsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch activity logs with profile information
  const { data: logs } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles:created_by (email, name)
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Activity types and their respective icons
  const activityIcons: Record<string, string> = {
    'cow_registered': '🐄',
    'cow_updated': '✏️',
    'health_check': '🩺',
    'treatment': '💉',
    'feeding': '🌾',
    'milking': '🥛',
    'user_login': '🔐',
    'user_created': '👤',
    'cow_transferred': '🔄',
    'other': '📝'
  }

  // Helper function to capitalize each word in a string
  const capitalizeWords = (str: string): string => {
    return str.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Activity Logs</h1>
        <p style={{color: '#8b9dc3'}}>Recent activity in the gaushala management system</p>
      </div>
      
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className='pt-6'>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-8 pb-8 border-l border-gray-200">
                  {/* Activity marker */}
                  <div className="absolute -left-3 p-2 bg-white rounded-full border border-gray-300">
                    <span className="text-lg">
                      {activityIcons[log.activity_type] || activityIcons.other}
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-medium">
                      {capitalizeWords(log.activity_type)}
                    </p>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {log.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        By {log.profiles?.name || log.profiles?.email || 'Unknown user'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    
                    {log.entity_id && (
                      <div className="mt-2">
                        <span className="inline-block text-xs bg-gray-100 px-2 py-1 rounded-full">
                          ID: {log.entity_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No activity logs found</p>
              <p className="text-sm text-gray-400 mt-2">Activity will be recorded as you use the system</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 