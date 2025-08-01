"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Database } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'

type Cow = Database['public']['Tables']['cows']['Row']

interface CowDetailsDialogProps {
  cow: Cow | null
  isOpen: boolean
  onClose: () => void
}

export default function CowDetailsDialog({ cow, isOpen, onClose }: CowDetailsDialogProps) {
  const isMobile = useIsMobile();
  
  // Helper function to get health status badge color
  const getHealthBadgeColor = (status: string) => {
    switch(status) {
      case 'healthy':
        return {backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0'}
      case 'sick':
        return {backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca'}
      case 'under_treatment':
        return {backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fed7aa'}
      case 'quarantine':
        return {backgroundColor: '#f3e8ff', color: '#a855f7', border: '1px solid #e9d5ff'}
      default:
        return {backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db'}
    }
  }

  if (!cow) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md shadow-xl p-4 sm:p-6" style={{border: '1px solid #dfe3ee'}}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{color: '#3b5998'}}>Cow Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-2">
          <div className="flex justify-center">
            {cow.photo_url ? (
              <div className={`${isMobile ? 'w-32 h-32' : 'w-40 h-40'} relative rounded-lg overflow-hidden border border-gray-200 shadow-md`}>
                <Image 
                  src={cow.photo_url} 
                  alt={`Photo of ${cow.tracking_id}`} 
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={`${isMobile ? 'w-32 h-32' : 'w-36 h-36'} rounded-lg flex items-center justify-center text-5xl border border-gray-200 shadow-md`} style={{backgroundColor: '#f7f7f7'}}>
                🐄
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center">
            <Badge className="px-4 py-1 text-sm font-medium shadow-sm" style={getHealthBadgeColor(cow.health_status)}>
              {cow.health_status.replace(/_/g, ' ')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{backgroundColor: '#f7f7f7', border: '1px solid #dfe3ee'}}>
            <div className="bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
              <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Tracking ID</p>
              <p className="font-semibold text-sm sm:text-base" style={{color: '#3b5998'}}>{cow.tracking_id}</p>
            </div>
            
            <div className="bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
              <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Gender</p>
              <p className="font-semibold capitalize text-sm sm:text-base" style={{color: '#3b5998'}}>{cow.gender}</p>
            </div>
            
            <div className="bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
              <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Source</p>
              <p className="font-semibold capitalize text-sm sm:text-base break-words" style={{color: '#3b5998'}}>{cow.source}</p>
            </div>
            
            <div className="bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
              <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Adopter Name</p>
              <p className="font-semibold text-sm sm:text-base" style={{color: '#3b5998'}}>{cow.adopter_name || 'No adopter yet'}</p>
            </div>
            
            {cow.notes && (
              <div className="col-span-1 sm:col-span-2 bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
                <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Notes</p>
                <p className="text-sm" style={{color: '#3b5998'}}>{cow.notes}</p>
              </div>
            )}
            
            <div className="col-span-1 sm:col-span-2 bg-white p-2 sm:p-3 rounded-md shadow-sm" style={{border: '1px solid #dfe3ee'}}>
              <p className="text-xs font-medium" style={{color: '#8b9dc3'}}>Registered On</p>
              <p className="font-semibold text-sm sm:text-base" style={{color: '#3b5998'}}>
                {format(new Date(cow.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 