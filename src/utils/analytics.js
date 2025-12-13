export const calculateWealthAnalytics = (data) => {
  if (data.length === 0) return null;

  const latestData = data[data.length - 1];
  const previousData = data.length > 1 ? data[data.length - 2] : latestData;

  const totalGainLoss = data.reduce((sum, entry) => sum + entry.gainLoss, 0);
  const avgGainLoss = totalGainLoss / data.length;
  const changeEUR = latestData.eur - previousData.eur;
  const changePercent = previousData.eur !== 0 ? ((changeEUR / previousData.eur) * 100).toFixed(2) : 0;
  const positiveGains = data.filter(d => d.gainLoss > 0).length;
  const winRate = ((positiveGains / data.length) * 100).toFixed(1);

  const growthData = data.map((entry, idx) => {
    if (idx === 0) return { ...entry, growth: 0 };
    const prevEur = data[idx - 1].eur;
    return { ...entry, growth: ((entry.eur - prevEur) / prevEur) * 100 };
  });

  const assetAllocationData = data.map(entry => {
    const total = entry.investments + entry.cash;
    const investmentsPct = total > 0 ? (entry.investments / total) * 100 : 0;
    const cashPct = total > 0 ? (entry.cash / total) * 100 : 0;

    return {
      date: entry.date,
      investments: parseFloat(investmentsPct.toFixed(2)),
      cash: parseFloat(cashPct.toFixed(2)),
      total: total,
    };
  });

  const returns = growthData.slice(1).map(d => d.growth);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  let peak = data[0].eur;
  let maxDrawdown = 0;
  data.forEach(entry => {
    if (entry.eur > peak) peak = entry.eur;
    const drawdown = ((peak - entry.eur) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const monthlyData = {};
  data.forEach(entry => {
    const [day, month, year] = entry.date.split('.');
    const key = `${year}-${month}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { values: [], gains: [] };
    }
    monthlyData[key].values.push(entry.eur);
    monthlyData[key].gains.push(entry.gainLoss);
  });

  const monthlyPerformance = Object.entries(monthlyData).map(([key, vals]) => {
    const avgValue = vals.values.reduce((a, b) => a + b, 0) / vals.values.length;
    const totalGain = vals.gains.reduce((a, b) => a + b, 0);
    return { month: key, avgValue, totalGain };
  });

  return {
    latestData,
    previousData,
    totalGainLoss,
    avgGainLoss,
    changeEUR,
    changePercent,
    positiveGains,
    winRate,
    growthData,
    assetAllocationData,
    volatility,
    maxDrawdown,
    monthlyPerformance
  };
};

export const calculateInvestmentAnalytics = (investmentData) => {
  if (!investmentData || investmentData.length === 0) return null;

  const totalInvested = investmentData.reduce((acc, curr) => acc + curr['Suma investita'], 0);
  const totalCurrentValue = investmentData.reduce((acc, curr) => acc + curr['Valoare actuala'], 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const avgTER = investmentData.reduce((acc, curr) => acc + curr['TER'], 0) / investmentData.length;

  const rebalancingData = investmentData.map(item => {
    const targetValue = (item['Alocare'] / 100) * totalCurrentValue;
    const rebalanceAmount = targetValue - item['Valoare actuala'];
    return {
      name: item.Ticker,
      'Alocare actuala': item['Alocare actuala'],
      'Alocare dorită': item['Alocare'],
      'Rebalansare (€)': rebalanceAmount,
    };
  });

  return {
    totalInvested,
    totalCurrentValue,
    totalProfit,
    totalProfitPercentage,
    avgTER,
    rebalancingData
  };
};