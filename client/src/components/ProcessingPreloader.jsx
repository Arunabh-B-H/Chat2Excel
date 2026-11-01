import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

const STEPS = [
  'Ingesting raw conversational data...',
  'Parsing timestamps, entities, and line items...',
  'Reconciling amounts and remaining balances...',
  'Running data quality audit for duplicates & typos...',
  'Synthesizing publication-grade Excel workbook...'
];

export default function ProcessingPreloader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center max-w-sm w-full mx-4 text-center px-6 py-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6">
        <BrandLogo size="lg" />

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI Data Entry Specialist</h3>
          <p className="text-xs text-indigo-600 font-mono font-medium transition-all duration-300">
            {STEPS[currentStep]}
          </p>
        </div>

        {/* Minimalist Progress Track */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <span className="text-[11px] text-slate-400 font-mono">Claude 3.5 Sonnet Precision Engine</span>
      </div>
    </div>
  );
}
