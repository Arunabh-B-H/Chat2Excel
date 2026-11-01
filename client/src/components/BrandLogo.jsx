import React from 'react';

export default function BrandLogo({ size = 'md', className = '' }) {
  const dimensions = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    hero: 'w-20 h-20'
  }[size] || 'w-9 h-9';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions} ${className}`}>
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Chat Bubble Base */}
        <path
          d="M6 8C6 6.34315 7.34315 5 9 5H27C28.6569 5 30 6.34315 30 8V22C30 23.6569 28.6569 25 27 25H13L7 30V8C7 6.34315 7.34315 5 9 5Z"
          fill="#EEF2FF"
          stroke="#4F46E5"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Spreadsheet Matrix Lines */}
        <line x1="12" y1="11" x2="24" y2="11" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="16" x2="24" y2="16" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="21" x2="19" y2="21" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Active Node Accent */}
        <circle cx="23.5" cy="21" r="1.5" fill="#2563EB" />
      </svg>
    </div>
  );
}
