import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const GOALS = [
  { label: '250k €', value: 250000 },
  { label: '500k €', value: 500000 },
  { label: '750k €', value: 750000 },
  { label: '1M €', value: 1000000 },
];

const PROJECTION_YEARS = 5;
const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const CONTRIB_KEY = 'portofolify_monthly_contrib';
const RETURN_KEY  = 'portofolify_annual_return';

const ScenarioProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  const [monthlyContrib, setMonthlyContrib] = useState<number>(() =>
    Number(localStorage.getItem(CONTRIB_KEY) || '1500'));
  const [annualReturn, setAnnualReturn] = useState<number>(() =>
    Number(localStorage.getItem(RETURN_KEY) || '7.5'));

  const handleContrib = (v: number) => { setMonthlyContrib(v); localStorage.setItem(CONTRIB_KEY, String(v)); };
  const handleReturn  = (v: number) => { setAnnualReturn(v);   localStorage.setItem(RETURN_KEY,  String(v)); };

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;

  // Exclude adjustment date from rate calculations (same logic as FinancialGoalsProgress)
  const calcData = sorted;
  if (calcData.length < 2) return null;

  const calcStart = calcData[0];
  const calcEnd   = calcData[calcData.length - 1];

  const totalMs = parseDDMMYYYY(calcEnd.date).getTime() - parseDDMMYYYY(calcStart.date).getTime();
  const totalMonths = totalMs / (1000 * 60 * 60 * 24 * 30.44);
  if (totalMonths <= 0) return null;

  const historicalMonthlyAvg = (calcEnd.netWorth - calcStart.netWorth) / totalMonths;

  const baseMonthlyAvg = historicalMonthlyAvg;
  const optimisticMonthly = baseMonthlyAvg * 1.25;
  const pessimisticMonthly = baseMonthlyAvg * 0.75;

  const MONTHS = PROJECTION_YEARS * 12;
  const startDate = parseDDMMYYYY(lastEntry.date);

  const chartData: Array<{ label: string; base: number; optimistic: number; pessimistic: number }> = [];
  let base = currentWealth;
  let optimistic = currentWealth;
  let pessimistic = currentWealth;
  let investmentBalance = lastEntry.investments;

  for (let m = 1; m <= MONTHS; m++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    const label = [12, 24, 36, 48, 60].includes(m)
      ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      : '';

    // Compound investment return on growing balance
    const monthlyReturn = investmentBalance * (annualReturn / 100) / 12;
    investmentBalance += monthlyContrib + monthlyReturn;
    const boost = monthlyContrib + monthlyReturn;

    base       += baseMonthlyAvg       + boost;
    optimistic += optimisticMonthly    + boost;
    pessimistic += pessimisticMonthly  + boost;
    chartData.push({ label, base, optimistic, pessimistic });
  }

  const relevantGoals = GOALS.filter(
    g => g.value > currentWealth && g.value < chartData[chartData.length - 1].optimistic * 1.1
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="text-indigo-400" size={24}/>
        Proiecție Scenarii 5 Ani
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Medie Istorică/lună</p>
          <p className="text-white font-bold">{formatEUR(historicalMonthlyAvg)}</p>
        </div>
        <div>
          <p className="text-slate-400">Baza proiecție/lună</p>
          <p className="text-blue-400 font-bold">{formatEUR(baseMonthlyAvg + monthlyContrib + lastEntry.investments * (annualReturn / 100) / 12)}/lună</p>
        </div>
        <div>
          <p className="text-slate-400">Interval Scenarii</p>
          <p className="text-slate-300 font-bold text-[10px]">
            {formatEUR(pessimisticMonthly)} – {formatEUR(optimisticMonthly)}
          </p>
        </div>
      </div>

      {/* Boost breakdown */}
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-500">+ Contribuție lunară netă</p>
          <p className="text-purple-400 font-bold">{formatEUR(monthlyContrib)}/lună</p>
        </div>
        <div>
          <p className="text-slate-500">+ Randament investiții ({annualReturn}%/an)</p>
          <p className="text-amber-400 font-bold">{formatEUR(lastEntry.investments * (annualReturn / 100) / 12)}/lună inițial (crește)</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="scenarioBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="scenarioOpt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="scenarioPes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval={0}
            height={40}
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
              const labels: Record<string, string> = { base: 'Baza', optimistic: 'Optimist (+25%)', pessimistic: 'Pesimist (-25%)' };
              return [formatEUR(value), labels[name] ?? name];
            }}
          />
          {relevantGoals.map(g => (
            <ReferenceLine
              key={g.value}
              y={g.value}
              stroke="#475569"
              strokeDasharray="4 2"
              label={{ value: g.label, position: 'insideTopRight', fill: '#64748b', fontSize: 9 }}
            />
          ))}
          <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1.5} fill="url(#scenarioPes)" strokeDasharray="4 2" name="pessimistic"/>
          <Area type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} fill="url(#scenarioBase)" name="base"/>
          <Area type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={1.5} fill="url(#scenarioOpt)" strokeDasharray="4 2" name="optimistic"/>
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {[{ label: 'La 1 an', m: 12 }, { label: 'La 3 ani', m: 36 }, { label: 'La 5 ani', m: 60 }].map(({ label, m }) => {
          const p = chartData[m - 1];
          return (
            <div key={m} className="bg-slate-800/50 rounded-lg p-2 space-y-1">
              <p className="text-slate-400 font-medium">{label}</p>
              <p className="text-emerald-400">{formatEUR(p.optimistic)}</p>
              <p className="text-blue-400">{formatEUR(p.base)}</p>
              <p className="text-red-400">{formatEUR(p.pessimistic)}</p>
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400 mb-3 font-medium">Parametri proiecție</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Contribuție lunară netă (EUR)</label>
            <div className="flex flex-col gap-1.5">
              <input type="number" min={0} step={100} value={monthlyContrib}
                onChange={e => handleContrib(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full" />
              <input type="range" min={0} max={10000} step={100} value={monthlyContrib}
                onChange={e => handleContrib(Number(e.target.value))}
                className="w-full accent-purple-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Randament anual investiții (%)</label>
            <div className="flex flex-col gap-1.5">
              <input type="number" min={0} max={30} step={0.5} value={annualReturn}
                onChange={e => handleReturn(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full" />
              <input type="range" min={0} max={20} step={0.5} value={annualReturn}
                onChange={e => handleReturn(Number(e.target.value))}
                className="w-full accent-amber-400" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">Contribuția și randamentul se adaugă peste trendul istoric și cresc prin efect de dobândă compusă. Setările sunt salvate automat și sincronizate cu Proiecția 52 Săptămâni.</p>
      </div>

      <p className="text-[10px] text-slate-600 mt-3">
        Baza = media istorică lunară + contribuții + randament compus. Scenariile ±25% se aplică doar pe componenta istorică.
      </p>
    </div>
  );
};

export default ScenarioProjectionChart;
