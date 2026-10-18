import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const CONTRIB_KEY = 'portofolify_monthly_contrib';
const RETURN_KEY = 'portofolify_annual_return';

interface Props { mergedData: MergedData[] }

const fv = (pv: number, pmt: number, annualRate: number, months: number): number => {
  if (months === 0) return pv;
  const r = annualRate / 100 / 12;
  if (r === 0) return pv + pmt * months;
  return pv * Math.pow(1 + r, months) + pmt * ((Math.pow(1 + r, months) - 1) / r);
};

const ContributionImpactChart: React.FC<Props> = ({ mergedData }) => {
  const [baseContrib, setBaseContrib] = useState<number>(() => Number(localStorage.getItem(CONTRIB_KEY) || '2000'));
  const [annualReturn] = useState<number>(() => Number(localStorage.getItem(RETURN_KEY) || '7.5'));
  const [projYears, setProjYears] = useState(10);

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;

  const variants = [
    { label: '€0 (fără contrib.)', contrib: 0, color: '#ef4444' },
    { label: `−50% (€${Math.round(baseContrib * 0.5)})`, contrib: baseContrib * 0.5, color: '#f97316' },
    { label: `Baza (€${baseContrib})`, contrib: baseContrib, color: '#3b82f6' },
    { label: `+50% (€${Math.round(baseContrib * 1.5)})`, contrib: baseContrib * 1.5, color: '#10b981' },
    { label: `×2 (€${baseContrib * 2})`, contrib: baseContrib * 2, color: '#a855f7' },
  ];


  const chartData = Array.from({ length: projYears + 1 }, (_, yr) => {
    const m = yr * 12;
    const point: Record<string, any> = {
      label: yr === 0 ? 'Acum' : `${yr}a`,
    };
    variants.forEach((v, i) => {
      // Use investment return on top of organic growth + contribution compounding
      point[`v${i}`] = Math.round(fv(currentWealth, v.contrib, annualReturn, m));
    });
    return point;
  });

  const finalDiffs = variants.map((v, i) => ({
    label: v.label,
    color: v.color,
    value: chartData[projYears][`v${i}`] as number,
    diff: (chartData[projYears][`v${i}`] as number) - (chartData[projYears]['v2'] as number),
  }));

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Sliders className="text-teal-400" size={24} />
        Impact Contribuții — Simulator
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Cum se schimbă averea ta la {projYears} ani în funcție de cât economisești lunar. Baza = contribuție curentă ({formatEUR(baseContrib)}/lună). Randament investiții: {annualReturn}%/an.
      </p>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Contribuție bază:</label>
          <input type="number" min={0} step={100} value={baseContrib}
            onChange={e => setBaseContrib(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1 text-xs w-24 focus:outline-none focus:border-teal-500" />
          <span className="text-xs text-slate-400">€/lună</span>
        </div>
        <div className="flex gap-1">
          {[5, 10, 15, 20].map(y => (
            <button key={y} onClick={() => setProjYears(y)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${projYears === y ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
              {y} ani
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {finalDiffs.map((v, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-1">{v.label}</p>
            <p className="text-sm font-bold" style={{ color: v.color }}>{formatEUR(v.value)}</p>
            {v.diff !== 0 && (
              <p className={`text-[10px] mt-0.5 ${v.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {v.diff > 0 ? '+' : ''}{formatEUR(v.diff)}
              </p>
            )}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <YAxis stroke="#94a3b8"
            tickFormatter={(v: number) => v >= 1e6 ? `€${(v / 1e6).toFixed(1)}M` : `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any, name: string) => {
              const idx = Number(name.replace('v', ''));
              return [formatEUR(v), variants[idx]?.label ?? name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(name: string) => {
              const idx = Number(name.replace('v', ''));
              return <span style={{ color: variants[idx]?.color }}>{variants[idx]?.label}</span>;
            }}
          />
          {[500000, 1000000].map(g => (
            <ReferenceLine key={g} y={g} stroke="#334155" strokeDasharray="4 2"
              label={{ value: g >= 1e6 ? '€1M' : '€500k', position: 'insideTopRight', fill: '#64748b', fontSize: 9 }} />
          ))}
          {variants.map((v, i) => (
            <Line key={i} type="monotone" dataKey={`v${i}`} stroke={v.color} strokeWidth={i === 2 ? 3 : 1.5}
              dot={false} strokeDasharray={i === 2 ? '' : i < 2 ? '4 3' : ''} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-slate-600 mt-2 text-center">
        Calculat cu dobândă compusă la {annualReturn}%/an + contribuție lunară. Linia albastră groasă = scenariul tău actual.
      </p>
    </div>
  );
};

export default ContributionImpactChart;
