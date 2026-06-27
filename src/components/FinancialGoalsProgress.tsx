import React from 'react';
import { Target } from 'lucide-react';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

interface FinancialGoalsProgressProps {
  mergedData: MergedData[];
}

// ================================
// Helper: parse DD.MM.YYYY → Date
// ================================
const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const FinancialGoalsProgress: React.FC<FinancialGoalsProgressProps> = ({ mergedData }) => {
  if (mergedData.length < 2) return null;

  // Ensure data is sorted by date
  const sortedData = [...mergedData].sort(
    (a, b) =>
      parseDDMMYYYY(a.date).getTime() -
      parseDDMMYYYY(b.date).getTime()
  );

  const startWealth = sortedData[0].netWorth;
  const currentWealth = sortedData[sortedData.length - 1].netWorth;

  // Exclude the calc-adjustment date from rate calculations
  const calcData = sortedData;

  // All-time average monthly earning
  const startDate = parseDDMMYYYY(calcData[0].date);
  const endDate = parseDDMMYYYY(calcData[calcData.length - 1].date);
  const monthsElapsed =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    (endDate.getDate() - startDate.getDate()) / 30;

  const totalGrowth = calcData[calcData.length - 1].netWorth - calcData[0].netWorth;
  const averageMonthlyEarning = monthsElapsed > 0 ? totalGrowth / monthsElapsed : 0;

  const computeTrend = (months: number): number => {
    const cutoff = new Date(endDate.getTime());
    cutoff.setMonth(cutoff.getMonth() - months);
    const entries = calcData.filter(e => parseDDMMYYYY(e.date).getTime() >= cutoff.getTime());
    if (entries.length < 2) return averageMonthlyEarning;
    const start = parseDDMMYYYY(entries[0].date);
    const end   = parseDDMMYYYY(entries[entries.length - 1].date);
    const elapsed = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (elapsed < 0.5) return averageMonthlyEarning;
    return (entries[entries.length - 1].netWorth - entries[0].netWorth) / elapsed;
  };

  const recentMonthlyEarning  = computeTrend(3);
  const trend6MonthlyEarning  = computeTrend(6);
  const trend12MonthlyEarning = computeTrend(12);

  // ================================
  // Financial goals
  // ================================
  const goals = [
    { label: '250k €', target: 250000, icon: '🎯' },
    { label: '500k €', target: 250000 * 2, icon: '🚀' },
    { label: '750k €', target: 250000 * 3, icon: '⭐' },
    { label: '1M €', target: 250000 * 4, icon: '💎' },
  ];

  const calculateMonthsToGoal = (target: number) => {
    if (averageMonthlyEarning <= 0) return Infinity;
    const remaining = target - currentWealth;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / averageMonthlyEarning);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Target className="text-yellow-400" size={24} />
        Progres către Obiective Financiare
      </h2>

      <div className="space-y-14">
        {goals.map((goal, idx) => {
          const progress = Math.min(100, (currentWealth / goal.target) * 100);
          const isAchieved = progress >= 100;
          const monthsToGoal = calculateMonthsToGoal(goal.target);
          const yearsToGoal = monthsToGoal / 12;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="text-white font-semibold">{goal.label}</span>
                </div>

                <div className="text-right">
                  <p className="text-slate-400 text-xs">
                    Target: {formatEUR(goal.target)}
                  </p>

                  {!isAchieved && monthsToGoal !== Infinity && (
                    <p className="text-xs text-blue-400">
                      ~
                      {yearsToGoal < 1
                        ? `${monthsToGoal} luni`
                        : `${monthsToGoal} luni (${yearsToGoal.toFixed(1)} ani)`}
                    </p>
                  )}

                  {isAchieved && (
                    <p className="text-xs text-green-400 font-bold">
                      ✓ Atins!
                    </p>
                  )}
                </div>
              </div>

              <div className="relative w-full bg-slate-700 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 flex items-center justify-end px-3 ${
                    isAchieved
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}
                  style={{ width: `${progress}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {progress.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Suma actuala: {formatEUR(currentWealth)}</span>
                <span>
                  Rămas: {formatEUR(Math.max(0, goal.target - currentWealth))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================
          Stats
         ================================ */}
      <div className="mt-6 bg-slate-800/50 p-4 rounded-lg">
        <p className="text-slate-400 text-xs mb-2">Statistici Progres</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Medie Istorică/lună</p>
            <p className="text-lg font-bold text-blue-400">
              {formatEUR(averageMonthlyEarning)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Trend 3 luni/lună</p>
            <p className={`text-lg font-bold ${recentMonthlyEarning >= averageMonthlyEarning ? 'text-emerald-400' : 'text-orange-400'}`}>
              {formatEUR(recentMonthlyEarning)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Trend 6 luni/lună</p>
            <p className={`text-lg font-bold ${trend6MonthlyEarning >= averageMonthlyEarning ? 'text-emerald-400' : 'text-orange-400'}`}>
              {formatEUR(trend6MonthlyEarning)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Trend 1 an/lună</p>
            <p className={`text-lg font-bold ${trend12MonthlyEarning >= averageMonthlyEarning ? 'text-emerald-400' : 'text-orange-400'}`}>
              {formatEUR(trend12MonthlyEarning)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialGoalsProgress;
