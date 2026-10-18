import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const CONTRIB_KEY = 'portofolify_monthly_contrib';
const RETURN_KEY = 'portofolify_annual_return';
const TARGET_KEY = 'portofolify_fire_target';
const CAP_YEARS = 60;

interface Props { mergedData: MergedData[] }

// Years of monthly contributions + compounding needed to reach `target` from `pv`.
const yearsToTarget = (pv: number, pmt: number, annualRatePct: number, target: number): number => {
  if (pv >= target) return 0;
  const r = annualRatePct / 100 / 12;
  let balance = pv;
  for (let m = 1; m <= CAP_YEARS * 12; m++) {
    balance = balance * (1 + r) + pmt;
    if (balance >= target) return m / 12;
  }
  return CAP_YEARS;
};

const FIRESensitivityChart: React.FC<Props> = ({ mergedData }) => {
  const [target, setTarget] = useState<number>(() => Number(localStorage.getItem(TARGET_KEY) || '1000000'));

  if (!mergedData || mergedData.length < 2) return null;

  const contrib = Number(localStorage.getItem(CONTRIB_KEY) || '2000');
  const annualReturn = Number(localStorage.getItem(RETURN_KEY) || '7.5');

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const currentWealth = sorted[sorted.length - 1].netWorth;

  const baseYears = yearsToTarget(currentWealth, contrib, annualReturn, target);

  const params = [
    {
      name: 'Contribuție',
      low: yearsToTarget(currentWealth, contrib * 0.8, annualReturn, target),
      high: yearsToTarget(currentWealth, contrib * 1.2, annualReturn, target),
      hint: `±20% din ${formatEUR(contrib)}/lună`,
    },
    {
      name: 'Randament',
      low: yearsToTarget(currentWealth, contrib, annualReturn * 0.8, target),
      high: yearsToTarget(currentWealth, contrib, annualReturn * 1.2, target),
      hint: `±20% din ${annualReturn}%/an`,
    },
    {
      name: 'Țintă FIRE',
      low: yearsToTarget(currentWealth, contrib, annualReturn, target * 0.8),
      high: yearsToTarget(currentWealth, contrib, annualReturn, target * 1.2),
      hint: `±20% din ${formatEUR(target)}`,
    },
  ];

  const chartData = params
    .map(p => ({ ...p, impact: Math.abs(p.high - p.low) }))
    .sort((a, b) => a.impact - b.impact); // ascending so biggest lands on top in a vertical layout

  const mostSensitive = [...chartData].sort((a, b) => b.impact - a.impact)[0];

  const onTarget = (v: number) => {
    setTarget(v);
    localStorage.setItem(TARGET_KEY, String(v));
  };

  const fmtY = (y: number) => y >= CAP_YEARS ? `${CAP_YEARS}+ ani` : y === 0 ? 'atins' : `${y.toFixed(1)} ani`;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Sliders className="text-pink-400" size={24} />
        Sensibilitate FIRE — Ce Contează Cel Mai Mult
        <ChartInfo text="Arată câți ani îți ia să atingi ținta FIRE dacă fiecare ipoteză se schimbă cu ±20%, ținând restul constant. Bara cea mai lată = variabila care îți schimbă cel mai mult data independenței financiare — acolo merită să te concentrezi. Ex: dacă bara „Contribuție” e cea mai lată, cât economisești contează mai mult decât randamentul pieței. Linia punctată = scenariul tău de bază." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Ani până la FIRE dacă fiecare ipoteză variază ±20%. Bază: {formatEUR(currentWealth)} acum, {formatEUR(contrib)}/lună, {annualReturn}%/an.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-slate-400">Țintă FIRE:</label>
        <input type="number" min={0} step={50000} value={target}
          onChange={e => onTarget(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1 text-xs w-32 focus:outline-none focus:border-pink-500" />
        <span className="text-xs text-slate-400">€</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Scenariul de bază</p>
          <p className="text-base font-bold text-blue-400">{fmtY(baseYears)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cea mai sensibilă</p>
          <p className="text-base font-bold text-pink-400">{mostSensitive.name}</p>
          <p className="text-[10px] text-slate-400">±{mostSensitive.impact.toFixed(1)} ani</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, left: 24, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}a`} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            formatter={(v: any, name: string) => [fmtY(v as number), name === 'low' ? '−20%' : '+20%']}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(name: string) => name === 'low' ? 'ipoteză −20%' : 'ipoteză +20%'} />
          <ReferenceLine x={baseYears} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'bază', fill: '#3b82f6', fontSize: 9, position: 'top' }} />
          <Bar dataKey="low" fill="#f97316" name="low" radius={[0, 3, 3, 0]} />
          <Bar dataKey="high" fill="#14b8a6" name="high" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FIRESensitivityChart;
