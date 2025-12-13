import React from "react";
import {formatEUR, formatRON} from "../utils/utils.js";


const HistoryTable = ({ data }) => {
  const sortedData = [...data].sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4">Istoricul Complet</h2>

      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-3">
        {sortedData.map((row, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-white">{row.date}</span>
              <span className={`font-semibold px-2 py-1 rounded text-sm ${row.gainLoss >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {row.gainLoss >= 0 ? '+' : ''}{formatRON(row.gainLoss)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">RON:</span>
                <span className="text-white ml-2 font-medium">{formatRON(row.ron)}</span>
              </div>dev
              <div>
                <span className="text-slate-400">EUR:</span>
                <span className="text-white ml-2 font-medium">{formatEUR(row.eur)}</span>
              </div>
              <div>
                <span className="text-slate-400">Investiții:</span>
                <span className="text-white ml-2 font-medium">{formatEUR(row.investments)}</span>
              </div>
              <div>
                <span className="text-slate-400">Cash:</span>
                <span className="text-white ml-2 font-medium">{formatEUR(row.cash)}</span>
              </div>
            </div>
            {row.comment && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <span className="text-slate-400 text-xs">Comentariu:</span>
                <p className="text-slate-300 text-sm italic mt-1">{row.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-3 px-2">Data</th>
            <th className="text-center py-3 px-2">RON</th>
            <th className="text-center py-3 px-2">EUR</th>
            <th className="text-center py-3 px-2">Profit/Pierdere</th>
            <th className="text-center py-3 px-2">Investiții</th>
            <th className="text-center py-3 px-2">Cash</th>
            <th className="text-center py-3 px-2">Comentariu</th>
          </tr>
          </thead>
          <tbody>
          {sortedData.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/50 text-white transition-colors">
              <td className="py-3 px-2 font-medium">{row.date}</td>
              <td className="text-center py-3 px-2">{formatRON(row.ron)}</td>
              <td className="text-center py-3 px-2">{formatEUR(row.eur)}</td>
              <td className={`text-center py-3 px-2 font-semibold ${row.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {row.gainLoss >= 0 ? '+' : ''}{formatRON(row.gainLoss)}
              </td>
              <td className="text-center py-3 px-2">{formatEUR(row.investments)}</td>
              <td className="text-center py-3 px-2">{formatEUR(row.cash)}</td>
              <td className="text-center py-3 px-2 text-slate-400 italic max-w-xs truncate" title={row.comment}>
                {row.comment || '-'}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;