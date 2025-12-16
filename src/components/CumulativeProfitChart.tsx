import {TrendingUp} from "lucide-react";
import {WealthData} from "../types";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {formatEUR} from "../utils/utils";
import React from "react";

const CumulativeProfitChart: React.FC<{ historyData: WealthData[] }> = ({historyData}) => {
  const cumulativeData = historyData.reduce((acc: any[], entry, idx) => {
    const cumulative = idx === 0 ? entry.gainLoss : acc[idx - 1].cumulative + entry.gainLoss;
    acc.push({
      date: entry.date,
      cumulative,
      gainLoss: entry.gainLoss
    });
    return acc;
  }, []);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" size={24}/>
        Profit/Pierdere Cumulativ
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={cumulativeData}>
          <defs>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 11}} angle={-45} textAnchor="end" height={80}/>
          <YAxis stroke="#94a3b8" tickFormatter={(val: number) => formatEUR(val)}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            formatter={(value: any) => [formatEUR(value), 'Profit Cumulativ']}
          />
          <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} fillOpacity={1}
                fill="url(#colorCumulative)"/>
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-slate-400 text-sm mt-4 text-center">
        Total profit cumulat: <span
        className={`font-bold ${cumulativeData[cumulativeData.length - 1]?.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatEUR(cumulativeData[cumulativeData.length - 1]?.cumulative || 0)}
        </span>
      </p>
    </div>
  );
};

export default CumulativeProfitChart;