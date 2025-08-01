"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Heart, AlertTriangle, Stethoscope, Shield } from 'lucide-react'

interface HealthStatusCardsProps {
  healthStatusCounts: {
    healthy: number;
    sick: number;
    under_treatment: number;
    quarantine: number;
  };
}

export default function HealthStatusCards({
  healthStatusCounts
}: HealthStatusCardsProps) {
  const healthCards = [
    {
      title: "HEALTHY",
      value: healthStatusCounts.healthy,
      icon: Heart,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "SICK",
      value: healthStatusCounts.sick,
      icon: AlertTriangle,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "UNDER TREATMENT",
      value: healthStatusCounts.under_treatment,
      icon: Stethoscope,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    },
    {
      title: "QUARANTINE",
      value: healthStatusCounts.quarantine,
      icon: Shield,
      gradient: "linear-gradient(135deg, #3b5998 0%, #8b9dc3 100%)",
      bgColor: "#ffffff",
      textColor: "#3b5998",
      iconBg: "#dfe3ee",
      iconColor: "#3b5998"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3">
      {healthCards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <Card 
            key={index}
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{backgroundColor: card.bgColor, border: '1px solid #dfe3ee'}}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{background: card.gradient}} />
            
            <CardContent className="relative p-4 lg:p-3 flex flex-col items-center justify-center space-y-3 lg:space-y-2 min-h-[140px] lg:min-h-[120px]">
              <div className="w-12 h-12 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200" style={{backgroundColor: card.iconBg}}>
                <IconComponent className="w-6 h-6 lg:w-5 lg:h-5" style={{color: card.iconColor}} />
              </div>
              
              <div className="text-3xl lg:text-2xl font-bold" style={{color: card.textColor}}>
                {card.value}
              </div>
              
              <div className="text-xs lg:text-[10px] font-bold text-center uppercase tracking-wider leading-tight" style={{color: card.textColor}}>
                {card.title}
              </div>
              
              {/* Progress indicator */}
              <div className="w-full bg-white/50 rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '85%', background: card.gradient }}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 