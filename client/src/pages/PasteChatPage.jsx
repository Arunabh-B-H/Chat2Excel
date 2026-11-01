import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Sparkles, 
  FileSpreadsheet, 
  Trash2, 
  Send, 
  AlertCircle, 
  Loader2, 
  BookmarkCheck,
  Zap
} from 'lucide-react';

const SAMPLE_PRESETS = [
  {
    name: 'Sales Negotiation',
    title: 'Enterprise SaaS Lead Negotiation',
    text: `[10/24/24, 09:15:22] Vikram Mehta: Good morning. We are reviewing your WhatsApp analytics dashboard for our sales team of 30 reps.
[10/24/24, 09:16:04] You: Good morning Vikram! Happy to assist. The platform handles both raw text exports and phone screenshot OCR with unlimited exports.
[10/24/24, 09:18:30] Vikram Mehta: Great. What is your pricing for 30 seats on an annual billing cycle?
[10/24/24, 09:19:15] You: Our Pro tier is ₹100/month per seat, but for 30 seats on annual billing we provide a 25% discount bringing it to ₹75/seat/month.
[10/24/24, 09:21:00] Vikram Mehta: That fits our budget. Can you send over the formal invoice and GST details? We would like to initiate payment today.
[10/24/24, 09:22:10] You: Sending the invoice with GSTIN to your email right away. Thank you!`
  },
  {
    name: 'Customer Support',
    title: 'Order Status & Return Support',
    text: `24/10/24, 2:30 pm - Priya Sen: Hello, I placed order #WA-9042 yesterday for the mechanical keyboard, but I haven't received a tracking link.
24/10/24, 2:32 pm - You: Hi Priya! Let me look into order #WA-9042 for you right away.
24/10/24, 2:34 pm - You: Your package was dispatched via BlueDart. Your tracking number is BD9821449. Estimated delivery is tomorrow afternoon.
24/10/24, 2:35 pm - Priya Sen: Wonderful! Also, what is your return policy if the switch feel isn't right?
24/10/24, 2:36 pm - You: We offer a 7-day hassle-free replacement or full refund guarantee. Just message us here!
24/10/24, 2:37 pm - Priya Sen: Thank you so much for the quick help, really appreciate it!`
  },
  {
    name: 'Product Feedback',
    title: 'Mobile App Beta User Feedback',
    text: `10/24/24, 11:00 AM - Ananya Roy: Hey team, loving the new dark mode in version 2.1!
10/24/24, 11:02 AM - You: Thanks Ananya! Really appreciate your feedback.
10/24/24, 11:05 AM - Ananya Roy: One small issue: the Excel download button on iPhone Safari seems to trigger a popup warning before saving.
10/24/24, 11:07 AM - You: Got it. We are pushing a fix today to trigger direct blob downloads on iOS WebKit.
10/24/24, 11:08 AM - Ananya Roy: Awesome! If that's fixed, this is 10/10 for our agency workflow.`
  }
];

const PasteChatPage = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, updateUser, setPricingModalOpen } = useAuth();
  const navigate = useNavigate();

  const handlePresetSelect = (preset) => {
    setText(preset.text);
    setTitle(preset.title);
    setError('');
  };

  const handleParse = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please paste or type WhatsApp chat messages to convert.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/conversions/parse-text', {
        text,
        title: title.trim() || undefined
      });

      if (data.success && data.conversion) {
        if (data.creditsRemaining !== undefined) {
          updateUser({ creditsRemaining: data.creditsRemaining });
        }
        navigate(`/conversions/${data.conversion._id}`);
      }
    } catch (err) {
      if (err.response?.status === 402) {
        setError('Credit limit reached. Please upgrade to continue parsing.');
        setPricingModalOpen(true);
      } else if (err.response?.status === 401 || err.message?.includes('401')) {
        setError('Your session has expired or token is invalid. Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login?expired=1', { replace: true });
        }, 1200);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to parse chat. Please verify format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const lineCount = text ? text.split('\n').filter(l => l.trim().length > 0).length : 0;
  const charCount = text.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a884]/15 text-[#25d366] text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Text Parsing Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Paste WhatsApp Chat Export
          </h1>
          <p className="text-sm text-[#8696a0] mt-1">
            Paste exported WhatsApp messages or select a sample preset below for instant AI conversion.
          </p>
        </div>

        {/* User Credit Status */}
        <div className="flex items-center gap-3 bg-[#111b21] border border-white/10 px-4 py-2.5 rounded-xl text-xs">
          <div>
            <div className="text-[#8696a0]">Current Plan</div>
            <div className="text-white font-bold capitalize">{user?.plan === 'pro_100' ? 'Pro Unlimited' : user?.plan || 'Free'}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[#8696a0]">Credits Left</div>
            <div className="text-[#25d366] font-extrabold">
              {user?.plan === 'pro_100' ? 'Unlimited' : user?.creditsRemaining ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mb-6 p-4 rounded-xl bg-[#111b21] border border-white/5">
        <div className="flex items-center justify-between text-xs text-[#8696a0] mb-3">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#25d366]" /> Quick Test Presets (1-Click Fill):
          </span>
          <span>Click to autofill</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-3.5 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#005c4b] border border-white/10 text-xs font-medium text-white transition-all flex items-center gap-1.5 hover:border-[#00a884]/40"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-[#25d366]" />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('upgrade') && (
            <button
              onClick={() => setPricingModalOpen(true)}
              className="px-3 py-1 bg-red-500 text-white font-bold rounded-lg text-[11px]"
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleParse} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
            Export Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Lead Conversation with Vikram - Oct 2024"
            className="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00a884] transition-colors"
          />
        </div>

        {/* Text Area */}
        <div className="relative">
          <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 flex items-center justify-between">
            <span>Raw WhatsApp Chat Text</span>
            <span className="font-mono text-[#8696a0]">
              {lineCount} lines • {charCount} chars
            </span>
          </label>

          <textarea
            rows={14}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste raw exported WhatsApp text here...\n\nExample:\n[10/24/24, 09:15:22] Client Name: Hello, what is the price for 25 units?\n[10/24/24, 09:16:00] You: Hi! That would be ₹1,200 per unit with free delivery.`}
            className="w-full p-4 rounded-xl bg-[#111b21] border border-white/10 text-white text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#00a884] transition-colors resize-y"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setText('');
              setTitle('');
              setError('');
            }}
            disabled={!text && !title}
            className="px-4 py-2.5 rounded-xl bg-[#202c33] text-[#8696a0] hover:text-white text-xs font-semibold border border-white/5 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear Text
          </button>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00a884] to-[#25d366] text-black font-extrabold text-sm hover:opacity-95 shadow-xl shadow-[#00a884]/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>AI Parsing & Structuring...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-black" />
                <span>Parse to Excel Table</span>
                <Send className="w-4 h-4 ml-1 text-black" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasteChatPage;

