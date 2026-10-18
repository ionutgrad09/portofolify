import React from 'react';
import { Trophy } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface Props { mergedData: MergedData[] }

const BestWorstMonthsChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 4) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const monthMap = new Map<string, number>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, e.netWorth);
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const months: { label: string; delta: number; pct: number }[] = [];
  for (let i = 1; i < monthEntries.length; i++) {
    const [prevKey, prev] = monthEntries[i - 1];
    void prevKey;
    const [currKey, curr] = monthEntries[i];
    const [y, m] = currKey.split('-').map(Number);
    // Strip the one-time June 2026 inflow so it doesn't top the "best month" ranking.
    const delta = curr - prev;
    months.push({
      label: `${MONTH_NAMES[m - 1]} ${y}`,
      delta,
      pct: prev > 0 ? (delta / prev) * 100 : 0,
    });
  }

  if (months.length < 2) return null;

  const N = Math.min(5, Math.floor(months.length / 2) || 1);
  const byDelta = [...months].sort((a, b) => b.delta - a.delta);
  const best = byDelta.slice(0, N);
  const worst = byDelta.slice(-N).reverse();

  // Combined, sorted descending so best sits on top and worst at the bottom
  const chartData = [...best, ...worst.filter(w => !best.includes(w))].sort((a, b) => b.delta - a.delta);

  const bestEver = byDelta[0];
  const worstEver = byDelta[byDelta.length - 1];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Trophy className="text-amber-400" size={24} />
        Cele Mai Bune și Mai Slabe Luni
        <ChartInfo text="Clasamentul celor mai bune și mai slabe luni ca sumă câștigată sau pierdută (€). Spre deosebire de histogramă, care arată distribuția, aici vezi exact ce luni au fost extreme — util pentru a-ți aminti ce s-a întâmplat (ex: o lună foarte bună dintr-un bonus, o lună roșie dintr-o corecție de piață). Treci cu mouse-ul pentru procent." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Top {N} luni ca sumă câștigată și top {N} ca sumă pierdută.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai bună lună</p>
          <p className="text-base font-bold text-emerald-400">{bestEver.label}</p>
          <p className="text-xs text-emerald-400">+{formatEUR(bestEver.delta)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai slabă lună</p>
          <p className="text-base font-bold text-red-400">{worstEver.label}</p>
          <p className="text-xs text-red-400">{formatEUR(worstEver.delta)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 34)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, left: 24, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} width={78} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            formatter={(v: any, _n: string, item: any) => {
              const pct = item?.payload?.pct ?? 0;
              return [`${v >= 0 ? '+' : ''}${formatEUR(v)}  (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`, 'Variație'];
            }}
          />
          <ReferenceLine x={0} stroke="#64748b" />
          <Bar dataKey="delta" name="Variație" radius={[0, 3, 3, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.delta >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BestWorstMonthsChart;
