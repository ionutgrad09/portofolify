interface Config {
  SESSION_KEY: string;
  SESSION_DURATION_MS: number;
  STORAGE_KEYS: {
    DATA: string;
    CASH_SPLIT: string;
    INVESTMENT: string;
  };
  COLORS: {
    PIE: string[];
    INVESTMENT: string[];
  };
}

export const CONFIG: Config = {
  SESSION_KEY: 'wealthTrackerSession',
  SESSION_DURATION_MS: 30 * 60 * 1000,
  STORAGE_KEYS: {
    DATA: 'wealthTrackerData',
    CASH_SPLIT: 'wealthTrackerCashSplit',
    INVESTMENT: 'wealthTrackerInvestmentData',
  },
  COLORS: {
    PIE: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#ec4899', '#6366f1', '#eab308'],
    INVESTMENT: ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#db2777'],
  },
};