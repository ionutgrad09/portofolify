// Shared application types (component prop interfaces should remain local to their components)

export interface WealthData {
  date: string;
  ron: number;
  eur: number;
  gainLoss: number;
  investments: number;
  cash: number;
  comment: string;
}

export interface CashSplitData {
  sursa: string;
  ron: number;
  eur: number;
  totalEur: number;
}

export interface InvestmentData {
  denumireEtf: string;
  ticker: string;
  alocare: number; // target allocation (%)
  sumaInvestita: number;
  valoareActuala: number;
  profitEur: number;
  profitPct: number;
  alocareActuala: number;
  ter: number;
}

export interface AssetData {
  date: string;
  assets: { [key: string]: number };
  total: number;
}

export interface MergedData extends WealthData {
  assetsTotal: number;
  assetsBreakdown: { [key: string]: number };
  netWorth: number;
}

export interface AssetAllocationData {
  date: string;
  investments: number;
  cash: number;
  assets: number;
  total: number;
}

export interface GrowthData extends MergedData {
  growth: number;
}

