import React from 'react';
import { Flame } from 'lucide-react';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const ONE_TIME_INFLOW_KEYWORDS = ['bani nunta'];
const isOneTimeInflow = (comment: string) =>
  ONE_TIME_INFLOW_KEYWORDS.some(kw => comment.toLowerCase().includes(kw));

// Color scale: green (inflow) → white (neutral) → red (high spending)
const getColor = (spending: number, min: number, max: number): string => {
  if (spending <= 0) {
    // green inflow
    const t = Math.min(1, Math.abs(spending) / Math.max(1, Math.abs(min)));
    const g = Math.round(80 + t * 80);
    return `rgba(16, ${g + 100}, 80, ${0.3 + t * 0.5})`;
  }
  // red spending
  const t = Math.min(1, spending / Math.max(1, max));
  return `rgba(239, ${Math.round(68 - t * 40)}, ${Math.round(68 - t * 40)}, ${0.2 + t * 0.65})`;
};

interface Props { mergedData: MergedData[] }

const SpendingHeatmap: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  type MonthBucket = { netWorth: number; investments: number; oneTimeInflows: number };
  const monthMap = new Map<string, MonthBucket>();

  sorted.forEach((e, idx) => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key);
    let oneTimeInflows = existing?.oneTimeInflows ?? 0;
    if (e.comment && isOneTimeInflow(e.comment) && idx > 0) {
      const delta = e.netWorth - sorted[idx - 1].netWorth;
      if (delta > 0) oneTimeInflows += delta;
    }
    monthMap.set(key, { netWorth: e.netWorth, investments: e.investments, oneTimeInflows });
  });

  const entries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Build { year, month, spending } records
  type Cell = { year: number; month: number; spending: number };
  const cells: Cell[] = [];
  for (let i = 1; i < entries.length; i++) {
    const [key, curr] = entries[i];
    const [, prev] = entries[i - 1];
    const [year, mo] = key.split('-').map(Number);
    const rawDelta = curr.netWorth - prev.netWorth;
    const investDelta = curr.investments - prev.investments;
    const spending = -(rawDelta - investDelta) - curr.oneTimeInflows;
    cells.push({ year, month: mo - 1, spending: parseFloat(spending.toFixed(0)) });
  }

  const years = Array.from(new Set(cells.map(c => c.year))).sort();
  const maxSpending = Math.max(...cells.filter(c => c.spending > 0).map(c => c.spending), 1);
  const minSpending = Math.min(...cells.filter(c => c.spending <= 0).map(c => c.spending), 0);

  // Build lookup: year → month → spending
  const lookup = new Map<string, number>();
  cells.forEach(c => lookup.set(`${c.year}-${c.month}`, c.spending));

  const avgSpending = cells.filter(c => c.spending > 0).reduce((a, b) => a + b.spending, 0) /
    Math.max(1, cells.filter(c => c.spending > 0).length);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Flame className="text-rose-400" size={20} />
        Heatmap Cheltuieli Lunare
      </h3>
      <p className="text-xs text-slate-400 mb-1">
        Roșu = cheltuieli mari, Verde = luni cu intrare netă. Medie cheltuieli: <span className="text-rose-400 font-semibold">{formatEUR(avgSpending)}/lună</span>
      </p>
      <div className="flex gap-3 items-center text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: 'rgba(16,185,80,0.7)' }}></span>Intrare netă</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: 'rgba(239,50,50,0.3)' }}></span>Cheltuieli mici</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded" style={{ background: 'rgba(239,28,28,0.85)' }}></span>Cheltuieli mari</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-slate-500 pb-2 pr-2 font-medium w-12">An</th>
              {MONTH_NAMES.map(m => (
                <th key={m} className="text-center text-slate-500 pb-2 px-1 font-medium min-w-[52px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(yr => (
              <tr key={yr}>
                <td className="text-slate-400 font-bold pr-2 py-1">{yr}</td>
                {MONTH_NAMES.map((_, mo) => {
                  const val = lookup.get(`${yr}-${mo}`);
                  if (val === undefined) return (
                    <td key={mo} className="px-1 py-1">
                      <div className="rounded h-10 bg-slate-800/30" />
                    </td>
                  );
                  const color = getColor(val, minSpending, maxSpending);
                  return (
                    <td key={mo} className="px-1 py-1" title={`${MONTH_NAMES[mo]} ${yr}: ${val >= 0 ? 'Cheltuieli' : 'Intrare'} ${formatEUR(Math.abs(val))}`}>
                      <div
                        className="rounded h-10 flex items-center justify-center cursor-default transition-transform hover:scale-105"
                        style={{ background: color }}
                      >
                        <span className="text-white font-semibold" style={{ fontSize: 9 }}>
                          {val >= 0 ? `€${Math.round(val / 1000)}k` : `+€${Math.round(Math.abs(val) / 1000)}k`}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpendingHeatmap;
