import React from 'react';
import { CalendarRange } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

interface Props { mergedData: MergedData[] }

const SeasonalityChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 6) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Last net worth per calendar month
  const monthMap = new Map<string, number>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, e.netWorth);
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Bucket monthly returns by calendar month index (0-11)
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (let i = 1; i < monthEntries.length; i++) {
    const prev = monthEntries[i - 1][1];
    const curr = monthEntries[i][1];
    if (prev <= 0) continue;
    const [y, mm] = monthEntries[i][0].split('-').map(Number);
    // Strip the one-time June 2026 inflow so seasonality reflects recurring behavior.
    byMonth[mm - 1].push((curr - prev) / prev * 100);
  }

  const chartData = MONTH_NAMES.map((label, idx) => {
    const rets = byMonth[idx];
    const n = rets.length;
    const avg = n ? rets.reduce((a, b) => a + b, 0) / n : 0;
    return {
      month: label,
      avg: parseFloat(avg.toFixed(2)),
      n,
      min: n ? parseFloat(Math.min(...rets).toFixed(2)) : 0,
      max: n ? parseFloat(Math.max(...rets).toFixed(2)) : 0,
    };
  });

  const withData = chartData.filter(d => d.n > 0);
  if (withData.length < 2) return null;

  const best = [...withData].sort((a, b) => b.avg - a.avg)[0];
  const worst = [...withData].sort((a, b) => a.avg - b.avg)[0];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <CalendarRange className="text-cyan-400" size={24} />
        Sezonalitate — Randament Mediu pe Lună
        <ChartInfo text="Adună toate lunile ianuarie la un loc, toate lunile februarie etc., și arată randamentul mediu pentru fiecare lună calendaristică. Scoate la iveală tipare care se repetă an de an: lunile cu taxe apar constant roșii, lunile cu bonus/prime apar verzi. Bara = media; treci cu mouse-ul pentru minim, maxim și câți ani au fost incluși." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Media istorică a variației averii pentru fiecare lună. Verde = lună tipic bună, roșu = lună tipic slabă.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai bună lună</p>
          <p className="text-base font-bold text-emerald-400">{best.month} · {best.avg > 0 ? '+' : ''}{best.avg}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai slabă lună</p>
          <p className="text-base font-bold text-red-400">{worst.month} · {worst.avg > 0 ? '+' : ''}{worst.avg}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            formatter={(v: any, _n: string, item: any) => {
              const p = item?.payload;
              if (!p || p.n === 0) return ['fără date', 'Medie'];
              return [`${v > 0 ? '+' : ''}${v}%  (min ${p.min}% / max ${p.max}%, ${p.n} ani)`, 'Medie'];
            }}
          />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="avg" name="Medie" radius={[3, 3, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.n === 0 ? '#475569' : d.avg >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeasonalityChart;
