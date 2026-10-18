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

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

interface Props { mergedData: MergedData[] }

const MonthlyPnLHistogram: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 3) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Last value per month
  const monthMap = new Map<string, { label: string; value: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: e.netWorth });
  });

  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Monthly deltas — the one-time June 2026 inflow is excluded so a single deposit
  // doesn't skew the distribution into a fake high-gain bucket.
  const deltas: { value: number; label: string }[] = [];
  for (let i = 1; i < monthEntries.length; i++) {
    const [key, cur] = monthEntries[i];
    const [y, mo] = key.split('-').map(Number);
    deltas.push({ value: cur.value - monthEntries[i - 1][1].value, label: cur.label });
  }

  const BUCKET = 5000;
  const min = Math.floor(Math.min(...deltas.map(d => d.value)) / BUCKET) * BUCKET;
  const max = Math.ceil(Math.max(...deltas.map(d => d.value)) / BUCKET) * BUCKET;

  const buckets: Record<number, number> = {};
  const bucketMonths: Record<number, string[]> = {};
  for (let b = min; b <= max; b += BUCKET) { buckets[b] = 0; bucketMonths[b] = []; }

  deltas.forEach(d => {
    const b = Math.floor(d.value / BUCKET) * BUCKET;
    buckets[b] = (buckets[b] ?? 0) + 1;
    if (!bucketMonths[b]) bucketMonths[b] = [];
    bucketMonths[b].push(d.label);
  });

  const chartData = Object.entries(buckets)
    .map(([k, count]) => ({ range: Number(k), count, months: bucketMonths[Number(k)] ?? [] }))
    .sort((a, b) => a.range - b.range);

  const positive = deltas.filter(d => d.value >= 0).length;
  const winRate = ((positive / deltas.length) * 100).toFixed(1);
  const avgGain = deltas.filter(d => d.value > 0).reduce((a, b) => a + b.value, 0) / Math.max(1, positive);
  const negative = deltas.length - positive;
  const avgLoss = deltas.filter(d => d.value < 0).reduce((a, b) => a + b.value, 0) / Math.max(1, negative);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <BarChart2 className="text-blue-400" size={20} />
        Distribuție P&amp;L Lunar (buckets €5k)
        <ChartInfo text="Histogramă care grupează lunile în intervale de €5.000. Fiecare bară arată câte luni s-au încheiat cu un câștig/pierdere în acel interval. De exemplu, bara de la +€10k arată câte luni ai câștigat între €10.000 și €15.000. Hover pe o bară pentru a vedea exact care luni sunt în acel interval." />
      </h3>
      <p className="text-xs text-slate-500 mb-4">Câte luni calendaristice au adus un câștig/pierdere de o anumită mărime.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-lg font-bold text-emerald-400">{winRate}%</p>
          <p className="text-xs text-slate-300">{positive}/{deltas.length} luni</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Câștig mediu</p>
          <p className="text-lg font-bold text-emerald-400">{formatEUR(avgGain)}</p>
          <p className="text-xs text-slate-300">lună pozitivă</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Pierdere medie</p>
          <p className="text-lg font-bold text-red-400">{formatEUR(avgLoss)}</p>
          <p className="text-xs text-slate-300">lună negativă</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Raport C/P</p>
          <p className={`text-lg font-bold ${avgLoss !== 0 && Math.abs(avgGain / avgLoss) >= 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {avgLoss !== 0 ? Math.abs(avgGain / avgLoss).toFixed(2) : '—'}x
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 9 }}
            tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`} />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.1)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', maxWidth: 260 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
                    {formatEUR(d.range)} – {formatEUR(d.range + BUCKET)}
                  </p>
                  <p style={{ color: '#94a3b8', marginBottom: d.months.length ? 6 : 0 }}>{d.count} luni</p>
                  {d.months.map((m: string, i: number) => (
                    <p key={i} style={{ color: '#cbd5e1', fontSize: 11 }}>{m}</p>
                  ))}
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

export default MonthlyPnLHistogram;
