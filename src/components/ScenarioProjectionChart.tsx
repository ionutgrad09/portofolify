import React from 'react';
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

const MONTHS_IN_YEAR = 12;
const PROJECTION_YEARS = 5;
const TAX_CHANGE_YEAR = 2026;
const TAX_FACTOR = 1 - 0.12;

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const ScenarioProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;

  // Compute monthly deltas (normalize by days elapsed)
  const monthlyDeltas: { delta: number; year: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = parseDDMMYYYY(sorted[i - 1].date);
    const currDate = parseDDMMYYYY(sorted[i].date);
    const days = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    const normalizedDelta = ((sorted[i].netWorth - sorted[i - 1].netWorth) / days) * 30.44;
    monthlyDeltas.push({ delta: normalizedDelta, year: currDate.getFullYear() });
  }

  if (monthlyDeltas.length === 0) return null;

  const preTaxDeltas = monthlyDeltas.filter(d => d.year < TAX_CHANGE_YEAR).map(d => d.delta);
  const postTaxDeltas = monthlyDeltas.filter(d => d.year >= TAX_CHANGE_YEAR).map(d => d.delta);

  const overallPreTaxAvg = preTaxDeltas.length > 0 ? avg(preTaxDeltas) : avg(monthlyDeltas.map(d => d.delta));

  // Base monthly avg: if 2026+ data exists use it, otherwise scale pre-tax
  const baseMonthlyAvg = postTaxDeltas.length > 0
    ? avg(postTaxDeltas)
    : overallPreTaxAvg * TAX_FACTOR;

  const optimisticMonthly = baseMonthlyAvg * 1.25;
  const pessimisticMonthly = baseMonthlyAvg * 0.75;

  // Build month-by-month projection
  const MONTHS = PROJECTION_YEARS * MONTHS_IN_YEAR;
  const startDate = parseDDMMYYYY(lastEntry.date);

  const chartData: Array<{
    label: string;
    base: number;
    optimistic: number;
    pessimistic: number;
  }> = [];

  let base = currentWealth;
  let optimistic = currentWealth;
  let pessimistic = currentWealth;

  const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

  for (let m = 1; m <= MONTHS; m++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    const label = m % 6 === 0 ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : '';
    base += baseMonthlyAvg;
    optimistic += optimisticMonthly;
    pessimistic += pessimisticMonthly;
    chartData.push({ label, base, optimistic, pessimistic });
  }

  // Annotated labels at 12/24/36/48/60 months
  const labeledData = chartData.map((d, i) => {
    const m = i + 1;
    if ([12, 24, 36, 48, 60].includes(m)) {
      const yr = new Date(startDate);
      yr.setMonth(yr.getMonth() + m);
      return { ...d, label: `${MONTH_NAMES[yr.getMonth()]} ${yr.getFullYear()}` };
    }
    return d;
  });

  const relevantGoals = GOALS.filter(g => g.value > currentWealth && g.value < chartData[chartData.length - 1].optimistic * 1.1);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="text-indigo-400" size={24}/>
        Proiecție Scenarii 5 Ani
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Pesimist (-25%)</p>
          <p className="text-red-400 font-bold">{formatEUR(pessimisticMonthly)}/lună</p>
        </div>
        <div>
          <p className="text-slate-400">Baza</p>
          <p className="text-blue-400 font-bold">{formatEUR(baseMonthlyAvg)}/lună</p>
        </div>
        <div>
          <p className="text-slate-400">Optimist (+25%)</p>
          <p className="text-emerald-400 font-bold">{formatEUR(optimisticMonthly)}/lună</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={labeledData}>
          <defs>
            <linearGradient id="scenarioBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="scenarioOptimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="scenarioPessimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
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
              const labels: Record<string, string> = { base: 'Baza', optimistic: 'Optimist', pessimistic: 'Pesimist' };
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
          <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1.5} fill="url(#scenarioPessimistic)" strokeDasharray="4 2" name="pessimistic"/>
          <Area type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} fill="url(#scenarioBase)" name="base"/>
          <Area type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={1.5} fill="url(#scenarioOptimistic)" strokeDasharray="4 2" name="optimistic"/>
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        {[
          { label: 'La 1 an', months: 12 },
          { label: 'La 3 ani', months: 36 },
          { label: 'La 5 ani', months: 60 },
        ].map(({ label, months }) => {
          const point = chartData[months - 1];
          return (
            <div key={months} className="bg-slate-800/50 rounded-lg p-2">
              <p className="text-slate-400 mb-1">{label}</p>
              <p className="text-emerald-400">{formatEUR(point.optimistic)}</p>
              <p className="text-blue-400">{formatEUR(point.base)}</p>
              <p className="text-red-400">{formatEUR(point.pessimistic)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioProjectionChart;
