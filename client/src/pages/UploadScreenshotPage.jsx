import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  Check, 
  Eye, 
  Wand2 
} from 'lucide-react';

const UploadScreenshotPage = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { user, updateUser, setPricingModalOpen } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, or WEBP).');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      if (!title) {
        setTitle(`Screenshot OCR - ${selected.name.replace(/\.[^/.]+$/, '')}`);
      }
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('image/')) {
        setError('Please drop an image file (PNG, JPG, or WEBP).');
        return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      if (!title) {
        setTitle(`Screenshot OCR - ${droppedFile.name.replace(/\.[^/.]+$/, '')}`);
      }
      setError('');
    }
  };

  // Helper to create a synthetic WhatsApp screenshot on canvas for quick testing
  const generateSampleScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Background WhatsApp Dark
    ctx.fillStyle = '#0b141a';
    ctx.fillRect(0, 0, 600, 700);

    // Header bar
    ctx.fillStyle = '#202c33';
    ctx.fillRect(0, 0, 600, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Rajesh Kumar (Enterprise Lead)', 60, 42);

    // Messages
    // Bubble 1 (Incoming)
    ctx.fillStyle = '#202c33';
    ctx.beginPath();
    ctx.roundRect(40, 100, 420, 90, 12);
    ctx.fill();

    ctx.fillStyle = '#e9edef';
    ctx.font = '15px sans-serif';
    ctx.fillText('Hi, saw your Chat2ExcelAI demo!', 60, 135);
    ctx.fillText('Can we get pricing for 25 seats annual?', 60, 160);

    // Bubble 2 (Outgoing)
    ctx.fillStyle = '#005c4b';
    ctx.beginPath();
    ctx.roundRect(140, 220, 420, 95, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText('Hello Rajesh! Absolutely. 25-seat tier is', 160, 255);
    ctx.fillText('₹75/seat/month with unlimited OCR exports.', 160, 280);

    // Bubble 3 (Incoming)
    ctx.fillStyle = '#202c33';
    ctx.beginPath();
    ctx.roundRect(40, 345, 420, 90, 12);
    ctx.fill();

    ctx.fillStyle = '#e9edef';
    ctx.fillText('Sounds good! Does it export XLSX directly?', 60, 380);
    ctx.fillText('Please email invoice to finance@agency.com', 60, 405);

    canvas.toBlob((blob) => {
      if (blob) {
        const demoFile = new File([blob], 'whatsapp_demo_chat.png', { type: 'image/png' });
        setFile(demoFile);
        setPreviewUrl(canvas.toDataURL('image/png'));
        setTitle('WhatsApp Enterprise Lead Screenshot Demo');
        setError('');
      }
    }, 'image/png');
  };

  const fileToBase64 = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleUploadAndParse = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or upload a WhatsApp screenshot image.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Direct Base64 conversion (Option A - bulletproof across all environments)
      const base64DataUrl = await fileToBase64(file);

      const { data } = await API.post('/conversions/parse-screenshot', {
        image: base64DataUrl,
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
        setError('Credit limit reached. Please upgrade your plan to continue.');
        setPricingModalOpen(true);
      } else if (err.response?.status === 401 || err.message?.includes('401')) {
        setError('Your session has expired or token is invalid. Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login?expired=1', { replace: true });
        }, 1200);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Vision OCR parsing failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a884]/15 text-[#25d366] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Multimodal Vision Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            WhatsApp Screenshot OCR to Excel
          </h1>
          <p className="text-sm text-[#8696a0] mt-1">
            Drop your phone screenshot. Our Gemini 2.0 Flash Vision AI extracts every chat bubble into structured rows.
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

      {/* Quick Test Demo Button */}
      <div className="mb-6 p-4 rounded-xl bg-[#111b21] border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[#8696a0]">
          <strong className="text-white">Don't have a phone screenshot ready?</strong> Click below to generate an instant sample screenshot.
        </div>
        <button
          type="button"
          onClick={generateSampleScreenshot}
          className="px-3.5 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#00a884]/20 border border-[#00a884]/30 text-xs font-semibold text-[#25d366] flex items-center gap-1.5 transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Load Sample Screenshot
        </button>
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
          {(error.includes('session') || error.includes('sign in') || error.includes('token') || error.includes('401')) && (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1 bg-[#00a884] text-white font-bold rounded-lg text-[11px]"
            >
              Sign In Again
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleUploadAndParse} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
            Conversion Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Client Consultation Screenshot - 24 Oct"
            className="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00a884] transition-colors"
          />
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            previewUrl
              ? 'border-[#00a884]/60 bg-[#111b21]'
              : 'border-white/10 hover:border-[#00a884]/40 bg-[#111b21]/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative max-w-sm mx-auto overflow-hidden rounded-xl border border-white/10 group">
              <img
                src={previewUrl}
                alt="WhatsApp Screenshot"
                className="w-full max-h-96 object-contain rounded-xl bg-[#0b141a]"
              />

              {/* Scanning Laser Beam */}
              {loading && (
                <div className="absolute inset-x-0 h-1 bg-[#25d366] shadow-[0_0_15px_#25d366] animate-scan z-10" />
              )}

              <div className="mt-3 text-xs text-[#8696a0] flex items-center justify-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#25d366]" />
                <span className="font-medium text-white">{file?.name}</span> ({(file?.size / 1024).toFixed(1)} KB)
              </div>
              <p className="text-[11px] text-[#8696a0] mt-1">Click to replace screenshot</p>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#202c33] border border-white/10 flex items-center justify-center text-[#25d366] mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Drop your WhatsApp Screenshot here
              </h3>
              <p className="text-xs text-[#8696a0] max-w-sm mx-auto">
                Supports PNG, JPG, or WEBP up to 15MB. Our Multimodal AI scans speech bubbles and timestamps.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#202c33] text-xs font-semibold text-white border border-white/5">
                <ImageIcon className="w-3.5 h-3.5 text-[#25d366]" />
                Browse Device Files
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreviewUrl('');
              setTitle('');
              setError('');
            }}
            disabled={!file}
            className="px-4 py-2.5 rounded-xl bg-[#202c33] text-[#8696a0] hover:text-white text-xs font-semibold border border-white/5 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Reset
          </button>

          <button
            type="submit"
            disabled={loading || !file}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00a884] to-[#25d366] text-black font-extrabold text-sm hover:opacity-95 shadow-xl shadow-[#00a884]/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Running Gemini Vision OCR...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-black" />
                <span>Extract Screenshot to Excel</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadScreenshotPage;

