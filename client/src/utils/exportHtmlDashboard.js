/**
 * Standalone Offline HTML Dashboard Exporter for Chat-to-Excel
 * Generates a zero-dependency, self-contained interactive HTML file with embedded
 * Tailwind CSS, Chart.js, search filter, summary metrics, and printable styling.
 */
export const exportHtmlDashboard = (records, title = 'Data Entry Analytics Dashboard') => {
  if (!records || !Array.isArray(records) || records.length === 0) return;

  const EXCLUDED_KEYS = new Set(['_id', 'id', '__v', 'userId', 'rawInputSnippet']);

  // Collect clean column headers
  const allColumns = [];
  records.forEach((record) => {
    if (record && typeof record === 'object') {
      Object.keys(record).forEach((k) => {
        if (!EXCLUDED_KEYS.has(k) && !allColumns.includes(k)) {
          allColumns.push(k);
        }
      });
    }
  });

  const columns = allColumns.length > 0 ? allColumns : Object.keys(records[0] || {});
  const safeRecords = records.map((r, i) => {
    const cleanRow = { '#': i + 1 };
    columns.forEach((col) => {
      cleanRow[col] = r[col] !== undefined && r[col] !== null ? r[col] : '';
    });
    return cleanRow;
  });

  const recordsJson = JSON.stringify(safeRecords);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} • Offline Analytics Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { background-color: #020617; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    @media print {
      body { background-color: #ffffff; color: #0f172a; }
      .no-print { display: none !important; }
      .bg-slate-900\\/80, .bg-slate-900, .bg-slate-950 { background-color: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .text-slate-400, .text-slate-300 { color: #475569 !important; }
      .text-white { color: #0f172a !important; }
    }
  </style>
</head>
<body class="p-4 sm:p-8 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono mb-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Standalone Offline Visual Dashboard
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${title}</h1>
        <p class="text-xs text-slate-400 mt-1">Generated on ${new Date().toLocaleDateString('en-GB')} • Zero external server dependencies • 100% Client-Side</p>
      </div>
      <div class="flex items-center gap-2.5 no-print">
        <button onclick="window.print()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition shadow-sm flex items-center gap-1.5">
          <span>🖨️ Print / Save as PDF</span>
        </button>
      </div>
    </header>

    <!-- Metrics Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="metrics-strip"></div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-200">Entity & Category Breakdown</h3>
          <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">Bar Distribution</span>
        </div>
        <canvas id="categoryChart" height="230"></canvas>
      </div>
      <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-200">Payment Modes & Receipt Channels</h3>
          <span class="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded">Donut Breakdown</span>
        </div>
        <canvas id="modeChart" height="230"></canvas>
      </div>
    </div>

    <!-- Searchable Ledger Table -->
    <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-slate-200">Reconciled Records (${safeRecords.length})</h3>
          <p class="text-[11px] text-slate-400">Search by customer name, consumer ID, bank, or transaction mode</p>
        </div>
        <div class="relative w-full sm:w-72">
          <input 
            type="text" 
            id="tableSearch" 
            placeholder="Search any field..." 
            class="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-full transition"
            oninput="filterRows()"
          />
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-left text-xs" id="ledgerTable">
          <thead class="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-3 w-12 text-center">#</th>
              ${columns.map((c) => `<th class="p-3 whitespace-nowrap">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300" id="tableBody"></tbody>
        </table>
      </div>

      <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
        <span id="filteredCount">Showing all ${safeRecords.length} records</span>
        <span>Chat2ExcelAI Standalone Engine</span>
      </div>
    </div>
  </div>

  <script>
    const data = ${recordsJson};
    const cols = ${JSON.stringify(columns)};

    // Render Metrics
    const metricsDiv = document.getElementById('metrics-strip');
    const totalRecords = data.length;
    let totalSale = 0, totalReceived = 0;

    data.forEach(r => {
      const sale = parseFloat(String(r['Sale Amount'] || r['Total Amount'] || r['Total Contract Value'] || r['saleAmount'] || r['Amount'] || 0).replace(/[^0-9.-]/g, '')) || 0;
      const rec = parseFloat(String(r['Received Amount'] || r['Amount Received'] || r['Amount Paid'] || r['Paid'] || r['receivedAmount'] || 0).replace(/[^0-9.-]/g, '')) || 0;
      totalSale += sale;
      totalReceived += rec;
    });

    const pendingBalance = Math.max(0, totalSale - totalReceived);

    metricsDiv.innerHTML = \`
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p class="text-[10px] uppercase font-mono text-slate-400 font-semibold">Total Records</p>
        <h4 class="text-2xl font-bold text-white mt-1">\${totalRecords}</h4>
      </div>
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p class="text-[10px] uppercase font-mono text-slate-400 font-semibold">Total Volume</p>
        <h4 class="text-2xl font-bold text-emerald-400 mt-1 mono">₹\${totalSale.toLocaleString('en-IN')}</h4>
      </div>
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p class="text-[10px] uppercase font-mono text-slate-400 font-semibold">Total Collected</p>
        <h4 class="text-2xl font-bold text-blue-400 mt-1 mono">₹\${totalReceived.toLocaleString('en-IN')}</h4>
      </div>
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p class="text-[10px] uppercase font-mono text-slate-400 font-semibold">Remaining Balance</p>
        <h4 class="text-2xl font-bold text-amber-400 mt-1 mono">₹\${pendingBalance.toLocaleString('en-IN')}</h4>
      </div>
    \`;

    // Render Table Rows
    const tbody = document.getElementById('tableBody');
    const countSpan = document.getElementById('filteredCount');

    function renderTable(items) {
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" class="p-8 text-center text-slate-500 font-mono">No matching records found.</td></tr>';
        countSpan.textContent = 'Showing 0 records';
        return;
      }

      tbody.innerHTML = items.map((r, idx) => \`
        <tr class="hover:bg-slate-800/40 transition">
          <td class="p-3 text-slate-500 text-center">\${r['#'] || idx + 1}</td>
          \${cols.map(c => {
            const val = r[c] !== undefined && r[c] !== null ? String(r[c]) : '';
            return '<td class="p-3 truncate max-w-[220px] whitespace-nowrap">' + val + '</td>';
          }).join('')}
        </tr>
      \`).join('');
      countSpan.textContent = 'Showing ' + items.length + ' of ' + data.length + ' records';
    }

    renderTable(data);

    function filterRows() {
      const q = document.getElementById('tableSearch').value.toLowerCase().trim();
      if (!q) {
        renderTable(data);
        return;
      }
      const filtered = data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
      renderTable(filtered);
    }

    // Chart.js Category & Payment Mode Breakdown
    const catMap = {}, modeMap = {};
    data.forEach(r => {
      const cat = r['Category'] || r['Franchise/Dealer'] || r['Franchise'] || r['Dealer'] || r['Customer'] || r['Customer / Record'] || 'General Record';
      const mode = r['Payment Mode'] || r['Mode of Receipts'] || r['Mode'] || r['Payment Type'] || r['Status'] || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
      modeMap[mode] = (modeMap[mode] || 0) + 1;
    });

    const catLabels = Object.keys(catMap).slice(0, 8);
    const catValues = catLabels.map(k => catMap[k]);

    new Chart(document.getElementById('categoryChart'), {
      type: 'bar',
      data: {
        labels: catLabels,
        datasets: [{
          data: catValues,
          backgroundColor: '#10B981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8', stepSize: 1 }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });

    const modeLabels = Object.keys(modeMap).slice(0, 6);
    const modeValues = modeLabels.map(k => modeMap[k]);

    new Chart(document.getElementById('modeChart'), {
      type: 'doughnut',
      data: {
        labels: modeLabels,
        datasets: [{
          data: modeValues,
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (title || 'Data_Entry_Dashboard').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${safeTitle}_Offline_Dashboard.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

