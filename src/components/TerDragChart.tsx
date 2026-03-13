import React from 'react';
import { Percent } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { InvestmentData } from '../types';

const formatEUR = (value: number): string =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const TerDragChart: React.FC<{ investmentData: InvestmentData[] }> = ({ investmentData }) => {
  const withTer = investmentData.filter(e => e.ter > 0 && e.valoareActuala > 0);
  if (withTer.length === 0) return null;

  const totalValue = withTer.reduce((s, e) => s + e.valoareActuala, 0);

  const chartData = withTer
    .map(e => ({
      ticker: e.ticker || e.denumireEtf,
      annualCost: (e.ter / 100) * e.valoareActuala,
      ter: e.ter,
      valoare: e.valoareActuala,
      cost5yr: (e.ter / 100) * e.valoareActuala * 5,
      cost10yr: (e.ter / 100) * e.valoareActuala * 10,
    }))
    .sort((a, b) => b.annualCost - a.annualCost);

  const totalAnnualCost = chartData.reduce((s, e) => s + e.annualCost, 0);
  const weightedAvgTer = totalValue > 0
    ? withTer.reduce((s, e) => s + (e.ter * e.valoareActuala), 0) / totalValue
    : 0;
  const total5yr = totalAnnualCost * 5;
  const total10yr = totalAnnualCost * 10;

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#3b82f6'];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Percent className="text-orange-400" size={24}/>
        Cost Anual TER per ETF
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">TER Mediu Ponderat</p>
          <p className="text-orange-400 font-bold">{weightedAvgTer.toFixed(3)}%</p>
        </div>
        <div>
          <p className="text-slate-400">Cost Anual Total</p>
          <p className="text-red-400 font-bold">{formatEUR(totalAnnualCost)}</p>
        </div>
        <div>
          <p className="text-slate-400">Cost 10 Ani (est.)</p>
          <p className="text-red-500 font-bold">{formatEUR(total10yr)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
          <XAxis
            type="number"
            stroke="#94a3b8"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickFormatter={(val: number) => `€${val.toFixed(0)}`}
          />
          <YAxis
            type="category"
            dataKey="ticker"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={80}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string, props: any) => {
              const d = props.payload;
              return [
                `${formatEUR(value)} (TER: ${d.ter}% × ${formatEUR(d.valoare)})`,
                'Cost Anual',
              ];
            }}
          />
          <Bar dataKey="annualCost" name="Cost Anual" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-slate-400 mb-1">Cost Proiectat 5 Ani</p>
          <p className="text-orange-400 font-bold text-base">{formatEUR(total5yr)}</p>
          <p className="text-slate-500">la valorile actuale</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-slate-400 mb-1">Cost Proiectat 10 Ani</p>
          <p className="text-red-400 font-bold text-base">{formatEUR(total10yr)}</p>
          <p className="text-slate-500">la valorile actuale</p>
        </div>
      </div>
    </div>
  );
};

export default TerDragChart;
