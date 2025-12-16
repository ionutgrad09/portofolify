

// ============================================
// 3. SavingsRateEvolution.tsx
// ============================================
import React from 'react';
import { PiggyBank } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import type { WealthData } from '../types';

interface SavingsRateEvolutionProps {
  historyData: WealthData[];
}

const SavingsRateEvolution: React.FC<SavingsRateEvolutionProps> = ({ historyData }) => {
  // Extract salary from comments and calculate savings rate
  const savingsData = historyData.map((entry, idx) => {
    if (idx === 0) return { date: entry.date, savingsRate: 0, salary: 0, saved: 0 };

    // Extract salary from comment
    const salaryMatch = entry.comment?.toLowerCase().includes('salariu');
    let salary = 0;

    if (salaryMatch) {
      // Try to extract number from comment
      const numbers = entry.comment.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        salary = parseInt(numbers[0]);
      }
    }

    // Calculate what was saved (growth minus profit/loss)
    const prevEntry = historyData[idx - 1];
    const growth = entry.eur - prevEntry.eur;
    const saved = growth - entry.gainLoss;

    // Calculate savings rate
    const savingsRate = salary > 0 ? (saved / salary) * 100 : 0;

    return {
      date: entry.date,
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      salary,
      saved
    };
  });

  const avgSavingsRate = savingsData.reduce((sum, d) => sum + d.savingsRate, 0) / savingsData.length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <PiggyBank className="text-emerald-400" size={24}/>
        Evoluția Ratei de Economisire
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={savingsData}>
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(val: number) => `${val}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            formatter={(value: any, name: string) => [`${(value as number)?.toFixed(1)}%`, 'Rată Economisire']}
          />
          <Area
            type="monotone"
            dataKey="savingsRate"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSavings)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 bg-slate-800/50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Rată Medie de Economisire</p>
            <p className="text-2xl font-bold text-emerald-400">{avgSavingsRate?.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Target Recomandat</p>
            <p className="text-2xl font-bold text-blue-400">20-30%</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          💡 Rata de economisire este calculată din comment-urile care conțin "salariu"
        </p>
      </div>
    </div>
  );
};

export default SavingsRateEvolution;