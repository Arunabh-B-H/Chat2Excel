import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Wand2,
  CircleStop
} from 'lucide-react';
import API from '../services/api';
import BrandLogo from '../components/BrandLogo';
import HistoryDrawer from '../components/HistoryDrawer';
import ProcessingPreloader from '../components/ProcessingPreloader';
import VoiceInputButton from '../components/VoiceInputButton';
import { useAuth } from '../context/AuthContext';

const QUICK_ACTIONS = [
  { 
    label: 'Payments & Balances', 
    prompt: 'Extract customer name, contact, sale amount, amount received, remaining balance, payment mode, and date.' 
  },
  { 
    label: 'Orders & Dispatches', 
    prompt: 'Extract customer name, order ID, phone, items, delivery address, courier, and status.' 
  },
  { 
    label: 'Entity Normalization', 
    prompt: 'Normalize all franchise and dealer names into clean canonical entities and group totals.' 
  },
  { 
    label: 'Data Quality Audit', 
    prompt: 'Audit entries for duplicate customer records, phone numbers missing digits, and unreadable fields.' 
  }
];

const SAMPLE_DATASETS = {
  retail: `Customer: John Doe, Order #8821, Phone: 9876543210
Items: 3x Wireless Headphones, 1x Mousepad
Sale Amount: $450, Paid $300 via Credit Card, Balance: $150
Status: Shipped to 42 Wallaby Way, Sydney

Customer: Sarah Connor, Order #8822, Phone: 987654321
Items: 1x Mechanical Keyboard
Sale Amount: $180, Full Paid $180 via GPay, Balance: $0
Status: Delivered to Tech Corp HQ

Customer: Marcus Vance, Order #8823, Phone: 9820123456
Items: 2x 4K Monitors, 1x HDMI Cable
Sale Amount: $920, Deposit $400 via Bank Wire, Balance: $520
Status: Processing Dispatch`,

  accounting: `Customer: Alex Morgan
Account ID: ACC-8891024
Phone: 9876543210
250000 Sale, 100000 Transfer, 50000 Card
Branch: Metro Central, Agent: John D.
Status: Partial Payment, 2026-05-10
Notes: Remaining balance 100000 due on dispatch

Customer: Brenda Vance
Account ID: ACC-8891025
Phone: 9811122233
180000 Sale, 180000 Bank Wire
Branch: West End Plaza
Status: Full Payment, 2026-05-12
Notes: Invoice cleared

Customer: Carlos Mendez
Account ID: ACC-8891026
Phone: 9822233344
320000 Sale, 120000 Transfer, 200000 Loan
Branch: North Region
Status: Full Amount, 2026-05-15
Notes: Loan confirmation verified`
};

export default function WorkspacePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [chatText, setChatText] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [userInstructions, setUserInstructions] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [inputMissing, setInputMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const voiceInputRef = useRef(null);
  const navigate = useNavigate();
  const { updateUser, setPricingModalOpen } = useAuth();

  // Handle clean canvas reset on "+ New extraction"
  useEffect(() => {
    const handleReset = () => {
      setChatText('');
      setScreenshotBase64(null);
      setScreenshotPreview(null);
      setUserInstructions('');
      setActiveTab('text');
      setInputMissing(false);
      setError('');
    };

    window.addEventListener('workspace:new', handleReset);
    return () => window.removeEventListener('workspace:new', handleReset);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    setScreenshotPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setScreenshotBase64(reader.result);
    };
    setInputMissing(false);
    setError('');
  };

  // Canvas demo generator for instant testing without manual file selection
  const generateSampleScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 620;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 620, 700);

    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 620, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('Order Dispatch & Client Ledger (Verified)', 35, 42);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(30, 95, 560, 110, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px monospace';
    ctx.fillText('Alex Morgan | ACC-8891024 | 9876543210', 45, 125);
    ctx.fillText('250000 Sale, 100000 Transfer, 50000 Card', 45, 150);
    ctx.fillText('Branch: Metro Central | Partial Payment 2026-05-10', 45, 175);

    ctx.fillStyle = '#eef2ff';
    ctx.strokeStyle = '#c7d2fe';
    ctx.beginPath();
    ctx.roundRect(30, 230, 560, 110, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#312e81';
    ctx.fillText('Brenda Vance | ACC-8891025 | 9811122233', 45, 260);
    ctx.fillText('180000 Sale, 180000 Bank Wire | Branch: West End Plaza', 45, 285);
    ctx.fillText('Full Payment 2026-05-12 | Invoice Cleared', 45, 310);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(30, 365, 560, 110, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Carlos Mendez | ACC-8891026 | 9822233344', 45, 395);
    ctx.fillText('320000 Sale, 120000 Transfer, 200000 Loan', 45, 420);
    ctx.fillText('Branch: North Region | Full Amount 2026-05-15', 45, 445);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setScreenshotBase64(reader.result);
          setScreenshotPreview(canvas.toDataURL('image/png'));
          setInputMissing(false);
          setError('');
        };
      }
    }, 'image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If voice recording is in progress, stop it first to capture full statement
    if (isVoiceRecording) {
      voiceInputRef.current?.stopRecording();
    }

    const hasData = (activeTab === 'text' && chatText.trim().length > 0) || (activeTab === 'screenshot' && !!screenshotBase64);

    if (!hasData) {
      setInputMissing(true);
      return;
    }

    setInputMissing(false);
    setLoading(true);

    try {
      const payload = {
        sourceType: activeTab,
        userInstructions: userInstructions.trim(),
        title: `Reconciliation Batch - ${new Date().toLocaleDateString('en-GB')}`,
        ...(activeTab === 'text' ? { rawText: chatText } : { imageBase64: screenshotBase64 })
      };

      const res = await API.post('/conversions/process', payload);
      const conversionId = res.data.conversionId || res.data._id || res.data.conversion?._id;

      if (res.data.creditsRemaining !== undefined) {
        updateUser({ creditsRemaining: res.data.creditsRemaining });
      }

      navigate(`/app/view/${conversionId}`);
    } catch (err) {
      console.error('Workspace submission error:', err);
      if (err.response?.status === 402) {
        setError('Credit limit reached. Please upgrade to Pro for unlimited conversions.');
        setPricingModalOpen(true);
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'AI Data Entry processing failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <ProcessingPreloader />}

      <div className="min-h-screen bg-[#FBFBFA] text-slate-800 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900 relative">
        
        {/* Top-Left Corner Logo Trigger (Drawer Opener) */}
        <header className="fixed top-4 left-4 z-30">
          <button
            onClick={() => setIsDrawerOpen(true)}
            title="Open History & Account Drawer"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition flex items-center justify-center group active:scale-95"
            aria-label="Open Drawer"
          >
            <BrandLogo size="sm" />
          </button>
        </header>

        {/* History & Account Drawer */}
        <HistoryDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        {/* Main Workspace Stage */}
        <main className="max-w-4xl w-full mx-auto px-4 pt-16 pb-12 flex-1 flex flex-col space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2 pt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-semibold">
              <ShieldCheck size={14} /> Studio Accounting & Data Intake
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What data are we structuring today?
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              Paste customer conversations, receipts, or screenshot captures. Tell the AI what columns and calculations to build.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              {error.includes('sign in') && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition"
                >
                  Sign in
                </button>
              )}
            </div>
          )}

          {/* Elevated Ingestion Card */}
          <div className={`bg-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 transition-all duration-200 ${
            inputMissing 
              ? 'border-2 border-red-500 ring-4 ring-red-500/10 shadow-md shadow-red-500/5' 
              : 'border border-slate-200/90'
          }`}>
            
            {/* Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('text'); setInputMissing(false); setError(''); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    activeTab === 'text'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <FileText size={14} /> Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('screenshot'); setInputMissing(false); setError(''); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    activeTab === 'screenshot'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon size={14} /> Upload Screenshot
                </button>
              </div>

              {/* Sample Helpers */}
              <div className="flex items-center gap-2">
                {activeTab === 'text' ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">Load sample:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setChatText(SAMPLE_DATASETS.retail);
                        setInputMissing(false);
                      }}
                      className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 px-2 py-0.5 rounded-lg font-mono transition flex items-center gap-1"
                    >
                      <Wand2 size={11} /> Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChatText(SAMPLE_DATASETS.accounting);
                        setInputMissing(false);
                      }}
                      className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 px-2 py-0.5 rounded-lg font-mono transition flex items-center gap-1"
                    >
                      <Wand2 size={11} /> Ledger
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={generateSampleScreenshot}
                    className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 px-2.5 py-1 rounded-lg font-mono transition flex items-center gap-1"
                  >
                    <Wand2 size={12} /> Load Sample Screenshot
                  </button>
                )}
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline ml-1">• Claude 3.5 Multimodal</span>
              </div>
            </div>

            {/* In-Card Warning Banner for Missing Input */}
            {inputMissing && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200/80 rounded-2xl text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={17} className="text-red-500 shrink-0" />
                <span>⚠️ Please paste your WhatsApp messages or upload a screenshot first!</span>
              </div>
            )}

            {/* Ingestion Surface */}
            <div className="min-h-[220px]">
              {activeTab === 'text' ? (
                <textarea
                  value={chatText}
                  onChange={(e) => {
                    setChatText(e.target.value);
                    if (inputMissing) setInputMissing(false);
                  }}
                  placeholder="Paste WhatsApp messages, customer payments, or ledger logs here...&#10;e.g.&#10;Customer: Alex Morgan, Account: ACC-8891024, Phone: 9876543210, 250000 Sale, 100000 Transfer, 50000 Card&#10;Branch: Metro Central, Agent: John D., Status: Partial Payment"
                  className="w-full h-full min-h-[220px] p-4 bg-slate-50/70 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y transition"
                />
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition cursor-pointer relative bg-slate-50/40 h-full flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {screenshotPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={screenshotPreview} alt="Preview" className="max-h-56 rounded-xl border border-slate-200 object-contain shadow-xs" />
                      <p className="text-xs text-indigo-600 font-medium">Click to replace screenshot</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-500">
                      <UploadCloud size={36} className="mx-auto text-indigo-500" />
                      <p className="text-xs font-semibold text-slate-700">Drop WhatsApp screenshot here or click to browse</p>
                      <p className="text-[11px] text-slate-400 font-mono">Direct Base64 processing (100% reliable)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Elevated Command Dock */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3.5">
            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-slate-400 text-[11px] font-mono shrink-0 font-semibold">Presets:</span>
              {QUICK_ACTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setUserInstructions(item.prompt);
                    if (isVoiceRecording) {
                      voiceInputRef.current?.stopRecording();
                    }
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition shrink-0 border border-transparent hover:border-indigo-100"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Instruction Input & Mic */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 border rounded-2xl p-2 sm:px-3.5 sm:py-2 transition-all ${
              isVoiceRecording 
                ? 'border-red-400 ring-2 ring-red-500/10 bg-red-50/20' 
                : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10'
            }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Animated Live Equalizer Waves inside input dock when recording */}
                {isVoiceRecording && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100/80 border border-red-200 rounded-lg shrink-0 animate-pulse">
                    <div className="flex items-center gap-0.5">
                      <span className="w-0.5 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-0.5 h-4 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-0.5 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
                      <span className="w-0.5 h-3.5 bg-red-600 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-bold font-mono text-red-600">Recording</span>
                  </div>
                )}

                <input
                  type="text"
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder={
                    isVoiceRecording
                      ? "Listening... speak instructions now (Click Stop when finished)"
                      : "Instruct the AI (e.g. 'Extract customer, amount, remaining balance...')"
                  }
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
                />

                {/* Voice Input Button */}
                <VoiceInputButton
                  ref={voiceInputRef}
                  currentText={userInstructions}
                  onTranscript={(newText) => setUserInstructions(newText)}
                  onRecordingChange={setIsVoiceRecording}
                />
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                {/* Prominent Stop button: a small square inside a circle next to Build Sheet */}
                {isVoiceRecording && (
                  <button
                    type="button"
                    onClick={() => voiceInputRef.current?.stopRecording()}
                    title="Stop Recording"
                    className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-red-600/20 transition shrink-0 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <CircleStop size={17} className="text-white shrink-0" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shadow-indigo-600/20 disabled:opacity-50 shrink-0"
                >
                  <span>Build Sheet</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
