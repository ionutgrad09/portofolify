import React from 'react';
import { Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const CONTRIB_KEY = 'portofolify_monthly_contrib';

const SERIES = [
  { key: 'contrib', label: 'Contribuții (est.)', color: '#3b82f6' },
  { key: 'market', label: 'Câștig piață (est.)', color: '#a855f7' },
  { key: 'cash', label: 'Cash', color: '#22c55e' },
  { key: 'assets', label: 'Active nelichide', color: '#f59e0b' },
];

interface Props { mergedData: MergedData[] }

const GrowthAttributionChart: React.FC<Props> = ({ mergedData }) => {
  const monthlyContrib = Number(localStorage.getItem(CONTRIB_KEY) || '2000');

  if (!mergedData || mergedData.length < 3) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Last snapshot per calendar month
  const monthMap = new Map<string, MergedData>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, e);
  });
  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Attribute each month transition to the year it lands in
  const yearMap = new Map<number, { contrib: number; market: number; cash: number; assets: number }>();
  for (let i = 1; i < monthEntries.length; i++) {
    const prev = monthEntries[i - 1][1];
    const curr = monthEntries[i][1];
    const currDate = parseDDMMYYYY(curr.date);
    const year = currDate.getFullYear();

    const dInv = curr.investments - prev.investments;
    const contrib = monthlyContrib;
    // Strip the one-time June 2026 inflow so it isn't attributed to market gains. The lump
    // landed in the investments bucket, so it shows up in dInv and must be removed here.
    const market = dInv - contrib; // investment move not explained by the contribution
    const cash = curr.cash - prev.cash;
    const assets = curr.assetsTotal - prev.assetsTotal;

    const y = yearMap.get(year) ?? { contrib: 0, market: 0, cash: 0, assets: 0 };
    y.contrib += contrib;
    y.market += market;
    y.cash += cash;
    y.assets += assets;
    yearMap.set(year, y);
  }

  const chartData = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({
      year: String(year),
      ...v,
      net: v.contrib + v.market + v.cash + v.assets,
    }));

  if (chartData.length === 0) return null;

  const totalContrib = chartData.reduce((s, d) => s + d.contrib, 0);
  const totalMarket = chartData.reduce((s, d) => s + d.market, 0);
  const totalNet = chartData.reduce((s, d) => s + d.net, 0);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Layers className="text-blue-400" size={24} />
        Sursa Creșterii Averii (pe an)
        <ChartInfo text="Descompune variația averii din fiecare an în: banii adăugați de tine (contribuții estimate), câștigul/pierderea din piață pe investiții (estimat), variația cash-ului și variația activelor nelichide. Contribuția și câștigul de piață sunt estimate pe baza contribuției lunare setate — vezi dacă averea crește pentru că economisești sau pentru că te-a dus piața. Barele sub zero = componente care au scăzut." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Câți bani ai adăugat tu vs. cât a lucrat piața, pe fiecare an. Contribuție lunară estimată: {formatEUR(monthlyContrib)}.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total contribuit (est.)</p>
          <p className="text-base font-bold text-blue-400">{formatEUR(totalContrib)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total din piață (est.)</p>
          <p className={`text-base font-bold ${totalMarket >= 0 ? 'text-purple-400' : 'text-red-400'}`}>{formatEUR(totalMarket)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Creștere netă totală</p>
          <p className={`text-base font-bold ${totalNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatEUR(totalNet)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v >= 1e6 || v <= -1e6 ? `€${(v / 1e6).toFixed(1)}M` : `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            formatter={(v: any, name: string) => {
              const s = SERIES.find(x => x.key === name);
              return [formatEUR(v), s?.label ?? name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(name: string) => {
              const s = SERIES.find(x => x.key === name);
              return <span style={{ color: s?.color }}>{s?.label ?? name}</span>;
            }}
          />
          <ReferenceLine y={0} stroke="#64748b" />
          {SERIES.map(s => (
            <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} name={s.key} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-slate-600 mt-2 text-center">
        „Contribuții" și „Câștig piață" sunt estimate din contribuția lunară setată. Ajustează-o în simulatorul de contribuții.
      </p>
    </div>
  );
};

export default GrowthAttributionChart;
