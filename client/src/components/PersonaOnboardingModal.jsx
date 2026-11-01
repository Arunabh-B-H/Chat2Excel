import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Building2, 
  Target, 
  PenTool, 
  Check, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const PERSONAS = [
  {
    id: 'accountant',
    title: 'Accountant / Bookkeeper',
    subtitle: 'Payment reconciliations, consumer IDs & balance calculation',
    icon: Calculator,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/50',
    bgActive: 'bg-emerald-500/15',
    defaultPrompt: 'Extract customer name, 13-digit consumer number, phone, sale amount, amount received, remaining balance, payment mode, and date. Flag missing phone digits.'
  },
  {
    id: 'franchise_manager',
    title: 'Franchise & Dealer Manager',
    subtitle: 'Dealer vs Franchise categorization & entity normalization',
    icon: Building2,
    color: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-500/50',
    bgActive: 'bg-blue-500/15',
    defaultPrompt: 'Group into Franchises and Dealers. Merge Dealer Biju under Kollam Franchise. Normalize spelling variants, calculate pending balances, and audit phone numbers.'
  },
  {
    id: 'sales_ops',
    title: 'Sales & Operations Lead',
    subtitle: 'Installation tracking, loan disbursements & rep follow-ups',
    icon: Target,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/50',
    bgActive: 'bg-amber-500/15',
    defaultPrompt: 'Extract customer name, contact phone, installation status, loan approval details, sales agent name, and critical customer remarks.'
  },
  {
    id: 'general',
    title: 'General Business & Copywriting',
    subtitle: 'General chat logging, sentiment scoring & customer hooks',
    icon: PenTool,
    color: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-500/50',
    bgActive: 'bg-purple-500/15',
    defaultPrompt: 'Extract timestamp, sender, message, category, sentiment score, and recommended action items.'
  }
];

export default function PersonaOnboardingModal({ isOpen, onClose, onSelectPersona }) {
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState(user?.rolePersona || 'accountant');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await API.put('/auth/persona', { rolePersona: selected });
      updateUser({ rolePersona: selected });
      if (user?._id || user?.id) {
        localStorage.setItem(`persona_onboarded_${user._id || user.id}`, 'true');
      }
      if (onSelectPersona) {
        const personaObj = PERSONAS.find(p => p.id === selected);
        onSelectPersona(personaObj);
      }
      onClose();
    } catch (err) {
      console.warn('Persona update error:', err);
      updateUser({ rolePersona: selected });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl bg-[#111b21] border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a884]/15 text-[#25d366] text-xs font-semibold mb-2">
                <Sparkles size={14} /> Persona Configuration
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                What best describes your daily work?
              </h2>
              <p className="text-sm text-[#8696a0] mt-1">
                Chat-to-Excel configures your default extraction prompts, accounting rules, and audit models based on your role.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8696a0] hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Persona Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = selected === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                    isSelected
                      ? `${p.bgActive} ${p.borderColor} border-2 shadow-lg shadow-[#00a884]/10`
                      : 'bg-[#182229] border-white/5 hover:border-white/20 hover:bg-[#202c33]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00a884] text-black flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}

                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${p.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                    <Icon size={18} />
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    {p.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#8696a0]">
              <ShieldCheck size={14} className="text-[#25d366]" />
              <span>You can adjust this anytime in your workspace.</span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00a884] to-[#25d366] text-black font-extrabold text-xs hover:opacity-95 shadow-lg shadow-[#00a884]/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Set Persona & Continue'}
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export { PERSONAS };

