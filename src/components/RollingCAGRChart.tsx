import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
const RETURN_KEY = 'portofolify_annual_return';

interface Props { mergedData: MergedData[] }

const RollingCAGRChart: React.FC<Props> = ({ mergedData }) => {
  const expectedReturn = Number(localStorage.getItem(RETURN_KEY) || '7.5');

  if (!mergedData || mergedData.length < 6) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const monthMap = new Map<string, { date: Date; label: string; value: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { date: d, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: e.netWorth });
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const first = monthEntries[0][1];
  if (first.value <= 0) return null;

  // Annualized growth rate of net worth from inception to each month
  const chartData = monthEntries.map(([, m]) => {
    const years = (m.date.getTime() - first.date.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (years < 0.25) return null; // too short to annualize meaningfully
    // Strip the one-time June 2026 inflow so the annualized rate reflects growth, not a deposit.
    const adjValue = m.value;
    const cagr = (Math.pow(adjValue / first.value, 1 / years) - 1) * 100;
    return { month: m.label, cagr: parseFloat(cagr.toFixed(2)) };
  }).filter(Boolean) as { month: string; cagr: number }[];

  if (chartData.length < 2) return null;

  const latest = chartData[chartData.length - 1];
  const best = Math.max(...chartData.map(d => d.cagr));
  const lastMonth = monthEntries[monthEntries.length - 1][1];
  const totalReturn = (lastMonth.value / first.value - 1) * 100;
  const cagrColor = latest.cagr >= expectedReturn ? 'text-emerald-400' : latest.cagr >= 0 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" size={24} />
        Rată Anualizată de Creștere (CAGR)
        <ChartInfo text="Transformă creșterea totală a averii într-un procent mediu pe an (CAGR), calculat de la prima înregistrare până la fiecare moment. Spre deosebire de creșterea cumulativă (care crește mereu), CAGR-ul se stabilizează în timp și arată ritmul real anual. Include și contribuțiile tale, deci reflectă cât de repede crește averea în total, nu doar randamentul pieței. Linia punctată = randamentul așteptat setat." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Ritmul mediu anual cu care ți-a crescut averea de la început până acum.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">CAGR curent</p>
          <p className={`text-base font-bold ${cagrColor}`}>{latest.cagr > 0 ? '+' : ''}{latest.cagr.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Maxim istoric</p>
          <p className="text-base font-bold text-emerald-400">+{best.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Creștere totală</p>
          <p className="text-base font-bold text-slate-300">{totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4 }}>
          <defs>
            <linearGradient id="cagrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any) => [`${(v as number) > 0 ? '+' : ''}${(v as number).toFixed(2)}%`, 'CAGR']}
          />
          <ReferenceLine y={expectedReturn} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `țintă ${expectedReturn}%`, fill: '#94a3b8', fontSize: 9 }} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Area type="monotone" dataKey="cagr" stroke="#10b981" strokeWidth={2} fill="url(#cagrGradient)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RollingCAGRChart;
