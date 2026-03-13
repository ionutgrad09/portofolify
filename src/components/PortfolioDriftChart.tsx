import React from 'react';
import { Sliders } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { InvestmentData } from '../types';

const PortfolioDriftChart: React.FC<{ investmentData: InvestmentData[] }> = ({ investmentData }) => {
  const withAlloc = investmentData.filter(e => e.alocare > 0);
  if (withAlloc.length === 0) return null;

  const chartData = withAlloc
    .map(e => ({
      ticker: e.ticker || e.denumireEtf,
      target: e.alocare,
      actual: e.alocareActuala,
      drift: parseFloat((e.alocareActuala - e.alocare).toFixed(2)),
    }))
    .sort((a, b) => b.drift - a.drift);

  const maxDrift = Math.max(...chartData.map(d => Math.abs(d.drift)));
  const domain = Math.ceil(maxDrift * 1.3) || 5;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Sliders className="text-violet-400" size={24}/>
        Deviere de la Ținta de Alocare
      </h2>
      <p className="text-slate-400 text-xs mb-4">
        Pozitiv = supra-ponderat față de target &nbsp;|&nbsp; Negativ = sub-ponderat
      </p>

      <ResponsiveContainer width="100%" height={Math.max(180, withAlloc.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
          <XAxis
            type="number"
            domain={[-domain, domain]}
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
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
            formatter={(value: number, _name: string, props: any) => {
              const d = props.payload;
              return [`${value > 0 ? '+' : ''}${value}% (Target: ${d.target}% → Actual: ${d.actual}%)`, 'Deviere'];
            }}
          />
          <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5}/>
          <Bar dataKey="drift" name="Deviere" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.drift > 2 ? '#ef4444' : entry.drift < -2 ? '#3b82f6' : '#22c55e'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>
          Supra-ponderat (&gt;+2%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>
          In target (±2%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
          Sub-ponderat (&lt;-2%)
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-2 px-2">ETF</th>
              <th className="text-right py-2 px-2">Target</th>
              <th className="text-right py-2 px-2">Actual</th>
              <th className="text-right py-2 px-2">Deviere</th>
              <th className="text-left py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {chartData.map((e, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-1.5 px-2 font-medium text-white">{e.ticker}</td>
                <td className="text-right py-1.5 px-2 text-slate-400">{e.target}%</td>
                <td className="text-right py-1.5 px-2">{e.actual}%</td>
                <td className={`text-right py-1.5 px-2 font-bold ${e.drift > 0 ? 'text-red-400' : e.drift < 0 ? 'text-blue-400' : 'text-green-400'}`}>
                  {e.drift > 0 ? '+' : ''}{e.drift}%
                </td>
                <td className="py-1.5 px-2">
                  {Math.abs(e.drift) <= 2 ? (
                    <span className="text-green-400">OK</span>
                  ) : e.drift > 0 ? (
                    <span className="text-red-400">Vinde</span>
                  ) : (
                    <span className="text-blue-400">Cumpara</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioDriftChart;
