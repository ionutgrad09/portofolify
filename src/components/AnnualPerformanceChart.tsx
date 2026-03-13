import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const AnnualPerformanceChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Track the last net worth entry per calendar year
  const lastOfYear = new Map<number, number>();
  sorted.forEach(entry => {
    const year = parseDDMMYYYY(entry.date).getFullYear();
    lastOfYear.set(year, entry.netWorth);
  });

  const years = Array.from(lastOfYear.keys()).sort((a, b) => a - b);

  // For each year, baseline = last entry of the previous year (or very first data point for year 0)
  // This avoids inaccuracy from the "first snapshot of the year" being mid-month
  const annualData = years.map((year, idx) => {
    const prevYear = idx === 0 ? null : years[idx - 1];
    const startValue = prevYear !== null ? lastOfYear.get(prevYear)! : sorted[0].netWorth;
    const endValue = lastOfYear.get(year)!;
    return {
      year: String(year),
      gain: endValue - startValue,
      pct: startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0,
      end: endValue,
    };
  });

  const totalGain = annualData.reduce((sum, d) => sum + d.gain, 0);
  const bestYear = annualData.reduce((best, curr) => curr.gain > best.gain ? curr : best, annualData[0]);
  const avgAnnualGain = annualData.length > 0 ? totalGain / annualData.length : 0;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BarChart2 className="text-yellow-400" size={24}/>
        Performanță Anuală
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Câștig Total</p>
          <p className={`font-bold ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatEUR(totalGain)}</p>
        </div>
        <div>
          <p className="text-slate-400">Cel mai bun an</p>
          <p className="text-blue-400 font-bold">{bestYear.year}: +{bestYear.pct.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-slate-400">Medie anuală</p>
          <p className={`font-bold ${avgAnnualGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatEUR(avgAnnualGain)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={annualData} margin={{top: 5, right: 10, left: 10, bottom: 5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="year"
            stroke="#94a3b8"
            tick={{fontSize: 13, fill: '#e2e8f0', fontWeight: 600}}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{fill: '#94a3b8'}}
            tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            labelStyle={{color: '#94a3b8', fontSize: 11, marginBottom: 4}}
            itemStyle={{color: '#e2e8f0', fontSize: 13}}
            cursor={{fill: 'rgba(148,163,184,0.1)'}}
            formatter={(value: number) => [formatEUR(value as number), 'Câștig']}
            labelFormatter={(label) => {
              const entry = annualData.find(d => d.year === label);
              return entry
                ? `${label}  (${entry.pct >= 0 ? '+' : ''}${entry.pct.toFixed(1)}%)`
                : label;
            }}
          />
          <Bar dataKey="gain" name="Câștig" radius={[4, 4, 0, 0]}>
            {annualData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.gain >= 0 ? '#22c55e' : '#ef4444'}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnnualPerformanceChart;
