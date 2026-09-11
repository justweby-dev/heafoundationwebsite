import React from 'react';

interface HeaLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  variant?: 'tile' | 'clean' | 'gradient';
}

// Exact 4-fold rotational symmetric arm matching the official HEA Foundation logo
const ARM_PATH = "M 39 16 L 49 16 L 49 35 C 49 23, 62 16, 84 16 L 84 26 C 65 26, 49 31, 39 44 Z";

export function HeaLogo({ 
  className = "", 
  size = 38, 
  animated = false,
  variant = "tile"
}: HeaLogoProps) {
  if (variant === 'tile') {
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm shadow-blue-900/30 transition-all ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: '#2200f2'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className={`w-[78%] h-[78%] object-contain ${animated ? 'animate-pulse-energy' : ''}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 4 Interlocking crisp white arms */}
          <g id="hea-logo-tile-arms">
            <path d={ARM_PATH} fill="#ffffff" />
            <path d={ARM_PATH} fill="#ffffff" transform="rotate(90 50 50)" />
            <path d={ARM_PATH} fill="#ffffff" transform="rotate(180 50 50)" />
            <path d={ARM_PATH} fill="#ffffff" transform="rotate(270 50 50)" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full object-contain ${animated ? 'animate-pulse-energy' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heaLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>

        {/* 4 Interlocking geometric arms rotated symmetrically */}
        <g id="hea-logo-emblem">
          <path 
            d={ARM_PATH} 
            fill={variant === 'gradient' ? "url(#heaLogoGrad)" : "#ffffff"} 
            className="transition-all duration-300"
          />
          <path 
            d={ARM_PATH} 
            fill={variant === 'gradient' ? "url(#heaLogoGrad)" : "#ffffff"} 
            transform="rotate(90 50 50)" 
            className="transition-all duration-300"
          />
          <path 
            d={ARM_PATH} 
            fill={variant === 'gradient' ? "url(#heaLogoGrad)" : "#ffffff"} 
            transform="rotate(180 50 50)" 
            className="transition-all duration-300"
          />
          <path 
            d={ARM_PATH} 
            fill={variant === 'gradient' ? "url(#heaLogoGrad)" : "#ffffff"} 
            transform="rotate(270 50 50)" 
            className="transition-all duration-300"
          />
        </g>
      </svg>
    </div>
  );
}

export default HeaLogo;
