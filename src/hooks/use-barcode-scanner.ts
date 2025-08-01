import { useState, useEffect, useRef } from 'react'

// Error types for camera access
export type CameraErrorType = 
  | 'permission_denied'  // User denied camera access
  | 'not_readable'       // Camera in use by another application
  | 'not_found'          // No camera available
  | 'constraint_error'   // Camera doesn't meet constraints
  | 'security_error'     // Insecure context or policy violation
  | 'unknown'            // Other errors

interface UseBarcodeScanner {
  startScanning: () => Promise<void>
  stopScanning: () => void
  isScanning: boolean
  hasPermission: boolean | null
  errorType: CameraErrorType | null
  errorMessage: string | null
  videoRef: { current: HTMLVideoElement | null }
  resetError: () => void
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [errorType, setErrorType] = useState<CameraErrorType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks()
        tracks.forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const resetError = () => {
    setErrorType(null)
    setErrorMessage(null)
  }

  const startScanning = async () => {
    resetError()
    setIsScanning(true)
    
    try {
      // Request camera permissions with rear-facing camera preferred
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setHasPermission(true)
      }
    } catch (error: any) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        setErrorType('permission_denied')
        setErrorMessage('Camera access denied. Please allow camera permissions to scan barcodes.')
      } else if (error.name === 'NotReadableError') {
        setErrorType('not_readable')
        setErrorMessage('Cannot access camera. It may be in use by another application. Please close other apps using the camera and try again.')
      } else if (error.name === 'NotFoundError') {
        setErrorType('not_found')
        setErrorMessage('No camera found on this device.')
      } else if (error.name === 'ConstraintNotSatisfiedError') {
        setErrorType('constraint_error')
        setErrorMessage('Your camera does not meet the required specifications.')
      } else if (error.name === 'SecurityError') {
        setErrorType('security_error')
        setErrorMessage('Camera access blocked due to security restrictions. Make sure you\'re using HTTPS.')
      } else {
        setErrorType('unknown')
        setErrorMessage(`Camera error: ${error.message || 'Unknown error'}`)
      }
      
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }

  return {
    startScanning,
    stopScanning,
    isScanning,
    hasPermission,
    errorType,
    errorMessage,
    videoRef,
    resetError
  }
} 