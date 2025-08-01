"use client"

import { Card, CardContent } from '@/components/ui/card'
import { useIsMobile } from '@/hooks/use-mobile'
import { TrendingUp, Heart, AlertTriangle, Calendar } from 'lucide-react'

interface StatsCardsProps {
  totalCows: number
  healthyCows: number
  needCareCows: number
  newRegistrations: number
}

export default function StatsCards({ 
  totalCows, 
  healthyCows, 
  needCareCows, 
  newRegistrations 
}: StatsCardsProps) {
  const isMobile = useIsMobile()
  
  const statsData = [
    {
      title: "Total Cows",
      value: totalCows,
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "Healthy Cows",
      value: healthyCows,
      icon: Heart,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "Need Care",
      value: needCareCows,
      icon: AlertTriangle,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "This Month",
      value: newRegistrations,
      icon: Calendar,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    }
  ]
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card 
            key={index}
            className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isMobile ? 'aspect-square' : ''}`}
            style={{backgroundColor: stat.bgColor, border: '1px solid #dfe3ee'}}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{background: stat.gradient}} />
            
            {isMobile ? (
              <CardContent className="relative flex flex-col items-center justify-center h-full p-4 space-y-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200" style={{backgroundColor: stat.iconBg}}>
                  <IconComponent className="w-5 h-5" style={{color: stat.iconColor}} />
                </div>
                <div className="text-3xl font-bold" style={{color: stat.textColor}}>{stat.value}</div>
                <div className="text-xs font-semibold text-center uppercase tracking-wide" style={{color: stat.textColor}}>
                  {stat.title}
                </div>
              </CardContent>
            ) : (
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold" style={{color: stat.textColor}}>{stat.value}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{color: stat.textColor}}>
                      {stat.title}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200" style={{backgroundColor: stat.iconBg}}>
                    <IconComponent className="w-6 h-6" style={{color: stat.iconColor}} />
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '75%', background: stat.gradient }}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
} 