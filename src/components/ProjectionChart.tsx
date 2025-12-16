import React from 'react';
import { Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock types for demonstration
type MergedData = {
  date: string;
  netWorth: number;
  eur: number;
  investments: number;
  cash: number;
  ron: number;
  gainLoss: number;
  comment: string;
  assetsTotal: number;
  assetsBreakdown: Record<string, number>;
};

const formatEUR = (value: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const ProjectionChart: React.FC<{ mergedData: MergedData[] }> = ({ mergedData }) => {
  console.log("mergedData in ProjectionChart:", mergedData);
  if (!mergedData || mergedData.length < 2) {
    return null;
  }

  // Helper to parse DD.MM.YYYY
  const parseDDMMYYYY = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // Ensure data sorted by date
  const sortedData = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const startWealth = sortedData[0].netWorth;
  const lastEntry = sortedData[sortedData.length - 1];
  const currentWealth = lastEntry.netWorth;

  // Compute months elapsed between first and last entries (date-based)
  const startDate = parseDDMMYYYY(sortedData[0].date);
  const endDate = parseDDMMYYYY(lastEntry.date);
  const monthsElapsed =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    (endDate.getDate() - startDate.getDate()) / 30;

  // Average earnings per month (EUR) based on historical data
  const totalGrowth = currentWealth - startWealth;
  const averageMonthlyEarning = monthsElapsed > 0 ? totalGrowth / monthsElapsed : 0;

  // Analyze historical data to estimate tax payments and base monthly growth
  const TAX_MONTHS = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct (0-based)

  // Calculate complete month deltas by finding first and last entry of each month
  type MonthData = {
    month: number;
    year: number;
    delta: number;
    isTaxMonth: boolean;
    monthName: string;
    daysInMonth: number;
    isPartial: boolean;
  };

  const completeMonths = new Map<string, {
    start: number;
    end: number;
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  }>();

  sortedData.forEach(entry => {
    const date = parseDDMMYYYY(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;

    if (!completeMonths.has(monthKey)) {
      completeMonths.set(monthKey, {
        start: entry.netWorth,
        end: entry.netWorth,
        month: date.getMonth(),
        year: date.getFullYear(),
        startDate: date,
        endDate: date
      });
    } else {
      completeMonths.get(monthKey)!.end = entry.netWorth;
      completeMonths.get(monthKey)!.endDate = date;
    }
  });

  // Calculate monthly deltas from complete months
  const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
  const monthlyDeltas: MonthData[] = [];

  completeMonths.forEach((data, key) => {
    const isTaxMonth = TAX_MONTHS.includes(data.month);
    const delta = data.end - data.start;

    // Calculate how many days of the month we have data for
    const daysInMonth = new Date(data.year, data.month + 1, 0).getDate();
    const daysCovered = data.endDate.getDate() - data.startDate.getDate() + 1;
    const isPartial = daysCovered < daysInMonth * 0.8; // Consider partial if less than 80% of month

    // For partial months, extrapolate to full month
    const normalizedDelta = isPartial ? (delta / daysCovered) * daysInMonth : delta;

    monthlyDeltas.push({
      month: data.month,
      year: data.year,
      delta: normalizedDelta,
      isTaxMonth: isTaxMonth,
      monthName: `${monthNames[data.month]} ${data.year}`,
      daysInMonth: daysInMonth,
      isPartial: isPartial
    });

    console.log(`${monthNames[data.month]} ${data.year}: days ${data.startDate.getDate()}-${data.endDate.getDate()} (${daysCovered}/${daysInMonth} days) = ${delta.toFixed(2)} EUR${isPartial ? ` → normalized: ${normalizedDelta.toFixed(2)} EUR` : ''} ${isTaxMonth ? '(TAX MONTH)' : ''}`);
  });

  // Calculate average monthly growth excluding tax months to get baseline
  const nonTaxDeltas = monthlyDeltas.filter(m => !m.isTaxMonth).map(m => m.delta);
  const baseMonthlyGrowth = nonTaxDeltas.length > 0
    ? nonTaxDeltas.reduce((a, b) => a + b, 0) / nonTaxDeltas.length
    : averageMonthlyEarning;

  // Calculate average tax impact (delta in tax months)
  const taxDeltas = monthlyDeltas.filter(m => m.isTaxMonth).map(m => m.delta);
  const avgTaxPayment = taxDeltas.length > 0
    ? taxDeltas.reduce((a, b) => a + b, 0) / taxDeltas.length
    : baseMonthlyGrowth * 0.3; // fallback: assume 30% of normal growth in tax months

  console.log("=== MONTHLY ANALYSIS ===");
  console.log("Non-tax months:", nonTaxDeltas.length, "months, deltas:", nonTaxDeltas.map(d => d.toFixed(2)));
  console.log("Base monthly growth (non-tax):", baseMonthlyGrowth.toFixed(2), "EUR");
  console.log("Tax months:", taxDeltas.length, "months, deltas:", taxDeltas.map(d => d.toFixed(2)));
  console.log("Avg tax month delta:", avgTaxPayment.toFixed(2), "EUR");

  // Build seasonal pattern using actual month data or averages
  // Group deltas by month-of-year (0-11) to create a seasonal pattern
  const deltasByMonth: number[][] = Array.from({ length: 12 }, () => []);
  monthlyDeltas.forEach(md => {
    deltasByMonth[md.month].push(md.delta);
  });

  // Calculate average for each month, with fallback to category average
  const seasonalAvg: number[] = deltasByMonth.map((deltas, monthIdx) => {
    if (deltas.length > 0) {
      // Use average of this specific month's historical data
      return deltas.reduce((a, b) => a + b, 0) / deltas.length;
    } else {
      // Fallback: use tax month or regular month average
      return TAX_MONTHS.includes(monthIdx) ? avgTaxPayment : baseMonthlyGrowth;
    }
  });

  // Add some variance to make it more realistic (±5-15% random variation)
  const addVariance = (value: number, idx: number): number => {
    const variance = 0.05 + (Math.sin(idx * 2.5) * 0.05); // -5% to +10% variation
    return value * (1 + variance);
  };

  console.log("Seasonal pattern by month:", seasonalAvg.map((v, i) => `${monthNames[i]}: ${v.toFixed(2)}`));

  // Build projection for 12 months (48 weeks) using seasonal monthly deltas
  const projectionData = [...sortedData] as any[];
  const monthlyProjections: Array<{ month: string; projectedValue: number; totalGrowth: number }> = [];

  let currentTotal = currentWealth;

  // Start from the last entry date
  const [day, month, year] = lastEntry.date.split('.').map(Number);
  let projectionDate = new Date(year, month - 1, day);

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(projectionDate.getTime());
    const monthIdx = monthStart.getMonth();
    const monthDelta = addVariance(seasonalAvg[monthIdx], m);
    const weeklyDelta = monthDelta / 4;

    for (let w = 0; w < 4; w++) {
      currentTotal += weeklyDelta;
      projectionDate = new Date(projectionDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekDate = `${String(projectionDate.getDate()).padStart(2, '0')}.${String(projectionDate.getMonth() + 1).padStart(2, '0')}.${projectionDate.getFullYear()}`;
      const projectedValue = currentTotal;
      projectionData.push({
        ...lastEntry,
        date: weekDate,
        netWorth: projectedValue,
        upperBound: projectedValue * 1.1,
        lowerBound: projectedValue * 0.9,
        isProjection: true
      } as any);
    }

    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
    const monthName = `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`;
    monthlyProjections.push({ month: monthName, projectedValue: currentTotal, totalGrowth: monthDelta });
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
            <p className="text-slate-400">Luni Normale</p>
            <p className="text-emerald-400 font-bold">{formatEUR(baseMonthlyGrowth)}/lună</p>
            <p className="text-slate-500 text-[10px]">({formatEUR(baseMonthlyGrowth / 4)}/săpt)</p>
          </div>
          <div>
            <p className="text-slate-400">Luni cu Taxe</p>
            <p className="text-orange-400 font-bold">{formatEUR(avgTaxPayment)}/lună</p>
            <p className="text-slate-500 text-[10px]">(Ian, Apr, Iul, Oct)</p>
          </div>
          <div>
            <p className="text-slate-400">Proiecție la 12 luni</p>
            <p className="text-blue-400 font-bold">
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
            interval={Math.floor(projectionData.length / 12)}
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
              <th className="text-right py-2 px-2">Câștig</th>
            </tr>
            </thead>
            <tbody className="text-slate-300">
            {monthlyProjections.map((proj, idx) => {
              const gain = proj.totalGrowth;
              const gainColor = gain >= 0 ? 'text-green-400' : 'text-red-400';
              const gainPrefix = gain >= 0 ? '+' : '';
              return (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-2 font-medium">{proj.month}</td>
                  <td className="text-right py-2 px-2 font-bold text-blue-400">
                    {formatEUR(proj.projectedValue)}
                  </td>
                  <td className={`text-right py-2 px-2 font-bold ${gainColor}`}>
                    {gainPrefix}{formatEUR(gain)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectionChart;