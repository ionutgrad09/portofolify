import {MergedData} from "../types";
import {Target} from "lucide-react";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {formatEUR} from "../utils/utils";
import React from "react";

const ProjectionChart: React.FC<{mergedData: MergedData[]}> = ({mergedData}) => {
  // Calculate growth rate from last 6 months
  const recentData = mergedData.slice(-6);
  const growthRates = recentData.slice(1).map((entry, idx) => {
    const prev = recentData[idx].netWorth;
    return prev > 0 ? ((entry.netWorth - prev) / prev) * 100 : 0;
  });
  const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  // Project 6 months forward
  const lastEntry = mergedData[mergedData.length - 1];
  const projectionData = [...mergedData];

  for (let i = 1; i <= 6; i++) {
    const lastValue = projectionData[projectionData.length - 1].netWorth;
    const projectedValue = lastValue * (1 + avgGrowthRate / 100);
    const upperBound = projectedValue * 1.1;
    const lowerBound = projectedValue * 0.9;

    projectionData.push({
      ...lastEntry,
      date: `Prognoza +${i}`,
      netWorth: projectedValue,
      upperBound,
      lowerBound,
      isProjection: true
    } as any);
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="text-blue-400" size={24}/>
        Proiecție 6 Luni (Bazat pe {avgGrowthRate?.toFixed(2)}% creștere medie)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={projectionData}>
          <defs>
            <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={80}/>
          <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000)?.toFixed(0)}k`}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            formatter={(value: any) => [formatEUR(value), 'Valoare']}
          />
          <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
          <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} fill="url(#colorProjection)" strokeDasharray={(entry: any) => entry.isProjection ? "5 5" : ""}/>
          <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectionChart;