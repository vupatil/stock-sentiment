import React from 'react';

const Logo = ({ size = 64 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="greenGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* Candlestick Chart */}
      {/* Green candle 1 */}
      <g>
        <rect x="12" y="52" width="10" height="24" rx="1.5" fill="url(#greenGrad)" opacity="0.9"/>
        <line x1="17" y1="48" x2="17" y2="78" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      
      {/* Red candle 2 */}
      <g>
        <rect x="28" y="36" width="10" height="30" rx="1.5" fill="url(#redGrad)" opacity="0.9"/>
        <line x1="33" y1="30" x2="33" y2="68" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      
      {/* Green candle 3 */}
      <g>
        <rect x="44" y="44" width="10" height="22" rx="1.5" fill="url(#greenGrad)" opacity="0.9"/>
        <line x1="49" y1="38" x2="49" y2="68" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      
      {/* Green candle 4 (strongest) */}
      <g>
        <rect x="60" y="28" width="10" height="36" rx="1.5" fill="url(#greenGrad)" opacity="0.9"/>
        <line x1="65" y1="22" x2="65" y2="66" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      
      {/* Trend arrow */}
      <g opacity="0.85">
        <path d="M 76 56 L 82 50 L 88 56" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="82" y1="50" x2="82" y2="72" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round"/>
      </g>
      
      {/* Subtle glow effects */}
      <ellipse cx="17" cy="64" rx="8" ry="4" fill="#10b981" opacity="0.2"/>
      <ellipse cx="49" cy="56" rx="8" ry="4" fill="#10b981" opacity="0.2"/>
      <ellipse cx="65" cy="46" rx="8" ry="4" fill="#10b981" opacity="0.25"/>
    </svg>
  );
};

export default Logo;
