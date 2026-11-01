import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import { Terminal, ShieldCheck, Zap, Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'CALIBRATING MULTIMODAL VISION CORE', detail: 'Claude 4.5 Sonnet & Gemini Flash Pipeline' },
    { label: 'MOUNTING ACCOUNTING RECONCILIATION ENGINE', detail: 'Formula Balance & Alias Normalization' },
    { label: 'INITIALIZING ANOMALY INTERCEPTOR RADAR', detail: 'Duplicate Txn & Contact Verification' },
    { label: 'BUFFERING DIRECT SHEETJS (.XLSX) EXPORTER', detail: 'Studio Ledger Grid Ready' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete?.();
          }, 450);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 8) + 4;
        const capped = Math.min(100, next);

        if (capped > 25 && capped <= 55) setActiveStep(1);
        else if (capped > 55 && capped <= 85) setActiveStep(2);
        else if (capped > 85) setActiveStep(3);

        return capped;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none overflow-hidden"
    >
      {/* Background Subtle Cybernetic Matrix Dots */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Ambient Radial Spotlight */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Skip Button Top Right */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition font-mono backdrop-blur-md"
      >
        <span>Skip Intro</span>
        <ArrowRight size={13} />
      </button>

      {/* Center Cinematic Unit */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">
        {/* Animated Brand Mark Container with Revolving Orbit */}
        <div className="relative flex items-center justify-center">
          {/* Revolving Dotted SVG Ring */}
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 w-28 h-28 pointer-events-none text-emerald-500/30"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          </motion.svg>

          {/* Central Logo */}
          <BrandLogo size="hero" animated />
        </div>

        {/* Title & Precision Badge */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Zap size={12} className="text-emerald-400 animate-pulse" />
            <span>Chat-to-Excel Autonomous Specialist</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
            SYSTEM BOOT SEQUENCE
          </h2>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Terminal size={12} />
              <span>INITIALIZING CORE</span>
            </span>
            <span className="font-bold text-white text-sm">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-full shadow-sm shadow-emerald-500"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Dynamic Status Log Step */}
        <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left font-mono space-y-1 shadow-inner">
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
            <span className="truncate">
              [{activeStep + 1}/4] {steps[activeStep].label}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {steps[activeStep].detail}
          </div>
        </div>

        {/* Micro Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <ShieldCheck size={13} className="text-emerald-400/80" />
          <span>Zero Server Storage • Client-Side Verified Parsing</span>
        </div>
      </div>
    </motion.div>
  );
}

