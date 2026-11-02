import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  SquarePen, 
  Search, 
  PanelLeftClose, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  LogOut, 
  Bot, 
  CreditCard, 
  Loader2 
} from 'lucide-react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { exportToExcel } from '../utils/exportExcel';
import SupportBotModal from './SupportBotModal';
import PricingModal from './PricingModal';

export default function HistoryDrawer({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const [conversions, setConversions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/conversions');
      const items = res.data?.conversions || res.data || [];
      setConversions(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewExtraction = () => {
    window.dispatchEvent(new CustomEvent('workspace:new'));
    if (onClose) onClose();
    navigate('/app');
  };

  const handleOpenItem = (id) => {
    if (onClose) onClose();
    navigate(`/app/view/${id}`);
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const filtered = conversions.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SupportBotModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 bg-white border-r border-slate-200 text-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Chat2ExcelAI Studio</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 font-mono">v2.0</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close Drawer"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Top Action: New Data Extraction */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleNewExtraction}
            className="w-full py-2.5 px-3.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 rounded-xl text-xs font-semibold text-indigo-700 transition flex items-center gap-2.5 shadow-sm group"
          >
            <SquarePen size={15} className="text-indigo-600 group-hover:scale-110 transition" />
            <span>New Data Extraction</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past extractions..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
          </div>
        </div>

        {/* Middle Section: Recent Exports History */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
            Recent Exports ({conversions.length})
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-xs font-mono">Loading history...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-mono">
              {searchQuery ? 'No matching extractions' : 'No previous extractions found'}
            </div>
          ) : (
            filtered.map((item) => {
              const isActive = location.pathname.includes(item._id);
              const records = item.records || item.structuredData || [];
              const rowCount = records.length;
              const dateStr = item.createdAt 
                ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : '';

              return (
                <div
                  key={item._id}
                  onClick={() => handleOpenItem(item._id)}
                  className={`group w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.sourceType === 'screenshot' ? (
                      <ImageIcon size={14} className="text-blue-500 shrink-0" />
                    ) : (
                      <FileText size={14} className="text-indigo-500 shrink-0" />
                    )}
                    <div className="flex flex-col truncate">
                      <span className="truncate max-w-[150px] font-medium text-slate-800 group-hover:text-slate-900">
                        {item.title || 'Untitled Extraction'}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono -mt-0.5">
                        {rowCount > 0 && <span>{rowCount} rows</span>}
                        {rowCount > 0 && dateStr && <span>•</span>}
                        {dateStr && <span>{dateStr}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (records.length > 0) {
                        const safeTitle = (item.title || 'Extraction').replace(/[^a-zA-Z0-9_-]/g, '_');
                        exportToExcel(records, `${safeTitle}.xlsx`);
                      }
                    }}
                    title="Quick Download .xlsx"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition shrink-0 shadow-xs"
                  >
                    <Download size={13} />
                  </button>
                </div>
              );
            })
          )}

          {/* Dedicated Help Bot Button */}
          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="w-full px-3 py-2.5 rounded-xl text-xs text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 border border-slate-200/80 bg-slate-50 flex items-center gap-2.5 transition group"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">AI Support & Help Bot</span>
                <span className="text-[10px] text-slate-500 font-mono">Ask questions or raise ticket</span>
              </div>
            </button>
          </div>
        </div>

        {/* Pinned Bottom Account Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            
            {/* Account Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {user?.name || 'Arunabh B H'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                    {user?.plan === 'pro_100' ? 'Pro Member' : `${user?.creditsRemaining ?? 0} Credits Left`}
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable / Inline Account Actions: Upgrade & Logout */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setIsPricingOpen(true)}
                className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CreditCard size={12} /> Upgrade Plan
              </button>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>

          </div>
        </div>

      </aside>
    </>
  );
}
