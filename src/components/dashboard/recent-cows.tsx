"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import CowDetailsDialog from './cow-details-dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { createClientBrowser } from '@/lib/supabase/client'

type Cow = Database['public']['Tables']['cows']['Row']

export default function RecentCows() {
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch cows on component mount
  useEffect(() => {
    const fetchCows = async () => {
      try {
        setLoading(true)
        const supabase = createClientBrowser()
        const { data } = await supabase
          .from('cows')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (data) {
          setCows(data)
        }
      } catch (error) {
        console.error('Error fetching cows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCows()
  }, [])

  const handleCowClick = (cow: Cow) => {
    setSelectedCow(cow)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const getHealthStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return {backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0'};
      case 'sick': return {backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca'};
      case 'under_treatment': return {backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fed7aa'};
      case 'quarantine': return {backgroundColor: '#f3e8ff', color: '#a855f7', border: '1px solid #e9d5ff'};
      default: return {backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db'};
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <>
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden" style={{border: '1px solid #dfe3ee'}}>
        <CardHeader className="border-b" style={{borderColor: '#dfe3ee'}}>
          <CardTitle style={{color: '#3b5998'}}>Recent Cows</CardTitle>
          <p className="text-sm" style={{color: '#3b5998'}}>
            Latest registered cows in the system
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <p style={{color: '#3b5998'}}>Loading...</p>
            </div>
          ) : cows && cows.length > 0 ? (
            <div className="overflow-hidden rounded-md" style={{border: '1px solid #dfe3ee'}}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{backgroundColor: '#dfe3ee'}}>
                      <th className="p-3 font-medium" style={{color: '#3b5998'}}>Sr. No.</th>
                      <th className="p-3 font-medium" style={{color: '#3b5998'}}>Health Status</th>
                      <th className="p-3 font-medium" style={{color: '#3b5998'}}>Source</th>
                      <th className="p-3 font-medium" style={{color: '#3b5998'}}>Adopter Name</th>
                      <th className="p-3 font-medium" style={{color: '#3b5998'}}>Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cows.map((cow, index) => (
                      <tr 
                        key={cow.id} 
                        className="transition-colors cursor-pointer"
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#dfe3ee'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                        onClick={() => handleCowClick(cow)}
                      >
                        <td className="p-3 whitespace-nowrap font-medium">
                          {index + 1}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge style={getHealthStatusColor(cow.health_status)}>
                            {cow.health_status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap capitalize">
                          {cow.source}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {cow.adopter_name || '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {formatDate(cow.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
                      ) : (
            <div className="flex items-center justify-center p-6">
              <p style={{color: '#3b5998'}}>No cows registered yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CowDetailsDialog 
        cow={selectedCow}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </>
  )
} 