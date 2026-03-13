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
  TrendingUp, DollarSign, PiggyBank, Banknote, RefreshCcw,
  Building, Activity
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
import KPICards from "./components/KPICards";
import ProjectionChart from "./components/ProjectionChart";
import type { WealthData, CashSplitData, InvestmentData, AssetData, MergedData, AssetAllocationData } from "./types";
import MonthlyPerformanceHeatmap from "./components/MonthlyPerformanceHeatmap";
import FinancialGoalsProgress from "./components/FinancialGoalsProgress";
import DrawdownChart from "./components/DrawdownChart";
import AnnualPerformanceChart from "./components/AnnualPerformanceChart";
import CumulativeReturnChart from "./components/CumulativeReturnChart";
import ScenarioProjectionChart from "./components/ScenarioProjectionChart";
import LiquidityChart from "./components/LiquidityChart";
import TerDragChart from "./components/TerDragChart";
import InvestmentGrowthChart from "./components/InvestmentGrowthChart";
import PortfolioDriftChart from "./components/PortfolioDriftChart";
import InvestmentForecastChart from "./components/InvestmentForecastChart";

const WealthTracker: React.FC = () => {
  const [historyData, setHistoryData] = useState<WealthData[]>(() => getFromStorage<WealthData>(CONFIG.STORAGE_KEYS.DATA));
  const [cashSplitData, setCashSplitData] = useState<CashSplitData[]>(() => getFromStorage<CashSplitData>(CONFIG.STORAGE_KEYS.CASH_SPLIT));
  const [investmentData, setInvestmentData] = useState<InvestmentData[]>(() => getFromStorage<InvestmentData>(CONFIG.STORAGE_KEYS.INVESTMENT));
  const [assetsData, setAssetsData] = useState<AssetData[]>(() => getFromStorage<AssetData>(CONFIG.STORAGE_KEYS.ASSET_ALLOCATION));

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
  const [activeTab, setActiveTab] = useState<string>("sumar");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY) as string);
    if (session && Date.now() < session.expiry) {
      setLoggedIn(true);
    } else {
      localStorage.removeItem(CONFIG.SESSION_KEY);
      localStorage.removeItem(CONFIG.SESSION_PASS_KEY);
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
    saveToStorage(CONFIG.STORAGE_KEYS.ASSET_ALLOCATION, assetsData);
  }, [assetsData]);

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
      // Save password for subsequent requests
      localStorage.setItem(CONFIG.SESSION_PASS_KEY, target.password.value);
      setLoggedIn(true);
    } else {
      alert('PIN greșit! Încercă din nou.');
    }
  };

  const fetchCSV = async (url: string): Promise<string> => {
    const password = localStorage.getItem(CONFIG.SESSION_PASS_KEY);
    if (!password) {
      throw new Error('Nu există parolă salvată. Relogați-vă.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

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
    const rawInvestments = total > 0 ? (entry.investments / total) * 100 : 0;
    const rawCash = total > 0 ? (entry.cash / total) * 100 : 0;
    const rawAssets = total > 0 ? (entry.assetsTotal / total) * 100 : 0;

    const sum = rawInvestments + rawCash + rawAssets;
    const factor = sum > 0 ? 100 / sum : 0;

    // Normalize to ensure the stacked bars never exceed 100%
    let investments = parseFloat((rawInvestments * factor).toFixed(2));
    let cash = parseFloat((rawCash * factor).toFixed(2));
    let assets = parseFloat((rawAssets * factor).toFixed(2));

    // Fix floating-point drift by adjusting the last component
    const drift = 100 - (investments + cash + assets);
    assets = parseFloat((assets + drift).toFixed(2));

    // Clamp to [0, 100]
    investments = Math.min(100, Math.max(0, investments));
    cash = Math.min(100, Math.max(0, cash));
    assets = Math.min(100, Math.max(0, assets));

    return {
      date: entry.date,
      investments,
      cash,
      assets,
      total,
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
  const changePercent = previousData.netWorth !== 0 ? ((changeNetWorth / previousData.netWorth) * 100)?.toFixed(2) : '0';

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

  const tabs = [
    { id: 'sumar',       label: 'Sumar' },
    { id: 'analiza',     label: 'Analiză' },
    { id: 'proiectii',   label: 'Proiecții' },
    { id: 'investitii',  label: 'Investiții' },
    ...(cashSplitData.length > 0  ? [{ id: 'cash',    label: 'Cash' }]   : []),
    ...(assetsData.length > 0     ? [{ id: 'active',  label: 'Active' }] : []),
    { id: 'istoric',     label: 'Istoric' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-[1800px] mx-auto">

        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
              Portofolify
            </h1>
            <p className="text-slate-400 text-sm">Analiză completă a portofoliului tău</p>
          </div>
          <button
            onClick={fetchAndProcessAllCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all w-full sm:w-auto justify-center"
          >
            <RefreshCcw size={18}/>
            <span>Actualizează</span>
          </button>
        </div>

        {/* KPI Cards — always visible */}
        <KPICards
          grandTotal={grandTotal}
          latestData={latestData}
          totalAssetsEUR={totalAssetsEUR}
          changeNetWorth={changeNetWorth}
          changePercent={changePercent}
          cashSplitLength={cashSplitData.length}
          assetsCount={Object.keys(assetsData.length > 0 ? assetsData[0].assets : {}).length}
          investmentDataLength={investmentData.length}
        />

        {/* Tab bar — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-6 mt-4">
          <div className="flex gap-1 min-w-max sm:min-w-0 bg-slate-800/60 p-1 rounded-xl border border-slate-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SUMAR ────────────────────────────────────────────── */}
        {activeTab === 'sumar' && (
          <div className="space-y-6">
            {/* Net worth chart + allocation stacked bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-400" size={24}/>
                  Valoarea Totală
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mergedData}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60}/>
                    <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val/1000).toFixed(0)}k`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" name="Avere Netă"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <PiggyBank className="text-green-400" size={24}/>
                  Alocare Actuale (%)
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assetAllocationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 9}} angle={-45} textAnchor="end" height={50}/>
                    <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `${val}%`} domain={[0, 100]}/>
                    <Tooltip
                      content={({active, payload, label}) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
                              <p className="text-slate-300 font-medium mb-1">{label}</p>
                              {payload.map((pld, index) => (
                                <div key={index} className="flex items-center gap-2" style={{color: pld.color || 'white'}}>
                                  <span>{pld.name}:</span>
                                  <span className="font-bold">{pld.value as number}%</span>
                                </div>
                              ))}
                              <p className="text-xs text-slate-400 mt-2">Total: {formatEUR((payload[0].payload as AssetAllocationData).total)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{paddingTop: 8, fontSize: 11}}/>
                    <Bar dataKey="investments" stackId="a" fill="#a855f7" name="Investiții %"/>
                    <Bar dataKey="assets" stackId="a" fill="#f59e0b" name="Active %"/>
                    <Bar dataKey="cash" stackId="a" fill="#22c55e" name="Cash %"/>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-slate-400 text-xs mt-2 text-center">
                  Investiții <b className="text-purple-400">{assetAllocationData[assetAllocationData.length - 1]?.investments ?? 0}%</b>
                  {' / '}Cash <b className="text-green-400">{assetAllocationData[assetAllocationData.length - 1]?.cash ?? 0}%</b>
                  {' / '}Active <b className="text-amber-400">{assetAllocationData[assetAllocationData.length - 1]?.assets ?? 0}%</b>
                </p>
              </div>
            </div>

            {/* Stacked evolution */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-400" size={24}/>
                Evoluția Activelor (Investiții, Cash, Active)
              </h2>
              <ResponsiveContainer width="100%" height={280}>
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
                    <linearGradient id="colorAssets2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60}/>
                  <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="assetsTotal" stackId="a" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAssets2)" name="Active Fizice"/>
                  <Area type="monotone" dataKey="investments" stackId="a" stroke="#a855f7" fillOpacity={1} fill="url(#colorInvestments)" name="Investiții"/>
                  <Area type="monotone" dataKey="cash" stackId="a" stroke="#22c55e" fillOpacity={1} fill="url(#colorCash)" name="Cash"/>
                  <Legend wrapperStyle={{paddingTop: 8}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative return + Liquidity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CumulativeReturnChart mergedData={mergedData}/>
              <LiquidityChart mergedData={mergedData}/>
            </div>
          </div>
        )}

        {/* ── ANALIZĂ ──────────────────────────────────────────── */}
        {activeTab === 'analiza' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DrawdownChart mergedData={mergedData}/>
              <AnnualPerformanceChart mergedData={mergedData}/>
            </div>
            <MonthlyPerformanceHeatmap mergedData={mergedData}/>
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="text-purple-400" size={24}/>
                Profit & Pierdere Săptămânală
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={historyData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3"/>
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 9}} angle={-45} textAnchor="end" height={50}/>
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}}/>
                  <Tooltip content={<CustomTooltip ron/>} cursor={{fill: 'rgba(255,255,255,0.1)'}}/>
                  <Bar dataKey="gainLoss" name="Profit">
                    {historyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.gainLoss >= 0 ? '#22c55e' : '#ef4444'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── PROIECȚII ────────────────────────────────────────── */}
        {activeTab === 'proiectii' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialGoalsProgress mergedData={mergedData}/>
              <ProjectionChart mergedData={mergedData}/>
            </div>
            <ScenarioProjectionChart mergedData={mergedData}/>
          </div>
        )}

        {/* ── INVESTIȚII ───────────────────────────────────────── */}
        {activeTab === 'investitii' && (
          <div className="space-y-6">
            <InvestmentsSection data={investmentData}/>
            {investmentData.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InvestmentGrowthChart investmentData={investmentData}/>
                  <TerDragChart investmentData={investmentData}/>
                </div>
                <PortfolioDriftChart investmentData={investmentData}/>
                <InvestmentForecastChart investmentData={investmentData}/>
              </>
            )}
          </div>
        )}

        {/* ── CASH ─────────────────────────────────────────────── */}
        {activeTab === 'cash' && cashSplitData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="text-purple-400" size={28}/>
              <h2 className="text-2xl font-bold text-white">Cash — Total: {formatEUR(totalCashEUR)}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Distribuția Lichidităților</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={sortedCashSplitPieData}
                      cx="50%"
                      cy={isMobile ? "38%" : "43%"}
                      outerRadius={isMobile ? 90 : 120}
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
                      wrapperStyle={{ paddingTop: isMobile ? 0 : '10px', color: '#f1f5f9', fontSize: isMobile ? '11px' : '14px' }}
                      formatter={(value, entry) => {
                        const pct = (entry.payload?.value / totalCashEUR * 100)?.toFixed(1);
                        return <span style={{color: (entry as any).color, fontWeight: 'bold'}}>{value}: {formatEUR(entry.payload?.value)} ({pct}%)</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CashSplitTable data={cashSplitData} totalCashEUR={totalCashEUR}/>
            </div>
          </div>
        )}

        {/* ── ACTIVE ───────────────────────────────────────────── */}
        {activeTab === 'active' && assetsData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="text-orange-400" size={28}/>
              <h2 className="text-2xl font-bold text-white">Active Personale — Total: {formatEUR(totalAssetsEUR)}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Distribuția Activelor</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={sortedAssetsPieData} cx="50%" cy="50%" outerRadius={isMobile ? 90 : 110} dataKey="value" label={false}>
                      {sortedAssetsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color}/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend
                      layout={isMobile ? "horizontal" : "vertical"}
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      align={isMobile ? "center" : "right"}
                      wrapperStyle={{ paddingTop: isMobile ? 0 : '10px', color: '#f1f5f9', fontSize: isMobile ? '11px' : '14px' }}
                      formatter={(value, entry) => {
                        const pct = (entry.payload?.value / totalAssetsEUR * 100)?.toFixed(1);
                        return `${value} (${pct}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Evoluție Active Individuale</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={assetsEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={50}/>
                    <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `€${(val/1000).toFixed(0)}k`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{paddingTop: 8}}/>
                    {assetKeys.map((key, index) => (
                      <Line key={key} type="monotone" dataKey={key}
                        stroke={['#F59E0B','#EF4444','#3B82F6','#10B981','#8B5CF6','#EC4899'][index % 6]}
                        strokeWidth={2} dot={false}/>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800 overflow-x-auto">
              <h3 className="text-lg font-bold text-white mb-4">Listă Active</h3>
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
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatEUR(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ISTORIC ──────────────────────────────────────────── */}
        {activeTab === 'istoric' && (
          <div className="space-y-6">
            <HistoryTable data={historyData}/>
          </div>
        )}

        <SyncModal isOpen={isSyncing} status={syncStatus} onClose={() => setIsSyncing(false)}/>
      </div>
    </div>
  );
};

export default WealthTracker;

