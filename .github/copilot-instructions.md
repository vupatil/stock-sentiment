# Stock Sentiment Pro - AI Agent Instructions

React 18 + Vite SPA for technical stock analysis with multi-indicator charting, market scanner, and sentiment scoring.

## Architecture Overview

**Data Flow:**
- Client → External Proxy (`C:\Project\myproject\stock-data-proxy-server`) → Multiple providers (Yahoo, Alpha Vantage, Finnhub, etc.)
- Proxy handles CORS, rate limiting, API keys, provider failover
- Client performs all technical calculations—no backend in this repo

**Key Files:**
- `src/App.jsx` (~2100 lines) - Monolithic component with tabs, fetch logic, SVG charts, scanner
- `src/lib/indicators.js` - 16 pure indicator functions (EMA, RSI, MACD, Bollinger, ATR, ADX, MFI, Stochastic, ROC, sentiment scoring)
- `src/lib/indicators.test.js` - Vitest unit tests
- `src/data/symbols.json` - 552 S&P 500 + ETF symbols
- `src/components/TradingViewChart.jsx` - TradingView widget
- `scripts/start-dev-servers.ps1` - Background process manager (Windows PowerShell)

## Development Workflow

**Quick Start (Windows PowerShell):**
```powershell
npm run start:dev-bg    # Start proxy + Vite in background
npm run stop:dev-bg     # Stop background servers
npm run dev:all         # Foreground with logs (concurrently)
npm run test            # Run Vitest tests
```

**Manual Setup:**
```powershell
# Terminal 1: Start proxy (REQUIRED)
cd C:\Project\myproject\stock-data-proxy-server
npm start  # Port 3001

# Terminal 2: Start frontend
cd C:\Project\myproject\stock-sentiment
npm run dev  # Port 5176 (vite.config.js)
```

**Environment:** Copy `.env.example` → `.env`, set `VITE_LOCAL_PROXY_URL=http://localhost:3001`

## Code Patterns & Conventions

**Indicator Functions (`src/lib/indicators.js`):**
- Pure functions for testability—array in, array/number/object out
- Key signatures:
  - `calculateEMA(values, period)` → array with nulls before warmup period
  - `calculateRSI(values, period=14)` → single number (last RSI)
  - `calculateMACD(values, 12, 26, 9)` → `{ macd, signal, hist }` (last values only)
  - `calculateMACDSeries(...)` → full arrays for charting
  - `calculateBollingerBands(closes, 20, 2)` → `{ middle, upper, lower, percentB, bandwidth }`
  - `analyzeTechnicalSentiment(closes, params, volumes, highs, lows)` → sentiment object

**Sentiment Scoring:**
- Range: **-16 to +16** across 8 components (trend, momentum, volume, volatility, trendStrength, moneyFlow, pricePosition, supportResistance)
- Buckets: Strong Bullish (+8 to +16), Bullish (+3 to +7), Neutral (-2 to +2), Bearish (-7 to -3), Strong Bearish (-16 to -8)
- Requires ~200 bars minimum (`params.minBars`)
- Returns: `{ score, sentiment, scoreBreakdown, indicators: { ema50, ema200, rsi, macd, ... } }`

**Data Ordering (CRITICAL):**
- ALL indicators expect **chronological order** (oldest → newest)
- Always sort by timestamp after fetching: `data.sort((a, b) => a.timestamp - b.timestamp)`
- Failure to sort = incorrect calculations

**Timeframes:**
- UI: `1m, 2m, 3m, 4m, 5m, 10m, 15m, 30m, 60m, 1h, 1d, 1wk, 1mo`
- Maps to proxy params: `interval` + `range` (Yahoo Finance format)
- TradingView uses different mapping (see `TradingViewChart.jsx` lines 14-29)

**Component Architecture:**
- Monolithic `App.jsx` with inline tab components (AnalyzeTab, ScannerTab, ScannerDetailTab)
- No state management library—all state via `React.useState` in App component
- Custom SVG charts (~lines 1100+) instead of external chart libraries

## Testing

**Unit Tests (Vitest):**
```powershell
npm run test  # Runs vitest.config.js
```
- Test file: `src/lib/indicators.test.js`
- Pattern: `generateSeries(length, start, step)` helper creates synthetic data
- Verify: boundary conditions, warmup periods, value ranges (RSI 0-100, etc.)

## Debugging

**"Failed to fetch" errors:**
1. Verify proxy: `Invoke-RestMethod -Uri "http://localhost:3001/"`
2. Check DevTools Network tab for CORS headers
3. Test endpoint: `Invoke-RestMethod -Uri "http://localhost:3001/api/stock/AAPL?interval=1d&range=5d"`
4. Ensure `.env` has `VITE_LOCAL_PROXY_URL=http://localhost:3001`

**Background servers won't stop:**
```powershell
Get-Content .dev-servers/pids.json | ConvertFrom-Json
Get-Process -Id <PID> | Stop-Process
```

## Project-Specific Notes

- **Windows-only:** PowerShell scripts require Windows. Use `npm run dev:all` for cross-platform.
- **No API keys:** Yahoo Finance (default) needs no auth. Optional providers (Alpha Vantage, Finnhub) require keys in proxy's `.env`.
- **TradingView:** Widget requires `<script>` tag in `index.html`.
- **Symbol list:** `src/data/symbols.json` is manually curated (552 symbols).
- **Large component:** `App.jsx` ~2100 lines is intentional—refactor into separate files if needed.
