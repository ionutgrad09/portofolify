import React, { useState, useMemo } from 'react';
import { Dices } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import { oneTimeInflowInWindow } from '../utils/utils';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
const SIMULATIONS = 500;
const CONTRIB_KEY = 'portofolify_monthly_contrib';

// Box-Muller normal random
function randn(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Props { mergedData: MergedData[] }

const MonteCarloChart: React.FC<Props> = ({ mergedData }) => {
  const [projYears, setProjYears] = useState(5);
  const [monthlyContrib] = useState<number>(() => Number(localStorage.getItem(CONTRIB_KEY) || '2000'));

  if (!mergedData || mergedData.length < 6) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const lastEntry = sorted[sorted.length - 1];

  // ── Step 1: build monthly buckets (last value per month) ──────────────
  const monthMap = new Map<string, { netWorth: number; investments: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { netWorth: e.netWorth, investments: e.investments });
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // ── Step 2: separate INVESTMENT returns from CASH FLOW ────────────────
  // Investment return = (investEnd - investStart) / investStart  — pure market movement
  // Cash flow = netWorthDelta - investDelta - oneTimeLumps       — salary minus spending
  const investmentReturns: number[] = [];  // monthly % return on investments
  const cashFlows: number[] = [];          // net EUR cash flow per month

  for (let i = 1; i < monthEntries.length; i++) {
    const [prevKey, prev] = monthEntries[i - 1];
    const [currKey, curr] = monthEntries[i];
    const prevDate = new Date(Number(prevKey.split('-')[0]), Number(prevKey.split('-')[1]) - 1);
    const currDate = new Date(Number(currKey.split('-')[0]), Number(currKey.split('-')[1]) - 1);
    const lump = oneTimeInflowInWindow(prevDate, currDate);

    // Investment market return
    if (prev.investments > 0) {
      investmentReturns.push((curr.investments - prev.investments) / prev.investments);
    }

    // Cash flow: net worth change minus investment market move minus one-time inflows
    const investDelta = curr.investments - prev.investments;
    const cashFlow = curr.netWorth - prev.netWorth - investDelta - lump;
    cashFlows.push(cashFlow);
  }

  // ── Step 3: compute distribution parameters ───────────────────────────
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);

  const meanInvReturn = mean(investmentReturns);
  const stdInvReturn = std(investmentReturns, meanInvReturn);
  const meanCashFlow = mean(cashFlows);
  const stdCashFlow = std(cashFlows, meanCashFlow);

  // ── Step 4: run simulations ───────────────────────────────────────────
  // Each month:
  //   investmentBalance grows by a random market return (sampled from investment return distribution)
  //   total wealth += randomCashFlow (sampled from cash flow distribution) + randomMarketGain
  //   plus fixed monthly contribution on top
  const simResults = useMemo(() => {
    const MONTHS = projYears * 12;
    const results: number[][] = [];

    for (let s = 0; s < SIMULATIONS; s++) {
      let totalWealth = lastEntry.netWorth;
      let investBal = lastEntry.investments;
      const path: number[] = [totalWealth];

      for (let m = 0; m < MONTHS; m++) {
        const invReturn = randn(meanInvReturn, stdInvReturn);
        const cashFlow = randn(meanCashFlow, stdCashFlow);

        const marketGain = investBal * invReturn;
        investBal = investBal * (1 + invReturn) + monthlyContrib;
        totalWealth += marketGain + cashFlow + monthlyContrib;
        path.push(totalWealth);
      }
      results.push(path);
    }
    return results;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projYears, lastEntry.netWorth, lastEntry.investments, meanInvReturn, stdInvReturn, meanCashFlow, stdCashFlow, monthlyContrib]);

  // ── Step 5: percentile bands ──────────────────────────────────────────
  const MONTHS = projYears * 12;
  const chartData = Array.from({ length: MONTHS + 1 }, (_, m) => {
    const vals = simResults.map(path => path[m]).sort((a, b) => a - b);
    const p = (pct: number) => vals[Math.floor(pct / 100 * vals.length)] ?? vals[vals.length - 1];
    const d = new Date(parseDDMMYYYY(lastEntry.date));
    d.setMonth(d.getMonth() + m);
    const label = m === 0 ? 'Acum' : m % 12 === 0 ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : '';
    return { label, p10: p(10), p25: p(25), p50: p(50), p75: p(75), p90: p(90) };
  });

  const finalVals = simResults.map(p => p[MONTHS]).sort((a, b) => a - b);
  const probGoal500k = (finalVals.filter(v => v >= 500000).length / SIMULATIONS * 100).toFixed(1);
  const probGoal1M = (finalVals.filter(v => v >= 1000000).length / SIMULATIONS * 100).toFixed(1);
  const p50Final = finalVals[Math.floor(SIMULATIONS * 0.5)];
  const p10Final = finalVals[Math.floor(SIMULATIONS * 0.1)];
  const p90Final = finalVals[Math.floor(SIMULATIONS * 0.9)];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Dices className="text-violet-400" size={24} />
        Monte Carlo — {SIMULATIONS} Simulări
      </h2>
      <p className="text-xs text-slate-400 mb-1">
        Fiecare simulare aplică lunar un randament de piață aleator (bazat pe distribuția istorică a investițiilor tale)
        și un flux de numerar aleator (bazat pe variația istorică a salariului minus cheltuieli).
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Parametri istorici: randament investiții {(meanInvReturn * 100).toFixed(2)}%/lună (σ={( stdInvReturn * 100).toFixed(2)}%),
        flux numerar mediu {formatEUR(meanCashFlow)}/lună (σ={formatEUR(stdCashFlow)}). Contribuție fixă: +{formatEUR(monthlyContrib)}/lună.
      </p>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-slate-400">Orizont:</span>
        {[1, 2, 3, 5, 10].map(y => (
          <button key={y} onClick={() => setProjYears(y)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${projYears === y ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
            {y} {y === 1 ? 'an' : 'ani'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Median (P50)</p>
          <p className="text-base font-bold text-blue-400">{formatEUR(p50Final)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Scenariu slab (P10)</p>
          <p className="text-base font-bold text-red-400">{formatEUR(p10Final)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Scenariu bun (P90)</p>
          <p className="text-base font-bold text-emerald-400">{formatEUR(p90Final)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Prob. ≥ €500k</p>
          <p className="text-base font-bold text-violet-400">{probGoal500k}%</p>
          <p className="text-[10px] text-slate-400">≥ €1M: {probGoal1M}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4 }}>
          <defs>
            <linearGradient id="mc90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="mc50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={0} height={30} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v >= 1e6 ? `€${(v/1e6).toFixed(1)}M` : `€${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            formatter={(v: any, name: string) => {
              const labels: Record<string, string> = { p10: 'P10 — scenariu slab', p25: 'P25', p50: 'Median (P50)', p75: 'P75', p90: 'P90 — scenariu bun' };
              return [formatEUR(v), labels[name] ?? name];
            }}
          />
          {[500000, 1000000].filter(g => g < p90Final * 1.1).map(g => (
            <ReferenceLine key={g} y={g} stroke="#475569" strokeDasharray="4 2"
              label={{ value: g >= 1e6 ? '€1M' : '€500k', position: 'insideTopRight', fill: '#94a3b8', fontSize: 9 }} />
          ))}
          <Area type="monotone" dataKey="p90" stroke="#7c3aed" strokeWidth={1} fill="url(#mc90)" strokeDasharray="4 2" />
          <Area type="monotone" dataKey="p75" stroke="#7c3aed" strokeWidth={1} fill="url(#mc50)" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="p50" stroke="#a855f7" strokeWidth={2.5} fill="url(#mc50)" />
          <Area type="monotone" dataKey="p25" stroke="#7c3aed" strokeWidth={1} fill="#1e1b4b" fillOpacity={0.3} strokeOpacity={0.5} />
          <Area type="monotone" dataKey="p10" stroke="#7c3aed" strokeWidth={1} fill="#1e1b4b" fillOpacity={0} strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-purple-400"></span>Median (P50)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-purple-600/30 rounded"></span>P25–P75</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-purple-700"></span>P10–P90</span>
      </div>
    </div>
  );
};

export default MonteCarloChart;
