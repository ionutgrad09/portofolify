import React from 'react';
import { PiggyBank } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, Legend,
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

const SavingsRateChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  type MonthBucket = { key: string; label: string; netWorth: number; investments: number; oneTimeInflows: number };
  const monthMap = new Map<string, MonthBucket>();

  sorted.forEach((e, idx) => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthMap.get(key);
    let oneTimeInflows = existing?.oneTimeInflows ?? 0;
    if (e.comment && isOneTimeInflow(e.comment) && idx > 0) {
      const delta = e.netWorth - sorted[idx - 1].netWorth;
      if (delta > 0) oneTimeInflows += delta;
    }
    monthMap.set(key, { key, label, netWorth: e.netWorth, investments: e.investments, oneTimeInflows });
  });

  const months = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  // Net cash flow = net worth change − investment market movement − one-time inflows
  // Positive = salary/income exceeded spending that month
  // Negative = spending exceeded income (tax months, big purchases, etc.)
  const rawData = months.slice(1).map((m, i) => {
    const prev = months[i];
    const rawDelta = m.netWorth - prev.netWorth;
    const investDelta = m.investments - prev.investments;
    const cashFlow = rawDelta - investDelta - m.oneTimeInflows;
    return { month: m.label, cashFlow: parseFloat(cashFlow.toFixed(0)) };
  });

  // Rolling 3-month average
  const chartData = rawData.map((d, i) => {
    const slice = rawData.slice(Math.max(0, i - 2), i + 1).map(x => x.cashFlow);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return { ...d, avg3m: parseFloat(avg.toFixed(0)) };
  });

  if (chartData.length === 0) return null;

  const positiveMonths = chartData.filter(d => d.cashFlow > 0);
  const negativeMonths = chartData.filter(d => d.cashFlow < 0);
  const avgPositive = positiveMonths.length > 0
    ? positiveMonths.reduce((a, b) => a + b.cashFlow, 0) / positiveMonths.length : 0;
  const avgNegative = negativeMonths.length > 0
    ? negativeMonths.reduce((a, b) => a + b.cashFlow, 0) / negativeMonths.length : 0;
  const totalAccumulated = chartData.reduce((a, b) => a + b.cashFlow, 0);
  const overallAvg = totalAccumulated / chartData.length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <PiggyBank className="text-emerald-400" size={20} />
        Flux de Numerar Lunar
        <ChartInfo text="Arată variația averii nete per lună, exclus mișcările de piață din investiții și intrările one-time (ex: bani nuntă). Verde = luni în care salariul a depășit cheltuielile. Roșu = luni în care ai cheltuit mai mult decât ai câștigat (plată taxe, achiziții mari). Linia galbenă punctată = media mobilă pe 3 luni." />
      </h3>
      <p className="text-xs text-slate-400 mb-1">
        Variația averii nete per lună, <strong>exclus mișcările de piață din investiții</strong> și intrările one-time.
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Verde = luni în care salariul a depășit cheltuielile. Roșu = luni în care ai cheltuit mai mult (taxe, achiziții mari).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total acumulat</p>
          <p className={`text-base font-bold ${totalAccumulated >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatEUR(totalAccumulated)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie lunară</p>
          <p className={`text-base font-bold ${overallAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatEUR(overallAvg)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie luni +</p>
          <p className="text-base font-bold text-emerald-400">{formatEUR(avgPositive)}</p>
          <p className="text-[10px] text-slate-300">{positiveMonths.length} luni</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie luni −</p>
          <p className="text-base font-bold text-red-400">{formatEUR(avgNegative)}</p>
          <p className="text-[10px] text-slate-300">{negativeMonths.length} luni</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            formatter={(v: any, name: string) => [formatEUR(Number(v)), name]}
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="cashFlow" name="Flux lunar" radius={[3, 3, 0, 0]}>
            {chartData.map((e, i) => (
              <Cell key={i} fill={e.cashFlow >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.8} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="avg3m"
            name="Medie 3 luni"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SavingsRateChart;
