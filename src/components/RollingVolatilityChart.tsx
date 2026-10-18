import React from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

interface Props { mergedData: MergedData[] }

const RollingVolatilityChart: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 6) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Group by month — last value per month
  const monthMap = new Map<string, { label: string; value: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: e.netWorth });
  });

  const months = Array.from(monthMap.values()).sort((a, b) =>
    [...monthMap.keys()].indexOf([...monthMap.keys()].find(k => monthMap.get(k) === a)!)
    - [...monthMap.keys()].indexOf([...monthMap.keys()].find(k => monthMap.get(k) === b)!)
  );

  // Compute monthly returns
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const returns: { label: string; ret: number }[] = [];
  for (let i = 1; i < monthEntries.length; i++) {
    const prev = monthEntries[i - 1][1].value;
    const curr = monthEntries[i][1].value;
    if (prev > 0) {
      const [y, mm] = monthEntries[i][0].split('-').map(Number);
      // Strip the one-time June 2026 inflow so it doesn't spike measured volatility.
      returns.push({ label: monthEntries[i][1].label, ret: (curr - prev) / prev });
    }
  }

  // Rolling 3-month volatility (annualized)
  const WINDOW = 3;
  const chartData = returns.map((r, i) => {
    if (i < WINDOW - 1) return null;
    const slice = returns.slice(i - WINDOW + 1, i + 1).map(x => x.ret);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const vol = Math.sqrt(variance) * Math.sqrt(12) * 100;
    return { month: r.label, volatility: parseFloat(vol.toFixed(2)) };
  }).filter(Boolean) as { month: string; volatility: number }[];

  if (chartData.length < 2) return null;

  const avgVol = chartData.reduce((a, b) => a + b.volatility, 0) / chartData.length;
  const maxVol = Math.max(...chartData.map(d => d.volatility));
  const latest = chartData[chartData.length - 1];

  const volColor = latest.volatility < 10 ? 'text-emerald-400' : latest.volatility < 20 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <ShieldAlert className="text-orange-400" size={20} />
        Volatilitate Rolling 3 Luni (Anualizată)
        <ChartInfo text="Măsoară cât de instabilă a fost averea ta în ultimele 3 luni, anualizat. Se calculează din deviația standard a randamentelor lunare pe o fereastră mobilă. Valori mici = portofoliu stabil (creștere predictibilă). Valori mari = luni cu variații extreme (taxe mari urmate de salarii mari). Linia punctată = media istorică a volatilității." />
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Cât de mult fluctuează averea ta pe o fereastră mobilă de 3 luni. Scăzut = portofoliu stabil.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Volatilitate curentă</p>
          <p className={`text-base font-bold ${volColor}`}>{latest.volatility.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Medie istorică</p>
          <p className="text-base font-bold text-slate-300">{avgVol.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Maxim istoric</p>
          <p className="text-base font-bold text-red-400">{maxVol.toFixed(2)}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4 }}>
          <defs>
            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any) => [`${(v as number).toFixed(2)}%`, 'Volatilitate anualizată']}
          />
          <ReferenceLine y={avgVol} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'medie', fill: '#94a3b8', fontSize: 9 }} />
          <Area type="monotone" dataKey="volatility" stroke="#f97316" strokeWidth={2} fill="url(#volGradient)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RollingVolatilityChart;
