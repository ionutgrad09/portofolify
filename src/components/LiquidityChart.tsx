import React from 'react';
import { Droplets } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const LiquidityChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const chartData = sorted.map(entry => ({
    date: entry.date,
    // Liquid = cash + investments (can be sold quickly)
    liquid: entry.cash + entry.investments,
    // Illiquid = physical assets
    illiquid: entry.assetsTotal,
  }));

  const latest = chartData[chartData.length - 1];
  const totalLatest = latest.liquid + latest.illiquid;
  const liquidPct = totalLatest > 0 ? ((latest.liquid / totalLatest) * 100).toFixed(1) : '0';
  const illiquidPct = totalLatest > 0 ? ((latest.illiquid / totalLatest) * 100).toFixed(1) : '0';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Droplets className="text-cyan-400" size={24}/>
        Lichiditate vs Active Fizice
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Lichide actuale (Cash + Investiții)</p>
          <p className="text-cyan-400 font-bold">{formatEUR(latest.liquid)} ({liquidPct}%)</p>
        </div>
        <div>
          <p className="text-slate-400">Nelichide actuale (Active Fizice)</p>
          <p className="text-amber-400 font-bold">{formatEUR(latest.illiquid)} ({illiquidPct}%)</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="illiquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = { liquid: 'Lichide', illiquid: 'Active Fizice' };
              return [formatEUR(value), labels[name] ?? name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10, color: '#94a3b8', fontSize: 12 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = { liquid: 'Lichide (Cash + Investiții)', illiquid: 'Active Fizice' };
              return <span style={{ color: '#94a3b8' }}>{labels[value] ?? value}</span>;
            }}
          />
          <Area type="monotone" dataKey="liquid" stroke="#06b6d4" strokeWidth={2} fill="url(#liquidGrad)" name="liquid"/>
          <Area type="monotone" dataKey="illiquid" stroke="#f59e0b" strokeWidth={2} fill="url(#illiquidGrad)" name="illiquid"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiquidityChart;
