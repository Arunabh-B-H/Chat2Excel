import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  BarChart3, 
  Mic, 
  Sparkles, 
  Clock, 
  Zap, 
  Check 
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import NeoleafPreloader from '../components/NeoleafPreloader';

const SAMPLE_RAW = `Customer: Alex Morgan
Account ID: ACC-8891024
Phone: 9876543210
250000 Sale, 100000 Transfer, 50000 Card
Branch: Metro Central, Agent: John D.
Status: Partial Payment, 2026-05-10`;

export default function LandingPage() {
  const { isAuthenticated, setPricingModalOpen } = useAuth();
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [interactiveMode, setInteractiveMode] = useState('raw'); // 'raw' or 'extracted'
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    // Only show curtain reveal on fresh browser session
    const hasLoaded = sessionStorage.getItem('neoleaf_preloader_seen');
    if (!hasLoaded) {
      setShowPreloader(true);
      sessionStorage.setItem('neoleaf_preloader_seen', 'true');
    }
  }, []);

  const hoursSavedWeekly = (hoursPerDay * 5 * 0.85).toFixed(0);
  const hoursSavedYearly = (hoursSavedWeekly * 50).toFixed(0);
  const estimatedCostSaved = (hoursSavedYearly * 350).toLocaleString('en-IN');

  return (
    <>
      {showPreloader && (
        <NeoleafPreloader onComplete={() => setShowPreloader(false)} />
      )}

      <div className="min-h-screen bg-[#FBFBFA] text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5 group">
          <BrandLogo size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition">
              Chat2Excel
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 font-mono">Autonomous Data Entry</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <span>Go to Workspace</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition px-2 py-1">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <span>Try Free</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles size={14} className="text-indigo-600" />
          <span>The Autonomous Data Entry Specialist for WhatsApp & Receipts</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Convert WhatsApp Chat to Excel Online in Seconds
        </h1>

        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          The fastest AI-powered tool to turn messy WhatsApp chats, forwarded payment dumps, and mobile screenshots into formatted .xlsx spreadsheets.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to={isAuthenticated ? '/app' : '/register'}
            className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm transition shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            Start Free (3 Conversions) <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setPricingModalOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition shadow-xs"
          >
            View Pricing (₹50 / ₹100)
          </button>
        </div>

        {/* Micro Trust Indicators */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck size={14} className="text-indigo-600" /> 100% Client-Side Privacy
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <FileSpreadsheet size={14} className="text-indigo-600" /> Instant .xlsx & .html Export
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Zap size={14} className="text-indigo-600" /> Razorpay UPI & Cards
          </span>
        </div>
      </section>

      {/* Live Interactive Before vs After Demo Widget */}
      <section className="max-w-4xl mx-auto w-full px-4 pb-16">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">Live Before & After Preview</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInteractiveMode('raw')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  interactiveMode === 'raw' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                1. Raw WhatsApp Text
              </button>
              <button
                type="button"
                onClick={() => setInteractiveMode('extracted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  interactiveMode === 'extracted' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                2. Formatted Excel
              </button>
            </div>
          </div>

          {interactiveMode === 'raw' ? (
            <div className="p-4 bg-slate-50 rounded-2xl font-mono text-xs text-slate-700 border border-slate-200/80 leading-relaxed whitespace-pre-line">
              {SAMPLE_RAW}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Consumer ID</th>
                    <th className="p-3">Sale Amount</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3">Balance Due</th>
                    <th className="p-3">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Alex Morgan</td>
                    <td className="p-3 text-slate-600">ACC-8891024</td>
                    <td className="p-3 text-indigo-600 font-bold">₹250,000</td>
                    <td className="p-3 text-emerald-600 font-bold">₹150,000</td>
                    <td className="p-3 text-amber-600 font-bold">₹100,000</td>
                    <td className="p-3 text-emerald-600 font-semibold">✓ Verified</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Automatic formula: Balance = Total Sale - Amount Received</span>
            <span className="text-indigo-600 font-medium">Ready to download in .xlsx & .html</span>
          </div>
        </div>
      </section>

      {/* Solutions / Value Grid */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Engineered for Daily Accounting Precision</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">Everything you need to automate manual nightly data entry, reconciliation, and visual reporting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-xs hover:border-indigo-200 transition">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Mic size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Conversational Voice Co-pilot</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Speak or type how you want your data structured. Claude 3.5 Sonnet dynamically maps requested columns, calculates remaining balances, and normalizes messy dealer spellings.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-xs hover:border-indigo-200 transition">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Downloadable Offline Dashboards</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export both publication-grade Excel spreadsheets (.xlsx) and standalone interactive HTML dashboards with search and visual breakdown charts that open anywhere without internet.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-xs hover:border-indigo-200 transition">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Data Quality Audit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Never miss human typos again. The AI automatically audits for phone numbers missing digits, duplicate utility account IDs, and unreadable fields before you download.
            </p>
          </div>
        </div>
      </section>

      {/* ROI Time-Saved Interactive Calculator */}
      <section className="max-w-4xl mx-auto w-full px-4 pb-20">
        <div className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-md w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-xs font-mono text-indigo-700 font-semibold border border-indigo-100">
              <Clock size={14} /> Time Saved Calculator
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">How much time do you spend on manual data entry every day?</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-600">
                <span>Daily Hours:</span>
                <span className="font-bold text-indigo-600">{hoursPerDay} Hours / Day</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 hr/day</span>
                <span>3 hrs/day</span>
                <span>6 hrs/day</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-2 w-full sm:w-64 shrink-0 shadow-inner font-mono">
            <p className="text-xs uppercase text-slate-500 font-semibold">You Will Save Approximately</p>
            <h4 className="text-4xl font-extrabold text-indigo-600">{hoursSavedWeekly} hrs</h4>
            <p className="text-[11px] text-slate-400">Every single week (~{hoursSavedYearly} hours/year)</p>
            <div className="pt-2 text-[11px] text-emerald-600 font-semibold border-t border-slate-200 mt-2">
              Save ~₹{estimatedCostSaved} in data entry hours
            </div>
          </div>
        </div>
      </section>

      {/* Semantic How It Works & Search FAQ Section for Google SEO */}
      <section className="py-16 px-4 max-w-5xl mx-auto text-slate-800 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            How to Convert WhatsApp Chat to Excel
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Three simple steps to transform messy chat exports and mobile payment screenshots into clean, structured spreadsheets.
          </p>
        </div>

        {/* How It Works Steps */}
        <div className="grid md:grid-cols-3 gap-6 my-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="text-indigo-600 font-bold text-lg">1. Export Chat</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Export chat without media from WhatsApp or capture a screenshot of your messages.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="text-indigo-600 font-bold text-lg">2. Paste or Upload</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Paste your raw text or upload the image directly into our AI workspace.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="text-indigo-600 font-bold text-lg">3. Download Excel (.xlsx)</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Claude AI parses custom columns, verifies formulas, and generates your ready-to-use spreadsheet.
            </p>
          </div>
        </div>

        {/* Search FAQ Section */}
        <div className="mt-14 bg-slate-50 p-7 sm:p-9 rounded-3xl border border-slate-200/90">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">How do I convert WhatsApp chat to Excel for free?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Simply export your chat from WhatsApp, paste the text into Chat2Excel, and click Build Sheet. Every new account receives 3 free trial credits to generate formatted spreadsheets instantly.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Can I convert screenshots and images of chats?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Yes. Chat2Excel features multimodal vision AI that extracts accounting and tabular data directly from mobile screenshots.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Can I convert WhatsApp payment messages and ledger balances to Excel?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Yes. Chat2Excel is optimized for financial messages, payment confirmations (GPay, PhonePe, Paytm, HDFC, ICICI), and customer ledger reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400 font-mono mt-auto bg-white">
        © 2026 Chat2Excel • Studio Data Entry & Financial Reconciliation
      </footer>
    </div>
  </>
  );
}
