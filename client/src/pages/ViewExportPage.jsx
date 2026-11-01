import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { exportToExcel, exportToCSV, appendToExistingWorkbook } from '../utils/exportExcel';
import { exportHtmlDashboard } from '../utils/exportHtmlDashboard';
import ChatAnalyticsDashboard from '../components/ChatAnalyticsDashboard';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  ArrowLeft, 
  BarChart3, 
  BarChart2,
  Table, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  FileText,
  PlusCircle,
  FileUp,
  AlertTriangle,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';

function formatHeader(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const EXCLUDED_KEYS = new Set(['_id', 'id', '__v', 'userId', 'rawInputSnippet']);

const ViewExportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [appending, setAppending] = useState(false);
  const [appendSuccess, setAppendSuccess] = useState('');

  const appendFileInputRef = useRef(null);

  useEffect(() => {
    const fetchConversion = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/conversions/${id}`);
        if (data.success && (data.conversion || data._id)) {
          setConversion(data.conversion || data);
        } else {
          setError('Conversion record not found');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Session expired. Please sign in again.');
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to retrieve conversion details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();
  }, [id]);

  const rawRecords = useMemo(() => {
    return conversion?.records || conversion?.structuredData || [];
  }, [conversion]);

  // Extract all dynamic columns from records
  const dynamicColumns = useMemo(() => {
    if (!rawRecords || !Array.isArray(rawRecords)) return [];
    const keys = [];
    rawRecords.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => {
          if (!EXCLUDED_KEYS.has(k) && !keys.includes(k)) {
            keys.push(k);
          }
        });
      }
    });
    return keys;
  }, [rawRecords]);

  // Financial aggregates
  const financials = useMemo(() => {
    const audit = conversion?.auditSummary || {};
    const totalRecords = audit.totalRecords || rawRecords.length;
    const totalSale = audit.totalSaleAmount || rawRecords.reduce((acc, r) => acc + (Number(r['Sale Amount'] || r.saleAmount || 0)), 0);
    const totalRecv = audit.totalReceivedAmount || rawRecords.reduce((acc, r) => acc + (Number(r['Received Amount'] || r.receivedAmount || 0)), 0);
    const totalBalance = audit.totalBalancePending !== undefined 
      ? audit.totalBalancePending 
      : Math.max(0, totalSale - totalRecv);
    const anomalies = audit.anomalies || audit.anomaliesFound || [];

    return {
      totalRecords,
      totalSale,
      totalRecv,
      totalBalance,
      anomalies
    };
  }, [conversion, rawRecords]);

  // Filter lists
  const availableCategories = useMemo(() => {
    const cats = new Set(['ALL']);
    rawRecords.forEach(r => {
      const c = r['Category'] || r.category;
      if (c) cats.add(c);
    });
    return Array.from(cats);
  }, [rawRecords]);

  const availableStatuses = useMemo(() => {
    const stats = new Set(['ALL']);
    rawRecords.forEach(r => {
      const s = r['Status'] || r.status;
      if (s) stats.add(s);
    });
    return Array.from(stats);
  }, [rawRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return rawRecords.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const itemCat = item['Category'] || item.category;
        if (itemCat !== selectedCategory) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const itemSt = item['Status'] || item.status;
        if (itemSt !== selectedStatus) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = Object.entries(item).some(([k, v]) => {
          if (EXCLUDED_KEYS.has(k)) return false;
          return String(v).toLowerCase().includes(q);
        });
        if (!matches) return false;
      }

      return true;
    });
  }, [rawRecords, searchQuery, selectedCategory, selectedStatus]);

  const handleExportExcel = () => {
    if (!rawRecords.length) return;
    const safeTitle = (conversion.title || 'Accounting_Master')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToExcel(rawRecords, `${safeTitle}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!rawRecords.length) return;
    const safeTitle = (conversion.title || 'Accounting_Master')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToCSV(rawRecords, `${safeTitle}.csv`);
  };

  const handleExportDashboard = () => {
    if (!rawRecords.length) return;
    exportHtmlDashboard(rawRecords, conversion.title || 'Data_Entry_Dashboard');
  };

  const handleCopyJSON = () => {
    if (!conversion) return;
    navigator.clipboard.writeText(JSON.stringify(rawRecords, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle appending to existing master Excel file
  const handleAppendFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppending(true);
    setAppendSuccess('');
    setError('');

    try {
      await appendToExistingWorkbook(file, rawRecords, `Merged_${file.name.replace(/\.[^/.]+$/, '')}.xlsx`);
      setAppendSuccess(`Successfully appended ${rawRecords.length} records to "${file.name}"!`);
      setTimeout(() => setAppendSuccess(''), 5000);
    } catch (err) {
      console.error('Append error:', err);
      setError(`Failed to append to existing workbook: ${err.message}`);
    } finally {
      setAppending(false);
      if (appendFileInputRef.current) appendFileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-[#FBFBFA] text-slate-800">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-mono">Loading verified accounting dataset...</p>
      </div>
    );
  }

  if (error && !conversion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Record Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This record could not be loaded.'}</p>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#FBFBFA] text-slate-800 min-h-screen">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/app" className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Workspace
          </Link>
          <span>/</span>
          <Link to="/history" className="hover:text-indigo-600 transition-colors font-medium">
            Exports
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{conversion.title}</span>
        </div>

        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-indigo-700 text-xs font-semibold transition shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" /> New Batch
        </Link>
      </div>

      {/* Main Header & Export Actions */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider border border-indigo-100 font-mono">
              {conversion.sourceType === 'screenshot' ? 'Vision OCR' : 'Chat Text'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(conversion.createdAt).toLocaleString()}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-700 font-medium font-mono">
              {rawRecords.length} Verified Records
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {conversion.title}
          </h1>

          {/* Custom Instruction Prompt Pill */}
          {(conversion.customInstructions || conversion.customPrompt) && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Prompt: <strong className="text-indigo-700 font-mono">{conversion.customInstructions || conversion.customPrompt}</strong></span>
            </div>
          )}
        </div>

        {/* Action Buttons: Export Excel, Append Master, CSV, JSON */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download New Master Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-xs shadow-indigo-600/20"
          >
            <Download className="w-4 h-4 text-white" />
            Download Excel (.xlsx)
          </button>

          {/* Download Standalone Offline HTML Dashboard */}
          <button
            onClick={handleExportDashboard}
            title="Download a self-contained interactive HTML dashboard that opens offline in any browser"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition shadow-xs font-mono"
          >
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            Download Offline Dashboard (.html)
          </button>

          {/* Append to Existing Master Workbook */}
          <input
            type="file"
            ref={appendFileInputRef}
            onChange={handleAppendFileSelected}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => appendFileInputRef.current?.click()}
            disabled={appending}
            title="Upload an existing master Excel sheet to append these new rows"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition disabled:opacity-50 font-mono shadow-xs"
          >
            {appending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Append to Master Sheet
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition font-mono shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            CSV
          </button>

          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200 transition font-mono shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'JSON'}
          </button>
        </div>
      </div>

      {appendSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{appendSuccess}</span>
        </div>
      )}

      {/* Financial Accounting Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Reconciled Customers</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {financials.totalRecords}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            From active franchise network
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Contract Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            ₹{financials.totalSale.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Aggregated sale amounts
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Collected (Paid)</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 font-mono">
            ₹{financials.totalRecv.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Via OD, SIB, GPay & Loans
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Remaining Balance</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 font-mono">
            ₹{financials.totalBalance.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Pending disbursements
          </div>
        </div>
      </div>

      {/* Anomalies Audit Alert Banner */}
      {financials.anomalies.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Audit Alert: {financials.anomalies.length} Data Anomaly Flagged</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {financials.anomalies.map((ano, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white border border-amber-200 text-slate-700 flex items-start gap-2 shadow-xs">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                  Row {ano.rowNumber || idx + 1}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{ano.customerName || 'Account'}: <span className="text-amber-700 font-mono">{ano.issueType}</span></div>
                  <div className="text-[11px] text-slate-500">{ano.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Switcher: Interactive Grid vs Visual Analytics */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-all relative ${
            activeTab === 'table' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          Reconciliation Grid ({filteredRecords.length})
          {activeTab === 'table' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-all relative ${
            activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Network Visual Analytics
          {activeTab === 'analytics' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Interactive Grid */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search consumer #, customer, dealer..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:border-indigo-500 outline-none transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" /> Category:
              </div>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Status Pills */}
              {availableStatuses.length > 2 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  {availableStatuses.slice(0, 3).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        selectedStatus === st
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    {dynamicColumns.map((colKey) => (
                      <th key={colKey} className="py-3 px-4 whitespace-nowrap">
                        {formatHeader(colKey)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((row, index) => {
                      const phone = row['Phone Number'] || row.phone || '';
                      const isPhoneAnomaly = String(phone).replace(/\D/g, '').length === 9;

                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-slate-50/70 transition-colors group ${
                            isPhoneAnomaly ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-slate-400 font-mono text-center">{index + 1}</td>
                          {dynamicColumns.map((colKey) => {
                            const val = row[colKey];
                            const strVal = val !== undefined && val !== null ? String(val) : '—';
                            const lowerKey = colKey.toLowerCase();

                            // Formatting rules for financial columns
                            const isAmount = lowerKey.includes('amount') || lowerKey.includes('balance') || lowerKey.includes('sale');
                            const isConsumerNo = lowerKey.includes('consumer');
                            const isPhone = lowerKey.includes('phone');
                            const isEntity = lowerKey.includes('franchise') || lowerKey.includes('dealer');
                            const isStatus = lowerKey.includes('status');

                            if (isConsumerNo && strVal !== '—') {
                              return (
                                <td key={colKey} className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                  {strVal}
                                </td>
                              );
                            }

                            if (isPhone && strVal !== '—') {
                              return (
                                <td key={colKey} className="py-3 px-4 font-mono whitespace-nowrap">
                                  {strVal.length === 9 ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                      {strVal} <span className="text-[9px] px-1 rounded bg-amber-100">9 digits!</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-800">{strVal}</span>
                                  )}
                                </td>
                              );
                            }

                            if (isAmount && strVal !== '—') {
                              const num = Number(strVal);
                              const isRemaining = lowerKey.includes('balance') || lowerKey.includes('remaining');
                              const isPaid = lowerKey.includes('received') || lowerKey.includes('paid');
                              const formatted = !isNaN(num) ? `₹${num.toLocaleString('en-IN')}` : strVal;

                              return (
                                <td 
                                  key={colKey} 
                                  className={`py-3 px-4 font-mono font-bold whitespace-nowrap ${
                                    isRemaining && num > 0
                                      ? 'text-amber-600'
                                      : isPaid
                                      ? 'text-emerald-600'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {formatted}
                                </td>
                              );
                            }

                            if (isEntity) {
                              return (
                                <td key={colKey} className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-mono">
                                    {strVal}
                                  </span>
                                </td>
                              );
                            }

                            if (isStatus) {
                              return (
                                <td key={colKey} className="py-3 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                    {strVal}
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td key={colKey} className="py-3 px-4 text-slate-700 max-w-xs break-words">
                                {strVal}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={dynamicColumns.length + 1} className="py-12 text-center text-sm text-slate-400 font-mono">
                        No records match the active search query or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Analytics */}
      {activeTab === 'analytics' && (
        <ChatAnalyticsDashboard
          structuredData={rawRecords}
          analyticsSummary={conversion.analyticsSummary}
        />
      )}
    </div>
  );
};

export default ViewExportPage;
