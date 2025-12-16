import {MergedData} from "../types";
import {Target} from "lucide-react";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {formatEUR} from "../utils/utils";
import React from "react";

const ProjectionChart: React.FC<{mergedData: MergedData[]}> = ({mergedData}) => {
  // Calculate growth rate from last 12 weeks (3 months of data)
  const recentData = mergedData.slice(-12);
  const growthRates = recentData.slice(1).map((entry, idx) => {
    const prev = recentData[idx].netWorth;
    return prev > 0 ? ((entry.netWorth - prev) / prev) * 100 : 0;
  });
  const avgWeeklyGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  // Convert to monthly rate (4 weeks = 1 month approximately)
  const avgMonthlyGrowthRate = avgWeeklyGrowthRate * 4;

  // Get last entry values
  const lastEntry = mergedData[mergedData.length - 1];
  const lastInvestments = lastEntry.investments;

  // Investment growth rate (8% annual = 0.643% monthly compounded)
  const MONTHLY_INVESTMENT_RETURN = Math.pow(1.08, 1/12) - 1;

  // Project 12 months forward (48 weeks)
  const projectionData = [...mergedData];
  const monthlyProjections: Array<{
    month: string;
    projectedValue: number;
    investmentGrowth: number;
    portfolioGrowth: number;
    totalGrowth: number;
  }> = [];

  let currentTotal = lastEntry.netWorth;
  let currentInv = lastInvestments;

  // Get current date from last entry
  const [day, month, year] = lastEntry.date.split('.').map(Number);
  let projectionDate = new Date(year, month - 1, day);

  // Project week by week for 48 weeks (12 months)
  for (let week = 1; week <= 48; week++) {
    // Calculate weekly investment growth (8% annual)
    const weeklyInvestmentReturn = Math.pow(1.08, 1/52) - 1;
    const investmentGrowth = currentInv * weeklyInvestmentReturn;

    // Calculate weekly portfolio growth (historical rate)
    const portfolioGrowth = currentTotal * (avgWeeklyGrowthRate / 100);

    // Total growth
    const totalGrowth = investmentGrowth + portfolioGrowth;

    // Update values
    currentTotal += totalGrowth;
    currentInv += investmentGrowth;

    const projectedValue = currentTotal;
    const upperBound = projectedValue * 1.1;
    const lowerBound = projectedValue * 0.9;

    // Add week to date
    projectionDate = new Date(projectionDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekDate = `${String(projectionDate.getDate()).padStart(2, '0')}.${String(projectionDate.getMonth() + 1).padStart(2, '0')}.${projectionDate.getFullYear()}`;

    projectionData.push({
      ...lastEntry,
      date: weekDate,
      netWorth: projectedValue,
      upperBound,
      lowerBound,
      isProjection: true
    } as any);

    // Add to monthly summary every 4 weeks
    if (week % 4 === 0) {
      const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
      const monthName = `${monthNames[projectionDate.getMonth()]} ${projectionDate.getFullYear()}`;

      // Calculate growth for this month (last 4 weeks)
      const monthStartValue = week === 4 ? lastEntry.netWorth : monthlyProjections[monthlyProjections.length - 1].projectedValue;
      const monthTotalGrowth = projectedValue - monthStartValue;

      // Approximate split between investment and portfolio growth for the month
      const monthInvestmentGrowth = currentInv - (week === 4 ? lastInvestments : monthlyProjections[monthlyProjections.length - 1].projectedValue * (lastInvestments / lastEntry.netWorth));
      const monthPortfolioGrowth = monthTotalGrowth - monthInvestmentGrowth;

      monthlyProjections.push({
        month: monthName,
        projectedValue,
        investmentGrowth: monthInvestmentGrowth,
        portfolioGrowth: monthPortfolioGrowth,
        totalGrowth: monthTotalGrowth
      });
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="text-blue-400" size={24}/>
        Proiecție 12 Luni (48 Săptămâni)
      </h2>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-slate-400">Creștere Medie</p>
            <p className="text-blue-400 font-bold">{avgWeeklyGrowthRate?.toFixed(2)}%/săpt</p>
            <p className="text-slate-500 text-[10px]">({avgMonthlyGrowthRate?.toFixed(2)}%/lună)</p>
          </div>
          <div>
            <p className="text-slate-400">Investiții</p>
            <p className="text-purple-400 font-bold">+8%/an</p>
            <p className="text-slate-500 text-[10px]">(0.15%/săpt)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiecție la 12 luni</p>
            <p className="text-emerald-400 font-bold">
              {formatEUR(monthlyProjections[11]?.projectedValue || 0)}
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={projectionData}>
          <defs>
            <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{fontSize: 9}}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={Math.floor(projectionData.length / 12)} // Show ~12 labels
          />
          <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000)?.toFixed(0)}k`}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: "white"}}
            formatter={(value: any, name: string) => {
              if (name === 'netWorth') return [formatEUR(value), 'Valoare'];
              if (name === 'upperBound') return [formatEUR(value), 'Maxim (+10%)'];
              if (name === 'lowerBound') return [formatEUR(value), 'Minim (-10%)'];
              return [formatEUR(value), name];
            }}
          />
          <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorProjection)"
            strokeDasharray={(entry: any) => entry.isProjection ? "5 5" : ""}
          />
          <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f6" fillOpacity={0.2}/>
        </AreaChart>
      </ResponsiveContainer>

      {/* Monthly Projections Table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          📅 Prognoză Detaliată Lunară
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-2 px-2">Lună</th>
              <th className="text-right py-2 px-2">Valoare Totală</th>
              <th className="text-right py-2 px-2">Creștere Inv.</th>
              <th className="text-right py-2 px-2">Creștere Portfolio</th>
              <th className="text-right py-2 px-2">Creștere Totală</th>
            </tr>
            </thead>
            <tbody className="text-slate-300">
            {monthlyProjections.map((proj, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="py-2 px-2 font-medium">{proj.month}</td>
                <td className="text-right py-2 px-2 font-bold text-blue-400">
                  {formatEUR(proj.projectedValue)}
                </td>
                <td className="text-right py-2 px-2 text-purple-400">
                  +{formatEUR(proj.investmentGrowth)}
                </td>
                <td className="text-right py-2 px-2 text-emerald-400">
                  +{formatEUR(proj.portfolioGrowth)}
                </td>
                <td className="text-right py-2 px-2 font-bold text-green-400">
                  +{formatEUR(proj.totalGrowth)}
                </td>
              </tr>
            ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-600 font-bold">
            <tr className="bg-slate-800/30">
              <td className="py-2 px-2 text-white">TOTAL (12 luni)</td>
              <td className="text-right py-2 px-2 text-blue-400">
                {formatEUR(monthlyProjections[11]?.projectedValue || 0)}
              </td>
              <td className="text-right py-2 px-2 text-purple-400">
                +{formatEUR(monthlyProjections.reduce((sum, p) => sum + p.investmentGrowth, 0))}
              </td>
              <td className="text-right py-2 px-2 text-emerald-400">
                +{formatEUR(monthlyProjections.reduce((sum, p) => sum + p.portfolioGrowth, 0))}
              </td>
              <td className="text-right py-2 px-2 text-green-400">
                +{formatEUR(monthlyProjections[11]?.projectedValue - lastEntry.netWorth)}
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
        <p className="text-blue-300 text-xs flex items-center gap-2">
          <span>💡</span>
          <span>
            Proiecția combină creșterea istorică săptămânală ({avgWeeklyGrowthRate?.toFixed(2)}%/săpt) cu randamentul investițiilor (8%/an ≈ 0.15%/săpt).
            Graficul arată 48 săptămâni viitoare, sumarizate lunar în tabel. Valorile reale pot varia ±10%.
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProjectionChart;