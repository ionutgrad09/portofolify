import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

interface Props {
  mergedData: MergedData[];
}

const Rolling12MonthChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 4) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const MS_TOLERANCE = 60 * 24 * 60 * 60 * 1000; // ±60 days tolerance

  const chartData = sorted
    .map(entry => {
      const currDate = parseDDMMYYYY(entry.date).getTime();
      const targetDate = currDate - MS_YEAR;

      // Find closest entry to ~12 months ago
      let closest: MergedData | null = null;
      let minDiff = Infinity;
      for (const e of sorted) {
        const d = parseDDMMYYYY(e.date).getTime();
        if (d >= currDate) break;
        const diff = Math.abs(d - targetDate);
        if (diff < minDiff) { minDiff = diff; closest = e; }
      }

      if (!closest || minDiff > MS_TOLERANCE) return null;
      const ret = ((entry.netWorth - closest.netWorth) / closest.netWorth) * 100;
      return { date: entry.date, return: parseFloat(ret.toFixed(2)) };
    })
    .filter(Boolean) as { date: string; return: number }[];

  if (chartData.length < 2) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val: number = payload[0].value;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        <p className={`font-bold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(2)}% vs acum 12 luni
        </p>
      </div>
    );
  };

  // Gradient stops based on sign
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="text-blue-400" size={24} />
        Return Cumulativ (Rolling 12 Luni)
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="rolling12Pos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="rolling12Neg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="return"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#rolling12Pos)"
            name="Return 12 luni"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400 mb-4 text-center">Fiecare punct = % câștig față de același punct cu 12 luni în urmă</p>
    </div>
  );
};

export default Rolling12MonthChart;
