import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { CashSplitData } from '../types';

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface Props {
  data: CashSplitData[];
  totalCashEUR: number;
}

const CashConcentrationChart: React.FC<Props> = ({ data, totalCashEUR }) => {
  if (!data || data.length === 0) return null;

  const sorted = [...data]
    .sort((a, b) => b.totalEur - a.totalEur)
    .map(item => ({
      name: item.sursa,
      value: item.totalEur,
      pct: totalCashEUR > 0 ? (item.totalEur / totalCashEUR) * 100 : 0,
    }));

  const maxPct = sorted[0]?.pct ?? 0;
  const isConcentrated = maxPct > 50;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
        <p className="text-white font-semibold mb-1">{label}</p>
        <p className="text-emerald-400 font-bold">{formatEUR(payload[0].payload.value)}</p>
        <p className="text-slate-400">{payload[0].payload.pct.toFixed(1)}% din total cash</p>
        {payload[0].payload.pct > 50 && (
          <p className="text-amber-400 text-xs mt-1">⚠ Concentrare ridicată</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className={isConcentrated ? 'text-amber-400' : 'text-emerald-400'} size={20} />
          Concentrare Risc Cash
        </h3>
        {isConcentrated && (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
            Risc concentrare
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        O sursă cu peste 50% din cash total reprezintă un risc de concentrare.
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#e2e8f0' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} domain={[0, 100]} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#e2e8f0' }} width={110} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={50} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: '50%', fill: '#f59e0b', fontSize: 10 }} />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="% din total">
            {sorted.map((entry, i) => (
              <Cell key={i} fill={entry.pct > 50 ? '#f59e0b' : entry.pct > 30 ? '#3b82f6' : '#22c55e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashConcentrationChart;
