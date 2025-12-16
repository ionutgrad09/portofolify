import React from 'react';
import { Target } from 'lucide-react';
import { formatEUR } from '../utils/utils';
import type { MergedData } from '../types';

interface FinancialGoalsProgressProps {
  mergedData: MergedData[];
}

const FinancialGoalsProgress: React.FC<FinancialGoalsProgressProps> = ({ mergedData }) => {
  if (mergedData.length < 2) return null;

  const currentWealth = mergedData[mergedData.length - 1].netWorth;
  const currentInvestments = mergedData[mergedData.length - 1].investments;
  const startWealth = mergedData[0].netWorth;

  // Calculate average monthly growth rate
  const monthsElapsed = mergedData.length / 4; // Assuming weekly data
  const totalGrowth = currentWealth - startWealth;
  const monthlyGrowthRate = totalGrowth / monthsElapsed / startWealth;

  // Annual investment return rate (8% per year = 0.67% per month compounded)
  const ANNUAL_INVESTMENT_RETURN = 0.08;
  const MONTHLY_INVESTMENT_RETURN = Math.pow(1 + ANNUAL_INVESTMENT_RETURN, 1/12) - 1;

  // Tax rates
  const VAT_RATE = 0.21; // 21% TVA
  const TAX_RATE = 0.30; // 30% Income Tax
  const TOTAL_TAX_RATE = VAT_RATE + TAX_RATE; // 51% total

  // Fixed goals with gross and net values
  const goals = [
    { label: '250k € NET', target: 250000, icon: '🎯' },
    { label: '500k € NET', target: 250000 * 2, icon: '🚀' },
    { label: '750k € NET', target: 250000 * 3, icon: '⭐' },
    { label: '1M € NET', target: 250000 * 4, icon: '💎' },
  ];

  const calculateMonthsToGoal = (netTarget: number) => {
    // Calculate gross amount needed to achieve net target after taxes
    const grossTarget = netTarget / (1 - TOTAL_TAX_RATE);

    if (monthlyGrowthRate <= 0 && MONTHLY_INVESTMENT_RETURN <= 0) return Infinity;

    // Starting values
    let currentTotal = currentWealth;
    let currentInv = currentInvestments;
    let months = 0;
    const maxMonths = 600; // 50 years max

    while (currentTotal < grossTarget && months < maxMonths) {
      // Growth from investments (8% annual compounded monthly)
      const investmentGrowth = currentInv * MONTHLY_INVESTMENT_RETURN;

      // Growth from overall portfolio (historical rate)
      const portfolioGrowth = currentTotal * monthlyGrowthRate;

      // Update values
      currentTotal += portfolioGrowth + investmentGrowth;
      currentInv += investmentGrowth; // Investments grow at 8%

      months++;
    }

    return months >= maxMonths ? Infinity : months;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="text-yellow-400" size={24}/>
        Progres către Obiective Financiare (NET)
      </h2>

      <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 mb-4">
        <p className="text-amber-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>Calcule după TVA (21%) + Impozit (30%) = 51% taxe totale</span>
        </p>
        <p className="text-emerald-300 text-xs flex items-center gap-2 mt-1">
          <span>📈</span>
          <span>Include creștere investiții: +8% anual (compus lunar)</span>
        </p>
      </div>

      <div className="space-y-6">
        {goals.map((goal, idx) => {
          const grossTarget = goal.target / (1 - TOTAL_TAX_RATE);
          const progress = Math.min(100, (currentWealth / grossTarget) * 100);
          const isAchieved = progress >= 100;
          const monthsToGoal = calculateMonthsToGoal(goal.target);
          const yearsToGoal = monthsToGoal / 12;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <span className="text-white font-semibold block">{goal.label}</span>
                    <span className="text-slate-500 text-xs">
                      (Gross: {formatEUR(grossTarget)})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Target NET: {formatEUR(goal.target)}</p>
                  {!isAchieved && monthsToGoal !== Infinity && (
                    <p className="text-xs text-blue-400 font-bold">
                      ~{yearsToGoal < 1 ? `${monthsToGoal} luni` : `${yearsToGoal?.toFixed(1)} ani`}
                    </p>
                  )}
                  {isAchieved && <p className="text-xs text-green-400 font-bold">✓ Atins!</p>}
                  {monthsToGoal === Infinity && !isAchieved && (
                    <p className="text-xs text-red-400">Imposibil cu rata actuală</p>
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
                  style={{ width: `${Math.min(100, progress)}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {progress?.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Current: {formatEUR(currentWealth)}</span>
                <span>Rămâne (gross): {formatEUR(Math.max(0, grossTarget - currentWealth))}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-slate-800/50 p-4 rounded-lg">
        <p className="text-slate-400 text-xs mb-3">📊 Statistici Progres</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Creștere Totală</p>
            <p className="text-lg font-bold text-green-400">
              {((currentWealth / startWealth - 1) * 100)?.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Creștere Lunară Medie</p>
            <p className="text-lg font-bold text-blue-400">
              {(monthlyGrowthRate * 100)?.toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-500">Investiții Actuale</p>
            <p className="text-lg font-bold text-purple-400">
              {formatEUR(currentInvestments)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              ({((currentInvestments / currentWealth) * 100)?.toFixed(1)}% din total)
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Valoare NET Curentă</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatEUR(currentWealth * (1 - TOTAL_TAX_RATE))}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">După taxe (51%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialGoalsProgress;