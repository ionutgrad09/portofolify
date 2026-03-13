import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InvestmentData } from '../types';

const SCENARIOS = [
  { rate: 5,  color: '#ef4444', label: '5%/an' },
  { rate: 8,  color: '#f97316', label: '8%/an' },
  { rate: 10, color: '#eab308', label: '10%/an' },
  { rate: 12, color: '#22c55e', label: '12%/an' },
  { rate: 15, color: '#3b82f6', label: '15%/an' },
];

const GOAL_MILESTONES = [250000, 500000, 750000, 1000000];

const fmt = (value: number): string =>
  new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const fv = (pv: number, pmt: number, annualRate: number, months: number): number => {
  if (months === 0) return pv;
  const r = annualRate / 100 / 12;
  if (r === 0) return pv + pmt * months;
  return pv * Math.pow(1 + r, months) + pmt * ((Math.pow(1 + r, months) - 1) / r);
};

interface Props {
  investmentData: InvestmentData[];
}

const InvestmentForecastChart: React.FC<Props> = ({ investmentData }) => {
  const defaultStart = useMemo(
    () => Math.round(investmentData.reduce((s, e) => s + e.valoareActuala, 0) / 100) * 100,
    [investmentData]
  );

  // Weighted average TER across all ETFs with known TER
  const avgTer = useMemo(() => {
    const withTer = investmentData.filter(e => e.ter > 0 && e.valoareActuala > 0);
    if (withTer.length === 0) return 0;
    const totalValue = withTer.reduce((s, e) => s + e.valoareActuala, 0);
    return withTer.reduce((s, e) => s + e.ter * e.valoareActuala, 0) / totalValue;
  }, [investmentData]);

  const [startAmount, setStartAmount] = useState<number>(defaultStart);
  const [monthlyContrib, setMonthlyContrib] = useState<number>(1320);
  const [years, setYears] = useState<number>(20);
  const [customRate, setCustomRate] = useState<number>(7);

  // Validate inputs
  const safeStart = Math.max(0, startAmount || 0);
  const safeContrib = Math.max(0, monthlyContrib || 0);
  const safeYears = Math.min(40, Math.max(1, years || 1));
  const safeCustomRate = Math.min(50, Math.max(0, customRate || 0));

  // Chart data — one point per year
  const chartData = useMemo(() => {
    return Array.from({ length: safeYears + 1 }, (_, yr) => {
      const months = yr * 12;
      const point: Record<string, number | string> = {
        label: yr === 0 ? 'Acum' : `${yr}a`,
        invested: Math.round(safeStart + safeContrib * months),
        custom: Math.round(fv(safeStart, safeContrib, safeCustomRate, months)),
        customNet: Math.round(fv(safeStart, safeContrib, safeCustomRate - avgTer, months)),
      };
      SCENARIOS.forEach(s => {
        point[`r${s.rate}`] = Math.round(fv(safeStart, safeContrib, s.rate, months));
      });
      return point;
    });
  }, [safeStart, safeContrib, safeYears, safeCustomRate, avgTer]);

  // Summary table — milestone years
  const tableYears = [1, 5, 10, 15, 20, 25, 30].filter(y => y <= safeYears);
  if (!tableYears.includes(safeYears)) tableYears.push(safeYears);

  const maxFinalValue = fv(safeStart, safeContrib, 15, safeYears * 12);
  const relevantGoals = GOAL_MILESTONES.filter(g => g > safeStart && g < maxFinalValue * 1.1);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
        <Calculator className="text-blue-400" size={24}/>
        Previziune Portofoliu cu Dobândă Compusă
      </h2>

      {/* ── Controls ── */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-5 space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Starting amount */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sumă inițială (€)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStartAmount(v => Math.max(0, v - 1000))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center shrink-0"
              >−</button>
              <input
                type="number"
                min={0}
                value={startAmount}
                onChange={e => setStartAmount(Number(e.target.value))}
                className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setStartAmount(v => v + 1000)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center shrink-0"
              >+</button>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {[defaultStart, 50000, 100000, 150000].map(v => (
                <button key={v} onClick={() => setStartAmount(v)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    startAmount === v ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}>
                  {v === defaultStart ? 'Actual' : fmt(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly contribution */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Contribuție lunară (€)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthlyContrib(v => Math.max(0, v - 100))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center shrink-0"
              >−</button>
              <input
                type="number"
                min={0}
                value={monthlyContrib}
                onChange={e => setMonthlyContrib(Number(e.target.value))}
                className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setMonthlyContrib(v => v + 100)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center shrink-0"
              >+</button>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {[0, 300, 500, 1000, 2000].map(v => (
                <button key={v} onClick={() => setMonthlyContrib(v)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    monthlyContrib === v ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}>
                  {v === 0 ? 'Fără' : `€${v}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time horizon slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Orizont de timp</label>
              <span className="text-sm font-bold text-white">{safeYears} ani</span>
            </div>
            <input
              type="range"
              min={1} max={40} step={1}
              value={safeYears}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1 an</span><span>10</span><span>20</span><span>30</span><span>40 ani</span>
            </div>
          </div>

          {/* Custom rate slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Randament personalizat</label>
              <span className="text-sm font-bold text-fuchsia-400">{safeCustomRate}%/an</span>
            </div>
            <input
              type="range"
              min={0} max={50} step={0.5}
              value={safeCustomRate}
              onChange={e => setCustomRate(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>50%</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700 text-xs">
          <div>
            <p className="text-slate-400">Total investit</p>
            <p className="text-slate-300 font-bold">{fmt(safeStart + safeContrib * safeYears * 12)}</p>
          </div>
          <div>
            <p className="text-slate-400">La {safeCustomRate}% după {safeYears} ani</p>
            <p className="text-fuchsia-400 font-bold">{fmt(fv(safeStart, safeContrib, safeCustomRate, safeYears * 12))}</p>
          </div>
          <div>
            <p className="text-slate-400">Net TER după {safeYears} ani</p>
            <p className="text-fuchsia-300 font-bold">{fmt(fv(safeStart, safeContrib, safeCustomRate - avgTer, safeYears * 12))}</p>
          </div>
          <div>
            <p className="text-slate-400">×{safeCustomRate}% față de investit</p>
            <p className="text-blue-400 font-bold">
              {safeStart + safeContrib * safeYears * 12 > 0
                ? `${((fv(safeStart, safeContrib, safeCustomRate, safeYears * 12) / (safeStart + safeContrib * safeYears * 12))).toFixed(2)}x`
                : '—'}
            </p>
          </div>
        </div>

        {/* TER drag info */}
        {avgTer > 0 && (() => {
          const gross = fv(safeStart, safeContrib, safeCustomRate, safeYears * 12);
          const net   = fv(safeStart, safeContrib, safeCustomRate - avgTer, safeYears * 12);
          const drag  = gross - net;
          const annualDrag = safeStart * (avgTer / 100);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50 text-xs">
              <div>
                <p className="text-slate-400">TER mediu ponderat</p>
                <p className="text-orange-400 font-bold">{avgTer.toFixed(3)}%/an</p>
              </div>
              <div>
                <p className="text-slate-400">Cost TER anual curent</p>
                <p className="text-orange-400 font-bold">−{fmt(annualDrag)}</p>
              </div>
              <div>
                <p className="text-slate-400">Drag total TER ({safeYears} ani)</p>
                <p className="text-red-400 font-bold">−{fmt(drag)}</p>
              </div>
              <div>
                <p className="text-slate-400">Randament net efectiv</p>
                <p className="text-orange-300 font-bold">{(safeCustomRate - avgTer).toFixed(2)}%/an</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(val: number) =>
              val >= 1_000_000
                ? `€${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`
                : `€${(val / 1000).toFixed(0)}k`
            }
            width={54}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => {
              if (name === 'invested')   return [fmt(value), 'Total investit'];
              if (name === 'custom')     return [fmt(value), `${safeCustomRate}%/an (brut)`];
              if (name === 'customNet')  return [fmt(value), `${(safeCustomRate - avgTer).toFixed(2)}%/an (net TER)`];
              const rate = name.replace('r', '');
              return [fmt(value), `Randament ${rate}%/an`];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value: string) => {
              if (value === 'invested')   return <span style={{ color: '#64748b' }}>Investit (fără randament)</span>;
              if (value === 'custom')    return <span style={{ color: '#e879f9', fontWeight: 700 }}>{safeCustomRate}%/an (brut)</span>;
              if (value === 'customNet') return <span style={{ color: '#f0abfc' }}>{(safeCustomRate - avgTer).toFixed(2)}%/an (net TER {avgTer.toFixed(3)}%)</span>;
              const rate = value.replace('r', '');
              const s = SCENARIOS.find(x => x.rate === Number(rate));
              return <span style={{ color: s?.color }}>{rate}%/an</span>;
            }}
          />
          {relevantGoals.map(g => (
            <ReferenceLine
              key={g}
              y={g}
              stroke="#334155"
              strokeDasharray="4 2"
              label={{
                value: g >= 1_000_000 ? `€${g / 1_000_000}M` : `€${g / 1000}k`,
                position: 'insideTopRight',
                fill: '#475569',
                fontSize: 9,
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="invested"
            stroke="#475569"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            name="invested"
          />
          {SCENARIOS.map(s => (
            <Line
              key={s.rate}
              type="monotone"
              dataKey={`r${s.rate}`}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
              name={`r${s.rate}`}
            />
          ))}
          <Line
            type="monotone"
            dataKey="custom"
            stroke="#e879f9"
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 2"
            name="custom"
          />
          {avgTer > 0 && (
            <Line
              type="monotone"
              dataKey="customNet"
              stroke="#f0abfc"
              strokeWidth={2}
              dot={false}
              strokeDasharray="3 3"
              name="customNet"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* ── Summary table ── */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-2 px-2">An</th>
              <th className="text-right py-2 px-2 text-slate-500">Investit</th>
              <th className="text-right py-2 px-2 text-fuchsia-400">{safeCustomRate}% brut</th>
              {avgTer > 0 && <th className="text-right py-2 px-2 text-orange-400">Drag TER</th>}
              {avgTer > 0 && <th className="text-right py-2 px-2 text-fuchsia-300">Net TER</th>}
              {SCENARIOS.map(s => (
                <th key={s.rate} className="text-right py-2 px-2" style={{ color: s.color }}>{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {tableYears.map(yr => {
              const months = yr * 12;
              const invested = safeStart + safeContrib * months;
              return (
                <tr key={yr} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-1.5 px-2 font-medium text-white">
                    {yr === safeYears && !([1,5,10,15,20,25,30].includes(yr)) ? `${yr} ani *` : `${yr} ${yr === 1 ? 'an' : 'ani'}`}
                  </td>
                  <td className="text-right py-1.5 px-2 text-slate-500">{fmt(invested)}</td>
                  {(() => {
                    const gross   = fv(safeStart, safeContrib, safeCustomRate, months);
                    const net     = fv(safeStart, safeContrib, safeCustomRate - avgTer, months);
                    const terDrag = gross - net;
                    const gain    = gross - invested;
                    return (
                      <>
                        <td className="text-right py-1.5 px-2">
                          <span className="font-bold text-fuchsia-400">{fmt(gross)}</span>
                          <span className="block text-[10px] text-emerald-400/70">+{fmt(gain)}</span>
                        </td>
                        {avgTer > 0 && (
                          <td className="text-right py-1.5 px-2">
                            <span className="font-bold text-orange-400">−{fmt(terDrag)}</span>
                          </td>
                        )}
                        {avgTer > 0 && (
                          <td className="text-right py-1.5 px-2">
                            <span className="font-bold text-fuchsia-300">{fmt(net)}</span>
                            <span className="block text-[10px] text-emerald-400/70">+{fmt(net - invested)}</span>
                          </td>
                        )}
                      </>
                    );
                  })()}
                  {SCENARIOS.map(s => {
                    const val = fv(safeStart, safeContrib, s.rate, months);
                    const gain = val - invested;
                    return (
                      <td key={s.rate} className="text-right py-1.5 px-2">
                        <span className="font-bold" style={{ color: s.color }}>{fmt(val)}</span>
                        <span className="block text-[10px] text-emerald-400/70">+{fmt(gain)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentForecastChart;
