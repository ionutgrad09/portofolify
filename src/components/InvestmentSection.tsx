import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Banknote } from 'lucide-react';
import { formatEUR } from "../utils/utils";
import type { InvestmentData } from "../types";

interface InvestmentsSectionProps {
  data: InvestmentData[];
}

interface CustomTooltipPayload {
  name: string;
  value: number;
  fill?: string;
  color?: string;
  dataKey?: string;
}

interface CustomTooltipForInvestmentsProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltipForInvestments: React.FC<CustomTooltipForInvestmentsProps> = ({active, payload, label}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-xl">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 text-white" style={{color: pld.fill || pld.color}}>
            <span>{pld.name}:</span>
            <span className="font-bold">
                {pld.dataKey === 'profitEur'
                  ? formatEUR(pld.value)
                  : `${pld.value.toFixed(2)}%`
                }
              </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const InvestmentsSection: React.FC<InvestmentsSectionProps> = ({data}) => {
  if (!data || data.length === 0) {
    return (
      <div className="mt-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Investiții</h2>
        <p className="text-slate-400">Nu sunt date despre investiții. Sincronizează datele pentru a le vedea aici.</p>
      </div>
    );
  }

  console.log("data investment", data)

  const totalInvested = data.reduce((acc, curr) => acc + curr.sumaInvestita, 0);
  const totalCurrentValue = data.reduce((acc, curr) => acc + curr.valoareActuala, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const rebalancingData = data.map(item => {
    const targetValue = (item.alocare / 100) * totalCurrentValue;
    const rebalanceAmount = targetValue - item.valoareActuala;
    return {
      name: item.ticker,
      alocareActuala: item.alocareActuala,
      alocareDorita: item.alocare,
      rebalansareEur: rebalanceAmount,
    };
  });

  const allocationData = data.map(item => ({
    name: item.ticker,
    value: item.alocareActuala
  }));

  const profitData = data.map(item => ({
    name: item.ticker,
    profitEur: item.profitEur
  }));

  const profitPercentageData = data.map(item => ({
    name: item.ticker,
    profitPct: item.profitPct
  }));

  const INVESTMENT_PIE_COLORS = ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#db2777'];


  return (
    <div className="mt-6 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-800">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <Banknote size={32} className="text-purple-400"/>
        Investiții
      </h2>

      {/* Investment KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 p-5 rounded-2xl">
          <p className="text-sm text-slate-400 mb-1">Suma Investită</p>
          <p className="text-2xl font-bold text-white mb-2">{formatEUR(totalInvested)}</p>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-2xl">
          <p className="text-sm text-slate-400 mb-1">Valoare Actuală</p>
          <p className="text-2xl font-bold text-white mb-2">{formatEUR(totalCurrentValue)}</p>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-2xl">
          <p className="text-sm text-slate-400 mb-1">Profit Total</p>
          <p
            className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatEUR(totalProfit)}</p>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-2xl">
          <p className="text-sm text-slate-400 mb-1">Randament Total</p>
          <p
            className={`text-2xl font-bold ${totalProfitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalProfitPercentage.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-2xl mb-6">
        <h3 className="font-bold text-white text-lg mb-4">Detalii Active</h3>

        {/* Mobile View - Cards */}
        <div className="block xl:hidden space-y-3">
          {data.map((item, index) => (
            <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
              <div className="mb-3">
                <h4 className="font-bold text-white text-base">{item.denumireEtf}</h4>
                <span className="text-xs text-slate-400">{item.ticker}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Suma Investită:</span>
                  <p className="text-white font-medium">{formatEUR(item.sumaInvestita)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Val. Actuală:</span>
                  <p className="text-white font-medium">{formatEUR(item.valoareActuala)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Alocare:</span>
                  <p className="text-white font-medium">{item.alocare?.toFixed(2)}%</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Aloc. Actuală:</span>
                  <p className="text-white font-medium">{item.alocareActuala?.toFixed(2)}%</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">TER:</span>
                  <p className="text-white font-medium">{item.ter?.toFixed(2)}%</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Profit (€):</span>
                  <p className={`font-medium ${item.profitEur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.profitEur.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-xs">Profit (%):</span>
                  <p className={`font-bold text-lg ${item.profitPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.profitPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase">
            <tr>
              <th className="px-2 py-2">Activ</th>
              <th className="px-2 py-2 text-right">Suma Investită</th>
              <th className="px-2 py-2 text-right">Val. Actuală</th>
              <th className="px-2 py-2 text-right">Alocare</th>
              <th className="px-2 py-2 text-right">Aloc. Actuală</th>
              <th className="px-2 py-2 text-right">TER</th>
              <th className="px-2 py-2 text-right">Profit (€)</th>
              <th className="px-2 py-2 text-right">Profit (%)</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-slate-800">
                <td className="px-2 py-3 font-medium text-white">
                  <div className="flex flex-col">
                    <span>{item.denumireEtf}</span>
                    <span className="text-xs text-slate-400">{item.ticker}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-right font-mono text-white">{formatEUR(item.sumaInvestita)}</td>
                <td className="px-2 py-3 text-right font-mono text-white">{formatEUR(item.valoareActuala)}</td>
                <td className="px-2 py-3 text-right font-mono text-white">{item.alocare.toFixed(2)}%</td>
                <td className="px-2 py-3 text-right font-mono text-white">{item.alocareActuala.toFixed(2)}%</td>
                <td className="px-2 py-3 text-right font-mono text-white">{item.ter.toFixed(2)}%</td>
                <td className={`px-2 py-3 text-right font-mono ${item.profitEur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.profitEur.toFixed(2)}
                </td>
                <td className={`px-2 py-3 text-right font-mono ${item.profitPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.profitPct.toFixed(2)}%
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rebalancing Chart */}
      <div className="bg-slate-800/50 p-4 rounded-2xl mb-6">
        <h3 className="font-bold text-white text-lg mb-4">Necesar Rebalansare Portofoliu</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rebalancingData} layout="vertical" margin={{top: 5, right: 20, left: 10, bottom: 5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val: number) => formatEUR(val)}/>
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80}/>
            <Tooltip
              content={({active, payload, label}) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { rebalansareEur: number, alocareActuala: number, alocareDorita: number };
                  const amount = data.rebalansareEur;
                  const action = amount > 0 ? 'Cumpără' : 'Vinde';
                  const currentAllocation = data.alocareActuala;
                  const targetAllocation = data.alocareDorita;

                  return (
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
                      <p className="text-slate-300 font-medium mb-2">{label}</p>
                      <p style={{color: amount > 0 ? '#22c55e' : '#ef4444'}}>
                        {action}: <span className="font-bold">{formatEUR(Math.abs(amount))}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Alocare curentă: {typeof currentAllocation === 'number' ? currentAllocation.toFixed(2) : 'N/A'}%
                        |
                        Alocare dorită: {typeof targetAllocation === 'number' ? targetAllocation.toFixed(2) : 'N/A'}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}
            />
            <Bar dataKey="rebalansareEur" name="Rebalansare">
              {rebalancingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rebalansareEur > 0 ? '#22c55e' : '#ef4444'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="bg-slate-800/50 p-4 rounded-2xl flex-1">
          <h3 className="font-bold text-white text-lg mb-4">Alocare Portofoliu (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                   labelLine={false}
                   label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={INVESTMENT_PIE_COLORS[index % INVESTMENT_PIE_COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipForInvestments/>}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl flex-1">
          <h3 className="font-bold text-white text-lg mb-4">Profit per ETF (€)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={profitData} margin={{top: 5, right: 20, left: -10, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
              <YAxis stroke="#94a3b8" fontSize={12}/>
              <Tooltip content={<CustomTooltipForInvestments/>} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}/>
              <Bar dataKey="profitEur" name="Profit (€)">
                {profitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profitEur >= 0 ? '#22c55e' : '#ef4444'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl flex-1">
          <h3 className="font-bold text-white text-lg mb-4">Profit per ETF (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={profitPercentageData} margin={{top: 5, right: 20, left: -10, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value: number) => `${value}%`}/>
              <Tooltip content={<CustomTooltipForInvestments/>} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}/>
              <Bar dataKey="profitPct" name="Profit (%)">
                {profitPercentageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profitPct >= 0 ? '#16a34a' : '#dc2626'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsSection;
