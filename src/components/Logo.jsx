import React from 'react';

const Logo = ({ size = 48 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bull (left, green) */}
      <g transform="translate(10, 20)">
        {/* Bull body */}
        <path d="M15 25 L15 35 L25 35 L25 25 Z" fill="#16a34a" />
        {/* Bull head */}
        <circle cx="20" cy="20" r="5" fill="#16a34a" />
        {/* Bull horns */}
        <path d="M17 16 L15 12 M23 16 L25 12" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        {/* Upward arrow */}
        <path d="M20 40 L20 50 M15 45 L20 40 L25 45" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      
      {/* Bear (right, red) */}
      <g transform="translate(50, 20)">
        {/* Bear body */}
        <path d="M15 25 L15 35 L25 35 L25 25 Z" fill="#ef4444" />
        {/* Bear head */}
        <circle cx="20" cy="20" r="5" fill="#ef4444" />
        {/* Bear ears */}
        <circle cx="17" cy="16" r="2" fill="#ef4444" />
        <circle cx="23" cy="16" r="2" fill="#ef4444" />
        {/* Downward arrow */}
        <path d="M20 40 L20 50 M15 45 L20 50 L25 45" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      
      {/* Chart line in background */}
      <path d="M5 70 L25 60 L35 65 L50 50 L65 55 L75 45 L95 40" 
            stroke="var(--primary)" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.3"
            strokeDasharray="4 2" />
    </svg>
  );
};

export default Logo;
