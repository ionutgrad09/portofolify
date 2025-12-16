

// ============================================
// 2. CashFlowWaterfall.tsx
// ============================================
import React from 'react';
import { TrendingUp as Waterfall } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

interface CashFlowWaterfallProps {
  mergedData: MergedData[];
}

const CashFlowWaterfall: React.FC<CashFlowWaterfallProps> = ({ mergedData }) => {
  if (mergedData.length < 2) return null;

  const firstEntry = mergedData[0];
  const lastEntry = mergedData[mergedData.length - 1];

  // Calculate total profit/loss from gainLoss
  const totalGainLoss = mergedData.reduce((sum, entry) => sum + entry.gainLoss, 0);

  // Calculate contributions (growth that's not from gains/losses)
  const totalGrowth = lastEntry.netWorth - firstEntry.netWorth;
  const estimatedContributions = totalGrowth - totalGainLoss;

  const waterfallData = [
    {
      name: 'Start',
      value: firstEntry.netWorth,
      total: firstEntry.netWorth,
      color: '#3b82f6',
      isTotal: true
    },
    {
      name: 'Contribuții',
      value: estimatedContributions,
      total: firstEntry.netWorth + estimatedContributions,
      color: estimatedContributions >= 0 ? '#22c55e' : '#ef4444',
      isTotal: false
    },
    {
      name: 'Profit/Pierdere',
      value: totalGainLoss,
      total: firstEntry.netWorth + estimatedContributions + totalGainLoss,
      color: totalGainLoss >= 0 ? '#10b981' : '#dc2626',
      isTotal: false
    },
    {
      name: 'Final',
      value: lastEntry.netWorth,
      total: lastEntry.netWorth,
      color: '#8b5cf6',
      isTotal: true
    }
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Waterfall className="text-blue-400" size={24}/>
        Cash Flow Waterfall
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(val: number) => formatEUR(val)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            formatter={(value: any, name: string, props: any) => {
              return [formatEUR(props.payload.value), props.payload.isTotal ? 'Total' : 'Modificare'];
            }}
            labelFormatter={(label: string) => label}
          />
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <p className="text-slate-400 text-xs mb-1">Start</p>
          <p className="text-blue-400 font-bold">{formatEUR(firstEntry.netWorth)}</p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <p className="text-slate-400 text-xs mb-1">Contribuții</p>
          <p className={`font-bold ${estimatedContributions >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatEUR(estimatedContributions)}
          </p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <p className="text-slate-400 text-xs mb-1">Profit/Pierdere</p>
          <p className={`font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatEUR(totalGainLoss)}
          </p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <p className="text-slate-400 text-xs mb-1">Final</p>
          <p className="text-purple-400 font-bold">{formatEUR(lastEntry.netWorth)}</p>
        </div>
      </div>
    </div>
  );
};

export default CashFlowWaterfall;