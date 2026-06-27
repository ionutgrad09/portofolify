import React from 'react';
import { TrendingUp, BarChart2, Zap, Award } from 'lucide-react';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const RISK_FREE_RATE = 0.03;

interface Props {
  mergedData: MergedData[];
}

const PerformanceStatsBar: React.FC<Props> = ({ mergedData }) => {

  if (!mergedData || mergedData.length < 6) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const startValue = sorted[0].netWorth;
  const endValue = sorted[sorted.length - 1].netWorth;
  const startDate = parseDDMMYYYY(sorted[0].date);
  const endDate = parseDDMMYYYY(sorted[sorted.length - 1].date);
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // CAGR
  const cagr = years > 0 ? (Math.pow(endValue / startValue, 1 / years) - 1) * 100 : 0;

  // Group by month → last value per month
  const monthMap = new Map<string, number>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, e.netWorth);
  });
  const monthlyValues = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // Monthly returns
  const monthlyReturns: number[] = [];
  for (let i = 1; i < monthlyValues.length; i++) {
    if (monthlyValues[i - 1] > 0) {
      monthlyReturns.push((monthlyValues[i] - monthlyValues[i - 1]) / monthlyValues[i - 1]);
    }
  }

  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / monthlyReturns.length;
  const monthlyVol = Math.sqrt(variance);
  const annualVol = monthlyVol * Math.sqrt(12) * 100;

  // Sharpe (annualized, using 3% risk-free)
  const sharpe = annualVol > 0 ? (cagr / 100 - RISK_FREE_RATE) / (annualVol / 100) : 0;

  // Best / worst month
  const bestMonth = Math.max(...monthlyReturns) * 100;
  const worstMonth = Math.min(...monthlyReturns) * 100;


  const stats = [
    {
      label: 'CAGR',
      value: `${cagr.toFixed(2)}%`,
      sub: `pe ${years.toFixed(1)} ani`,
      explanation: 'Rata anuală compusă de creștere — arată cu ce % crește averea ta în fiecare an, eliminând fluctuațiile.',
      color: cagr >= 0 ? 'text-emerald-400' : 'text-red-400',
      icon: <TrendingUp size={18} className="text-emerald-400" />,
    },
    {
      label: 'Volatilitate Anuală',
      value: `${annualVol.toFixed(2)}%`,
      sub: `lunar: ${(monthlyVol * 100).toFixed(2)}%`,
      explanation: 'Măsoară cât de mult variază averea de la lună la lună. Valoare mică = creștere stabilă.',
      color: annualVol < 10 ? 'text-emerald-400' : annualVol < 20 ? 'text-yellow-400' : 'text-red-400',
      icon: <BarChart2 size={18} className="text-yellow-400" />,
    },
    {
      label: 'Sharpe Ratio',
      value: sharpe.toFixed(2),
      sub: `rf = ${(RISK_FREE_RATE * 100).toFixed(0)}% EUR`,
      explanation: 'Randament obținut per unitate de risc asumat. >1 = excelent, 0.5–1 = bun, <0.5 = slab față de risc.',
      color: sharpe >= 1 ? 'text-emerald-400' : sharpe >= 0.5 ? 'text-yellow-400' : 'text-red-400',
      icon: <Zap size={18} className="text-purple-400" />,
    },
    {
      label: 'Cea mai bună lună',
      value: `+${bestMonth.toFixed(2)}%`,
      sub: '',
      explanation: 'Cea mai mare creștere procentuală înregistrată într-o singură lună calendaristică.',
      color: 'text-emerald-400',
      icon: <Award size={18} className="text-emerald-400" />,
    },
    {
      label: 'Cea mai proastă lună',
      value: `${worstMonth.toFixed(2)}%`,
      sub: '',
      explanation: 'Cea mai mare scădere procentuală înregistrată într-o singură lună calendaristică.',
      color: 'text-red-400',
      icon: <Award size={18} className="text-red-400" />,
    },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-slate-800">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Statistici Performanță</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`flex flex-col gap-1 ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              {s.icon}
              <span>{s.label}</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-slate-500">{s.sub}</p>}
            <p className="text-xs text-slate-600 leading-snug mt-0.5">{s.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceStatsBar;
