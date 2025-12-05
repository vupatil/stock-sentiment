# Stock Sentiment Pro - AI Agent Instructions

React 18 + Vite SPA for technical stock analysis with multi-indicator charting, market scanner, and sentiment scoring.

## Architecture Overview

**Data Flow:**
- Client → External Proxy (`C:\Project\myproject\stock-data-proxy-server`) → Multiple providers (automatic failover)
- Proxy handles CORS, rate limiting, API keys, provider selection, and failover
- Client performs all technical calculations—no backend in this repo
- **Server is the source of truth** for all data and metadata

**Key Files:**
- `src/App.jsx` (3582 lines) - Monolithic component with tabs, fetch logic, custom SVG charts, scanner
- `src/lib/indicators.js` (967 lines) - 16 pure indicator functions + sentiment scoring
- `src/lib/indicators.test.js` - Vitest unit tests with `generateSeries()` helper
- `src/data/symbols.json` - 552 curated S&P 500 + ETF symbols
- `src/components/TradingViewChart.jsx` - TradingView widget integration
- `scripts/start-dev-servers.ps1` - Background process manager (Windows only)
- `vite.config.js` - Port 5176, base path `/stkcld/` for production

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
# Terminal 1: Start proxy (REQUIRED - app won't work without it)
cd C:\Project\myproject\stock-data-proxy-server
npm start  # Port 3001

# Terminal 2: Start frontend
cd C:\Project\myproject\stock-sentiment
npm run dev  # Port 5176
```

**Environment:** Copy `.env.example` → `.env`, set `VITE_PROXY_URL=http://localhost:3001`

**Proxy URL Resolution (`getApiUrl()` in App.jsx line 170):**
1. Check `import.meta.env.VITE_PROXY_URL` (dev: `http://localhost:3001`)
2. If prod build: `window.location.origin + '/api'` (deployed as `prysan.com/stkcld/`)
3. Fallback: `http://localhost:3001`

## Code Patterns & Conventions

**Indicator Functions (`src/lib/indicators.js`):**
- Pure functions for testability—array in, array/number/object out
- Key signatures:
  - `calculateEMA(values, period)` → array with nulls before warmup period
  - `calculateRSI(values, period=14)` → single number (last RSI value)
  - `calculateMACD(values, 12, 26, 9)` → `{ macd, signal, hist }` (last values only)
  - `calculateMACDSeries(...)` → full arrays for charting
  - `calculateBollingerBands(closes, 20, 2)` → `{ middle, upper, lower, percentB, bandwidth }`
  - `analyzeTechnicalSentiment(closes, params, volumes, highs, lows)` → sentiment object

**Sentiment Scoring:**
- Range: **-16 to +16** across 8 components (trend, momentum, volume, volatility, trendStrength, moneyFlow, pricePosition, supportResistance)
- Buckets: Strong Bullish (+8 to +16), Bullish (+3 to +7), Neutral (-2 to +2), Bearish (-7 to -3), Strong Bearish (-16 to -8)
- Requires ~200 bars minimum (`params.minBars` in `INDICATOR_PARAMS`)
- Returns: `{ score, sentiment, scoreBreakdown, indicators: { ema50, ema200, rsi, macd, ... } }`

**Data Ordering (CRITICAL):**
- ALL indicators expect **chronological order** (oldest → newest)
- Always sort by timestamp after fetching: `data.sort((a, b) => a.timestamp - b.timestamp)`
- Failure to sort = incorrect calculations (EMAs, MACD will be wrong)

**Timeframe Aggregation (`AGGREGATION_MAP` line 48):**
- Some intervals are client-side calculated: `3m, 4m, 10m, 2h, 4h, 6h, 12h`
- Uses `aggregateCandles(candles, multiplier)` (line 59) to combine base intervals
- Example: `3m` fetches `1m` data, then aggregates 3 bars into 1
- Implementation: Combines OHLCV (open=first, high=max, low=min, close=last, volume=sum)

**Timeframes & Mapping:**
- UI intervals: `1m, 2m, 3m, 4m, 5m, 10m, 15m, 30m, 60m, 1h, 1d, 1wk, 1mo`
- All intervals sent directly to proxy server via `interval` param (e.g., `?interval=1d`)
- Server handles provider-specific format conversion automatically
- TradingView uses different mapping: `'1d' → 'D', '1wk' → 'W', '60m' → '60'` (see `TradingViewChart.jsx` intervalMap line 22)
- `INDICATOR_PARAMS` (line 25) adjusts EMA/MACD periods per timeframe (1d uses 50/200 EMAs, 1m uses 20/50)

**Component Architecture:**
- Monolithic `App.jsx` with inline tab components (AnalyzeTab, ScannerTab, ScannerDetailTab)
- No Redux/Zustand—all state via `React.useState` hooks (~20+ useState calls)
- Custom SVG charts (lines 2400+) instead of Recharts/Victory—direct path rendering for performance
- TradingView widget loaded via `<script>` tag in `index.html` (line 8)

**Fetching Pattern (`fetchStockData()` line 189):**
```javascript
const proxyUrl = getApiUrl(); // Resolves to http://localhost:3001 or prod URL
const url = `${proxyUrl}/api/stock/${symbol}?interval=${interval}`;
const response = await fetch(url);
// Handle 429 rate limit with retry countdown
// Handle 503 all sources failed
// Sort data chronologically before passing to indicators
```

## Testing

**Unit Tests (Vitest):**
```powershell
npm run test  # Runs vitest.config.js with jsdom environment
```
- Test file: `src/lib/indicators.test.js` (147 lines)
- Pattern: `generateSeries(length, start, step)` helper creates synthetic trending data
- Tests verify: boundary conditions, warmup periods, value ranges (RSI 0-100, EMA arrays)
- Example: `generateSeries(260, 100, 0.1)` = 260 bars starting at 100 with sinusoidal pattern

**Test Structure:**
```javascript
it('calculateRSI returns a numeric value', () => {
  const series = generateSeries(260);
  const rsi = calculateRSI(series, 14);
  expect(rsi).toBeGreaterThanOrEqual(0);
  expect(rsi).toBeLessThanOrEqual(100);
});
```

## Deployment

**Production Build:**
```powershell
npm run build:production  # Runs scripts/build-for-production.ps1
# Creates dist/ folder with base path /stkcld/
# Copies .htaccess.template → dist/.htaccess for SPA routing
```

**Target:** `prysan.com/stkcld/` (subdirectory deployment)
- Main site: `prysan.com/` (separate React app)
- Stock app: `prysan.com/stkcld/` (this app)
- API: `prysan.com/api/` (shared or separate proxy deployment)

**Key Config:**
- `vite.config.js` sets `base: '/stkcld/'` for asset paths
- `.env.production` should have `VITE_PROXY_URL=https://prysan.com/api`
- `.htaccess.template` handles SPA routing (redirects all /stkcld/* to index.html)

## Debugging

**"Failed to fetch" errors:**
1. Verify proxy is running: `Invoke-RestMethod -Uri "http://localhost:3001/"`
2. Check DevTools Network tab for CORS headers (should have `Access-Control-Allow-Origin`)
3. Test endpoint directly: `Invoke-RestMethod -Uri "http://localhost:3001/api/stock/AAPL?interval=1d"`
4. Verify `.env` has correct `VITE_PROXY_URL` (no trailing slash)

**Incorrect indicator values:**
- Check data is sorted chronologically: `console.log(data.map(d => d.timestamp))`
- Verify sufficient bars: Daily needs 220+ bars, intraday needs 100+ (see `INDICATOR_PARAMS.minBars`)
- RSI must be 0-100, MACD histogram can be negative

**Background servers won't stop:**
```powershell
Get-Content .dev-servers/pids.json | ConvertFrom-Json
Get-Process -Id <PID> | Stop-Process -Force
```

**Chart rendering issues:**
- SVG charts are in `App.jsx` lines 2400+ (search for `<svg>`)
- Data slicing uses `zoom` and `scroll` state for visible range
- Check `visibleData` array has valid OHLCV objects

## Project-Specific Notes

- **Windows-only scripts:** PowerShell scripts require Windows. For cross-platform use `npm run dev:all` (concurrently)
- **API keys:** Server handles all provider API keys via proxy's `.env` file
- **TradingView widget:** Requires `<script src="https://s3.tradingview.com/tv.js">` in `index.html` (already present)
- **Symbol list:** `src/data/symbols.json` is manually curated (552 symbols)—update by editing JSON directly
- **Large monolithic component:** `App.jsx` 3582 lines is intentional for simplicity. Can refactor into `src/components/{AnalyzeTab,ScannerTab,ScannerDetailTab}.jsx` if needed
- **No TypeScript:** Plain JavaScript with JSDoc comments for IDE hints
- **Rate limiting:** Proxy handles rate limits with 429 responses + `retryAfter` countdown UI
