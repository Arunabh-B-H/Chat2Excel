import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';

const Preloader = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AI Parsing Engine...');

  useEffect(() => {
    const steps = [
      { at: 20, text: 'Waking up Multimodal Vision Model...' },
      { at: 45, text: 'Calibrating WhatsApp Chat Regex & LLM...' },
      { at: 70, text: 'Mounting SheetJS XLSX Formatter...' },
      { at: 92, text: 'Finalizing Secure Razorpay Pipeline...' },
      { at: 100, text: 'System Ready!' }
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 3;
        const currentStep = steps.find(s => next >= s.at && prev < s.at);
        if (currentStep) {
          setStatusText(currentStep.text);
        }
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onFinish) onFinish();
          }, 400);
          return 100;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b141a] text-white px-4"
      >
        {/* Background Ambient Glows */}
        <div className="absolute w-96 h-96 bg-[#00a884]/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute w-80 h-80 bg-[#25d366]/10 rounded-full blur-[100px] pointer-events-none -top-10 -right-10"></div>

        {/* Central Morphing Hologram */}
        <div className="relative mb-10">
          <motion.div
            animate={{
              rotate: [0, 360],
              borderRadius: ["24%", "50%", "24%"]
            }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "linear"
            }}
            className="w-28 h-28 border-2 border-dashed border-[#00a884]/60 flex items-center justify-center"
          />

          {/* Glowing Center Badge */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                '0 0 20px rgba(0, 168, 132, 0.4)',
                '0 0 40px rgba(37, 211, 102, 0.7)',
                '0 0 20px rgba(0, 168, 132, 0.4)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 m-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#111b21] via-[#202c33] to-[#005c4b] border border-[#00a884] flex items-center justify-center"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-9 h-9 text-[#25d366] absolute -left-1" />
              <FileSpreadsheet className="w-8 h-8 text-emerald-300 absolute left-2 top-1" />
            </div>
          </motion.div>
        </div>

        {/* Brand Title */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#25d366] animate-spin" style={{ animationDuration: '6s' }} />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#25d366] to-[#00a884] bg-clip-text text-transparent">
              Chat-to-Excel
            </h1>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#8696a0] font-medium">
            AI Multimodal Conversion & Analytics Platform
          </p>
        </motion.div>

        {/* Dynamic Progress Bar */}
        <div className="w-72 sm:w-80">
          <div className="flex justify-between items-center text-xs text-[#8696a0] mb-2 font-mono">
            <span className="flex items-center gap-1.5 truncate max-w-[210px]">
              {progress === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#25d366]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
              )}
              {statusText}
            </span>
            <span className="text-[#25d366] font-semibold">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-[#202c33] rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00a884] to-[#25d366] rounded-full relative"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/60 blur-[2px]" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;

