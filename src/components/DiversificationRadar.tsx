import {PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip} from "recharts";
import {Shield} from "lucide-react";
import {InvestmentData, MergedData} from "../types";
import React from "react";

const DiversificationRadar: React.FC<{
  latestData: MergedData;
  grandTotal: number;
  investmentData: InvestmentData[];
}> = ({latestData, grandTotal, investmentData}) => {
  // Calculate diversification scores (0-100)
  const assetTypeScore = Math.min(100, ((1 - Math.abs(0.33 - (latestData.cash / grandTotal))) * 100) +
    ((1 - Math.abs(0.33 - (latestData.investments / grandTotal))) * 100) +
    ((1 - Math.abs(0.34 - (latestData.assetsTotal / grandTotal))) * 100)) / 3;

  const currencyScore = latestData.ron > 0 && latestData.eur > 0 ? 80 : 40;

  const investmentDiversification = investmentData.length > 0
    ? Math.min(100, investmentData.length * 25)
    : 0;

  const allocationBalance = investmentData.length > 0
    ? 100 - (investmentData.reduce((sum, inv) => sum + Math.abs(inv.alocareActuala - inv.alocare), 0) / investmentData.length) * 2
    : 0;

  const radarData = [
    { subject: 'Tipuri Active', score: assetTypeScore, fullMark: 100 },
    { subject: 'Diversificare Valutară', score: currencyScore, fullMark: 100 },
    { subject: 'Nr. Investiții', score: investmentDiversification, fullMark: 100 },
    { subject: 'Echilibru Alocare', score: Math.max(0, allocationBalance), fullMark: 100 },
    { subject: 'Lichiditate', score: (latestData.cash / grandTotal) * 100 > 20 ? 80 : 50, fullMark: 100 }
  ];

  const overallScore = radarData.reduce((sum, d) => sum + d.score, 0) / radarData.length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Shield className="text-cyan-400" size={24}/>
        Scor Diversificare: <span className={`ml-2 ${overallScore > 70 ? 'text-green-400' : overallScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
          {overallScore?.toFixed(0)}/100
        </span>
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#334155"/>
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{fontSize: 11}}/>
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8"/>
          <Radar name="Scor" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6}/>
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
            formatter={(value: any) => [`${(value as number)?.toFixed(1)}`, 'Scor']}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-slate-400">
        <p className="mb-1">📊 Tipuri Active: echilibru între cash, investiții și active fizice</p>
        <p className="mb-1">💱 Diversificare Valutară: expunere la EUR și RON</p>
        <p className="mb-1">📈 Nr. Investiții: distribuție pe mai multe ETF-uri</p>
        <p className="mb-1">⚖️ Echilibru Alocare: apropiere de țintele de alocare</p>
        <p>💰 Lichiditate: procent optim de cash disponibil</p>
      </div>
    </div>
  );
};

export default DiversificationRadar;