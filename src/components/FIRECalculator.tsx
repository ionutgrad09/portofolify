import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const monthsToLabel = (m: number): string => {
  if (!isFinite(m) || m <= 0) return '—';
  if (m < 12) return `${Math.ceil(m)} luni`;
  const y = m / 12;
  return `${Math.ceil(m)} luni (${y.toFixed(1)} ani)`;
};


interface Props {
  mergedData: MergedData[];
}

const FIRECalculator: React.FC<Props> = ({ mergedData }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(3000);

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData]
    .sort((a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime());

  const currentWealth = sorted[sorted.length - 1].netWorth;
  const startWealth   = sorted[0].netWorth;

  const startDate = parseDDMMYYYY(sorted[0].date);
  const endDate   = parseDDMMYYYY(sorted[sorted.length - 1].date);
  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    (endDate.getDate() - startDate.getDate()) / 30;

  const historicalMonthly = totalMonths > 0 ? (currentWealth - startWealth) / totalMonths : 0;

  const computeTrend = (months: number): number => {
    const cutoff = new Date(endDate.getTime());
    cutoff.setMonth(cutoff.getMonth() - months);
    const entries = sorted.filter(e => parseDDMMYYYY(e.date).getTime() >= cutoff.getTime());
    if (entries.length < 2) return historicalMonthly;
    const s = parseDDMMYYYY(entries[0].date);
    const en = parseDDMMYYYY(entries[entries.length - 1].date);
    const elapsed = (en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (elapsed < 0.5) return historicalMonthly;
    return (entries[entries.length - 1].netWorth - entries[0].netWorth) / elapsed;
  };

  const trend3  = computeTrend(3);
  const trend6  = computeTrend(6);
  const trend12 = computeTrend(12);

  // 4% rule: FIRE number = annual expenses / 0.04 = monthly * 12 * 25
  const fireTarget = monthlyExpenses * 12 * 25;
  const remaining  = Math.max(0, fireTarget - currentWealth);
  const progress   = Math.min(100, (currentWealth / fireTarget) * 100);

  const toFIRE = (rate: number) => rate > 0 ? remaining / rate : Infinity;

  const scenarios = [
    { label: 'Medie Istorică', rate: historicalMonthly, color: 'text-blue-400' },
    { label: 'Trend 3 luni',   rate: trend3,            color: trend3  >= historicalMonthly ? 'text-emerald-400' : 'text-orange-400' },
    { label: 'Trend 6 luni',   rate: trend6,            color: trend6  >= historicalMonthly ? 'text-emerald-400' : 'text-orange-400' },
    { label: 'Trend 1 an',     rate: trend12,           color: trend12 >= historicalMonthly ? 'text-emerald-400' : 'text-orange-400' },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Flame className="text-orange-400" size={24} />
        FIRE Calculator
      </h2>

      {/* Expense input */}
      <div className="mb-6">
        <label className="text-xs text-slate-400 mb-1 block">Cheltuieli lunare estimate (EUR)</label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <input
            type="number"
            min={500}
            max={50000}
            step={100}
            value={monthlyExpenses}
            onChange={e => setMonthlyExpenses(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 w-full sm:w-36 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="range"
            min={500}
            max={20000}
            step={100}
            value={monthlyExpenses}
            onChange={e => setMonthlyExpenses(Number(e.target.value))}
            className="w-full sm:flex-1 accent-orange-400"
          />
        </div>
      </div>

      {/* FIRE target + progress */}
      <div className="mb-5 bg-slate-800/50 p-4 rounded-xl">
        <div className="flex justify-between items-start sm:items-center mb-2 gap-2">
          <div>
            <p className="text-xs text-slate-500">FIRE Target (regula 4%)</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-400">{formatEUR(fireTarget)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Rămas</p>
            <p className="text-base sm:text-lg font-bold text-white">{formatEUR(remaining)}</p>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 flex items-center justify-end px-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          >
            <span className="text-white text-xs font-bold">{progress.toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">Avere curentă: {formatEUR(currentWealth)}</p>
      </div>

      {/* Time to FIRE per scenario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{formatEUR(s.rate)}/lună</p>
            <p className="text-xs text-slate-400 mt-1">{monthsToLabel(toFIRE(s.rate))}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Bazat pe regula 4% (SWR). FIRE = {formatEUR(monthlyExpenses)} × 12 × 25
      </p>
    </div>
  );
};

export default FIRECalculator;
