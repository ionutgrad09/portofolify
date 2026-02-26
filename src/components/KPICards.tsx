import {Activity, ArrowDown, ArrowUp, Briefcase, Building, DollarSign, PiggyBank, Target, Wallet} from "lucide-react";
import {formatEUR} from "../utils/utils";
import {MergedData} from "../types";
import React from "react";

const KPICards: React.FC<{
  grandTotal: number;
  latestData: MergedData;
  totalAssetsEUR: number;
  changeNetWorth: number;
  changePercent: string;
  cashSplitLength: number;
  assetsCount: number;
  investmentDataLength: number;
}> = ({grandTotal, latestData, totalAssetsEUR, changeNetWorth, changePercent, cashSplitLength, assetsCount, investmentDataLength}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-2xl border border-blue-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <DollarSign className="text-blue-200" size={28}/>
          <span className="text-blue-200 text-xs font-medium">AVERE NETĂ TOTALĂ</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">{formatEUR(grandTotal)}</div>
        <div className="text-blue-200 text-sm mb-2">Lichid: {formatEUR(latestData.eur)}</div>
        <div className={`flex items-center gap-1 text-sm ${changeNetWorth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {changeNetWorth >= 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
          <span>{changePercent}% vs ultima perioadă</span>
        </div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl p-6 shadow-2xl border border-green-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <Wallet className="text-green-200" size={28}/>
          <span className="text-green-200 text-xs font-medium">CASH TOTAL</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">{formatEUR(latestData.cash)}</div>
        <div className="text-green-200 text-sm mb-2">
          {grandTotal ? ((latestData.cash / grandTotal) * 100)?.toFixed(1) : 0}% din total
        </div>
        <div className="flex items-center gap-1 text-sm text-green-300">
          <Target size={16}/>
          <span>{cashSplitLength} surse de cash</span>
        </div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-orange-600 to-red-800 rounded-2xl p-6 shadow-2xl border border-orange-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <Building className="text-orange-200" size={28}/>
          <span className="text-orange-200 text-xs font-medium">ACTIVE FIZICE</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">{formatEUR(totalAssetsEUR)}</div>
        <div className="text-orange-200 text-sm mb-2">
          {grandTotal ? ((totalAssetsEUR / grandTotal) * 100)?.toFixed(1) : 0}% din total
        </div>
        <div className="flex items-center gap-1 text-sm text-orange-300">
          <Briefcase size={16}/>
          <span>{assetsCount} active înregistrate</span>
        </div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-2xl border border-purple-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <PiggyBank className="text-purple-200" size={28}/>
          <span className="text-purple-200 text-xs font-medium">INVESTIȚII</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">{formatEUR(latestData.investments)}</div>
        <div className="text-purple-200 text-sm mb-2">
          {grandTotal ? ((latestData.investments / grandTotal) * 100)?.toFixed(1) : 0}% din total
        </div>
        <div className="flex items-center gap-1 text-sm text-purple-300">
          <Activity size={16}/>
          <span>Investitii in {investmentDataLength} ETFs</span>
        </div>
      </div>
    </div>
  </div>
);

export default KPICards;