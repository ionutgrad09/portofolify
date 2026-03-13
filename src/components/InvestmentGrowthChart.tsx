import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { InvestmentData } from '../types';

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const InvestmentGrowthChart: React.FC<{ investmentData: InvestmentData[] }> = ({ investmentData }) => {
  if (!investmentData || investmentData.length === 0) return null;

  const chartData = [...investmentData]
    .filter(e => e.sumaInvestita > 0 || e.valoareActuala > 0)
    .sort((a, b) => b.valoareActuala - a.valoareActuala)
    .map(e => ({
      ticker: e.ticker || e.denumireEtf,
      costBasis: e.sumaInvestita,
      currentValue: e.valoareActuala,
      profit: e.profitEur,
      profitPct: e.profitPct,
      isProfit: e.profitEur >= 0,
    }));

  const totalCost = chartData.reduce((s, e) => s + e.costBasis, 0);
  const totalValue = chartData.reduce((s, e) => s + e.currentValue, 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPct = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BarChart2 className="text-purple-400" size={24}/>
        Creștere ETF: Cost vs Valoare Actuală
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Total Investit</p>
          <p className="text-slate-300 font-bold">{formatEUR(totalCost)}</p>
        </div>
        <div>
          <p className="text-slate-400">Valoare Actuală</p>
          <p className="text-blue-400 font-bold">{formatEUR(totalValue)}</p>
        </div>
        <div>
          <p className="text-slate-400">Profit Total</p>
          <p className={`font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatEUR(totalProfit)} ({totalProfit >= 0 ? '+' : ''}{totalProfitPct}%)
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
          <XAxis
            type="number"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="ticker"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={85}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string, props: any) => {
              const d = props.payload;
              if (name === 'costBasis') return [formatEUR(value), 'Investit'];
              const sign = d.profitPct >= 0 ? '+' : '';
              return [`${formatEUR(value)} (${sign}${d.profitPct?.toFixed(2)}%)`, 'Valoare Actuală'];
            }}
          />
          <Bar dataKey="costBasis" name="costBasis" fill="#64748b" radius={[0, 2, 2, 0]}/>
          <Bar dataKey="currentValue" name="currentValue" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.isProfit ? '#10b981' : '#ef4444'} fillOpacity={0.85}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-2 px-2">ETF</th>
              <th className="text-right py-2 px-2">Investit</th>
              <th className="text-right py-2 px-2">Valoare</th>
              <th className="text-right py-2 px-2">Profit</th>
              <th className="text-right py-2 px-2">%</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {chartData.map((e, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-1.5 px-2 font-medium text-white">{e.ticker}</td>
                <td className="text-right py-1.5 px-2 text-slate-400">{formatEUR(e.costBasis)}</td>
                <td className="text-right py-1.5 px-2 text-blue-400">{formatEUR(e.currentValue)}</td>
                <td className={`text-right py-1.5 px-2 font-bold ${e.isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {e.profit >= 0 ? '+' : ''}{formatEUR(e.profit)}
                </td>
                <td className={`text-right py-1.5 px-2 font-bold ${e.isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {e.profitPct >= 0 ? '+' : ''}{e.profitPct?.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentGrowthChart;
