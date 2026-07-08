import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { oneTimeInflowInWindow } from '../utils/utils';

// Mock types for demonstration
type MergedData = {
  date: string;
  netWorth: number;
  eur: number;
  investments: number;
  cash: number;
  ron: number;
  gainLoss: number;
  comment: string;
  assetsTotal: number;
  assetsBreakdown: Record<string, number>;
};

const formatEUR = (value: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const toDateStr = (date: Date): string =>
  `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

// Returns week-of-year index (0–51)
const weekOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.min(Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)), 51);
};


const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const CONTRIB_KEY = 'portofolify_monthly_contrib';
const RETURN_KEY  = 'portofolify_annual_return';

const ProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  const [monthlyContrib, setMonthlyContrib] = useState<number>(() =>
    Number(localStorage.getItem(CONTRIB_KEY) || '2000'));
  const [annualReturn, setAnnualReturn] = useState<number>(() =>
    Number(localStorage.getItem(RETURN_KEY) || '7.5'));

  const handleContrib = (v: number) => { setMonthlyContrib(v); localStorage.setItem(CONTRIB_KEY, String(v)); };
  const handleReturn  = (v: number) => { setAnnualReturn(v);   localStorage.setItem(RETURN_KEY,  String(v)); };

  if (!mergedData || mergedData.length < 2) {
    return null;
  }

  const sortedData = [...mergedData]
    .sort((a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime());

  // Use real latest entry (may include the excluded date) as projection start
  const lastEntry = [...mergedData]
    .sort((a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime())
    .at(-1)!;
  const currentWealth = lastEntry.netWorth;

  // Compute week-over-week deltas, normalized to 7 days, tagged with year.
  // The 37k June 2026 inflow stays in all totals, but is a one-time deposit, so we
  // strip it from the deltas to keep the projected weekly trend realistic.
  const weeklyDeltas: { week: number; delta: number }[] = [];
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = parseDDMMYYYY(sortedData[i - 1].date);
    const currDate = parseDDMMYYYY(sortedData[i].date);
    const days = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    const recurringGrowth =
      sortedData[i].netWorth - sortedData[i - 1].netWorth - oneTimeInflowInWindow(prevDate, currDate);
    const normalizedDelta = (recurringGrowth / days) * 7;
    weeklyDeltas.push({ week: weekOfYear(currDate), delta: normalizedDelta });
  }

  if (weeklyDeltas.length === 0) return null;

  // End-to-end weekly average
  const allDeltas = weeklyDeltas.map(d => d.delta);
  const startMs = parseDDMMYYYY(sortedData[0].date).getTime();
  const endMs   = parseDDMMYYYY(lastEntry.date).getTime();
  const totalWeeks = (endMs - startMs) / (7 * 24 * 60 * 60 * 1000);
  const overallAvgWeekly = totalWeeks > 0
    ? (lastEntry.netWorth - sortedData[0].netWorth - oneTimeInflowInWindow(parseDDMMYYYY(sortedData[0].date), parseDDMMYYYY(lastEntry.date))) / totalWeeks
    : avg(allDeltas);

  const variance = allDeltas.reduce((sum, d) => sum + Math.pow(d - overallAvgWeekly, 2), 0) / allDeltas.length;
  const stdDev = Math.sqrt(variance);

  // Seasonal buckets across all data
  const byWeek: number[][] = Array.from({ length: 52 }, () => []);
  weeklyDeltas.forEach(({ week, delta }) => byWeek[week].push(delta));

  const seasonalWeeklyAvg: number[] = byWeek.map(slot =>
    slot.length > 0 ? avg(slot) : overallAvgWeekly
  );

  // Projected weekly average (for display)
  const projectedAvgWeekly = avg(seasonalWeeklyAvg);

  // ── Contribution + investment return boost ──────────────────────
  const weeklyContrib = monthlyContrib / 4.33;
  let investmentBalance = lastEntry.investments;
  const initialWeeklyReturn = investmentBalance * (annualReturn / 100) / 52;

  // Build 52-week projection
  const projectionData = [...sortedData] as any[];
  let currentTotal = currentWealth;
  const projDate = parseDDMMYYYY(lastEntry.date);

  const weeklyProjections: Array<{ date: string; netWorth: number; upperBound: number; lowerBound: number }> = [];

  for (let w = 0; w < 52; w++) {
    projDate.setDate(projDate.getDate() + 7);
    const weeklyReturn = investmentBalance * (annualReturn / 100) / 52;
    const extraBoost   = weeklyContrib + weeklyReturn;
    investmentBalance += weeklyContrib + weeklyReturn;
    const delta = seasonalWeeklyAvg[weekOfYear(projDate)] + extraBoost;
    currentTotal += delta;
    const spread = stdDev * Math.sqrt(w + 1);
    const dateStr = toDateStr(projDate);
    weeklyProjections.push({ date: dateStr, netWorth: currentTotal, upperBound: currentTotal + spread, lowerBound: currentTotal - spread });
    projectionData.push({ ...lastEntry, date: dateStr, netWorth: currentTotal, upperBound: currentTotal + spread, lowerBound: currentTotal - spread, isProjection: true } as any);
  }

  // Aggregate weekly projections into calendar months
  const monthlyProjections: Array<{ month: string; projectedValue: number; totalGrowth: number }> = [];
  const monthMap = new Map<string, { name: string; lastValue: number }>();
  let prevMonthKey = '';
  let monthStartWealth = currentWealth;

  weeklyProjections.forEach(wp => {
    const d = parseDDMMYYYY(wp.date);
    const mk = `${d.getFullYear()}-${d.getMonth()}`;
    const name = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    if (prevMonthKey && mk !== prevMonthKey) {
      const prev = monthMap.get(prevMonthKey)!;
      monthlyProjections.push({ month: prev.name, projectedValue: prev.lastValue, totalGrowth: prev.lastValue - monthStartWealth });
      monthStartWealth = prev.lastValue;
    }

    monthMap.set(mk, { name, lastValue: wp.netWorth });
    prevMonthKey = mk;
  });

  if (prevMonthKey) {
    const last = monthMap.get(prevMonthKey)!;
    monthlyProjections.push({ month: last.name, projectedValue: last.lastValue, totalGrowth: last.lastValue - monthStartWealth });
  }

  const endProjectedValue = currentTotal;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="text-blue-400" size={24}/>
        Proiecție 52 Săptămâni
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-slate-400">Medie Istorică</p>
            <p className="text-white font-bold">{formatEUR(overallAvgWeekly)}/săpt</p>
            <p className="text-slate-400 text-[10px]">({formatEUR(overallAvgWeekly * 4.33)}/lună)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiectat (cu boost)</p>
            <p className="text-emerald-400 font-bold">{formatEUR(projectedAvgWeekly + weeklyContrib + initialWeeklyReturn)}/săpt</p>
            <p className="text-slate-400 text-[10px]">({formatEUR((projectedAvgWeekly + weeklyContrib + initialWeeklyReturn) * 4.33)}/lună)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiecție la 52 săpt</p>
            <p className="text-blue-400 font-bold">{formatEUR(endProjectedValue)}</p>
          </div>
        </div>
        <div className="border-t border-slate-700/50 pt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">+ Contribuție lunară</p>
            <p className="text-purple-400 font-bold">{formatEUR(monthlyContrib)}/lună</p>
          </div>
          <div>
            <p className="text-slate-500">+ Randament investiții (~{annualReturn}%/an)</p>
            <p className="text-amber-400 font-bold">{formatEUR(lastEntry.investments * (annualReturn / 100) / 12)}/lună inițial</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={projectionData}>
          <defs>
            <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{fontSize: 9}}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={Math.floor(projectionData.length / 12)}
          />
          <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000)?.toFixed(0)}k`}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: "white"}}
            formatter={(value: any, name: string) => {
              if (name === 'netWorth') return [formatEUR(value), 'Valoare'];
              if (name === 'upperBound') return [formatEUR(value), 'Estimat Max'];
              if (name === 'lowerBound') return [formatEUR(value), 'Estimat Min'];
              return [formatEUR(value), name];
            }}
          />
          <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorProjection)"
            strokeDasharray={(entry: any) => entry.isProjection ? "5 5" : ""}
          />
          <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
        </AreaChart>
      </ResponsiveContainer>

      {/* Monthly Projections Table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📅 Prognoză Detaliată Lunară
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-2 px-2">Lună</th>
              <th className="text-right py-2 px-2">Valoare Totală</th>
              <th className="text-right py-2 px-2">Câștig</th>
            </tr>
            </thead>
            <tbody className="text-slate-300">
            {monthlyProjections.map((proj, idx) => {
              const gain = proj.totalGrowth;
              const gainColor = gain >= 0 ? 'text-green-400' : 'text-red-400';
              const gainPrefix = gain >= 0 ? '+' : '';
              return (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-2 font-medium">{proj.month}</td>
                  <td className="text-right py-2 px-2 font-bold text-blue-400">{formatEUR(proj.projectedValue)}</td>
                  <td className={`text-right py-2 px-2 font-bold ${gainColor}`}>{gainPrefix}{formatEUR(gain)}</td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
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
        <p className="text-[10px] text-slate-600 mt-2">Contribuția și randamentul se adaugă peste trendul istoric. Setările sunt salvate automat.</p>
      </div>
    </div>
  );
};

export default ProjectionChart;

