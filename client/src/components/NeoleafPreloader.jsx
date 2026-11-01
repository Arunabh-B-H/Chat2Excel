import React, { useState, useEffect } from 'react';

export default function NeoleafPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  useEffect(() => {
    // Kinetic organic counter from 0 to 100 with non-linear acceleration
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSlidingOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 800); // Duration of the cubic curtain wipe
          }, 350);
          return 100;
        }
        // Organic acceleration curve
        const increment = prev < 60 ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 12) + 6;
        return Math.min(prev + increment, 100);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 bg-[#FBFBFA] text-slate-900 transition-transform duration-800 ease-[cubic-bezier(0.85,0,0.15,1)] ${
        isSlidingOut ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{
        boxShadow: isSlidingOut ? '0 25px 60px -15px rgba(15, 23, 42, 0.25)' : 'none'
      }}
    >
      {/* Ambient background glow adhering to our bright executive design system */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.08),rgba(255,255,255,0))]" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-200/70 pb-4">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-semibold">Studio Ingestion Pipeline</span>
        </span>
        <span>Version 2.4.0 • Enterprise Edition</span>
      </div>

      {/* Centerpiece: Brand Logo + Kinetic Counter */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-7">
        
        {/* Brand Logo Presentation with Tactile Glow */}
        <div className="flex flex-col items-center text-center space-y-3.5">
          <div className="relative p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-indigo-500/5 group">
            {/* Ambient Pulse Ring */}
            <div className="absolute -inset-1 rounded-3xl bg-indigo-500/10 blur-md animate-pulse" />
            
            {/* Official Brand Icon */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
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
                <circle cx="23.5" cy="21" r="1.5" fill="#2563EB" className="animate-ping [animation-duration:2s]" />
                <circle cx="23.5" cy="21" r="1.5" fill="#2563EB" />
              </svg>
            </div>
          </div>

          {/* Brand Name & Monospace Subtitle */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Chat2Excel
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-400 tracking-wider">
              Autonomous Data Entry
            </p>
          </div>
        </div>

        {/* Kinetic Numeric Counter */}
        <div className="flex flex-col items-center space-y-3">
          <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-slate-900 tabular-nums select-none flex items-baseline">
            <span>{progress < 10 ? `0${progress}` : progress}</span>
            <span className="text-2xl sm:text-4xl text-indigo-600 font-sans ml-1">%</span>
          </div>

          {/* Micro-telemetry status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] sm:text-xs font-mono text-slate-600 tracking-wide shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            <span>
              {progress < 30 && 'INITIALIZING PARSING ENGINE...'}
              {progress >= 30 && progress < 65 && 'CALIBRATING MULTIMODAL VISION MATRIX...'}
              {progress >= 65 && progress < 95 && 'OPTIMIZING FINANCIAL RECONCILIATION...'}
              {progress >= 95 && 'STUDIO READY — UNVEILING WORKSPACE'}
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Progress Track & Design Label */}
      <div className="relative z-10 w-full max-w-md mx-auto space-y-3">
        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          <span>Multimodal Pipeline</span>
          <span>Awwwards Transition</span>
        </div>
      </div>
    </div>
  );
}
