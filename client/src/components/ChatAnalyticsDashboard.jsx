import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard,
  DollarSign,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const PALETTE = ['#00a884', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

const ChatAnalyticsDashboard = ({ structuredData = [], analyticsSummary = {} }) => {
  // Check if financial fields exist
  const isAccountingData = useMemo(() => {
    if (!structuredData || structuredData.length === 0) return false;
    const first = structuredData[0];
    return 'Sale Amount' in first || 'saleAmount' in first || 'Franchise/Dealer' in first || 'Payment Mode' in first;
  }, [structuredData]);

  // Aggregate by Franchise / Dealer
  const franchiseData = useMemo(() => {
    const map = {};
    structuredData.forEach((item) => {
      const entity = item['Franchise/Dealer'] || item.franchise || item.dealer || item.sender || 'Other';
      const sale = Number(item['Sale Amount'] || item.saleAmount || 0);
      const recv = Number(item['Received Amount'] || item.receivedAmount || 0);

      if (!map[entity]) {
        map[entity] = { name: entity, totalSale: 0, totalReceived: 0, count: 0 };
      }
      map[entity].totalSale += sale;
      map[entity].totalReceived += recv;
      map[entity].count += 1;
    });

    return Object.values(map).sort((a, b) => b.totalSale - a.totalSale).slice(0, 8);
  }, [structuredData]);

  // Aggregate by Payment Mode
  const paymentModeData = useMemo(() => {
    const map = {};
    structuredData.forEach((item) => {
      const mode = item['Payment Mode'] || item.paymentMode || item.category || 'Direct / Bank';
      map[mode] = (map[mode] || 0) + 1;
    });

    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: PALETTE[i % PALETTE.length]
    })).sort((a, b) => b.value - a.value);
  }, [structuredData]);

  // Aggregate Districts
  const districtData = useMemo(() => {
    const map = {};
    structuredData.forEach((item) => {
      const d = item['District'] || item.district;
      if (d && d !== 'N/A') {
        map[d] = (map[d] || 0) + 1;
      }
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [structuredData]);

  const totalRecords = structuredData.length;

  return (
    <div className="space-y-6">
      {/* Executive Synthesis Card */}
      <div className="p-6 rounded-2xl glass-panel border border-[#00a884]/30 bg-gradient-to-r from-[#111b21] via-[#1a2730] to-[#111b21]">
        <div className="flex items-center gap-2 mb-2 text-[#25d366]">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {isAccountingData ? 'Financial Audit & Reconciliation Synthesis' : 'AI Executive Synthesis'}
          </h3>
        </div>
        <p className="text-white text-base leading-relaxed font-medium">
          {analyticsSummary?.overview || analyticsSummary?.keyTakeaway || 'Audited and normalized all records into verified accounting datasets.'}
        </p>

        {analyticsSummary?.topTopics && analyticsSummary.topTopics.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
            <span className="text-xs text-[#8696a0] font-semibold">Key Highlights:</span>
            {analyticsSummary.topTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#00a884]/15 text-[#25d366] border border-[#00a884]/25"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Franchise/Dealer Volume */}
        <div className="p-5 rounded-2xl bg-[#111b21] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> 
              {isAccountingData ? 'Franchise & Dealer Sales (₹)' : 'Participant Activity'}
            </h4>
            <span className="text-xs text-[#8696a0]">{franchiseData.length} entities</span>
          </div>

          <div className="h-64 w-full">
            {franchiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={franchiseData} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#8696a0" 
                    tick={{ fill: '#8696a0', fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#8696a0" 
                    tick={{ fill: '#8696a0', fontSize: 10 }}
                    tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v}`}
                  />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                    contentStyle={{
                      backgroundColor: '#1f2c34',
                      borderColor: '#00a884',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="totalSale" name="Sale Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalReceived" name="Received" fill="#00a884" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8696a0]">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Payment Mode Breakdown */}
        <div className="p-5 rounded-2xl bg-[#111b21] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#25d366]" /> 
              {isAccountingData ? 'Payment Channel Distribution' : 'Category Breakdown'}
            </h4>
            <span className="text-xs text-[#8696a0]">{paymentModeData.length} channels</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {paymentModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#111b21" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2c34',
                      borderColor: '#00a884',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#8696a0]">No channel data</div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
            {paymentModeData.slice(0, 5).map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[#8696a0]">{p.name}:</span>
                <strong className="text-white">{p.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAnalyticsDashboard;
