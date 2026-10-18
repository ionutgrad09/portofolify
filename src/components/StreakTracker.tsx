import React from 'react';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';
import type { MergedData } from '../types';
import ChartInfo from './ChartInfo';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

interface Props { mergedData: MergedData[] }

const StreakTracker: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 3) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  // Monthly last values
  const monthMap = new Map<string, { label: string; value: number }>();
  sorted.forEach(e => {
    const d = parseDDMMYYYY(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: e.netWorth });
  });

  const monthEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Build win/loss streak data. The one-time June 2026 inflow is stripped so it can't turn
  // an otherwise-flat/negative month into a "win" or inflate the displayed delta.
  type MonthResult = { label: string; win: boolean; delta: number };
  const results: MonthResult[] = [];
  for (let i = 1; i < monthEntries.length; i++) {
    const [key, cur] = monthEntries[i];
    const [y, mo] = key.split('-').map(Number);
    const delta = cur.value - monthEntries[i - 1][1].value;
    results.push({ label: cur.label, win: delta >= 0, delta });
  }

  // Current streak
  let currentStreak = 1;
  const lastResult = results[results.length - 1];
  for (let i = results.length - 2; i >= 0; i--) {
    if (results[i].win === lastResult.win) currentStreak++;
    else break;
  }

  // Longest win streak
  let longestWin = 0, tempWin = 0;
  let longestWinStart = '', longestWinEnd = '';
  let tempWinStart = '';
  results.forEach(r => {
    if (r.win) {
      if (tempWin === 0) tempWinStart = r.label;
      tempWin++;
      if (tempWin > longestWin) {
        longestWin = tempWin;
        longestWinStart = tempWinStart;
        longestWinEnd = r.label;
      }
    } else tempWin = 0;
  });

  // Longest loss streak
  let longestLoss = 0, tempLoss = 0;
  let longestLossStart = '', longestLossEnd = '';
  let tempLossStart = '';
  results.forEach(r => {
    if (!r.win) {
      if (tempLoss === 0) tempLossStart = r.label;
      tempLoss++;
      if (tempLoss > longestLoss) {
        longestLoss = tempLoss;
        longestLossStart = tempLossStart;
        longestLossEnd = r.label;
      }
    } else tempLoss = 0;
  });

  const totalWins = results.filter(r => r.win).length;
  const winRate = ((totalWins / results.length) * 100).toFixed(1);
  const isCurrentWin = lastResult?.win ?? false;

  // Last 12 months for visual strip
  const last12 = results.slice(-12);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Flame className="text-orange-400" size={20} />
        Streak Lunar — Luni consecutive fără pierdere
        <ChartInfo text="Arată câte luni consecutive ai terminat pe plus față de luna anterioară. Streak curent = seria activă de luni pozitive sau negative. Cel mai lung streak pozitiv = recordul tău de luni consecutive câștigătoare. Win rate = % din totalul lunilor care s-au terminat pe plus față de luna precedentă." />
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Streak curent</p>
          <div className="flex items-center justify-center gap-2">
            {isCurrentWin
              ? <TrendingUp size={18} className="text-emerald-400" />
              : <TrendingDown size={18} className="text-red-400" />}
            <p className={`text-2xl font-bold ${isCurrentWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentStreak}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1">{isCurrentWin ? 'luni pozitive' : 'luni negative'}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Cel mai lung streak +</p>
          <p className="text-2xl font-bold text-emerald-400">{longestWin}</p>
          <p className="text-[10px] text-slate-500 mt-1">{longestWinStart} → {longestWinEnd}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Cel mai lung streak −</p>
          <p className="text-2xl font-bold text-red-400">{longestLoss}</p>
          <p className="text-[10px] text-slate-500 mt-1">{longestLossStart} → {longestLossEnd}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Win rate lunar</p>
          <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
          <p className="text-[10px] text-slate-500 mt-1">{totalWins}/{results.length} luni</p>
        </div>
      </div>

      {/* Visual strip — last 12 months */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Ultimele {last12.length} luni</p>
        <div className="flex gap-1.5 flex-wrap">
          {last12.map((r, i) => (
            <div key={i} title={`${r.label}: ${r.win ? '+' : ''}${new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(r.delta)}`}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold cursor-default transition-transform hover:scale-105 ${r.win ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {r.label.split(' ')[0]}
              <span className="ml-1 opacity-70">{r.win ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
