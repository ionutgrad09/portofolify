# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:5173
npm run build    # Production build (output in dist/)
npm run preview  # Preview production build
```

No test suite is configured.

## Architecture

**Portofolify** is a personal wealth tracking dashboard — a single-page React app deployed on Netlify with serverless backend functions.

### Data Flow

1. The app is PIN-protected. On login, `/.netlify/functions/auth` validates the password against the `PASS` env variable. A 30-minute session is stored in `localStorage` (key: `wealthTrackerSession`).
2. The "Sync" button triggers `fetchAndProcessAllCSV()` in `App.tsx`, which calls four Netlify functions sequentially: `history`, `cash`, `investments`, `assets`. Each function fetches a Google Sheet as CSV and returns it (password re-sent with each request for auth).
3. Parsed data is stored in `localStorage` under keys defined in `src/utils/config.ts` (`CONFIG.STORAGE_KEYS`) and rehydrated on load via `getFromStorage()`.

### Key Files

- `src/App.tsx` — Main component: owns all state, data fetching, derived computations (`mergedData`, `assetAllocationData`, `growthData`), and renders the full dashboard layout.
- `src/types.ts` — All shared data interfaces (`WealthData`, `CashSplitData`, `InvestmentData`, `AssetData`, `MergedData`, etc.).
- `src/utils/csv.ts` — Four CSV parsers (`processWealthCSVData`, `processCashSplitCSVData`, `processInvestmentsCSVData`, `processAssetsCSVData`). Parsers use keyword-based header matching so they're resilient to column reordering.
- `src/utils/utils.ts` — `getFromStorage`, `saveToStorage`, `formatEUR`, `parseNum`, `parseLine`.
- `src/utils/config.ts` — `CONFIG` singleton: session keys, localStorage keys, chart color palettes, RON/EUR exchange rate.
- `netlify/functions/*.mts` — Serverless functions (TypeScript). Each data function validates the password, fetches a Google Sheet CSV URL from an env variable, and returns the raw CSV text.

### Components

All components are in `src/components/`. Each receives pre-computed data as props from `App.tsx`:
- `KPICards` — Top summary metrics
- `InvestmentSection` — ETF portfolio table
- `HistoryTable` — Raw wealth history table
- `CashSplitTable` — Cash breakdown table
- `ProjectionChart` — Future wealth projection
- `MonthlyPerformanceHeatmap` — Month-by-month P&L heatmap
- `FinancialGoalsProgress` — Progress toward financial targets
- `CustomTooltip` — Shared Recharts tooltip (supports EUR, RON, and percentage modes)
- `LoginForm`, `SyncModal`, `EmptyState` — Auth/UX states

### Data Merging

`mergedData` in `App.tsx` is a key derived structure: it merges `historyData` (weekly EUR/cash/investments snapshots) with `assetsData` (physical assets snapshots) by date using forward-fill, producing a unified timeline with `netWorth = eur + assetsTotal`.

### Netlify Environment Variables

Each function expects env variables for the CSV source URLs and `PASS` for authentication. These must be configured in the Netlify dashboard.

### Dates

All dates are in `DD.MM.YYYY` format throughout the codebase.