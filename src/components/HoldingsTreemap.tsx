import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { InvestmentData } from '../types';
import ChartInfo from './ChartInfo';

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface Props { investmentData: InvestmentData[] }

// Green for gains, red for losses; intensity grows with the size of the % move.
const colorFor = (pct: number): string => {
  const a = Math.abs(pct);
  if (pct >= 0) {
    if (a >= 25) return '#065f46';
    if (a >= 15) return '#047857';
    if (a >= 7) return '#059669';
    if (a >= 2) return '#10b981';
    return '#34d399';
  }
  if (a >= 25) return '#7f1d1d';
  if (a >= 15) return '#991b1b';
  if (a >= 7) return '#dc2626';
  if (a >= 2) return '#ef4444';
  return '#f87171';
};

interface CellProps {
  x?: number; y?: number; width?: number; height?: number;
  ticker?: string; profitPct?: number; value?: number;
}

const HoldingCell: React.FC<CellProps> = ({ x = 0, y = 0, width = 0, height = 0, ticker, profitPct = 0, value = 0 }) => {
  const showLabel = width > 54 && height > 34;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} ry={4}
        fill={colorFor(profitPct)} stroke="#0f172a" strokeWidth={2} />
      {showLabel && (
        <>
          <text x={x + 8} y={y + 20} fill="#fff" fontSize={13} fontWeight={700}>{ticker}</text>
          <text x={x + 8} y={y + 37} fill="#e2e8f0" fontSize={11}>{formatEUR(value)}</text>
          {height > 52 && (
            <text x={x + 8} y={y + 53} fill="#f1f5f9" fontSize={11} fontWeight={600}>
              {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
};

const HoldingsTreemap: React.FC<Props> = ({ investmentData }) => {
  if (!investmentData || investmentData.length === 0) return null;

  const data = investmentData
    .filter(h => h.valoareActuala > 0)
    .map(h => ({
      name: h.ticker,
      ticker: h.ticker,
      fullName: h.denumireEtf,
      size: h.valoareActuala,
      value: h.valoareActuala,
      profitPct: h.profitPct,
      profitEur: h.profitEur,
    }))
    .sort((a, b) => b.size - a.size);

  if (data.length === 0) return null;

  const totalValue = data.reduce((s, d) => s + d.size, 0);
  const totalProfit = data.reduce((s, d) => s + d.profitEur, 0);
  const best = [...data].sort((a, b) => b.profitPct - a.profitPct)[0];
  const worst = [...data].sort((a, b) => a.profitPct - b.profitPct)[0];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <LayoutGrid className="text-violet-400" size={24} />
        Hartă Portofoliu (mărime = valoare, culoare = profit)
        <ChartInfo text="Fiecare dreptunghi este un ETF din portofoliu. Mărimea = cât cântărește în valoarea totală (dreptunghiuri mari = poziții concentrate). Culoarea = profitul: verde = pe plus, roșu = pe minus, cu cât mai intens cu atât mișcarea e mai mare. Vezi dintr-o privire ce dețineri îți duc portofoliul și dacă ești prea concentrat pe o poziție." />
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Concentrarea portofoliului și ce dețineri sunt pe profit sau pe pierdere.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Valoare totală</p>
          <p className="text-base font-bold text-white">{formatEUR(totalValue)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Profit total</p>
          <p className={`text-base font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalProfit >= 0 ? '+' : ''}{formatEUR(totalProfit)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cel mai profitabil</p>
          <p className="text-base font-bold text-emerald-400">{best.ticker}</p>
          <p className="text-[10px] text-emerald-400">+{best.profitPct.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Cel mai slab</p>
          <p className={`text-base font-bold ${worst.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{worst.ticker}</p>
          <p className={`text-[10px] ${worst.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{worst.profitPct >= 0 ? '+' : ''}{worst.profitPct.toFixed(1)}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <Treemap data={data} dataKey="size" stroke="#0f172a" isAnimationActive={false} content={<HoldingCell />}>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: any) => [formatEUR(v as number), 'Valoare']}
            labelFormatter={(_l: any, payload: any) => {
              const p = payload?.[0]?.payload;
              return p ? `${p.fullName} (${p.ticker}) · ${p.profitPct >= 0 ? '+' : ''}${p.profitPct.toFixed(1)}%` : '';
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default HoldingsTreemap;
