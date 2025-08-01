import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, AlertCircle, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'

interface CowDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CowDetailsPage(props: CowDetailsPageProps) {
  // Destructure after awaiting
  const params = await props.params;
  const id = params.id;
  
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch cow details
  const { data: cow, error: cowError } = await supabase
    .from('cows')
    .select('*, profiles:created_by (email, full_name)')
    .eq('id', id)
    .single()
  
  if (cowError || !cow) {
    notFound()
  }
  
  // Fetch activity logs related to this cow
  const { data: cowLogs } = await supabase
    .from('logs')
    .select('*, profiles:user_id (email, full_name)')
    .eq('cow_id', cow.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Helper function to get health status badge color
  const getHealthBadgeColor = (status: string) => {
    switch(status) {
      case 'healthy':
        return {backgroundColor: '#dcfce7', color: '#16a34a'}
      case 'sick':
        return {backgroundColor: '#fee2e2', color: '#dc2626'}
      case 'under_treatment':
        return {backgroundColor: '#fef3c7', color: '#d97706'}
      case 'quarantine':
        return {backgroundColor: '#f3e8ff', color: '#a855f7'}
      default:
        return {backgroundColor: '#f3f4f6', color: '#374151'}
    }
  }

  // Helper function to capitalize each word in a string
  const capitalizeWords = (str: string) => {
    return str.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold" style={{color: '#3b5998'}}>{cow.tracking_id}</h1>
          <Badge style={getHealthBadgeColor(cow.health_status)}>
            {capitalizeWords(cow.health_status)}
          </Badge>
        </div>
        
        <Button className="flex items-center">
          <Edit className="w-4 h-4 mr-2" />
          Edit Details
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cow Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tracking ID</h3>
                <p className="mt-1">{cow.tracking_id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                <p className="mt-1 capitalize">{cow.gender}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Source</h3>
                <p className="mt-1 capitalize">{cow.source}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Adopter Name</h3>
                <p className="mt-1">{cow.adopter_name || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Registered On</h3>
                <p className="mt-1">{format(new Date(cow.created_at), 'MMM d, yyyy • h:mm a')}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Registered By</h3>
                <p className="mt-1">{cow.profiles?.full_name || cow.profiles?.email || 'Unknown'}</p>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{cow.notes || 'No notes available.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                <div className={`mt-2 px-3 py-2 rounded-lg ${getHealthBadgeColor(cow.health_status)}`}>
                  <p className="font-medium">
                    {capitalizeWords(cow.health_status)}
                  </p>
                </div>
              </div>
              
              <Button className="w-full flex items-center justify-center">
                <Activity className="w-4 h-4 mr-2" />
                Update Health Status
              </Button>
              
              <Button variant="outline" className="w-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {cowLogs && cowLogs.length > 0 ? (
            <div className="space-y-4">
              {cowLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-full border border-gray-300">
                    <span className="text-lg">
                      {log.action === 'cow_registration' ? '🐄' :
                       log.action === 'cow_update' ? '✏️' :
                       log.action === 'health_check' ? '🩺' :
                       log.action === 'treatment' ? '💉' : '📝'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <p className="font-medium">
                        {capitalizeWords(log.action)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {log.details && typeof log.details === 'object' 
                        ? JSON.stringify(log.details) 
                        : 'No details available'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      By {log.profiles?.full_name || log.profiles?.email || 'Unknown user'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activity logs found for this cow</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 