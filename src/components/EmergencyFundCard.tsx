import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { formatEUR } from '../utils/utils';

const STORAGE_KEY = 'portofolify_monthly_expenses';

interface Props { totalCashEUR: number }

const EmergencyFundCard: React.FC<Props> = ({ totalCashEUR }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 2000;
  });

  const handleChange = (v: number) => {
    setMonthlyExpenses(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  };

  const months = monthlyExpenses > 0 ? totalCashEUR / monthlyExpenses : 0;
  const recommended = 6;

  const color = months >= 12 ? 'text-emerald-400'
    : months >= 6  ? 'text-green-400'
    : months >= 3  ? 'text-yellow-400'
    : 'text-red-400';

  const label = months >= 12 ? 'Excelent — securitate maximă'
    : months >= 6  ? 'Bun — standard recomandat'
    : months >= 3  ? 'Acceptabil — încearcă să ajungi la 6 luni'
    : 'Insuficient — prioritate urgentă';

  const progressPct = Math.min(100, (months / recommended) * 100);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Shield className="text-blue-400" size={20} />
        Fond de Urgență
      </h3>
      <p className="text-xs text-slate-500 mb-5">Câte luni de cheltuieli acoperă cash-ul tău curent.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="sm:col-span-1">
          <p className="text-xs text-slate-400 mb-1">Cheltuieli lunare estimate</p>
          <div className="flex flex-col gap-2">
            <input
              type="number"
              min={100}
              step={100}
              value={monthlyExpenses}
              onChange={e => handleChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-500"
            />
            <input
              type="range"
              min={500}
              max={20000}
              step={100}
              value={monthlyExpenses}
              onChange={e => handleChange(Number(e.target.value))}
              className="w-full accent-blue-400"
            />
          </div>
        </div>

        <div className="sm:col-span-2 grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Cash disponibil</p>
            <p className="text-base font-bold text-white">{formatEUR(totalCashEUR)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Luni acoperite</p>
            <p className={`text-2xl font-bold ${color}`}>{months.toFixed(1)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Target (6 luni)</p>
            <p className="text-base font-bold text-slate-300">{formatEUR(recommended * monthlyExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Progress bar toward 6 months */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>0 luni</span>
          <span>3 luni</span>
          <span>6 luni (recomandat)</span>
          <span>12 luni</span>
        </div>
        <div className="relative w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              months >= 6 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              : months >= 3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
              : 'bg-gradient-to-r from-red-700 to-red-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
          {/* 6-month marker */}
          <div className="absolute top-0 left-1/2 h-full w-0.5 bg-white/30" />
        </div>
      </div>

      <p className={`text-sm font-semibold mt-2 ${color}`}>{label}</p>
      {months < recommended && (
        <p className="text-xs text-slate-500 mt-1">
          Mai ai nevoie de <span className="text-white font-medium">{formatEUR((recommended - months) * monthlyExpenses)}</span> pentru a atinge 6 luni.
        </p>
      )}
    </div>
  );
};

export default EmergencyFundCard;
