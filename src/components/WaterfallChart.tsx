import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const ONE_TIME_INFLOW_KEYWORDS = ['bani nunta'];
const isOneTimeInflow = (comment: string) =>
  ONE_TIME_INFLOW_KEYWORDS.some(kw => comment.toLowerCase().includes(kw));

interface Props { mergedData: MergedData[] }

const WaterfallChart: React.FC<Props> = ({ mergedData }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const years = Array.from(new Set(sorted.map(e => String(parseDDMMYYYY(e.date).getFullYear())))).sort();

  const filtered = selectedYear === 'all' ? sorted : sorted.filter(e => String(parseDDMMYYYY(e.date).getFullYear()) === selectedYear);

  type MonthBucket = { key: string; label: string; netWorth: number; investments: number; oneTimeInflows: number };
  const monthMap = new Map<string, MonthBucket>();

  filtered.forEach((e, idx) => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const shortLabel = selectedYear === 'all'
      ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      : MONTH_NAMES[d.getMonth()];
    const existing = monthMap.get(key);
    let oneTimeInflows = existing?.oneTimeInflows ?? 0;

    if (e.comment && isOneTimeInflow(e.comment) && idx > 0) {
      const globalIdx = sorted.indexOf(e);
      if (globalIdx > 0) {
        const delta = e.netWorth - sorted[globalIdx - 1].netWorth;
        if (delta > 0) oneTimeInflows += delta;
      }
    }
    monthMap.set(key, { key, label: shortLabel, netWorth: e.netWorth, investments: e.investments, oneTimeInflows });
  });

  const months = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  // Build waterfall: each month shows component breakdown
  // market = investDelta, salary/income = positive cash change, spending = negative cash change, lump = one-time
  const chartData = months.slice(1).map((m, i) => {
    const prev = months[i];
    const rawDelta = m.netWorth - prev.netWorth;
    const investDelta = m.investments - prev.investments;
    const cashDelta = rawDelta - investDelta;
    const lump = m.oneTimeInflows;
    const adjustedCash = cashDelta - lump;
    const income = adjustedCash > 0 ? adjustedCash : 0;
    const expenses = adjustedCash < 0 ? adjustedCash : 0;

    return {
      month: m.label,
      total: parseFloat(rawDelta.toFixed(0)),
      market: parseFloat(investDelta.toFixed(0)),
      income: parseFloat(income.toFixed(0)),
      expenses: parseFloat(expenses.toFixed(0)),
      lump: parseFloat(lump.toFixed(0)),
    };
  });

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', minWidth: 200 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 6 }}>{label}</p>
        <p style={{ color: d.total >= 0 ? '#34d399' : '#f87171', fontWeight: 700, marginBottom: 6 }}>
          Total: {d.total >= 0 ? '+' : ''}{formatEUR(d.total)}
        </p>
        {d.income !== 0 && <p style={{ color: '#3b82f6' }}>💼 Venit net: +{formatEUR(d.income)}</p>}
        {d.market !== 0 && <p style={{ color: d.market >= 0 ? '#a855f7' : '#f97316' }}>📈 Piață: {d.market >= 0 ? '+' : ''}{formatEUR(d.market)}</p>}
        {d.expenses !== 0 && <p style={{ color: '#f43f5e' }}>🛒 Cheltuieli: {formatEUR(d.expenses)}</p>}
        {d.lump !== 0 && <p style={{ color: '#facc15' }}>💰 Intrare one-time: +{formatEUR(d.lump)}</p>}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="text-cyan-400" size={20} />
          Waterfall Lunar — Unde s-au dus banii
          <ChartInfo text="Descompune variația averii nete per lună în 4 componente: Venit net cash (albastru) = salarii minus cheltuieli curente; Mișcare piață (violet) = câștig/pierdere din ETF-uri; Cheltuieli (roșu) = ieșiri nete de cash; Intrare one-time (galben) = sume excepționale (ex: bani nuntă). Suma tuturor = variația totală a averii. Folosește filtrul de an pentru a compara anii." />
        </h3>
        <div className="flex gap-1 flex-wrap justify-end">
          {['all', ...years].map(yr => (
            <button key={yr} onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedYear === yr ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
              {yr === 'all' ? 'Toți' : yr}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltipContent />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="income" name="Venit" stackId="a" fill="#3b82f6" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
          <Bar dataKey="market" name="Piață" stackId="a" fill="#a855f7" fillOpacity={0.85} />
          <Bar dataKey="lump" name="One-time" stackId="a" fill="#facc15" fillOpacity={0.85} />
          <Bar dataKey="expenses" name="Cheltuieli" stackId="a" fill="#f43f5e" fillOpacity={0.85} radius={[0, 0, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill="#f43f5e" fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-blue-500"></span> Venit net cash</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-purple-500"></span> Mișcare piață</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-yellow-400"></span> Intrare one-time</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-rose-500"></span> Cheltuieli</span>
      </div>
    </div>
  );
};

export default WaterfallChart;
