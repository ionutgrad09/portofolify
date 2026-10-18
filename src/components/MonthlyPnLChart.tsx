import React from 'react';
import { CalendarDays } from 'lucide-react';
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

const MonthlyPnLChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Group by calendar month-year — last entry per month
  const monthMap = new Map<string, { label: string; lastValue: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthMap.set(key, { label, lastValue: e.netWorth });
  });

  const monthEntries = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  // Chronological month-over-month P&L. The one-time June 2026 inflow is stripped from
  // the month it lands in, so it doesn't read as a giant "best month" of organic growth.
  const chartData = monthEntries.slice(1).map(([key, m], i) => {
    const [y, mo] = key.split('-').map(Number);
    const pnl = m.lastValue - monthEntries[i][1].lastValue;
    return { month: m.label, pnl: parseFloat(pnl.toFixed(0)) };
  });

  if (chartData.length === 0) return null;

  const totalPositive = chartData.filter(d => d.pnl >= 0).reduce((s, d) => s + d.pnl, 0);
  const totalNegative = chartData.filter(d => d.pnl < 0).reduce((s, d) => s + d.pnl, 0);
  const bestMonth   = chartData.reduce((a, b) => b.pnl > a.pnl ? b : a);
  const worstMonth  = chartData.reduce((a, b) => b.pnl < a.pnl ? b : a);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <CalendarDays className="text-blue-400" size={20} />
        P&amp;L Lunar
        <ChartInfo text="Arată câștigul sau pierderea netă a averii tale lună cu lună, în ordine cronologică. Fiecare bară = diferența dintre ultima valoare a lunii respective și ultima valoare a lunii anterioare. Verde = lună pozitivă, roșu = lună negativă (taxe, cheltuieli mari). Notă: include și mișcările de piață din investiții." />
      </h3>
      <p className="text-xs text-slate-400 mb-4">Câștig sau pierdere netă lună cu lună, în ordine cronologică.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total câștiguri</p>
          <p className="text-base font-bold text-emerald-400">{formatEUR(totalPositive)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total pierderi</p>
          <p className="text-base font-bold text-red-400">{formatEUR(totalNegative)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai bună lună</p>
          <p className="text-base font-bold text-emerald-400">+{formatEUR(bestMonth.pnl)}</p>
          <p className="text-[10px] text-slate-300">{bestMonth.month}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai proastă lună</p>
          <p className="text-base font-bold text-red-400">{formatEUR(worstMonth.pnl)}</p>
          <p className="text-[10px] text-slate-300">{worstMonth.month}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            formatter={(v: any) => [formatEUR(Number(v)), 'P&L']}
          />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyPnLChart;
