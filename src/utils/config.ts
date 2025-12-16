interface Config {
  SESSION_KEY: string;
  SESSION_DURATION_MS: number;
  STORAGE_KEYS: {
    DATA: string;
    CASH_SPLIT: string;
    INVESTMENT: string;
    ASSET_ALLOCATION: string;
  };
  COLORS: {
    PIE: string[];
    INVESTMENT: string[];
  };
  EXCHANGE: {
    RON_PER_EUR: number;
    TTL_MS: number;
  };
}

export const CONFIG: Config = {
  SESSION_KEY: 'wealthTrackerSession',
  SESSION_DURATION_MS: 30 * 60 * 1000,
  STORAGE_KEYS: {
    DATA: 'wealthTrackerData',
    CASH_SPLIT: 'wealthTrackerCashSplit',
    INVESTMENT: 'wealthTrackerInvestmentData',
    ASSET_ALLOCATION: 'wealthTrackerAssetAllocation',
  },
  COLORS: {
    PIE: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#ec4899', '#6366f1', '#eab308'],
    INVESTMENT: ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#db2777'],
  },
  EXCHANGE: {
    RON_PER_EUR: 5.0,
    TTL_MS: 12 * 60 * 60 * 1000, // 12 hours
  }
};