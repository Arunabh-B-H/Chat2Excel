import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { exportToExcel } from '../utils/exportExcel';
import { 
  History, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';

const HistoryPage = () => {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/conversions');
      if (data.success && data.conversions) {
        setConversions(data.conversions);
      } else if (Array.isArray(data)) {
        setConversions(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to retrieve conversion history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this conversion record?')) return;

    setDeletingId(id);
    try {
      await API.delete(`/conversions/${id}`);
      setConversions(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete conversion');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickDownload = async (id, title, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const { data } = await API.get(`/conversions/${id}`);
      const records = data.conversion?.records || data.conversion?.structuredData || [];
      if (records.length > 0) {
        const safeTitle = (title || 'Data_Export').replace(/[^a-zA-Z0-9_-]/g, '_');
        exportToExcel(records, `${safeTitle}.xlsx`);
      }
    } catch (err) {
      alert('Could not download Excel file');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 bg-[#FBFBFA] text-slate-800 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2 font-mono">
            <History className="w-3.5 h-3.5" /> Saved Conversions & Ledgers
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Export History & Archives
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access past ledger batches, inspect anomaly flags, and download reconciled `.xlsx` workbooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" /> Open Workspace
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Loading saved conversion records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : conversions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Conversions Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            You haven't converted any WhatsApp chats yet. Start by pasting text or uploading a screenshot in the studio workspace!
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs shadow-indigo-600/20"
          >
            Open Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversions.map((conv) => {
            const recordsCount = conv.records?.length || conv.structuredData?.length || 0;
            return (
              <Link
                key={conv._id}
                to={`/app/view/${conv._id}`}
                className="group p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {conv.sourceType === 'screenshot' ? 'Vision OCR' : 'Text'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {conv.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {conv.userInstructions || conv.customInstructions || conv.analyticsSummary?.keyTakeaway || 'Parsed WhatsApp conversation.'}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-mono">
                    <span className="font-semibold text-slate-900">
                      {recordsCount}
                    </span>
                    <span className="text-slate-400">records extracted</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleQuickDownload(conv._id, conv.title, e)}
                    title="Quick Download Excel"
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline font-mono"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel .xlsx
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(conv._id, e)}
                    disabled={deletingId === conv._id}
                    title="Delete Record"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === conv._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
