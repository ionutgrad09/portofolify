import React from 'react';
import { CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { MergedData } from '../types';

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

  // Group by month — last entry per month
  const monthMap = new Map<string, { label: string; lastValue: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthMap.set(key, { label, lastValue: e.netWorth });
  });

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const chartData = months.slice(1).map((m, i) => ({
    month: m.label,
    pnl: parseFloat((m.lastValue - months[i].lastValue).toFixed(0)),
  }));

  if (chartData.length === 0) return null;

  const totalPositive = chartData.filter(d => d.pnl >= 0).reduce((s, d) => s + d.pnl, 0);
  const totalNegative = chartData.filter(d => d.pnl < 0).reduce((s, d) => s + d.pnl, 0);
  const bestMonth   = chartData.reduce((a, b) => b.pnl > a.pnl ? b : a);
  const worstMonth  = chartData.reduce((a, b) => b.pnl < a.pnl ? b : a);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <CalendarDays className="text-blue-400" size={20} />
        P&amp;L Lunar Agregat
      </h3>
      <p className="text-xs text-slate-400 mb-4">Câștig sau pierdere netă agregată per lună calendaristică.</p>

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
