import React, { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatEUR = (v: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
const YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4'];

interface Props { mergedData: MergedData[] }

const YearOverYearChart: React.FC<Props> = ({ mergedData }) => {
  const [mode, setMode] = useState<'absolute' | 'indexed'>('indexed');

  if (!mergedData || mergedData.length < 4) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Group by year → month → last netWorth
  const byYearMonth = new Map<number, Map<number, number>>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    if (!byYearMonth.has(yr)) byYearMonth.set(yr, new Map());
    byYearMonth.get(yr)!.set(mo, e.netWorth);
  });

  const years = Array.from(byYearMonth.keys()).sort();

  // Build chart rows: one per month index 0–11
  const chartData = MONTH_NAMES.map((name, mo) => {
    const row: Record<string, any> = { month: name };
    years.forEach(yr => {
      const val = byYearMonth.get(yr)?.get(mo);
      if (val !== undefined) {
        if (mode === 'absolute') {
          row[String(yr)] = val;
        } else {
          // Index to Jan of that year (first available month)
          const yearMap = byYearMonth.get(yr)!;
          const firstMonth = Math.min(...Array.from(yearMap.keys()));
          const base = yearMap.get(firstMonth)!;
          row[String(yr)] = parseFloat(((val / base - 1) * 100).toFixed(2));
        }
      }
    });
    return row;
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarRange className="text-blue-400" size={20} />
          Comparație An vs An
          <ChartInfo text="Suprapune evoluția averii pe luni calendaristice, câte un an pe linie. Modul EUR = valori absolute; Modul Indexat % = fiecare an pornește de la 0% din prima lună disponibilă, arătând ritmul relativ de creștere. Util pentru a compara dacă 2026 crește mai repede sau mai lent decât 2025 în aceeași perioadă a anului." />
        </h3>
        <div className="flex gap-1">
          {(['absolute', 'indexed'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
              {m === 'absolute' ? 'EUR' : 'Indexat %'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        {mode === 'indexed'
          ? 'Fiecare an indexat la 100% din prima lună cu date — arată sezonalitatea și ritmul de creștere.'
          : 'Valoarea absolută a averii nete per lună calendaristică, pe ani.'}
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <YAxis stroke="#94a3b8"
            tickFormatter={(v: number) => mode === 'indexed' ? `${v > 0 ? '+' : ''}${v.toFixed(0)}%` : `€${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
            formatter={(v: any, name: string) =>
              mode === 'indexed'
                ? [`${(v as number) > 0 ? '+' : ''}${(v as number).toFixed(2)}%`, name]
                : [formatEUR(v as number), name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {mode === 'indexed' && <line x1="0%" x2="100%" y1="0" y2="0" stroke="#475569" strokeDasharray="4 4" />}
          {years.map((yr, i) => (
            <Line
              key={yr}
              type="monotone"
              dataKey={String(yr)}
              stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearOverYearChart;
