import React from 'react';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface Props { mergedData: MergedData[] }

const PnLHistogram: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 4) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Week-over-week deltas
  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = (parseDDMMYYYY(sorted[i].date).getTime() - parseDDMMYYYY(sorted[i - 1].date).getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    deltas.push(((sorted[i].netWorth - sorted[i - 1].netWorth) / days) * 7);
  }

  if (deltas.length === 0) return null;

  // Build histogram buckets of €1k width
  const BUCKET = 1000;
  const min = Math.floor(Math.min(...deltas) / BUCKET) * BUCKET;
  const max = Math.ceil(Math.max(...deltas) / BUCKET) * BUCKET;
  const buckets: Record<number, number> = {};
  for (let b = min; b <= max; b += BUCKET) buckets[b] = 0;
  deltas.forEach(d => {
    const b = Math.floor(d / BUCKET) * BUCKET;
    buckets[b] = (buckets[b] ?? 0) + 1;
  });

  const chartData = Object.entries(buckets)
    .map(([k, count]) => ({ range: Number(k), count }))
    .sort((a, b) => a.range - b.range);

  const positiveWeeks = deltas.filter(d => d >= 0).length;
  const winRate = ((positiveWeeks / deltas.length) * 100).toFixed(1);
  const avgGain = deltas.filter(d => d > 0).reduce((a, b) => a + b, 0) / (positiveWeeks || 1);
  const negWeeks = deltas.length - positiveWeeks;
  const avgLoss = deltas.filter(d => d < 0).reduce((a, b) => a + b, 0) / (negWeeks || 1);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <BarChart2 className="text-purple-400" size={20} />
        Distribuție Câștiguri / Pierderi Săptămânale
      </h3>
      <p className="text-xs text-slate-500 mb-4">Câte săptămâni ai terminat cu câștig vs. pierdere și de ce mărime.</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-lg font-bold text-emerald-400">{winRate}%</p>
          <p className="text-xs text-slate-300">{positiveWeeks}/{deltas.length} săpt</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Câștig mediu</p>
          <p className="text-lg font-bold text-emerald-400">{formatEUR(avgGain)}</p>
          <p className="text-xs text-slate-300">săpt pozitivă</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Pierdere medie</p>
          <p className="text-lg font-bold text-red-400">{formatEUR(avgLoss)}</p>
          <p className="text-xs text-slate-300">săpt negativă</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Raport C/P</p>
          <p className={`text-lg font-bold ${avgLoss !== 0 && Math.abs(avgGain / avgLoss) >= 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {avgLoss !== 0 ? Math.abs(avgGain / avgLoss).toFixed(2) : '—'}x
          </p>
          <p className="text-xs text-slate-300">câștig/pierdere</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 9 }}
            tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`} />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            formatter={(v: any, _: any, props: any) => [
              `${v} săptămâni`, `${formatEUR(props.payload.range)} – ${formatEUR(props.payload.range + BUCKET)}`
            ]}
          />
          <ReferenceLine x={0} stroke="#64748b" />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.range >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PnLHistogram;
