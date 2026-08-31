import React from 'react';
import { ShoppingCart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

// Comments that indicate a one-time non-recurring inflow (lump deposits, not salary)
// Only strip entries where the delta is positive AND comment matches exactly.
const ONE_TIME_INFLOW_KEYWORDS = ['bani nunta'];

const isOneTimeInflow = (comment: string): boolean =>
  ONE_TIME_INFLOW_KEYWORDS.some(kw => comment.toLowerCase().includes(kw));

interface Props { mergedData: MergedData[] }

const MonthlySpendingChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Group by calendar month-year:
  // - last entry per month for netWorth & investments (end-of-month snapshot)
  // - collect all non-empty comments
  // - track one-time inflows (EUR delta of entries flagged as lump-sum)
  type MonthBucket = { key: string; label: string; netWorth: number; investments: number; comments: string[]; oneTimeInflows: number };
  const monthMap = new Map<string, MonthBucket>();

  sorted.forEach((e, idx) => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthMap.get(key);
    const comments = existing?.comments ?? [];
    let oneTimeInflows = existing?.oneTimeInflows ?? 0;

    if (e.comment?.trim()) comments.push(e.comment.trim());

    // If this entry is a one-time lump inflow, compute its EUR delta vs prev entry and accumulate
    if (e.comment && isOneTimeInflow(e.comment) && idx > 0) {
      const prev = sorted[idx - 1];
      const entryDelta = e.netWorth - prev.netWorth;
      if (entryDelta > 0) oneTimeInflows += entryDelta;
    }

    monthMap.set(key, { key, label, netWorth: e.netWorth, investments: e.investments, comments, oneTimeInflows });
  });

  const months = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  // For each month compute "adjusted spending":
  //   rawDelta      = curr.netWorth - prev.netWorth  (= Δcash + Δinvestments + ΔassetsTotal)
  //   investDelta   = curr.investments - prev.investments  (market movement, not spending)
  //   spending      = -(rawDelta - investDelta) = -(Δcash + ΔassetsTotal)
  //
  // We strip the FULL investment delta (both gains and losses) because neither
  // a market gain nor a market loss represents actual cash spending.
  // Then we also subtract any one-time lump inflows (e.g. "bani nunta").
  const chartData = months.slice(1).map((m, i) => {
    const prev = months[i];
    const rawDelta = m.netWorth - prev.netWorth;
    const investDelta = m.investments - prev.investments;
    const spending = -(rawDelta - investDelta) - m.oneTimeInflows;
    return {
      month: m.label,
      spending: parseFloat(spending.toFixed(0)),
      comments: m.comments,
    };
  });

  if (chartData.length === 0) return null;

  const spendingMonths = chartData.filter(d => d.spending > 0);
  const totalSpent = spendingMonths.reduce((s, d) => s + d.spending, 0);
  const avgMonthly = spendingMonths.length > 0 ? totalSpent / spendingMonths.length : 0;
  const worstMonth = spendingMonths.length > 0 ? spendingMonths.reduce((a, b) => b.spending > a.spending ? b : a) : null;

  const CustomTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const isInflow = d.spending <= 0;
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', maxWidth: 280 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{d.month}</p>
        <p style={{ color: isInflow ? '#34d399' : '#f87171', marginBottom: d.comments.length ? 6 : 0 }}>
          {isInflow ? `Intrare netă: ${formatEUR(-d.spending)}` : `Cheltuieli: ${formatEUR(d.spending)}`}
        </p>
        {d.comments.length > 0 && (
          <>
            <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Comentarii:</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {d.comments.map((c: string, i: number) => (
                <li key={i} style={{ color: '#cbd5e1', fontSize: 11, lineHeight: '18px' }}>• {c}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <ShoppingCart className="text-rose-400" size={20} />
        Cheltuieli Lunare Estimate
      </h3>
      <p className="text-xs text-slate-400 mb-1">
        Scăderea averii nete per lună, ajustată pentru pierderile de piață din portofoliu (nu sunt cheltuieli reale).
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Verde = luni cu intrare netă de bani (salarii &gt; cheltuieli). Roșu = luni cu ieșire netă.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total cheltuit</p>
          <p className="text-base font-bold text-rose-400">{formatEUR(totalSpent)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie lună negativă</p>
          <p className="text-base font-bold text-orange-400">{formatEUR(avgMonthly)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Luna cu cel mai mult cheltuit</p>
          <p className="text-base font-bold text-rose-400">{worstMonth ? formatEUR(worstMonth.spending) : '—'}</p>
          {worstMonth && <p className="text-[10px] text-slate-300">{worstMonth.month}</p>}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltipContent />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="spending" name="Cheltuieli" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.spending > 0 ? '#f43f5e' : '#10b981'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySpendingChart;
