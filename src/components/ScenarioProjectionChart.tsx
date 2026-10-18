import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MergedData } from '../types';
import { oneTimeInflowInWindow } from '../utils/utils';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatEURShort = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}k`;
  return `€${Math.round(value)}`;
};

const GOALS = [
  { label: '250k €', value: 250000 },
  { label: '500k €', value: 500000 },
  { label: '750k €', value: 750000 },
  { label: '1M €', value: 1000000 },
  { label: '2M €', value: 2000000 },
];

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const CONTRIB_KEY   = 'portofolify_monthly_contrib';
const RETURN_KEY    = 'portofolify_annual_return';
const PROJ_YEARS_KEY = 'portofolify_scenario_years';

const ScenarioProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  const [monthlyContrib, setMonthlyContrib] = useState<number>(() =>
    Number(localStorage.getItem(CONTRIB_KEY) || '2000'));
  const [annualReturn, setAnnualReturn] = useState<number>(() =>
    Number(localStorage.getItem(RETURN_KEY) || '7.5'));
  const [projYears, setProjYears] = useState<number>(() =>
    Number(localStorage.getItem(PROJ_YEARS_KEY) || '5'));
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const INFLATION = 0.03; // 3% EUR annual

  const handleContrib = (v: number) => { setMonthlyContrib(v); localStorage.setItem(CONTRIB_KEY, String(v)); };
  const handleReturn  = (v: number) => { setAnnualReturn(v);   localStorage.setItem(RETURN_KEY,  String(v)); };
  const handleYears   = (v: number) => { setProjYears(v);      localStorage.setItem(PROJ_YEARS_KEY, String(v)); };

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;

  // ── Historical monthly avg — strip lump sums same as ProjectionChart ──
  const calcStart = sorted[0];
  const calcEnd   = sorted[sorted.length - 1];
  const startDate = parseDDMMYYYY(calcStart.date);
  const endDate   = parseDDMMYYYY(calcEnd.date);

  const totalMs = endDate.getTime() - startDate.getTime();
  const totalMonths = totalMs / (1000 * 60 * 60 * 24 * 30.44);
  if (totalMonths <= 0) return null;

  // Strip one-time inflows from the net growth before computing the trend
  const lumpSumTotal = oneTimeInflowInWindow(startDate, endDate);
  const recurringGrowth = calcEnd.netWorth - calcStart.netWorth - lumpSumTotal;
  const historicalMonthlyAvg = recurringGrowth / totalMonths;

  const baseMonthlyAvg = historicalMonthlyAvg;
  const optimisticMonthly = baseMonthlyAvg * 1.25;
  const pessimisticMonthly = baseMonthlyAvg * 0.75;

  const MONTHS = projYears * 12;
  const projStartDate = parseDDMMYYYY(lastEntry.date);

  const chartData: Array<{ label: string; base: number; optimistic: number; pessimistic: number }> = [];
  let base = currentWealth;
  let optimistic = currentWealth;
  let pessimistic = currentWealth;
  let investmentBalance = lastEntry.investments;

  // Year-markers for X-axis labels
  const yearMarkers = new Set<number>();
  for (let y = 1; y <= projYears; y++) yearMarkers.add(y * 12);

  for (let m = 1; m <= MONTHS; m++) {
    const d = new Date(projStartDate);
    d.setMonth(d.getMonth() + m);
    const label = yearMarkers.has(m)
      ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      : '';

    const monthlyReturn = investmentBalance * (annualReturn / 100) / 12;
    // The extra contribution both grows the investment balance (so it compounds via the
    // return above) AND adds to net worth as principal. baseMonthlyAvg is the historical
    // trend, which does NOT include this extra saving, so the principal must be added on
    // top — otherwise the money you deposit never shows up in the projected net worth.
    investmentBalance += monthlyContrib + monthlyReturn;
    const boost = monthlyContrib + monthlyReturn;

    base       += baseMonthlyAvg      + boost;
    optimistic += optimisticMonthly   + boost;
    pessimistic += pessimisticMonthly + boost;
    const deflator = inflationAdjusted ? Math.pow(1 + INFLATION, -m / 12) : 1;
    chartData.push({ label, base: base * deflator, optimistic: optimistic * deflator, pessimistic: pessimistic * deflator });
  }

  const relevantGoals = GOALS.filter(
    g => g.value > currentWealth && g.value < chartData[chartData.length - 1].optimistic * 1.1
  );

  // Dynamic milestone summary cards
  const summaryPoints: Array<{ label: string; m: number }> = [];
  if (projYears >= 1) summaryPoints.push({ label: 'La 1 an', m: 12 });
  if (projYears >= 2) summaryPoints.push({ label: `La ${Math.floor(projYears / 2)} ani`, m: Math.floor(projYears / 2) * 12 });
  summaryPoints.push({ label: `La ${projYears} ani`, m: MONTHS });

  // Deduplicate
  const seen = new Set<number>();
  const uniqueSummary = summaryPoints.filter(s => { if (seen.has(s.m)) return false; seen.add(s.m); return true; });

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="text-indigo-400" size={24}/>
          Proiecție Scenarii {projYears} {projYears === 1 ? 'An' : 'Ani'}
        </h2>
        <button
          onClick={() => setInflationAdjusted(v => !v)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${inflationAdjusted ? 'bg-orange-600 border-orange-500 text-white' : 'border-slate-600 text-slate-400 hover:text-white'}`}
        >
          {inflationAdjusted ? '📉 Ajustat inflație (3%)' : '💶 Nominal (neajustat)'}
        </button>
      </div>

      <ChartInfo text="Proiectează averea ta pe mai mulți ani în 3 scenarii: Baza (albastru) = trendul tău istoric mediu; Optimist (verde) = trend +25%; Pesimist (roșu) = trend -25%. Contribuție lunară extra = bani suplimentari față de comportamentul tău obișnuit. Randament investiții = dobânda aplicată doar pe portofoliul tău de investiții, nu pe toată averea. Butonul de inflație ajustează valorile la puterea de cumpărare din ziua de azi." />

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Medie Istorică/lună</p>
          <p className="text-white font-bold">{formatEUR(historicalMonthlyAvg)}</p>
          <p className="text-slate-600 text-[9px]">fără intrări unice</p>
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

      <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 mb-4 text-xs space-y-2">
        <p className="text-slate-400">
          <span className="text-white font-semibold">Trendul de bază</span> = media istorică lunară a averii tale reale
          (include salarii, cheltuieli, taxe și piață). Scenariile ±25% se aplică doar pe această componentă.
        </p>
        <p className="text-slate-400">
          <span className="text-purple-400 font-semibold">Contribuție lunară netă ({formatEUR(monthlyContrib)}/lună)</span> = bani <em>extra</em> pe
          care intenționezi să îi economisești față de comportamentul tău istoric. Dacă nu vrei să schimbi nimic, lasă €0.
          Contribuția intră în soldul de investiții și se compounduiește.
        </p>
        <p className="text-slate-400">
          <span className="text-amber-400 font-semibold">Randament investiții ({annualReturn}%/an)</span> = dobânda anuală estimată pe soldul de investiții
          ({formatEUR(lastEntry.investments)} acum). Generează ~{formatEUR(lastEntry.investments * (annualReturn / 100) / 12)}/lună inițial,
          crescând pe măsură ce soldul crește. Nu se aplică pe toată averea.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/40">
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Contribuție lunară extra (EUR)</label>
            <div className="flex gap-2 items-center">
              <input type="number" min={0} step={100} value={monthlyContrib}
                onChange={e => handleContrib(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-24" />
              <input type="range" min={0} max={10000} step={100} value={monthlyContrib}
                onChange={e => handleContrib(Number(e.target.value))}
                className="flex-1 accent-purple-400" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Randament anual investiții (%)</label>
            <div className="flex gap-2 items-center">
              <input type="number" min={0} max={30} step={0.5} value={annualReturn}
                onChange={e => handleReturn(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-24" />
              <input type="range" min={0} max={20} step={0.5} value={annualReturn}
                onChange={e => handleReturn(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
            </div>
          </div>
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
            tickFormatter={formatEURShort}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
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
              label={{ value: g.label, position: 'insideTopRight', fill: '#94a3b8', fontSize: 9 }}
            />
          ))}
          <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1.5} fill="url(#scenarioPes)" strokeDasharray="4 2" name="pessimistic"/>
          <Area type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} fill="url(#scenarioBase)" name="base"/>
          <Area type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={1.5} fill="url(#scenarioOpt)" strokeDasharray="4 2" name="optimistic"/>
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {uniqueSummary.map(({ label, m }) => {
          const p = chartData[Math.min(m, chartData.length) - 1];
          if (!p) return null;
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
        <div className="max-w-xs">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ani proiecție</label>
            <div className="flex gap-2 items-center">
              <input type="number" min={1} max={30} step={1} value={projYears}
                onChange={e => handleYears(Math.max(1, Math.min(30, Number(e.target.value))))}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-24" />
              <input type="range" min={1} max={30} step={1} value={projYears}
                onChange={e => handleYears(Number(e.target.value))}
                className="flex-1 accent-indigo-400" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">Contribuția lunară intră în balanța de investiții și se compounduiește la randamentul setat. Setările sunt salvate automat.</p>
      </div>

      <p className="text-[10px] text-slate-600 mt-3">
        Baza = media istorică lunară (fără lump sum) + contribuții + randament compus. Scenariile ±25% se aplică doar pe componenta istorică.
      </p>
    </div>
  );
};

export default ScenarioProjectionChart;
