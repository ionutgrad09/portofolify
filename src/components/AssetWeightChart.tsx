import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AssetData, MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

interface Props {
  assetsData: AssetData[];
  mergedData: MergedData[];
}

const AssetWeightChart: React.FC<Props> = ({ assetsData, mergedData }) => {
  if (!assetsData || assetsData.length === 0 || !mergedData || mergedData.length === 0) return null;

  const sortedAssets = [...assetsData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );
  const sortedMerged = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const assetKeys = Object.keys(sortedAssets[sortedAssets.length - 1]?.assets ?? {});
  if (assetKeys.length === 0) return null;

  // For each asset date, find closest net worth
  const chartData = sortedAssets.map(entry => {
    const entryTime = parseDDMMYYYY(entry.date).getTime();
    const closest = sortedMerged.reduce((prev, curr) =>
      Math.abs(parseDDMMYYYY(curr.date).getTime() - entryTime) <
      Math.abs(parseDDMMYYYY(prev.date).getTime() - entryTime) ? curr : prev
    );
    const totalWealth = closest.netWorth;
    const row: Record<string, any> = { date: entry.date };
    assetKeys.forEach(key => {
      row[key] = totalWealth > 0
        ? parseFloat(((entry.assets[key] ?? 0) / totalWealth * 100).toFixed(2))
        : 0;
    });
    return row;
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <PieIcon className="text-amber-400" size={20} />
        Active ca % din Avere Totală
      </h3>
      <p className="text-xs text-slate-400 mb-4">Cât reprezintă fiecare activ din totalul averii nete în timp.</p>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#e2e8f0' }} angle={-45} textAnchor="end" height={50} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0' }} tickFormatter={(v: number) => `${v}%`} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
            formatter={(v: any, name: string) => [`${Number(v).toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#f1f5f9' }} />
          {assetKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stackId="a"
              stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetWeightChart;
