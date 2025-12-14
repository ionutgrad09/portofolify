import React, {useState, useEffect, useMemo, FormEvent} from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp, DollarSign, PiggyBank, Wallet, ArrowUp, ArrowDown, Activity, Target, Banknote, RefreshCcw,
  Building,
  Briefcase
} from 'lucide-react';
import HistoryTable from "./components/HistoryTable";
import {
  processAssetsCSVData,
  processCashSplitCSVData,
  processInvestmentsCSVData,
  processWealthCSVData
} from "./utils/csv";
import {formatEUR, getFromStorage, saveToStorage} from "./utils/utils";
import InvestmentsSection from "./components/InvestmentSection";
import CustomTooltip from "./components/CustomTooltip";
import LoginForm from "./components/LoginForm";
import SyncModal from "./components/SyncModal";
import {CONFIG} from "./utils/config";
import EmptyState from "./components/EmptyState";
import CashSplitTable from "./components/CashSplitTable";
import type { WealthData, CashSplitData, InvestmentData, AssetData, MergedData, AssetAllocationData, GrowthData } from "./types";

// remove duplicated local interfaces in favor of shared types
// ...existing code...

const WealthTracker: React.FC = () => {
  const [historyData, setHistoryData] = useState<WealthData[]>(() => getFromStorage<WealthData>(CONFIG.STORAGE_KEYS.DATA));
  const [cashSplitData, setCashSplitData] = useState<CashSplitData[]>(() => getFromStorage<CashSplitData>(CONFIG.STORAGE_KEYS.CASH_SPLIT));
  const [investmentData, setInvestmentData] = useState<InvestmentData[]>(() => getFromStorage<InvestmentData>(CONFIG.STORAGE_KEYS.INVESTMENT));
  const [assetsData, setAssetsData] = useState<AssetData[]>(() => getFromStorage<AssetData>('wealthAssetsData'));

  // Add responsive flag for mobile layout
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);


  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>("Așteptare...");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY) as string);
    if (session && Date.now() < session.expiry) {
      setLoggedIn(true);
    } else {
      localStorage.removeItem(CONFIG.SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    saveToStorage(CONFIG.STORAGE_KEYS.DATA, historyData);
  }, [historyData]);

  useEffect(() => {
    saveToStorage(CONFIG.STORAGE_KEYS.CASH_SPLIT, cashSplitData);
  }, [cashSplitData]);

  useEffect(() => {
    saveToStorage(CONFIG.STORAGE_KEYS.INVESTMENT, investmentData);
  }, [investmentData]);

  useEffect(() => {
    saveToStorage('wealthAssetsData', assetsData);
  }, [assetsData]);

  useEffect(() => {
    fetchAndProcessAllCSV();
  }, []);

  const handlePinSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      password: { value: string };
    };

    const loginResult = await fetch("/.netlify/functions/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: target.password.value,
      }),
    });

    if (loginResult.status === 200) {
      const expiry = Date.now() + CONFIG.SESSION_DURATION_MS;
      localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({expiry}));
      setLoggedIn(true);
    } else {
      alert('PIN greșit! Încercă din nou.');
    }
  };

  const fetchCSV = async (url: string): Promise<string> => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Eroare HTTP: ${response.status}`);
    }

    return response.text();
  };

  const fetchAndProcessAllCSV = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      // 1. Preluare și procesare Istoric Complet
      setSyncStatus("1/4: Se descarcă Istoricul Complet...");
      const historyCsvText = await fetchCSV("/.netlify/functions/history");
      setSyncStatus("1/4: Procesează Istoricul Complet...");
      setHistoryData(processWealthCSVData(historyCsvText));

      // 2. Preluare și procesare Cash Split
      setSyncStatus("2/4: Se descarcă Distribuția Cash...");
      const cashSplitCsvText = await fetchCSV("/.netlify/functions/cash");
      setSyncStatus("2/4: Procesează Distribuția Cash...");
      setCashSplitData(processCashSplitCSVData(cashSplitCsvText));

      // 3. Preluare și procesare Investiții
      setSyncStatus("3/4: Se descarcă Portofoliul de Investiții...");
      const investmentsCsvText = await fetchCSV("/.netlify/functions/investments");
      setSyncStatus("3/4: Procesează Portofoliul de Investiții...");
      const parsedInvestments = processInvestmentsCSVData(investmentsCsvText);
      setInvestmentData(parsedInvestments);

      // 4. Preluare și procesare Assets
      setSyncStatus("4/4: Se descarcă Activele...");
      const assetsCsvText = await fetchCSV("/.netlify/functions/assets");
      setSyncStatus("4/4: Procesează Activele...");
      setAssetsData(processAssetsCSVData(assetsCsvText));

      // Finalizare
      setSyncStatus("Sincronizare finalizată cu succes!");
      setTimeout(() => setIsSyncing(false), 1000);

    } catch (error: any) {
      console.error("Eroare la actualizarea automată:", error);
      setSyncStatus(`Eroare: ${error.message}.`);
    }
  };

  const mergedData: MergedData[] = useMemo(() => {
    if (historyData.length === 0 && assetsData.length === 0) return [];

    const allDates = new Set([...historyData.map(d => d.date), ...assetsData.map(d => d.date)]);
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('.').map(Number);
      const [dayB, monthB, yearB] = b.split('.').map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });

    let lastHistory: WealthData = { eur: 0, investments: 0, cash: 0, ron: 0, gainLoss: 0, date: '', comment: '' };
    let lastAssets: AssetData = { total: 0, assets: {}, date: '' };

    return sortedDates.map(date => {
      const historyEntry = historyData.find(h => h.date === date);
      const assetsEntry = assetsData.find(a => a.date === date);

      if (historyEntry) lastHistory = historyEntry;
      if (assetsEntry) lastAssets = assetsEntry;

      const netWorth = lastHistory.eur + lastAssets.total;
      const { eur, investments, cash, ron, gainLoss, comment } = lastHistory;

      return {
        date,
        eur,
        investments,
        cash,
        ron,
        gainLoss,
        comment,
        assetsTotal: lastAssets.total,
        assetsBreakdown: lastAssets.assets,
        netWorth
      };
    });
  }, [historyData, assetsData]);

  const assetAllocationData: AssetAllocationData[] = mergedData.map(entry => {
    const total = entry.netWorth;
    const investmentsPct = total > 0 ? (entry.investments / total) * 100 : 0;
    const cashPct = total > 0 ? (entry.cash / total) * 100 : 0;
    const assetsPct = total > 0 ? (entry.assetsTotal / total) * 100 : 0;

    return {
      date: entry.date,
      investments: parseFloat(investmentsPct.toFixed(2)),
      cash: parseFloat(cashPct.toFixed(2)),
      assets: parseFloat(assetsPct.toFixed(2)),
      total: total,
    };
  });


  if (!loggedIn) {
    return (
      <LoginForm onSubmit={handlePinSubmit}/>
    );
  }

  if (historyData.length === 0) {
    return <EmptyState onSync={fetchAndProcessAllCSV}/>
  }

  const latestData = mergedData[mergedData.length - 1];
  const previousData = mergedData.length > 1 ? mergedData[mergedData.length - 2] : latestData;

  // ASSETS CALCULATIONS
  const totalAssetsEUR = latestData.assetsTotal;
  const grandTotal = latestData.netWorth;

  const changeNetWorth = latestData.netWorth - previousData.netWorth;
  const changePercent = previousData.netWorth !== 0 ? ((changeNetWorth / previousData.netWorth) * 100).toFixed(2) : '0';

  const growthData: GrowthData[] = mergedData.map((entry, idx) => {
    if (idx === 0) return {...entry, growth: 0};
    const prevNetWorth = mergedData[idx - 1].netWorth;
    const growth = prevNetWorth !== 0 ? ((entry.netWorth - prevNetWorth) / prevNetWorth) * 100 : 0;
    return {...entry, growth};
  });

  // CASH SPLIT CALCULATIONS
  const totalCashEUR = cashSplitData.reduce((sum, item) => sum + item.totalEur, 0);
  const sortedCashSplitPieData = [...cashSplitData]
    .map((item, index) => ({
      name: item.sursa,
      value: item.totalEur,
      color: CONFIG.COLORS.PIE[index % CONFIG.COLORS.PIE.length]
    }))
    .sort((a, b) => b.value - a.value);

  const latestAssetsEntry = assetsData.length > 0 ? assetsData[assetsData.length - 1] : {total: 0, assets: {}};
  const sortedAssetsPieData = Object.entries(latestAssetsEntry.assets || {})
    .map(([name, value], index) => ({
      name,
      value: value as number,
      color: ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'][index % 6]
    }))
    .sort((a, b) => b.value - a.value);

  const assetsEvolutionData = assetsData.map(entry => {
    return {
      date: entry.date,
      ...entry.assets
    };
  });

  const assetKeys = Object.keys(latestAssetsEntry.assets || {});


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header (DOAR SYNC) */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Portofolify
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Analiză completă a portofoliului tău</p>
          </div>
          <div className="w-full sm:w-auto flex justify-start sm:justify-end">
            <button
              onClick={fetchAndProcessAllCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all w-full sm:w-auto justify-center"
            >
              <RefreshCcw size={20}/>
              <span>Actualizează Datele</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-2xl border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="text-blue-200" size={28}/>
                <span className="text-blue-200 text-xs font-medium">AVERE NETĂ TOTALĂ</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{formatEUR(grandTotal)}</div>
              <div className="text-blue-200 text-sm mb-2">Lichid: {formatEUR(latestData.eur)}</div>
              <div
                className={`flex items-center gap-1 text-sm ${changeNetWorth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {changeNetWorth >= 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                <span>{changePercent}% vs ultima perioadă</span>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-2xl border border-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <PiggyBank className="text-purple-200" size={28}/>
                <span className="text-purple-200 text-xs font-medium">INVESTIȚII BURSIERE</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{formatEUR(latestData.investments)}</div>
              <div
                className="text-purple-200 text-sm mb-2">{grandTotal ? ((latestData.investments / grandTotal) * 100).toFixed(1) : 0}%
                din total
              </div>
              <div className="flex items-center gap-1 text-sm text-purple-300">
                <Target size={16}/>
                <span>Investitii in {investmentData.length} ETFs</span>
              </div>
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl p-6 shadow-2xl border border-green-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Wallet className="text-green-200" size={28}/>
                <span className="text-green-200 text-xs font-medium">CASH TOTAL</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{formatEUR(latestData.cash)}</div>
              <div className="text-green-200 text-sm mb-2">
                {grandTotal ? ((latestData.cash / grandTotal) * 100).toFixed(1) : 0}% din total
              </div>
              <div className="flex items-center gap-1 text-sm text-green-300">
                <Activity size={16}/>
                <span>{cashSplitData.length} surse de cash</span>
              </div>
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-orange-600 to-red-800 rounded-2xl p-6 shadow-2xl border border-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Building className="text-orange-200" size={28}/>
                <span className="text-orange-200 text-xs font-medium">ACTIVE FIZICE / ALTELE</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{formatEUR(totalAssetsEUR)}</div>
              <div
                className="text-orange-200 text-sm mb-2">{grandTotal ? ((totalAssetsEUR / grandTotal) * 100).toFixed(1) : 0}%
                din total
              </div>
              <div className="flex items-center gap-1 text-sm text-orange-300">
                <Briefcase size={16}/>
                <span>{assetsData.length} active înregistrate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">

            {/* GRAFIC 1: Valoarea Totală a Averii (EUR) */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={24}/>
                Valoarea Totală a Averii (EUR)
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={mergedData}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end"
                         height={80}/>
                  <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={3} fillOpacity={1}
                        fill="url(#colorNetWorth)" name="Avere Netă"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>


            {/* GRAFIC 2: Evoluția Activelor (Investiții, Cash, Active) */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-400" size={24}/>
                Evoluția Activelor (Investiții, Cash, Active)
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={mergedData}>
                  <defs>
                    <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end"
                         height={80}/>
                  <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="assetsTotal" stackId="a" stroke="#f59e0b" fillOpacity={1}
                        fill="url(#colorAssets)" name="Active Fizice"/>
                  <Area type="monotone" dataKey="investments" stackId="a" stroke="#a855f7" fillOpacity={1}
                        fill="url(#colorInvestments)" name="Investiții"/>
                  <Area type="monotone" dataKey="cash" stackId="a" stroke="#22c55e" fillOpacity={1}
                        fill="url(#colorCash)" name="Cash"/>
                  <Legend wrapperStyle={{paddingTop: 10}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            {/* GRAFIC 2: Alocarea Activelor (%) în Timp (Stacked Bar Chart) */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PiggyBank className="text-green-400" size={24}/>
                Alocarea Activelor (%) în Timp
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetAllocationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end"
                         height={60}/>
                  <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `${val}%`}/>
                  <Tooltip
                    content={({active, payload, label}) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
                            <p className="text-slate-300 font-medium mb-1">{label}</p>
                            {payload.map((pld, index) => (
                              <div key={index} className="flex items-center gap-2"
                                   style={{color: pld.color || "white"}}>
                                <span>{pld.name}:</span>
                                <span className="font-bold">{pld.value as number}%</span>
                              </div>
                            ))}
                            <p className="text-xs text-slate-400 mt-2">Total
                              EUR: {formatEUR((payload[0].payload as AssetAllocationData).total)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{paddingTop: 10}}/>
                  <Bar dataKey="investments" stackId="a" fill="#a855f7" name="Investiții %"/>
                  <Bar dataKey="cash" stackId="a" fill="#22c55e" name="Cash %"/>
                  <Bar dataKey="assets" stackId="a" fill="#f59e0b" name="Active %"/>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-slate-400 text-sm mt-4 text-center">
                Alocarea
                curentă: <b>Investiții {assetAllocationData.length > 0 ? assetAllocationData[assetAllocationData.length - 1].investments : 0}%</b> / <b>Cash {assetAllocationData.length > 0 ? assetAllocationData[assetAllocationData.length - 1].cash : 0}%</b> / <b>Active {assetAllocationData.length > 0 ? assetAllocationData[assetAllocationData.length - 1].assets : 0}%</b>
              </p>
            </div>

            {/* Rata de Creștere - HEIGHT: 350 */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="text-pink-400" size={24}/>
                Rata de Creștere
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end"
                         height={60}/>
                  <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `${val.toFixed(0)}%`}/>
                  <Tooltip content={<CustomTooltip percentage/>}/>
                  <Line type="monotone" dataKey="growth" stroke="#ec4899" strokeWidth={2}
                        dot={{fill: '#ec4899', r: 3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* NEW ROW: Profit & Loss + Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div
            className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-purple-400" size={24}/>
              Profit & Pierdere Săptămânală
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historyData}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3"/>
                <XAxis dataKey="date" stroke="#f1f5f9"/>
                <YAxis stroke="#f1f5f9"/>
                <Tooltip content={<CustomTooltip ron/>} cursor={{fill: 'rgba(255,255,255,0.1)'}}/>
                <Bar dataKey="gainLoss" name="Profit">
                  {historyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gainLoss >= 0 ? '#22c55e' : '#ef4444'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Distribuție Totală</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    {name: 'Cash', value: latestData?.cash || 0, color: '#22c55e'},
                    {name: 'Investiții', value: latestData?.investments || 0, color: '#a855f7'},
                    {name: 'Active', value: totalAssetsEUR || 0, color: '#f59e0b'}
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    {name: 'Cash', value: latestData?.cash || 0, color: '#22c55e'},
                    {name: 'Investiții', value: latestData?.investments || 0, color: '#a855f7'},
                    {name: 'Active', value: totalAssetsEUR || 0, color: '#f59e0b'}
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color}/>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-2xl font-bold text-white">{formatEUR(grandTotal)}</span>
              <p className="text-xs text-slate-400">Total Avere</p>
            </div>
          </div>
        </div>

        {/* CASH SPLIT SECTION */}
        {cashSplitData.length > 0 && (
          <div className="mt-6 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-800">

            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <Banknote className="text-purple-400" size={30}/>
              Cash (Total: {formatEUR(totalCashEUR)})
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">Distribuția Lichidităților (EUR Echivalent)</h2>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={sortedCashSplitPieData}
                      cx="50%"
                      cy={isMobile ? "40%" : "45%"}
                      outerRadius={isMobile ? 90 : 120}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                      labelLine={false}
                    >
                      {sortedCashSplitPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color}/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend
                      layout={isMobile ? "horizontal" : "vertical"}
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      align={isMobile ? "center" : "right"}
                      wrapperStyle={{
                        paddingTop: isMobile ? 0 : '10px',
                        color: '#f1f5f9',
                        fontSize: isMobile ? '11px' : '12px',
                      }}
                      formatter={(value, entry) => {
                        const percentage = (entry.payload?.value / totalCashEUR * 100).toFixed(1);
                        return (
                          <span style={{color: (entry as any).color, fontWeight: 'bold'}}>
              {value}: {formatEUR(entry.payload?.value)} ({percentage}%)
            </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <CashSplitTable data={cashSplitData} totalCashEUR={totalCashEUR}/>
            </div>
          </div>
        )}

        {/* ASSETS SECTION */}
        {assetsData.length > 0 && (
          <div className="mt-6 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-800">
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <Building className="text-orange-400" size={30}/>
              Active Personale (Total: {formatEUR(totalAssetsEUR)})
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">Distribuția Activelor</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sortedAssetsPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                    >
                      {sortedAssetsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color}/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>

                    <Legend
                      layout={isMobile ? "horizontal" : "vertical"}
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      align={isMobile ? "center" : "right"}
                      wrapperStyle={{
                        paddingTop: isMobile ? 0 : '10px',
                        color: '#f1f5f9',
                        fontSize: isMobile ? '11px' : '12px',
                      }}
                      formatter={(value, entry) => {
                        const percentage = (entry.payload?.value / totalAssetsEUR * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">Evoluție Active Individuale</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={assetsEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end"
                           height={60}/>
                    <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val / 1000).toFixed(0)}k`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{paddingTop: 10}}/>
                    {assetKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'][index % 6]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800 overflow-hidden lg:col-span-2">
                <h2 className="text-xl font-bold text-white mb-4">Listă Active</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Activ</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Valoare (EUR)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAssetsPieData.map((item, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          {formatEUR(item.value)}
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="my-8 border-slate-700"/>

        <InvestmentsSection data={investmentData}/>
        <hr className="my-8 border-slate-700"/>
        <HistoryTable data={historyData}/>
        <SyncModal isOpen={isSyncing} status={syncStatus} onClose={() => setIsSyncing(false)}/>
      </div>
    </div>
  );
};

export default WealthTracker;

