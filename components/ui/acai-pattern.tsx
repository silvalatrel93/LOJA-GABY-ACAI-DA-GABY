import React from "react"

interface AcaiPatternProps {
  className?: string
}

export function AcaiPattern({ className = "" }: AcaiPatternProps) {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden opacity-10 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Padrão de frutas de açaí */}
        <circle cx="20" cy="20" r="2" fill="currentColor" />
        <circle cx="40" cy="20" r="2" fill="currentColor" />
        <circle cx="60" cy="20" r="2" fill="currentColor" />
        <circle cx="80" cy="20" r="2" fill="currentColor" />
        
        <circle cx="10" cy="40" r="2" fill="currentColor" />
        <circle cx="30" cy="40" r="2" fill="currentColor" />
        <circle cx="50" cy="40" r="2" fill="currentColor" />
        <circle cx="70" cy="40" r="2" fill="currentColor" />
        <circle cx="90" cy="40" r="2" fill="currentColor" />
        
        <circle cx="20" cy="60" r="2" fill="currentColor" />
        <circle cx="40" cy="60" r="2" fill="currentColor" />
        <circle cx="60" cy="60" r="2" fill="currentColor" />
        <circle cx="80" cy="60" r="2" fill="currentColor" />
        
        <circle cx="10" cy="80" r="2" fill="currentColor" />
        <circle cx="30" cy="80" r="2" fill="currentColor" />
        <circle cx="50" cy="80" r="2" fill="currentColor" />
        <circle cx="70" cy="80" r="2" fill="currentColor" />
        <circle cx="90" cy="80" r="2" fill="currentColor" />
        
        {/* Elementos decorativos que lembram folhas ou frutas */}
        <path 
          d="M15,15 Q20,5 25,15 T35,15" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <path 
          d="M55,15 Q60,5 65,15 T75,15" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <path 
          d="M35,85 Q40,95 45,85 T55,85" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <path 
          d="M75,85 Q80,95 85,85 T95,85" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
