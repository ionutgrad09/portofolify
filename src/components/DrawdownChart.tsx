import React from 'react';
import { Activity } from 'lucide-react';
import {
  Bar, CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const DrawdownChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  let ath = 0;
  const chartData = sorted.map((entry, idx) => {
    ath = Math.max(ath, entry.netWorth);
    // drawdownPct: how far below ATH — always ≤ 0
    const drawdownPct = ath > 0 ? ((entry.netWorth - ath) / ath) * 100 : 0;
    // changePct: week-over-week % change — positive = gained, negative = lost
    const changePct = idx > 0 && sorted[idx - 1].netWorth > 0
      ? ((entry.netWorth - sorted[idx - 1].netWorth) / sorted[idx - 1].netWorth) * 100
      : 0;
    return { date: entry.date, changePct, drawdownPct, ath };
  });

  const maxDrawdown = Math.min(...chartData.map(d => d.drawdownPct));
  const currentDrawdown = chartData[chartData.length - 1].drawdownPct;
  const currentATH = chartData[chartData.length - 1].ath;

  const drawdownColor =
    currentDrawdown < -10 ? 'text-red-400' :
    currentDrawdown < -3  ? 'text-orange-400' :
                            'text-emerald-400';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="text-blue-400" size={24}/>
        Variație Săptămânală & Drawdown
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Drawdown Curent</p>
          <p className={`font-bold ${drawdownColor}`}>{currentDrawdown.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-400">Max Drawdown</p>
          <p className="text-red-400 font-bold">{maxDrawdown.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-400">ATH</p>
          <p className="text-blue-400 font-bold">{formatEUR(currentATH)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> Creștere săpt.</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-500"></span> Scădere săpt.</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 border-t-2 border-dashed border-orange-400"></span> Drawdown ATH</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{top: 5, right: 10, left: 0, bottom: 60}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{fontSize: 9, fill: '#94a3b8'}}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{fill: '#94a3b8', fontSize: 11}}
            tickFormatter={(val: number) => `${val.toFixed(1)}%`}
          />
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            labelStyle={{color: '#94a3b8', fontSize: 11, marginBottom: 4}}
            itemStyle={{color: '#e2e8f0', fontSize: 12}}
            cursor={{fill: 'rgba(148,163,184,0.08)'}}
            formatter={(value: number, name: string) => [
              `${(value as number).toFixed(2)}%`,
              name === 'changePct' ? 'Variație săpt.' : 'Drawdown ATH'
            ]}
            labelFormatter={(label) => {
              const entry = chartData.find(d => d.date === label);
              return entry ? `${label}  |  ATH: ${formatEUR(entry.ath)}` : label;
            }}
          />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1}/>
          <Bar dataKey="changePct" barSize={6}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.changePct >= 0 ? '#22c55e' : '#ef4444'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="drawdownPct"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DrawdownChart;
