import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { AssetData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

interface Props { assetsData: AssetData[] }

const AssetYoYChart: React.FC<Props> = ({ assetsData }) => {
  if (!assetsData || assetsData.length < 2) return null;

  const sorted = [...assetsData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const latestEntry  = sorted[sorted.length - 1];
  const assetKeys    = Object.keys(latestEntry.assets);
  const latestDate   = parseDDMMYYYY(latestEntry.date);

  // Find entry closest to 1 year ago
  const oneYearAgo   = new Date(latestDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yearAgoEntry = sorted.reduce((prev, curr) =>
    Math.abs(parseDDMMYYYY(curr.date).getTime() - oneYearAgo.getTime()) <
    Math.abs(parseDDMMYYYY(prev.date).getTime() - oneYearAgo.getTime()) ? curr : prev
  );

  const chartData = assetKeys.map((key, i) => {
    const current  = latestEntry.assets[key] ?? 0;
    const previous = yearAgoEntry.assets[key] ?? 0;
    const yoy      = previous > 0 ? parseFloat(((current - previous) / previous * 100).toFixed(2)) : 0;
    return { name: key, yoy, current, previous, color: COLORS[i % COLORS.length] };
  }).sort((a, b) => b.yoy - a.yoy);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const fmt = (v: number) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
        <p className="text-white font-semibold mb-1">{label}</p>
        <p className={`font-bold ${d.yoy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {d.yoy >= 0 ? '+' : ''}{d.yoy}% YoY
        </p>
        <p className="text-slate-400 text-xs">Acum: {fmt(d.current)}</p>
        <p className="text-slate-500 text-xs">Acum 1 an: {fmt(d.previous)}</p>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" size={20} />
        Creștere Anuală per Activ (YoY)
      </h3>
      <p className="text-xs text-slate-400 mb-4">% variație față de aceeași perioadă a anului trecut.</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#e2e8f0' }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0' }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="yoy" name="YoY %" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.yoy >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetYoYChart;
