import React from 'react';
import { Flag } from 'lucide-react';
import type { MergedData } from '../types';
import { oneTimeInflowInWindow } from '../utils/utils';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const GOALS = [150000, 200000, 250000, 300000, 350000, 400000, 500000, 600000, 750000, 1000000, 1500000, 2000000];

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (d: Date) => {
  const MONTHS = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

interface Props { mergedData: MergedData[] }

const GoalETAChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 4) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;
  const now = parseDDMMYYYY(lastEntry.date);

  // Compute monthly rate for 3 different windows (strip lump sums)
  const computeRate = (windowMonths: number): number => {
    const cutoff = new Date(now.getTime());
    cutoff.setMonth(cutoff.getMonth() - windowMonths);
    const entries = sorted.filter(e => parseDDMMYYYY(e.date).getTime() >= cutoff.getTime());
    if (entries.length < 2) return 0;
    const s = parseDDMMYYYY(entries[0].date);
    const en = parseDDMMYYYY(entries[entries.length - 1].date);
    const elapsed = (en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (elapsed < 0.5) return 0;
    const lump = oneTimeInflowInWindow(s, en);
    return (entries[entries.length - 1].netWorth - entries[0].netWorth - lump) / elapsed;
  };

  // Overall historical rate
  const startDate = parseDDMMYYYY(sorted[0].date);
  const totalMs = now.getTime() - startDate.getTime();
  const totalMonths = totalMs / (1000 * 60 * 60 * 24 * 30.44);
  const lumpTotal = oneTimeInflowInWindow(startDate, now);
  const overallRate = totalMonths > 0 ? (currentWealth - sorted[0].netWorth - lumpTotal) / totalMonths : 0;

  const rate3m = computeRate(3);
  const rate6m = computeRate(6);
  const rate12m = computeRate(12);

  // For each goal compute ETA under each rate
  const futureGoals = GOALS.filter(g => g > currentWealth);

  const eta = (goal: number, rate: number): string => {
    if (rate <= 0) return '∞';
    const months = (goal - currentWealth) / rate;
    if (months > 600) return '> 50 ani';
    const d = addMonths(now, Math.ceil(months));
    const yrs = months / 12;
    return `${formatDate(d)} (~${yrs.toFixed(1)} ani)`;
  };

  if (futureGoals.length === 0) return null;

  const rates = [
    { label: 'Medie istorică', rate: overallRate, color: 'text-blue-400' },
    { label: 'Trend 12 luni', rate: rate12m, color: 'text-amber-400' },
    { label: 'Trend 6 luni', rate: rate6m, color: 'text-emerald-400' },
    { label: 'Trend 3 luni', rate: rate3m, color: 'text-purple-400' },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Flag className="text-rose-400" size={24} />
        Când ating X €? — ETA Obiective
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Data estimată de atingere a fiecărui prag. Ratele de mai jos sunt calculate din variația reală a averii nete
        (includ salarii, cheltuieli și piață) — <span className="text-slate-300">nu reprezintă contribuții separate</span>, ci ritmul tău real de creștere.
        Avere curentă: <span className="text-white font-semibold">{formatEUR(currentWealth)}</span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
        {rates.map((r, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-slate-400">{r.label}</p>
            <p className={`font-bold ${r.color}`}>{formatEUR(r.rate)}/lună</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left py-2 px-2">Obiectiv</th>
              <th className="text-right py-2 px-2 text-blue-400">Medie istorică</th>
              <th className="text-right py-2 px-2 text-amber-400">Trend 12 luni</th>
              <th className="text-right py-2 px-2 text-emerald-400">Trend 6 luni</th>
              <th className="text-right py-2 px-2 text-purple-400">Trend 3 luni</th>
            </tr>
          </thead>
          <tbody>
            {futureGoals.map(goal => {
              const pct = ((currentWealth / goal) * 100).toFixed(0);
              return (
                <tr key={goal} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-2">
                    <span className="font-bold text-white">{formatEUR(goal)}</span>
                    <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                      <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-500 text-[10px]">{pct}% atins</span>
                  </td>
                  {rates.map((r, i) => (
                    <td key={i} className={`text-right py-2 px-2 ${r.color}`}>
                      {eta(goal, r.rate)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoalETAChart;
