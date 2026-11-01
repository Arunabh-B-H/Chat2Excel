import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  ShieldCheck, 
  Loader2, 
  LifeBuoy
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SupportBotModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { supportBotOpen, setSupportBotOpen, isAuthenticated } = useAuth();
  
  const isVisible = propIsOpen !== undefined ? propIsOpen : supportBotOpen;
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setSupportBotOpen(false);
    }
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Chat2Excel Support Assistant. How can I help you with your spreadsheet extractions, voice commands, or filing a support ticket today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isVisible]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await API.post('/support/chat', {
        message: userMessage,
        conversationHistory: newMessages
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Support assistant is currently busy. Please try again or reach out to support@chat2excel.com.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // If closed, render a subtle, non-intrusive bottom-right floating trigger when logged in
  if (!isVisible) {
    if (!isAuthenticated) return null;
    return (
      <button
        type="button"
        onClick={() => setSupportBotOpen(true)}
        className="fixed bottom-4 right-4 z-40 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 shadow-md flex items-center gap-2 text-xs font-semibold transition group animate-in fade-in duration-200"
        title="Open Support Assistant & Tickets"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <LifeBuoy size={15} className="text-indigo-600 group-hover:rotate-45 transition duration-300" />
        <span className="hidden sm:inline font-sans">Need Help?</span>
      </button>
    );
  }

  return (
    /* Right-Side Docked Slide-Out Panel (Zero Screen Overlay / Zero Dimming) */
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-5.5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-200 text-slate-800">
      
      {/* Top Subtle Indigo-Amber Hairline */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-amber-500" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <Bot size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Chat2Excel Support AI</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Docked Assistant & Tickets</p>
          </div>
        </div>

        <button 
          onClick={handleClose} 
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
          title="Minimize Assistant"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setInput("How do I upload a WhatsApp screenshot for OCR?")}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 transition whitespace-nowrap shadow-xs"
        >
          📸 Screenshot OCR
        </button>
        <button
          type="button"
          onClick={() => setInput("How does balance calculation work?")}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 transition whitespace-nowrap shadow-xs"
        >
          🧮 Balances
        </button>
        <button
          type="button"
          onClick={() => setInput("Please raise a ticket: Issue with receipt extraction")}
          className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition whitespace-nowrap shadow-xs"
        >
          🎫 Raise Ticket
        </button>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-[#FBFBFA]/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={12} />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs whitespace-pre-line shadow-xs'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-slate-500 text-xs py-1">
            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
              <Loader2 size={12} className="animate-spin text-indigo-600" />
            </div>
            <span className="font-mono text-[11px]">Assistant is consulting guidelines...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Strict Anti-Leakage Guardrail Disclaimer */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono shrink-0">
        <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
        <span className="truncate">Chat2Excel questions & tickets only. Strict anti-leakage active.</span>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or raise a ticket..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-xs shrink-0"
          title="Send Message"
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
}
