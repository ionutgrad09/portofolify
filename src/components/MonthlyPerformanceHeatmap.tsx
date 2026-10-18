// ============================================
// 1. MonthlyPerformanceHeatmap.tsx
// ============================================
import React from 'react';
import { Calendar } from 'lucide-react';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

interface MonthlyPerformanceHeatmapProps {
  mergedData: MergedData[];
}

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MonthlyPerformanceHeatmap: React.FC<MonthlyPerformanceHeatmapProps> = ({ mergedData }) => {
  // Sort data chronologically
  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // For each calendar month, record the last net worth snapshot
  const lastOfMonth = new Map<string, number>(); // key: "YYYY-M"
  sorted.forEach(entry => {
    const [, month, year] = entry.date.split('.').map(Number);
    lastOfMonth.set(`${year}-${month}`, entry.netWorth);
  });

  // Sort month keys chronologically
  const monthKeys = Array.from(lastOfMonth.keys()).sort((a, b) => {
    const [ya, ma] = a.split('-').map(Number);
    const [yb, mb] = b.split('-').map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  // Compute month-over-month return: (last of month − last of prev month) / last of prev month
  // This captures ALL movement within the calendar month, including the gap from the previous month's last snapshot.
  const monthlyReturns: { [key: string]: { [key: string]: number } } = {};
  const monthlyDeltasEUR: { [key: string]: { [key: string]: number } } = {};

  monthKeys.forEach((key, idx) => {
    const [year, month] = key.split('-').map(Number);
    const endValue = lastOfMonth.get(key)!;
    const startValue = idx === 0 ? endValue : lastOfMonth.get(monthKeys[idx - 1])!;

    // Full month-over-month change in €, including one-time inflows — this is real history.
    const deltaEUR = endValue - startValue;
    const returnPct = startValue > 0 && idx > 0 ? (deltaEUR / startValue) * 100 : 0;

    if (!monthlyReturns[year]) monthlyReturns[year] = {};
    if (!monthlyDeltasEUR[year]) monthlyDeltasEUR[year] = {};

    monthlyReturns[year][month] = returnPct;
    monthlyDeltasEUR[year][month] = deltaEUR;
  });

  const years = Object.keys(monthlyReturns).sort();
  const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

  // Color reflects the ABSOLUTE monthly change in €: one step darker per €2.000, saturating
  // at €40k (anything ≥ €40k shares the darkest shade). Green = gain, red = loss.
  const STEP_EUR = 2000;
  const CAP_EUR = 40000;
  const MAX_STEP = CAP_EUR / STEP_EUR; // 20

  const getColor = (delta: number): string => {
    if (!delta) return '#334155'; // slate-700 — no change
    const step = Math.min(Math.floor(Math.abs(delta) / STEP_EUR), MAX_STEP); // 0..20
    const t = step / MAX_STEP; // 0..1
    // Pure green (gain) / red (loss) — hue stays fixed. With only 20 steps (€2.000 each) we push
    // BOTH lightness and saturation across their widest usable range so every step is clearly
    // distinct. Losses (red) use a darker lightness range across ALL steps, but still get one
    // step darker per €2.000, same as gains.
    const lightness = delta > 0 ? 82 - t * 70 : 58 - t * 46; // green 82→12, red (darker) 58→12
    const saturation = 30 + t * 70; // 30% → 100%
    const hue = delta > 0 ? 145 : 0; // green / red
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Uniform €2.000 steps for the legend: 2000, 4000, 6000, … 40000
  const legendSteps = Array.from({ length: MAX_STEP }, (_, i) => (i + 1) * STEP_EUR);

  // Selection state for clicked cell
  const [selected, setSelected] = React.useState<{ year: string; month: number; pct: number; eur: number } | null>(null);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="text-cyan-400" size={24}/>
        Heatmap Performanță Lunară
        <ChartInfo text="Grid cu ani pe verticală și luni pe orizontală. Fiecare celulă = variația averii față de luna anterioară. Culoarea reflectă suma în € a variației: o treaptă mai închisă la fiecare €2.000, saturând la €40k+ (aceeași culoare peste €40k). Verde = creștere, roșu = scădere. Click pe o celulă pentru detalii. Util pentru a vedea sezonalitatea (ex: luni cu taxe apar constant roșii)." />
      </h2>

      <div className="w-full">
        <div className="w-full">
          <div className="flex gap-1 mb-2">
            <div className="w-12 shrink-0"></div>
            {months.map((month, idx) => (
              <div key={idx} className="flex-1 text-center text-xs text-slate-400 font-medium">
                {month}
              </div>
            ))}
          </div>

          {years.map(year => (
            <div key={year} className="flex gap-1 mb-1">
              <div className="w-12 shrink-0 text-sm text-slate-400 font-medium flex items-center">
                {year}
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                const value = monthlyReturns[year]?.[month] || 0;
                const delta = monthlyDeltasEUR[year]?.[month] || 0;
                return (
                  <div
                    key={month}
                    className="flex-1 h-12 rounded flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-white transition-all cursor-pointer group relative"
                    style={{ backgroundColor: getColor(delta) }}
                    title={`${months[month - 1]} ${year}: ${delta < 0 ? '-' : '+'}€${Math.abs(delta)?.toFixed(2)} (${value?.toFixed(2)}%)`}
                    onClick={() => setSelected({ year, month, pct: value, eur: delta })}
                  >
                    {delta !== 0 && (
                      <span className="opacity-0 group-hover:opacity-100 flex flex-col items-center leading-tight">
                        <span>{value?.toFixed(1)}%</span>
                        <span className="text-[10px] font-normal opacity-90">{delta >= 0 ? '+' : '-'}€{Math.abs(delta)?.toFixed(0)}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <div className="flex items-center justify-center gap-0.5 text-xs flex-wrap">
          <span className="text-slate-400 mr-1">pierdere</span>
          {[...legendSteps].reverse().map(v => (
            <div key={`l${v}`} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(-v) }} title={`−€${(v / 1000)}k`}></div>
          ))}
          <div className="w-3 h-3 rounded-sm mx-1" style={{ backgroundColor: getColor(0) }} title="fără schimbare"></div>
          {legendSteps.map(v => (
            <div key={`g${v}`} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v) }} title={`+€${(v / 1000)}k`}></div>
          ))}
          <span className="text-slate-400 ml-1">câștig</span>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2">
          Culoarea reflectă suma lunară în €: o treaptă la fiecare €2.000, saturând la €40k+
        </p>
      </div>

      {/* Details panel for selected month */}
      {selected && (
        <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">
              {months[selected.month - 1]} {selected.year}
            </span>
            <button className="text-slate-400 hover:text-white" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-slate-500">Percent</p>
              <p className={`${selected.pct >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                {selected.pct > 0 ? '+' : ''}{selected.pct.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500">Sumă</p>
              <p className={`${selected.eur >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                {selected.eur >= 0 ? '+' : '-'}€{Math.abs(selected.eur).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyPerformanceHeatmap;