import React, { useState } from 'react';
import { Anchor } from 'lucide-react';
import type { MergedData } from '../types';
import { formatEUR } from '../utils/utils';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

interface Props { mergedData: MergedData[] }

const CoastFIRECard: React.FC<Props> = ({ mergedData }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000);
  const [retirementAge, setRetirementAge] = useState(55);
  const [currentAge, setCurrentAge] = useState(30);
  const [annualReturn, setAnnualReturn] = useState(7);

  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const lastEntry = sorted[sorted.length - 1];
  const currentWealth = lastEntry.netWorth;
  const investedAmount = lastEntry.investments; // only investments compound to FIRE

  // FIRE number (4% rule)
  const fireNumber = monthlyExpenses * 12 * 25;

  // Years until retirement
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);

  // Coast FIRE number: how much you need NOW so it grows to fireNumber by retirement
  // coastFIRE = fireNumber / (1 + r)^years
  const r = annualReturn / 100;
  const coastFIRE = fireNumber / Math.pow(1 + r, yearsToRetirement);

  const isCoasting = investedAmount >= coastFIRE;
  const gap = coastFIRE - investedAmount;
  const progressPct = Math.min(100, (investedAmount / coastFIRE) * 100);

  const yearsToCoast = !isCoasting && investedAmount > 0
    ? Math.log(coastFIRE / investedAmount) / Math.log(1 + r)
    : 0;

  const coastColor = isCoasting ? 'text-emerald-400' : progressPct > 75 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Anchor className="text-cyan-400" size={24} />
        Coast FIRE
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Suma de care ai nevoie acum pentru ca, fără contribuții suplimentare, portofoliul să crească singur până la FIRE la vârsta de pensionare.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Vârsta curentă</label>
          <input type="number" min={18} max={70} value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Vârsta pensionare</label>
          <input type="number" min={30} max={80} value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Cheltuieli/lună (€)</label>
          <input type="number" min={500} step={100} value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Randament anual (%)</label>
          <input type="number" min={1} max={20} step={0.5} value={annualReturn} onChange={e => setAnnualReturn(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">FIRE Target</p>
          <p className="text-xl font-bold text-orange-400">{formatEUR(fireNumber)}</p>
          <p className="text-[10px] text-slate-500">la {retirementAge} ani</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Coast FIRE Number</p>
          <p className={`text-xl font-bold ${coastColor}`}>{formatEUR(coastFIRE)}</p>
          <p className="text-[10px] text-slate-500">necesar acum la {annualReturn}%/an</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Investiții curente</p>
          <p className="text-xl font-bold text-blue-400">{formatEUR(investedAmount)}</p>
          <p className="text-[10px] text-slate-500">din {formatEUR(currentWealth)} avere totală</p>
          <p className={`text-[10px] font-medium mt-0.5 ${isCoasting ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isCoasting ? '🎉 Ești deja în Coast FIRE!' : `mai lipsesc ${formatEUR(gap)}`}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progres Coast FIRE</span>
          <span className={coastColor}>{progressPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCoasting ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : 'bg-gradient-to-r from-cyan-800 to-cyan-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {!isCoasting && yearsToCoast > 0 && (
        <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-3 text-xs text-slate-300">
          <span className="text-cyan-400 font-semibold">La {annualReturn}%/an fără contribuții</span> ai atinge Coast FIRE în aproximativ{' '}
          <span className="text-white font-bold">{yearsToCoast.toFixed(1)} ani</span> (la vârsta de ~{Math.round(currentAge + yearsToCoast)} ani).
          Dacă continui să contribui, vei ajunge mai devreme.
        </div>
      )}

      {isCoasting && (
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3 text-xs text-slate-300">
          <span className="text-emerald-400 font-semibold">Felicitări!</span> Ai deja suficient pentru Coast FIRE.
          Chiar dacă oprești toate contribuțiile azi, portofoliul tău ar trebui să crească la{' '}
          <span className="text-white font-bold">{formatEUR(fireNumber)}</span> până la vârsta de {retirementAge} ani la {annualReturn}%/an.
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3 text-center">
        Coast FIRE = FIRE Target ÷ (1 + {annualReturn}%)^{yearsToRetirement} ani. Bazat pe regula 4% (SWR).
      </p>
    </div>
  );
};

export default CoastFIRECard;
