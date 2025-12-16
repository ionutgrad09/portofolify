import {MergedData} from "../types";
import {Zap} from "lucide-react";
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import React from "react";

const VolatilityChart: React.FC<{ mergedData: MergedData[] }> = ({mergedData}) => {
  const volatilityData = mergedData.map((entry, idx) => {
    if (idx === 0) return {date: entry.date, volatility: 0, change: 0};
    const prev = mergedData[idx - 1].netWorth;
    const change = prev > 0 ? ((entry.netWorth - prev) / prev) * 100 : 0;
    return {
      date: entry.date,
      volatility: Math.abs(change),
      change
    };
  });

  const avgVolatility = volatilityData.reduce((sum, d) => sum + d.volatility, 0) / volatilityData.length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="text-yellow-400" size={24}/>
        Volatilitate Portofoliu
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={volatilityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 11}} angle={-45} textAnchor="end" height={80}/>
          <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `${val?.toFixed(1)}%`}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            formatter={(value: any, name: string, props: any) => [
              `${(value as number)?.toFixed(2)}%`,
              props.payload.change >= 0 ? 'Creștere' : 'Scădere'
            ]}
          />
          <Bar dataKey="volatility" name="Volatilitate">
            {volatilityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.change >= 0 ? '#22c55e' : '#ef4444'}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-slate-400 text-sm mt-4 text-center">
        Volatilitate medie: <span className="font-bold text-yellow-400">{avgVolatility?.toFixed(2)}%</span>
      </p>
    </div>
  );
};

export default VolatilityChart;