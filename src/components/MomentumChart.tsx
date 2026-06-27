import React from 'react';
import { Zap } from 'lucide-react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const MomentumChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 5) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Compute week-over-week normalized deltas (€/week)
  const deltas: { date: string; delta: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = parseDDMMYYYY(sorted[i - 1].date);
    const currDate = parseDDMMYYYY(sorted[i].date);
    const days = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    if (days <= 0) continue;
    const delta = ((sorted[i].netWorth - sorted[i - 1].netWorth) / days) * 7;
    deltas.push({ date: sorted[i].date, delta });
  }

  if (deltas.length < 4) return null;

  // Build rolling averages
  const rolling = (arr: number[], window: number): (number | null)[] =>
    arr.map((_, i) => {
      if (i < window - 1) return null;
      const slice = arr.slice(i - window + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / window;
    });

  const deltaValues = deltas.map(d => d.delta);
  const avg4 = rolling(deltaValues, 4);
  const avg12 = rolling(deltaValues, 12);

  const chartData = deltas.map((d, i) => ({
    date: d.date,
    weekly: d.delta,
    avg4: avg4[i],
    avg12: avg12[i],
  }));

  const latest = chartData[chartData.length - 1];
  const overallAvg = deltaValues.reduce((a, b) => a + b, 0) / deltaValues.length;

  const isMomentumPositive = (latest.avg4 ?? 0) > (latest.avg12 ?? 0);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Zap className="text-yellow-400" size={24}/>
        Momentum Săptămânal
      </h2>

      {/* Explanation */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-4 space-y-2 text-xs text-slate-400">
        <p>
          <span className="text-white font-semibold">Ce arată acest grafic?</span>{' '}
          Viteza cu care crește sau scade averea ta, săptămână de săptămână.
        </p>
        <p>
          <span className="text-amber-400 font-semibold">Linia galbenă (4 săpt)</span>{' '}
          — media ultimelor 4 săptămâni. Reacționează rapid la schimbări recente.
        </p>
        <p>
          <span className="text-blue-400 font-semibold">Linia albastră (12 săpt)</span>{' '}
          — media ultimelor 12 săptămâni. Arată trendul pe termen mediu, mai puțin influențată de fluctuații.
        </p>
        <p>
          <span className="text-white font-semibold">Cum interpretezi?</span>{' '}
          Când galbenul este <span className="text-emerald-400">deasupra</span> albastrului → accelerezi, crești mai repede ca de obicei.{' '}
          Când galbenul este <span className="text-red-400">sub</span> albastru → încetinești sau pierzi.
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Media Istorică/săpt</p>
          <p className="text-white font-bold">{formatEUR(overallAvg)}</p>
        </div>
        <div>
          <p className="text-slate-400">Medie 4 săpt (recent)</p>
          <p className="text-amber-400 font-bold">{formatEUR(latest.avg4 ?? 0)}</p>
        </div>
        <div>
          <p className="text-slate-400">Medie 12 săpt</p>
          <p className={`font-bold ${isMomentumPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatEUR(latest.avg12 ?? 0)}
            <span className="ml-1">{isMomentumPositive ? '↑' : '↓'}</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(val: number) => `€${(val / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                weekly: 'Variație Săptămânală',
                avg4: 'Medie 4 săpt',
                avg12: 'Medie 12 săpt',
              };
              return [formatEUR(value), labels[name] ?? name];
            }}
          />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1}/>
          <ReferenceLine
            y={overallAvg}
            stroke="#475569"
            strokeDasharray="4 2"
            label={{ value: 'Medie hist.', position: 'insideTopRight', fill: '#475569', fontSize: 9 }}
          />
          <Line
            type="monotone"
            dataKey="weekly"
            stroke="#334155"
            strokeWidth={1}
            dot={false}
            name="weekly"
          />
          <Line
            type="monotone"
            dataKey="avg4"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            connectNulls
            name="avg4"
          />
          <Line
            type="monotone"
            dataKey="avg12"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            connectNulls
            name="avg12"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 text-xs text-slate-400 flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-amber-400"></span>
          Medie 4 săpt (scurtă)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-blue-400"></span>
          Medie 12 săpt (lungă)
        </span>
        <span className="ml-auto font-medium" style={{ color: isMomentumPositive ? '#34d399' : '#f87171' }}>
          {isMomentumPositive ? 'Momentum pozitiv (4s > 12s)' : 'Momentum negativ (4s < 12s)'}
        </span>
      </div>
    </div>
  );
};

export default MomentumChart;
