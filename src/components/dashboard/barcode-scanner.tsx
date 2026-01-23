"use client"

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, X, Camera, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import CowDetailsDialog from './cow-details-dialog'
import { useBarcodeScanner, CameraErrorType } from '@/hooks/use-barcode-scanner'
import { useToast } from '@/components/ui/use-toast'

type Cow = Database['public']['Tables']['cows']['Row']

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
}

export default function BarcodeScanner({ isOpen, onClose }: BarcodeScannerProps) {
  const [scannedCow, setScannedCow] = useState<Cow | null>(null)
  const [showCowDetails, setShowCowDetails] = useState(false)
  const [barcodeReader, setBarcodeReader] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()
  
  // Use our custom barcode scanner hook
  const {
    startScanning,
    stopScanning,
    isScanning,
    hasPermission,
    errorType,
    errorMessage,
    videoRef,
    resetError
  } = useBarcodeScanner()
  
  // Initialize barcode scanner when dialog opens
  useEffect(() => {
    const initScanner = async () => {
      if (isOpen) {
        await startScanning()
        
        if (hasPermission) {
          initBarcodeReader()
        }
      }
    }
    
    if (isOpen) {
      initScanner()
    }
    
    // Cleanup when dialog closes or component unmounts
    return () => {
      if (isScanning) {
        stopScanning()
      }
      
      // Clean up barcode reader
      if (barcodeReader) {
        try {
          barcodeReader.reset()
        } catch (e) {
          console.log('Error resetting barcode reader:', e)
        }
      }
    }
  }, [isOpen])
  
  // Watch for permission changes to initialize barcode reader
  useEffect(() => {
    if (hasPermission === true && videoRef.current) {
      initBarcodeReader()
    }
  }, [hasPermission])
  
  const initBarcodeReader = async () => {
    try {
      // Dynamically import the barcode detector library
      const { BrowserMultiFormatReader } = await import('@zxing/library')
      const reader = new BrowserMultiFormatReader()
      setBarcodeReader(reader)
      
      if (videoRef.current) {
        // Start continuous scanning
        reader.decodeFromVideoElement(videoRef.current).then(async (result: any) => {
          if (result) {
            const barcodeValue = result.getText()
            handleScannedBarcode(barcodeValue)
          }
        }).catch((err: any) => {
          // This is expected when stopping the scanner, so we don't need to handle it
          if (!err.toString().includes('NotFoundException')) {
            console.error('Scanning error:', err)
            toast({
              title: "Scanning Error",
              description: "Failed to read barcode. Please try again.",
              variant: "destructive"
            })
          }
        })
      }
    } catch (error) {
      console.error('Error initializing barcode reader:', error)
      toast({
        title: "Scanner Error",
        description: "Failed to initialize the barcode scanner.",
        variant: "destructive"
      })
    }
  }
  
  const handleScannedBarcode = async (barcodeValue: string) => {
    // Stop scanning after successful scan
    stopScanning()
    
    try {
      // Check if the scanned barcode corresponds to an existing cow
      const { data: cowData, error } = await supabase
        .from('cows')
        .select('*')
        .eq('tracking_id', barcodeValue)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Cow not found, redirect to registration page with prefilled tracking ID
          router.push(`/dashboard/register?tracking_id=${encodeURIComponent(barcodeValue)}`)
          onClose()
        } else {
          console.error('Error fetching cow data:', error)
          toast({
            title: "Database Error",
            description: "Failed to check the database for this barcode.",
            variant: "destructive"
          })
        }
      } else if (cowData) {
        // Cow found, show details
        setScannedCow(cowData)
        setShowCowDetails(true)
      }
    } catch (error) {
      console.error('Error processing barcode:', error)
      toast({
        title: "Processing Error",
        description: "Failed to process the scanned barcode.",
        variant: "destructive"
      })
    }
  }
  
  const handleCloseCowDetails = () => {
    setShowCowDetails(false)
    onClose()
  }
  
  const handleRetry = () => {
    resetError()
    startScanning()
  }
  
  // Helper function to get error UI based on error type
  const getErrorUI = () => {
    switch (errorType) {
      case 'not_readable':
        return (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex justify-center mb-2">
              <Camera className="text-amber-600 h-8 w-8" />
            </div>
            <h3 className="font-medium text-amber-800 mb-1">Camera In Use</h3>
            <p className="text-amber-700 mb-3 text-sm">
              Your camera appears to be in use by another application. Please close other apps that might be using the camera.
            </p>
            <Button onClick={handleRetry} variant="outline" size="sm" className="bg-white">
              Try Again
            </Button>
          </div>
        );
      
      case 'permission_denied':
        return (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-center mb-2">
              <AlertTriangle className="text-red-600 h-8 w-8" />
            </div>
            <h3 className="font-medium text-red-800 mb-1">Camera Access Denied</h3>
            <p className="text-red-700 mb-3 text-sm">
              Camera access is required to scan barcodes. Please allow camera permissions in your browser settings.
            </p>
            <Button onClick={handleRetry} variant="destructive" size="sm">
              Try Again
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 mb-2">{errorMessage || "An error occurred with the camera"}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        );
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md shadow-xl p-4" style={{border: '1px solid #dfe3ee'}}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{color: '#3b5998'}}>Scan Barcode</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {hasPermission === false && errorType && getErrorUI()}
            
            {hasPermission !== false && !errorType && (
              <>
                <div className="relative w-full aspect-square max-w-xs bg-black rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay 
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-2 rounded-lg opacity-70" style={{borderColor: '#3b5998'}}></div>
                  </div>
                  
                  {isScanning && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center">
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Scanning...
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                  Position the barcode within the green box
                </p>
              </>
            )}
            
            <Button 
              onClick={() => {
                stopScanning();
                onClose();
              }} 
              variant="outline" 
              className="mt-2"
              size="sm"
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Cow details dialog */}
      {scannedCow && (
        <CowDetailsDialog 
          cow={scannedCow}
          isOpen={showCowDetails}
          onClose={handleCloseCowDetails}
        />
      )}
    </>
  )
} 