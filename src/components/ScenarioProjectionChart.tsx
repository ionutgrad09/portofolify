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

const PROJECTION_YEARS = 5;
const TAX_FACTOR = 1 - 0.12; // 2026+ tax increase
const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const ScenarioProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;

  // End-to-end monthly average: totalGrowth / totalMonths (matches FinancialGoalsProgress method)
  const totalMs = parseDDMMYYYY(lastEntry.date).getTime() - parseDDMMYYYY(sorted[0].date).getTime();
  const totalMonths = totalMs / (1000 * 60 * 60 * 24 * 30.44);
  if (totalMonths <= 0) return null;

  const historicalMonthlyAvg = (currentWealth - sorted[0].netWorth) / totalMonths;

  // Base: historical average adjusted for 2026 tax increase
  const baseMonthlyAvg = historicalMonthlyAvg * TAX_FACTOR;
  const optimisticMonthly = baseMonthlyAvg * 1.25;
  const pessimisticMonthly = baseMonthlyAvg * 0.75;

  const MONTHS = PROJECTION_YEARS * 12;
  const startDate = parseDDMMYYYY(lastEntry.date);

  const chartData: Array<{ label: string; base: number; optimistic: number; pessimistic: number }> = [];
  let base = currentWealth;
  let optimistic = currentWealth;
  let pessimistic = currentWealth;

  for (let m = 1; m <= MONTHS; m++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    const label = [12, 24, 36, 48, 60].includes(m)
      ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      : '';
    base += baseMonthlyAvg;
    optimistic += optimisticMonthly;
    pessimistic += pessimisticMonthly;
    chartData.push({ label, base, optimistic, pessimistic });
  }

  const relevantGoals = GOALS.filter(
    g => g.value > currentWealth && g.value < chartData[chartData.length - 1].optimistic * 1.1
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="text-indigo-400" size={24}/>
        Proiecție Scenarii 5 Ani
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Medie Istorică/lună</p>
          <p className="text-slate-300 font-bold">{formatEUR(historicalMonthlyAvg)}</p>
        </div>
        <div>
          <p className="text-slate-400">Baza (ajustat taxe 2026)</p>
          <p className="text-blue-400 font-bold">{formatEUR(baseMonthlyAvg)}/lună</p>
        </div>
        <div>
          <p className="text-slate-400">Interval Scenarii</p>
          <p className="text-slate-300 font-bold text-[10px]">
            {formatEUR(pessimisticMonthly)} – {formatEUR(optimisticMonthly)}
          </p>
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
            tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
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
              label={{ value: g.label, position: 'insideTopRight', fill: '#64748b', fontSize: 9 }}
            />
          ))}
          <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1.5} fill="url(#scenarioPes)" strokeDasharray="4 2" name="pessimistic"/>
          <Area type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} fill="url(#scenarioBase)" name="base"/>
          <Area type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={1.5} fill="url(#scenarioOpt)" strokeDasharray="4 2" name="optimistic"/>
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {[{ label: 'La 1 an', m: 12 }, { label: 'La 3 ani', m: 36 }, { label: 'La 5 ani', m: 60 }].map(({ label, m }) => {
          const p = chartData[m - 1];
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

      <p className="text-[10px] text-amber-400/70 mt-3 flex items-center gap-1">
        <span>⚠</span>
        Baza calculată din media istorică lunară, redusă cu 12% pentru taxele 2026+.
      </p>
    </div>
  );
};

export default ScenarioProjectionChart;
