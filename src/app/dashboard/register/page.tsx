"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/dashboard/image-upload'
import { registerCowAction } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { Loader2, QrCode } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import BarcodeScanner from '@/components/dashboard/barcode-scanner'
import { useIsTabletOrMobile } from '@/hooks/use-mobile'

// Define form schema with zod
const formSchema = z.object({
  tracking_id: z.string()
    .refine(val => val === '' || (val.length === 12), {
      message: "Tracking ID must be exactly 12 digits if provided"
    }),
  gender: z.enum(['female', 'male', 'calf']),
  health_status: z.enum(['healthy', 'sick', 'under_treatment', 'quarantine']),
  source: z.string(),
  adopter_name: z.string().optional(),
  date_time: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Source options
const policeStations = [
  "Nashik Road Police Station",
  "Bhadrakali Police Station",
  "Satpur Police Station",
  "Ambad Police Station",
  "Panchavati Police Station",
  "Mahatma Nagar Police Station",
  "Indira Nagar Police Station",
  "Mhasrul Police Station",
  "Gangapur Police Station",
  "Adgaon Police Station"
]

export default function RegisterCowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const isTabletOrMobile = useIsTabletOrMobile()
  
  // Get tracking_id from URL query if available
  const trackingIdFromQuery = searchParams.get('tracking_id') || ''
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: 'female',
      health_status: 'healthy',
      source: 'donation',
      tracking_id: trackingIdFromQuery,
      adopter_name: '',
      date_time: '',
      notes: '',
    },
  })
  
  // Update form when tracking_id in URL changes
  useEffect(() => {
    if (trackingIdFromQuery) {
      form.setValue('tracking_id', trackingIdFromQuery)
    }
  }, [trackingIdFromQuery, form])
  
  const handleImageChange = (file: File | null) => {
    setSelectedFile(file)
  }
  
  const showAlert = (title: string, message: string, isError = false) => {
    toast({
      title: title,
      description: message,
      variant: isError ? "destructive" : "success",
    });
  };
  
  const handleOpenScanner = () => {
    setIsScannerOpen(true)
  }
  
  const handleCloseScanner = () => {
    setIsScannerOpen(false)
  }
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Create FormData object for file upload
      const formData = new FormData()
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString())
        }
      })
      
      // Add the selected file to the form data
      if (selectedFile) {
        formData.set('photo', selectedFile)
      }
      
      const result = await registerCowAction(formData)
      
      if (result.success) {
        showAlert("Success", "Cow registered successfully!");
        router.push('/dashboard')
      } else {
        showAlert("Error", result.error || "Failed to register cow", true);
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showAlert("Error", "An unexpected error occurred", true);
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="rounded-xl p-4" style={{background: 'linear-gradient(90deg, #dfe3ee 0%, #f7f7f7 100%)', border: '1px solid #dfe3ee'}}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{background: 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)'}}>
            <span className="text-white text-lg">🐄</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Register New Cow</h1>
            <p className="font-medium" style={{color: '#3b5998'}}>Add a new cow to the gaushala management system</p>
          </div>
        </div>
      </div>
      
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b" style={{borderColor: '#dfe3ee', background: 'linear-gradient(90deg, #dfe3ee 0%, #f7f7f7 100%)'}}>
          <CardTitle className="text-2xl font-bold flex items-center space-x-2" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            <span>🐄</span>
            <span>Cow Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="tracking_id"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <span>🏷️</span>
                        <span>Tracking ID (Optional)</span>
                      </FormLabel>
                      <div className="flex items-center space-x-3">
                        <FormControl>
                          <Input 
                            placeholder="Will be auto-generated if left empty"
                            className="h-12 border-2 rounded-xl transition-all duration-200 font-medium focus:bg-white"
                            style={{
                              borderColor: '#dfe3ee',
                              backgroundColor: '#f7f7f7'
                            }}
                            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b5998'}
                            {...field}
                            value={field.value || ''}
                            maxLength={12}
                          />
                        </FormControl>
                        {isTabletOrMobile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleOpenScanner}
                            className="h-12 w-12 border-2 rounded-xl transition-all duration-200"
                            style={{
                              borderColor: '#dfe3ee'
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = '#dfe3ee';
                              (e.currentTarget as HTMLElement).style.borderColor = '#3b5998';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                              (e.currentTarget as HTMLElement).style.borderColor = '#dfe3ee';
                            }}
                          >
                            <QrCode className="h-5 w-5" style={{color: '#3b5998'}} />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs font-medium" style={{color: '#3b5998'}}>
                        💡 Leave empty for auto-generated ID or enter exactly 12 digits
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger style={{borderColor: '#dfe3ee'}} className="focus-visible:ring-2 focus-visible:ring-offset-2" onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="calf">Calf</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="health_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger style={{borderColor: '#dfe3ee'}} className="focus-visible:ring-2 focus-visible:ring-offset-2" onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                            <SelectValue placeholder="Select health status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="sick">Sick</SelectItem>
                          <SelectItem value="under_treatment">Under Treatment</SelectItem>
                          <SelectItem value="quarantine">Quarantine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger style={{borderColor: '#dfe3ee'}} className="focus-visible:ring-2 focus-visible:ring-offset-2" onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectGroup>
                            <SelectLabel>General</SelectLabel>
                          <SelectItem value="donation">Donation</SelectItem>
                          <SelectItem value="rescue">Rescue</SelectItem>
                          <SelectItem value="birth">Birth</SelectItem>
                          <SelectItem value="stray">Stray</SelectItem>
                          <SelectItem value="transferred">Transferred</SelectItem>
                          <SelectItem value="death">Death</SelectItem>
                            <SelectItem value="gaurakshak">Gaurakshak</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Police Stations</SelectLabel>
                            {policeStations.map((station) => (
                              <SelectItem key={station} value={`${station} - rescue`}>
                                {station}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adopter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adopter Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Name of person who adopted this cow"
                          style={{borderColor: '#dfe3ee'}} 
                          className="focus-visible:ring-2 focus-visible:ring-offset-2" 
                          onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date and Time (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="datetime-local"
                          style={{borderColor: '#dfe3ee'}} 
                          className="focus-visible:ring-2 focus-visible:ring-offset-2" 
                          onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <p className="text-xs" style={{color: '#8b9dc3'}}>
                        Current date/time will be used if left empty
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Cow Photo</Label>
                  <ImageUpload name="photo" onChange={handleImageChange} />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Additional information about the cow"
                          rows={4}
                          style={{borderColor: '#dfe3ee'}} 
                          className="focus-visible:ring-2 focus-visible:ring-offset-2" 
                          onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #3b5998'}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  style={{
                    background: 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #2d4373 0%, #7a8bb8 100%)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)'}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Cow'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Barcode Scanner Dialog */}
      <BarcodeScanner isOpen={isScannerOpen} onClose={handleCloseScanner} />
    </div>
  )
} 