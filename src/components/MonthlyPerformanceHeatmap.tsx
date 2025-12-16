// ============================================
// 1. MonthlyPerformanceHeatmap.tsx
// ============================================
import React from 'react';
import { Calendar } from 'lucide-react';
import type { MergedData } from '../types';

interface MonthlyPerformanceHeatmapProps {
  mergedData: MergedData[];
}

const MonthlyPerformanceHeatmap: React.FC<MonthlyPerformanceHeatmapProps> = ({ mergedData }) => {
  // Parse dates and calculate monthly returns
  const monthlyReturns: { [key: string]: { [key: string]: number } } = {};

  mergedData.forEach((entry, idx) => {
    if (idx === 0) return;

    const [day, month, year] = entry.date.split('.').map(Number);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const prevNetWorth = mergedData[idx - 1].netWorth;
    const returnPct = prevNetWorth > 0 ? ((entry.netWorth - prevNetWorth) / prevNetWorth) * 100 : 0;

    if (!monthlyReturns[year]) monthlyReturns[year] = {};
    if (!monthlyReturns[year][month]) {
      monthlyReturns[year][month] = returnPct;
    } else {
      monthlyReturns[year][month] += returnPct;
    }
  });

  const years = Object.keys(monthlyReturns).sort();
  const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

  const getColor = (value: number) => {
    if (!value || value === 0) return 'bg-slate-700';
    if (value > 10) return 'bg-green-600';
    if (value > 5) return 'bg-green-500';
    if (value > 2) return 'bg-green-400';
    if (value > 0) return 'bg-green-300';
    if (value > -2) return 'bg-red-300';
    if (value > -5) return 'bg-red-400';
    if (value > -10) return 'bg-red-500';
    return 'bg-red-600';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="text-cyan-400" size={24}/>
        Heatmap Performanță Lunară
      </h2>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-2">
            <div className="w-12"></div>
            {months.map((month, idx) => (
              <div key={idx} className="w-16 text-center text-xs text-slate-400 font-medium">
                {month}
              </div>
            ))}
          </div>

          {years.map(year => (
            <div key={year} className="flex gap-1 mb-1">
              <div className="w-12 text-sm text-slate-400 font-medium flex items-center">
                {year}
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                const value = monthlyReturns[year]?.[month] || 0;
                return (
                  <div
                    key={month}
                    className={`w-16 h-12 ${getColor(value)} rounded flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-white transition-all cursor-pointer group relative`}
                    title={`${months[month - 1]} ${year}: ${value?.toFixed(2)}%`}
                  >
                    {value !== 0 && (
                      <span className="opacity-0 group-hover:opacity-100">
                        {value?.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-400">Mai puțin</span>
        <div className="w-4 h-4 bg-red-600 rounded"></div>
        <div className="w-4 h-4 bg-red-400 rounded"></div>
        <div className="w-4 h-4 bg-slate-700 rounded"></div>
        <div className="w-4 h-4 bg-green-400 rounded"></div>
        <div className="w-4 h-4 bg-green-600 rounded"></div>
        <span className="text-slate-400">Mai mult</span>
      </div>
    </div>
  );
};

export default MonthlyPerformanceHeatmap;