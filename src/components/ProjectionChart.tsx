import React from 'react';
import { Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { oneTimeInflowForMonth } from '../utils/utils';
import ChartInfo from './ChartInfo';

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

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const ProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) {
    return null;
  }

  const sortedData = [...mergedData]
    .sort((a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime());

  // Real latest entry is the projection start (its net worth includes the June inflow —
  // that's fine, the inflow stays in the level, we only strip it from the growth trend).
  const lastEntry = sortedData.at(-1)!;
  const currentWealth = lastEntry.netWorth;

  // ── Calendar-month-end snapshots (last value observed in each month) ──────────
  const monthEndMap = new Map<string, { date: Date; value: number }>();
  sortedData.forEach(d => {
    const dt = parseDDMMYYYY(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
    monthEndMap.set(key, { date: dt, value: d.netWorth }); // later entries overwrite → last of month
  });
  const monthEnds = Array.from(monthEndMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (monthEnds.length < 2) return null;

  // Month-over-month deltas, tagged by the ENDING calendar month (0–11). The one-time
  // June 2026 inflow is subtracted from the delta it lands in, so it never inflates the
  // projected trend (it won't recur).
  const deltas: { month: number; delta: number }[] = [];
  for (let i = 1; i < monthEnds.length; i++) {
    const curr = monthEnds[i];
    const raw =
      curr.value - monthEnds[i - 1].value - oneTimeInflowForMonth(curr.date.getFullYear(), curr.date.getMonth() + 1);
    deltas.push({ month: curr.date.getMonth(), delta: raw });
  }

  const allDeltas = deltas.map(d => d.delta);
  const overallAvgMonthly = avg(allDeltas);

  // Seasonal average per calendar month: the growth we predict for a future month is the
  // average change historically seen in that same month across all years (e.g. the mean of
  // past Augusts predicts next August). Months with no history fall back to the overall mean.
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  deltas.forEach(({ month, delta }) => byMonth[month].push(delta));
  const seasonalMonthlyAvg = byMonth.map(slot => (slot.length > 0 ? avg(slot) : overallAvgMonthly));

  const variance = allDeltas.reduce((sum, d) => sum + Math.pow(d - overallAvgMonthly, 2), 0) / allDeltas.length;
  const stdDev = Math.sqrt(variance);

  // ── Build 12-month projection ──────────────────────────────────────────────
  const projectionData = [...sortedData] as any[];
  const monthlyProjections: Array<{ month: string; projectedValue: number; totalGrowth: number }> = [];
  let currentTotal = currentWealth;
  const projDate = parseDDMMYYYY(lastEntry.date);

  for (let m = 0; m < 12; m++) {
    projDate.setMonth(projDate.getMonth() + 1);
    const delta = seasonalMonthlyAvg[projDate.getMonth()];
    currentTotal += delta;
    const spread = stdDev * Math.sqrt(m + 1);
    const dateStr = toDateStr(projDate);
    // Simple linear trajectory: flat historical monthly average, no seasonality — amber ref line.
    const linearTrajectory = currentWealth + overallAvgMonthly * (m + 1);
    projectionData.push({
      ...lastEntry,
      date: dateStr,
      netWorth: currentTotal,
      upperBound: currentTotal + spread,
      lowerBound: currentTotal - spread,
      linearTrajectory,
      isProjection: true,
    } as any);
    monthlyProjections.push({
      month: `${MONTH_NAMES[projDate.getMonth()]} ${projDate.getFullYear()}`,
      projectedValue: currentTotal,
      totalGrowth: delta,
    });
  }

  const endProjectedValue = currentTotal;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="text-blue-400" size={24}/>
        Proiecție 12 Luni
        <ChartInfo text="Proiectează averea pentru următoarele 12 luni folosind DOAR datele tale istorice, fără parametri de configurat. Pentru fiecare lună viitoare aplică creșterea medie observată istoric în acea lună calendaristică (ex: media lunilor august din anii anteriori prezice augustul viitor). Linia albastră = proiecție sezonieră; Linia galbenă punctată = traiectorie liniară la media istorică lunară; Banda albastră = intervalul de ±1 deviație standard. Intrarea unică de 37k din iunie 2026 este exclusă din trend (nu se va repeta)." />
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Creștere medie/lună</p>
          <p className="text-white font-bold">{formatEUR(overallAvgMonthly)}</p>
          <p className="text-slate-600 text-[9px]">istorică, fără intrări unice</p>
        </div>
        <div>
          <p className="text-slate-400">Proiecție la 12 luni</p>
          <p className="text-blue-400 font-bold">{formatEUR(endProjectedValue)}</p>
        </div>
        <div>
          <p className="text-slate-400">Câștig proiectat</p>
          <p className="text-emerald-400 font-bold">+{formatEUR(endProjectedValue - currentWealth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Chart */}
        <div>
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
                labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: any, name: string) => {
                  if (name === 'netWorth') return [formatEUR(value), 'Valoare'];
                  if (name === 'linearTrajectory') return [formatEUR(value), 'Traiectorie liniară'];
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
              />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
              <Line
                type="monotone"
                dataKey="linearTrajectory"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
                name="linearTrajectory"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-blue-500"></span>Proiecție sezonieră</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-amber-400"></span>Traiectorie istorică liniară</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-blue-500/20 rounded"></span>Bandă ±1σ</span>
          </div>
        </div>

        {/* Monthly Projections Table */}
        <div>
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
      </div>

      <p className="text-[10px] text-slate-600 mt-4">
        Proiecție bazată exclusiv pe istoricul tău (media sezonieră lunară). Nu conține parametri de configurat — se
        actualizează automat pe măsură ce adaugi date noi.
      </p>
    </div>
  );
};

export default ProjectionChart;
