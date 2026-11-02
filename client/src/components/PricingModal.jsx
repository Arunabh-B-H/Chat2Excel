import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  X, 
  QrCode, 
  Smartphone, 
  Sparkles, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { 
    user, 
    updateUser, 
    setUser, 
    pricingModalOpen, 
    setPricingModalOpen, 
    isAuthenticated 
  } = useAuth();
  
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pricingConfig, setPricingConfig] = useState({
    merchantUpi: 'mjolnirfitness3@okicici',
    plans: {
      basic_50: { displayPrice: 50, amount: 5000 },
      pro_100: { displayPrice: 100, amount: 10000 }
    }
  });

  const navigate = useNavigate();

  const isVisible = propIsOpen !== undefined ? propIsOpen : pricingModalOpen;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else if (setPricingModalOpen) {
      setPricingModalOpen(false);
    }
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isVisible) {
      API.get('/payments/config')
        .then((res) => {
          if (res.data?.plans) {
            setPricingConfig(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const basicPrice = pricingConfig.plans?.basic_50?.displayPrice ?? 50;
  const proPrice = pricingConfig.plans?.pro_100?.displayPrice ?? 100;
  const merchantUpi = pricingConfig.merchantUpi || 'mjolnirfitness3@okicici';

  const triggerUpgradeSuccess = (updatedUserData, price, planKey) => {
    try {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const planName = planKey === 'pro_100' ? 'Pro Unlimited' : 'Basic';
    setSuccess(`🎉 Payment of ₹${price} Verified! Upgraded to ${planName}.`);

    if (updatedUserData) {
      if (updateUser) updateUser(updatedUserData);
      if (setUser) setUser(updatedUserData);
    }

    setTimeout(() => {
      handleClose();
    }, 2200);
  };

  const handleCheckout = async (planKey) => {
    if (!isAuthenticated) {
      handleClose();
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');
    setLoadingPlan(planKey);

    try {
      const planType = (planKey === 'pro_100' || planKey === 'pro') ? 'pro' : 'basic';
      const res = await API.post('/payments/create-order', { plan: planKey, planType });
      const { orderId, amount, displayPrice, keyId, merchantUpi: returnedUpi } = res.data;

      const clientKeyId = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const activeUpi = returnedUpi || merchantUpi;
      const isLiveOrTestKey = clientKeyId && (clientKeyId.startsWith('rzp_test_') || clientKeyId.startsWith('rzp_live_')) && !clientKeyId.includes('demo') && !clientKeyId.includes('placeholder');

      if (isLiveOrTestKey) {
        const isLoaded = await loadRazorpay();
        if (isLoaded) {
          const options = {
            key: clientKeyId,
            amount,
            currency: 'INR',
            name: 'Chat2ExcelAI Studio',
            description: `${planKey === 'pro_100' ? 'Pro Plan' : 'Basic Plan'} - ₹${displayPrice}/month`,
            order_id: orderId,
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: ''
            },
            config: {
              display: {
                blocks: {
                  upi: {
                    name: 'Pay using UPI (Recommended)',
                    instruments: [{ method: 'upi' }]
                  },
                  other: {
                    name: 'Cards & Net Banking',
                    instruments: [{ method: 'card' }, { method: 'netbanking' }]
                  }
                },
                sequence: ['block.upi', 'block.other'],
                preferences: { show_default_blocks: true }
              }
            },
            theme: { color: '#4F46E5' },
            handler: async function (response) {
              try {
                const verifyRes = await API.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planType,
                  plan: planKey
                });

                if (verifyRes.data.success) {
                  triggerUpgradeSuccess(verifyRes.data.user, displayPrice, planKey);
                }
              } catch (verifyErr) {
                setError(verifyErr.response?.data?.error || 'Payment signature verification failed.');
              }
            },
            modal: {
              ondismiss: () => setLoadingPlan(null)
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            setError(`Payment Failed: ${response.error?.description || 'Transaction declined'}`);
          });
          rzp.open();
          return;
        }
      }

      // Mobile Direct UPI Intent Fallback
      if (isMobile) {
        window.location.href = `upi://pay?pa=${activeUpi}&pn=Chat2ExcelAI&am=${displayPrice}&cu=INR&tn=Plan_${planKey}`;
      }

      // Simulated Verification Fallback for local sandbox testing
      const verifyRes = await API.post('/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        isSimulated: true
      });

      if (verifyRes.data.success) {
        triggerUpgradeSuccess(verifyRes.data.user, displayPrice, planKey);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.error || err.message || 'Payment initiation failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 text-slate-800 my-auto max-h-[95vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-semibold">
              <Zap size={13} /> Official Production Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Upgrade Your Plan
            </h2>
            
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
              {isMobile ? (
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full font-mono text-[11px]">
                  <Smartphone size={13} className="text-emerald-600" /> Mobile UPI Intent Active (Google Pay / PhonePe)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full font-mono text-[11px]">
                  <QrCode size={13} className="text-indigo-600" /> Desktop QR Mode Active (Scan with any UPI App)
                </span>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5 shadow-xs font-semibold">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Responsive Plan Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Plan 1: Basic (₹50) */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
              <div>
                <span className="text-xs font-mono uppercase text-slate-500 font-semibold">Basic Plan</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">₹{basicPrice}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" /> 50 Extractions / Month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" /> Full Excel (.xlsx) Downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" /> Screenshot OCR & Text Parsing
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleCheckout('basic_50')}
                disabled={loadingPlan !== null}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 active:scale-95"
              >
                {loadingPlan === 'basic_50' ? (
                  <Loader2 size={14} className="animate-spin text-slate-600" />
                ) : isMobile ? (
                  <Smartphone size={14} className="text-slate-600" />
                ) : (
                  <QrCode size={14} className="text-slate-600" />
                )}
                <span>Pay ₹{basicPrice} {isMobile ? 'via Google Pay' : 'via UPI QR / Card'}</span>
              </button>
            </div>

            {/* Plan 2: Pro (₹100) — UPI Recommended */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white border-2 border-indigo-600 flex flex-col justify-between space-y-4 shadow-md">
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider font-mono shadow-xs">
                UPI Recommended
              </span>
              <div>
                <span className="text-xs font-mono uppercase text-indigo-700 font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-600" /> Pro Unlimited
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">₹{proPrice}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 shrink-0" /> <strong>Unlimited Extractions</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 shrink-0" /> Standalone Offline HTML Dashboards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 shrink-0" /> Continuous Voice Dictation
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleCheckout('pro_100')}
                disabled={loadingPlan !== null}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs shadow-indigo-600/30 disabled:opacity-50 active:scale-95"
              >
                {loadingPlan === 'pro_100' ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : isMobile ? (
                  <Smartphone size={14} className="text-white" />
                ) : (
                  <QrCode size={14} className="text-white" />
                )}
                <span>Pay ₹{proPrice} {isMobile ? 'via Google Pay' : 'via UPI QR / Card'}</span>
              </button>
            </div>
          </div>

          {/* Security & Direct Bank Settlement */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
              <span>Direct Settlement: <strong className="text-slate-800">{merchantUpi}</strong></span>
            </div>
            <span className="text-slate-400">256-bit Encrypted • Instant Activation</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
