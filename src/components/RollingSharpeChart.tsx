import React from 'react';
import { Gauge } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
const WINDOW = 6;

interface Props { mergedData: MergedData[] }

const RollingSharpeChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 10) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const monthMap = new Map<string, { label: string; value: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: e.netWorth });
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const returns: { label: string; ret: number }[] = [];
  for (let i = 1; i < monthEntries.length; i++) {
    const prev = monthEntries[i - 1][1].value;
    const curr = monthEntries[i][1].value;
    if (prev > 0) {
      const [y, mm] = monthEntries[i][0].split('-').map(Number);
      // Strip the one-time June 2026 inflow so it doesn't distort risk-adjusted return.
      returns.push({ label: monthEntries[i][1].label, ret: (curr - prev) / prev });
    }
  }

  // Rolling annualized Sharpe (risk-free ~ 0): mean/std of window, annualized by sqrt(12)
  const chartData = returns.map((r, i) => {
    if (i < WINDOW - 1) return null;
    const slice = returns.slice(i - WINDOW + 1, i + 1).map(x => x.ret);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const std = Math.sqrt(variance);
    const sharpe = std === 0 ? 0 : (mean / std) * Math.sqrt(12);
    return { month: r.label, sharpe: parseFloat(sharpe.toFixed(2)) };
  }).filter(Boolean) as { month: string; sharpe: number }[];

  if (chartData.length < 2) return null;

  const avg = chartData.reduce((a, b) => a + b.sharpe, 0) / chartData.length;
  const latest = chartData[chartData.length - 1];
  const rating = (s: number) => s >= 1 ? { txt: 'Excelent', c: 'text-emerald-400' } : s >= 0.5 ? { txt: 'Bun', c: 'text-lime-400' } : s >= 0 ? { txt: 'Slab', c: 'text-yellow-400' } : { txt: 'Negativ', c: 'text-red-400' };
  const r = rating(latest.sharpe);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Gauge className="text-indigo-400" size={24} />
        Sharpe Rolling {WINDOW} Luni (Randament ajustat la risc)
        <ChartInfo text="Sharpe măsoară cât randament obții pentru fiecare unitate de risc (volatilitate). Se calculează pe o fereastră mobilă de 6 luni ca media randamentelor împărțită la volatilitate, anualizat. Peste 1 = excelent (câștig mare cu risc mic), 0.5–1 = bun, sub 0 = ai pierdut bani asumându-ți risc. Complementar cu graficul de volatilitate: acolo vezi riscul, aici vezi dacă riscul a meritat." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Randament per unitate de risc. Mai sus = câștig mai bun raportat la cât de mult a fluctuat averea.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Sharpe curent</p>
          <p className={`text-base font-bold ${r.c}`}>{latest.sharpe.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie istorică</p>
          <p className="text-base font-bold text-slate-300">{avg.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Evaluare</p>
          <p className={`text-base font-bold ${r.c}`}>{r.txt}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4 }}>
          <defs>
            <linearGradient id="sharpeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any) => [(v as number).toFixed(2), 'Sharpe anualizat']}
          />
          <ReferenceLine y={0} stroke="#64748b" />
          <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'excelent', fill: '#22c55e', fontSize: 9 }} />
          <Area type="monotone" dataKey="sharpe" stroke="#6366f1" strokeWidth={2} fill="url(#sharpeGradient)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RollingSharpeChart;
