"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Scan } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import CowDetailsDialog from './cow-details-dialog'
import BarcodeScanner from './barcode-scanner'
import { useIsMobile, useIsTabletOrMobile } from '@/hooks/use-mobile'

type Cow = Database['public']['Tables']['cows']['Row']

export default function SearchCows() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Cow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const searchRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const isTabletOrMobile = useIsTabletOrMobile()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search cows when query changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsLoading(true)
        
        // Focus on searching by tracking ID
        const { data, error } = await supabase
          .from('cows')
          .select('*')
          .ilike('tracking_id', `%${searchQuery}%`)
          .limit(5)
        
        if (!error && data) {
          setSearchResults(data)
        } else {
          setSearchResults([])
        }
        
        setIsLoading(false)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  const handleCowClick = (cow: Cow) => {
    setSelectedCow(cow)
    setIsDialogOpen(true)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const getHealthStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return '#16a34a';
      case 'sick': return '#dc2626';
      case 'under_treatment': return '#d97706';
      case 'quarantine': return '#a855f7';
      default: return '#666666';
    }
  }

  const openScanner = () => {
    setIsScannerOpen(true)
  }
  
  const closeScanner = () => {
    setIsScannerOpen(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="rounded-2xl p-4 shadow-lg" style={{background: 'linear-gradient(90deg, #ffffff 0%, #dfe3ee 30%)', border: '1px solid #dfe3ee'}}>
        <div className="relative flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#3b5998'}} />
            <Input
              type="text"
              placeholder="Search cows by tracking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 pr-6 h-14 border-2 rounded-xl bg-white/80 backdrop-blur-sm font-medium transition-all duration-200"
              style={{
                borderColor: '#dfe3ee',
                color: '#000000'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b5998'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#dfe3ee'}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                style={{color: '#8b9dc3'}}
                onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#3b5998'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#8b9dc3'}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Scan button - inline with search input */}
          {isTabletOrMobile && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center h-14 w-14 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0"
              style={{
                background: 'linear-gradient(to right, #3b5998, #8b9dc3)'
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to right, #2d4373, #7a8bb8)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to right, #3b5998, #8b9dc3)'}
              title="Scan Barcode"
            >
              <Scan className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto" style={{border: '1px solid #dfe3ee'}}>
          {searchResults.map((cow) => (
            <div
              key={cow.id}
              onClick={() => handleCowClick(cow)}
              className="p-5 cursor-pointer last:border-b-0 transition-all duration-200 hover:scale-[1.02] mx-2 my-1 rounded-xl"
              style={{
                borderBottom: '1px solid #dfe3ee'
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#f7f7f7'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 text-lg">
                    {cow.tracking_id || 'No ID'}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="px-2 py-1 rounded-full font-medium" style={{backgroundColor: '#dfe3ee', color: '#3b5998'}}>
                      {cow.gender}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full font-medium"
                      style={
                        cow.health_status === 'healthy' ? {backgroundColor: '#dcfce7', color: '#16a34a'} :
                        cow.health_status === 'sick' ? {backgroundColor: '#fee2e2', color: '#dc2626'} :
                        cow.health_status === 'under_treatment' ? {backgroundColor: '#fef3c7', color: '#d97706'} :
                        cow.health_status === 'quarantine' ? {backgroundColor: '#f3e8ff', color: '#a855f7'} :
                        {backgroundColor: '#f3f4f6', color: '#374151'}
                      }
                    >
                      {cow.health_status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {new Date(cow.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cow details dialog */}
      <CowDetailsDialog 
        cow={selectedCow}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
      
      {/* Barcode scanner dialog */}
      <BarcodeScanner 
        isOpen={isScannerOpen}
        onClose={closeScanner}
      />
    </div>
  )
} 