import React from 'react';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

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

  // Period-over-period deltas (raw difference, no normalization)
  const deltas: { value: number; from: string; to: string }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = (parseDDMMYYYY(sorted[i].date).getTime() - parseDDMMYYYY(sorted[i - 1].date).getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    deltas.push({
      value: sorted[i].netWorth - sorted[i - 1].netWorth,
      from: sorted[i - 1].date,
      to: sorted[i].date,
    });
  }

  if (deltas.length === 0) return null;

  const deltaValues = deltas.map(d => d.value);

  // Build histogram buckets of €1k width
  const BUCKET = 1000;
  const min = Math.floor(Math.min(...deltaValues) / BUCKET) * BUCKET;
  const max = Math.ceil(Math.max(...deltaValues) / BUCKET) * BUCKET;
  const buckets: Record<number, number> = {};
  const bucketPeriods: Record<number, string[]> = {};
  for (let b = min; b <= max; b += BUCKET) { buckets[b] = 0; bucketPeriods[b] = []; }
  deltas.forEach(d => {
    const b = Math.floor(d.value / BUCKET) * BUCKET;
    buckets[b] = (buckets[b] ?? 0) + 1;
    if (!bucketPeriods[b]) bucketPeriods[b] = [];
    bucketPeriods[b].push(`${d.from} → ${d.to}`);
  });

  const chartData = Object.entries(buckets)
    .map(([k, count]) => ({ range: Number(k), count, periods: bucketPeriods[Number(k)] ?? [] }))
    .sort((a, b) => a.range - b.range);

  const positiveWeeks = deltaValues.filter(d => d >= 0).length;
  const winRate = ((positiveWeeks / deltaValues.length) * 100).toFixed(1);
  const avgGain = deltaValues.filter(d => d > 0).reduce((a, b) => a + b, 0) / (positiveWeeks || 1);
  const negWeeks = deltaValues.length - positiveWeeks;
  const avgLoss = deltaValues.filter(d => d < 0).reduce((a, b) => a + b, 0) / (negWeeks || 1);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <BarChart2 className="text-purple-400" size={20} />
        Distribuție Câștiguri / Pierderi per Perioadă
        <ChartInfo text="Histogramă cu intervale de €1.000. Arată câte perioade (înregistrări consecutive) s-au încheiat cu un câștig/pierdere de o anumită mărime. Mișcările de piață din investiții sunt incluse. Hover pe fiecare bară pentru a vedea datele exacte ale perioadelor respective." />
      </h3>
      <p className="text-xs text-slate-500 mb-4">Câte perioade ai terminat cu câștig vs. pierdere și de ce mărime (variație reală față de înregistrarea anterioară).</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-lg font-bold text-emerald-400">{winRate}%</p>
          <p className="text-xs text-slate-300">{positiveWeeks}/{deltaValues.length} perioade</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Câștig mediu</p>
          <p className="text-lg font-bold text-emerald-400">{formatEUR(avgGain)}</p>
          <p className="text-xs text-slate-300">perioadă pozitivă</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Pierdere medie</p>
          <p className="text-lg font-bold text-red-400">{formatEUR(avgLoss)}</p>
          <p className="text-xs text-slate-300">perioadă negativă</p>
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
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', maxWidth: 260 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
                    {formatEUR(d.range)} – {formatEUR(d.range + BUCKET)}
                  </p>
                  <p style={{ color: '#94a3b8', marginBottom: d.periods.length ? 6 : 0 }}>
                    {d.count} perioade
                  </p>
                  {d.periods.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {d.periods.map((p: string, i: number) => (
                        <li key={i} style={{ color: '#cbd5e1', fontSize: 11, lineHeight: '18px' }}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }}
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
