import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const INFLATION_KEY = 'portofolify_inflation';

interface Props { mergedData: MergedData[] }

const RealNetWorthChart: React.FC<Props> = ({ mergedData }) => {
  const [inflation, setInflation] = useState<number>(() => Number(localStorage.getItem(INFLATION_KEY) || '5'));

  if (!mergedData || mergedData.length < 3) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const firstDate = parseDDMMYYYY(sorted[0].date);

  // Deflate every point to first-date purchasing power
  const chartData = sorted.map(e => {
    const years = (parseDDMMYYYY(e.date).getTime() - firstDate.getTime()) / (365.25 * 24 * 3600 * 1000);
    const real = e.netWorth / Math.pow(1 + inflation / 100, years);
    return { date: e.date, nominal: Math.round(e.netWorth), real: Math.round(real) };
  });

  const last = chartData[chartData.length - 1];
  const erosion = last.nominal - last.real;
  const erosionPct = last.nominal > 0 ? (erosion / last.nominal) * 100 : 0;

  const onInflation = (v: number) => {
    setInflation(v);
    localStorage.setItem(INFLATION_KEY, String(v));
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Flame className="text-orange-400" size={24} />
        Avere Reală (ajustată la inflație)
        <ChartInfo text="Averea nominală este cifra brută; averea reală arată aceeași sumă în puterea de cumpărare din prima ta înregistrare. Inflația îți erodează banii în timp, așa că 100.000 € de acum valorează mai puțin decât 100.000 € de acum câțiva ani. Distanța dintre cele două linii = cât ți-a mâncat inflația. Ajustează rata pentru scenariul tău." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Cât valorează cu adevărat averea ta în puterea de cumpărare de la început.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-slate-400">Inflație anuală:</label>
        <input type="number" min={0} max={30} step={0.5} value={inflation}
          onChange={e => onInflation(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1 text-xs w-20 focus:outline-none focus:border-orange-500" />
        <span className="text-xs text-slate-400">%/an</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Nominal acum</p>
          <p className="text-base font-bold text-blue-400">{formatEUR(last.nominal)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Real acum</p>
          <p className="text-base font-bold text-orange-400">{formatEUR(last.real)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Erodat de inflație</p>
          <p className="text-base font-bold text-red-400">−{formatEUR(erosion)}</p>
          <p className="text-[10px] text-slate-400">{erosionPct.toFixed(1)}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 4 }}>
          <defs>
            <linearGradient id="nominalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v >= 1e6 ? `€${(v / 1e6).toFixed(1)}M` : `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any, name: string) => [formatEUR(v), name === 'nominal' ? 'Nominal' : 'Real (azi)']}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(name: string) => name === 'nominal' ? 'Nominal' : 'Real (ajustat)'} />
          <Area type="monotone" dataKey="nominal" stroke="#3b82f6" strokeWidth={2} fill="url(#nominalGrad)" dot={false} />
          <Area type="monotone" dataKey="real" stroke="#f97316" strokeWidth={2} fill="url(#realGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealNetWorthChart;
