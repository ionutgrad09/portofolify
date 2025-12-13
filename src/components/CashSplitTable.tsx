import {formatEUR, formatRON} from "../utils/utils";
import React from "react";

interface CashSplitData {
  sursa: string;
  ron: number;
  eur: number;
  totalEur: number;
}

interface CashSplitTableProps {
  data: CashSplitData[];
  totalCashEUR: number;
}

const CashSplitTable: React.FC<CashSplitTableProps> = ({ data, totalCashEUR }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4">Sursă Lichidități</h2>

      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-3">
        {data.sort((a, b) => b.totalEur - a.totalEur).map((row, idx) => (
          <div key={idx} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-white text-lg">{row.sursa}</span>
              <span className="text-purple-400 font-bold text-lg">{formatEUR(row.totalEur)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Valoare LEI:</span>
                <span className="text-white ml-2 font-medium">{formatRON(row.ron)}</span>
              </div>
              <div>
                <span className="text-slate-400">Valoare EURO:</span>
                <span className="text-white ml-2 font-medium">{formatEUR(row.eur)}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <span className="text-slate-400 text-xs">Proporție (din total CASH):</span>
              <span className="text-purple-300 ml-2 font-semibold">
                {totalCashEUR > 0 ? ((row.totalEur / totalCashEUR) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-3 px-2">Sursă</th>
            <th className="text-right py-3 px-2">Valoare LEI</th>
            <th className="text-right py-3 px-2">Valoare EURO</th>
            <th className="text-right py-3 px-2">Total EUR Echiv.</th>
          </tr>
          </thead>
          <tbody>
          {data.sort((a, b) => b.totalEur - a.totalEur).map((row, idx) => (
            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/50 text-white transition-colors">
              <td className="py-3 px-2 font-medium">{row.sursa}</td>
              <td className="text-right py-3 px-2">{formatRON(row.ron)}</td>
              <td className="text-right py-3 px-2">{formatEUR(row.eur)}</td>
              <td className="text-right py-3 px-2 font-semibold text-purple-400">{formatEUR(row.totalEur)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashSplitTable;