import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MILESTONES = [25, 50, 100, 150, 200, 300, 500];

const CumulativeReturnChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const firstValue = sorted[0].netWorth;
  const chartData = sorted.map(entry => ({
    date: entry.date,
    returnPct: firstValue > 0 ? ((entry.netWorth - firstValue) / firstValue) * 100 : 0,
  }));

  const currentReturn = chartData[chartData.length - 1].returnPct;
  const maxReturn = Math.max(...chartData.map(d => d.returnPct));

  const startDate = parseDDMMYYYY(sorted[0].date);
  const endDate = parseDDMMYYYY(sorted[sorted.length - 1].date);
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const annualizedReturn = years > 0.1
    ? (Math.pow(1 + currentReturn / 100, 1 / years) - 1) * 100
    : currentReturn;

  const relevantMilestones = MILESTONES.filter(m => m < maxReturn * 1.15 && m > 0);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" size={24}/>
        Randament Cumulativ
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-1 text-xs">
        <div className="min-w-0">
          <p className="text-slate-400 truncate">Total</p>
          <p className={`font-bold ${currentReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {currentReturn >= 0 ? '+' : ''}{currentReturn.toFixed(2)}%
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-slate-400 truncate">CAGR</p>
          <p className={`font-bold ${annualizedReturn >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(2)}%/an
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-slate-400 truncate">Maxim</p>
          <p className="text-purple-400 font-bold">+{maxReturn.toFixed(2)}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{fontSize: 9, fill: '#94a3b8'}}
            angle={-45}
            textAnchor="end"
            height={55}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{fill: '#94a3b8', fontSize: 10}}
            tickFormatter={(val: number) => `${val.toFixed(0)}%`}
            width={42}
          />
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            labelStyle={{color: '#94a3b8', fontSize: 11, marginBottom: 4}}
            itemStyle={{color: '#e2e8f0'}}
            formatter={(value: number) => [`${(value as number).toFixed(2)}%`, 'Randament']}
          />
          {relevantMilestones.map(m => (
            <ReferenceLine
              key={m}
              y={m}
              stroke="#334155"
              strokeDasharray="4 2"
              label={{value: `+${m}%`, position: 'insideTopRight', fill: '#475569', fontSize: 9}}
            />
          ))}
          <Area
            type="monotone"
            dataKey="returnPct"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#cumulativeGradient)"
            name="Randament"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CumulativeReturnChart;
