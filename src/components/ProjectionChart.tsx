import React from 'react';
import { Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

// From 2026 onward, taxes increased by 12% → net gains are proportionally lower.
// Weeks where we already have 2026 actuals are used as-is (they already reflect the new rate).
// Weeks we haven't reached yet fall back to the pre-2026 seasonal pattern scaled down.
const TAX_CHANGE_YEAR = 2026;
const TAX_FACTOR = 1 - 0.12; // 12% higher taxes → 12% less net gain

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const ProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) {
    return null;
  }

  const sortedData = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const lastEntry = sortedData[sortedData.length - 1];
  const currentWealth = lastEntry.netWorth;

  // Compute week-over-week deltas, normalized to 7 days, tagged with year
  const weeklyDeltas: { week: number; delta: number; year: number }[] = [];
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = parseDDMMYYYY(sortedData[i - 1].date);
    const currDate = parseDDMMYYYY(sortedData[i].date);
    const days = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    const normalizedDelta = ((sortedData[i].netWorth - sortedData[i - 1].netWorth) / days) * 7;
    weeklyDeltas.push({ week: weekOfYear(currDate), delta: normalizedDelta, year: currDate.getFullYear() });
  }

  if (weeklyDeltas.length === 0) return null;

  // Split deltas by tax regime
  const preTaxDeltas  = weeklyDeltas.filter(d => d.year < TAX_CHANGE_YEAR);
  const postTaxDeltas = weeklyDeltas.filter(d => d.year >= TAX_CHANGE_YEAR);

  // End-to-end weekly average: totalGrowth / totalWeeks (matches FinancialGoalsProgress method)
  const allDeltas = weeklyDeltas.map(d => d.delta);
  const startMs = parseDDMMYYYY(sortedData[0].date).getTime();
  const endMs = parseDDMMYYYY(lastEntry.date).getTime();
  const totalWeeks = (endMs - startMs) / (7 * 24 * 60 * 60 * 1000);
  const overallAvgWeekly = totalWeeks > 0
    ? (currentWealth - sortedData[0].netWorth) / totalWeeks
    : avg(allDeltas);

  // stdDev from all data (volatility is regime-independent)
  const variance = allDeltas.reduce((sum, d) => sum + Math.pow(d - overallAvgWeekly, 2), 0) / allDeltas.length;
  const stdDev = Math.sqrt(variance);

  // Seasonal buckets per regime
  const preTaxByWeek:  number[][] = Array.from({ length: 52 }, () => []);
  const postTaxByWeek: number[][] = Array.from({ length: 52 }, () => []);
  preTaxDeltas.forEach(({ week, delta }) => preTaxByWeek[week].push(delta));
  postTaxDeltas.forEach(({ week, delta }) => postTaxByWeek[week].push(delta));

  // Overall pre-tax avg — fallback when a week slot has no pre-tax data
  const overallPreTaxAvg = preTaxDeltas.length > 0 ? avg(preTaxDeltas.map(d => d.delta)) : overallAvgWeekly;

  // Projection seasonal averages (all projection weeks are 2026+):
  //   • Use 2026 actuals directly when available (already reflect new tax regime)
  //   • Otherwise scale pre-2026 pattern by TAX_FACTOR
  const seasonalWeeklyAvg: number[] = postTaxByWeek.map((postSlot, i) => {
    if (postSlot.length > 0) return avg(postSlot);
    const preSlot = preTaxByWeek[i];
    return (preSlot.length > 0 ? avg(preSlot) : overallPreTaxAvg) * TAX_FACTOR;
  });

  // Projected weekly average (for display)
  const projectedAvgWeekly = avg(seasonalWeeklyAvg);

  // Build 52-week projection
  const projectionData = [...sortedData] as any[];
  let currentTotal = currentWealth;
  const projDate = parseDDMMYYYY(lastEntry.date);

  const weeklyProjections: Array<{ date: string; netWorth: number; upperBound: number; lowerBound: number }> = [];

  for (let w = 0; w < 52; w++) {
    projDate.setDate(projDate.getDate() + 7);
    const delta = seasonalWeeklyAvg[weekOfYear(projDate)];
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
            <p className="text-slate-300 font-bold">{formatEUR(overallAvgWeekly)}/săpt</p>
            <p className="text-slate-500 text-[10px]">({formatEUR(overallAvgWeekly * 4.33)}/lună)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiectat 2026+</p>
            <p className="text-emerald-400 font-bold">{formatEUR(projectedAvgWeekly)}/săpt</p>
            <p className="text-slate-500 text-[10px]">({formatEUR(projectedAvgWeekly * 4.33)}/lună)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiecție la 52 săpt</p>
            <p className="text-blue-400 font-bold">{formatEUR(endProjectedValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 border-t border-slate-700 pt-2">
          <span>⚠</span>
          <span>Taxe 2026 aplicate: săptămânile fără date reale sunt reduse cu 12% față de modelul 2025.</span>
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
                  <td className="text-right py-2 px-2 font-bold text-blue-400">
                    {formatEUR(proj.projectedValue)}
                  </td>
                  <td className={`text-right py-2 px-2 font-bold ${gainColor}`}>
                    {gainPrefix}{formatEUR(gain)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectionChart;