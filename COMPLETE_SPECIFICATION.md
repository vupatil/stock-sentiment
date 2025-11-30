# Stock Sentiment Pro - Complete Technical Specification

**Version:** 1.0  
**Date:** November 30, 2025  
**Purpose:** Complete regeneration instructions for AI code generators

---

## 🎯 Project Overview

**Stock Sentiment Pro** is a React 18 + Vite single-page application that performs client-side technical analysis of stocks with:
- 16 technical indicators
- Multi-component sentiment scoring (-16 to +16 scale)
- Market scanner with concurrent processing
- Interactive SVG charts
- Extended hours pricing support
- TradingView chart integration

**Tech Stack:**
- Frontend: React 18, Vite, vanilla CSS (CSS variables)
- Data Source: External proxy server (`C:\Project\myproject\stock-data-proxy-server`)
- Testing: Vitest (unit tests for indicator functions)
- Charts: Custom SVG implementation + TradingView widget
- No backend in this repo—100% client-side calculations

---

## 🏗️ Architecture

### Data Flow
```
Client (React App) 
  ↓ HTTP GET
Proxy Server (port 3001)
  ↓ Fetches from
Multiple Providers (Yahoo, Alpha Vantage, Finnhub, etc.)
  ↓ Returns
Standardized OHLCV Data
  ↓ Client processes
Technical Indicators → Sentiment Score → UI Display
```

### Critical Requirements
1. **External Dependency:** Proxy server MUST be running at `http://localhost:3001`
2. **Data Ordering:** ALL arrays must be chronologically sorted (oldest → newest) before indicator calculations
3. **Pure Functions:** Indicators are pure functions (no side effects, testable)
4. **Monolithic Design:** Single `App.jsx` file (~2100 lines) contains all tab components inline

---

## 📊 Technical Indicators (src/lib/indicators.js)

### Core Indicators

#### 1. **EMA (Exponential Moving Average)**
```javascript
calculateEMA(values, period)
// Formula: EMA = (Close - EMA_prev) × multiplier + EMA_prev
// Where multiplier = 2 / (period + 1)
// Returns: Array aligned with input (nulls before period)
```

#### 2. **RSI (Relative Strength Index)**
```javascript
calculateRSI(values, period = 14)
// Formula: RSI = 100 - [100 / (1 + RS)]
// Where RS = Average Gain / Average Loss over period
// Wilder's smoothing method
// Returns: Single number (last RSI value, 0-100 scale)
```

#### 3. **MACD (Moving Average Convergence Divergence)**
```javascript
calculateMACD(values, shortPeriod=12, longPeriod=26, signalPeriod=9)
// Formula: 
//   MACD Line = EMA(12) - EMA(26)
//   Signal Line = EMA(9) of MACD Line
//   Histogram = MACD Line - Signal Line
// Returns: { macd, signal, hist } (last values only)

calculateMACDSeries(values, shortPeriod=12, longPeriod=26, signalPeriod=9)
// Same as above but returns full arrays for charting
// Returns: { macdLine[], signalLine[], hist[] }
```

#### 4. **Bollinger Bands**
```javascript
calculateBollingerBands(closes, period=20, stdDevMultiplier=2)
// Formula:
//   Middle Band = SMA(20)
//   Upper Band = Middle + (2 × Standard Deviation)
//   Lower Band = Middle - (2 × Standard Deviation)
//   %B = (Close - Lower) / (Upper - Lower)
//   Bandwidth = (Upper - Lower) / Middle
// Returns: { middle[], upper[], lower[], percentB[], bandwidth[] }
```

#### 5. **ATR (Average True Range)**
```javascript
calculateATR(highs, lows, closes, period=14)
// Formula: ATR = Smoothed Average of True Range
// True Range = max(High-Low, |High-PrevClose|, |Low-PrevClose|)
// Uses Wilder's smoothing
// Returns: Array of ATR values
```

#### 6. **ADX (Average Directional Index)**
```javascript
calculateADX(highs, lows, closes, period=14)
// Formula: Measures trend strength (0-100)
//   +DM = High(t) - High(t-1) if positive
//   -DM = Low(t-1) - Low(t) if positive
//   +DI = Smoothed +DM / Smoothed TR × 100
//   -DI = Smoothed -DM / Smoothed TR × 100
//   DX = |(+DI - -DI)| / (+DI + -DI) × 100
//   ADX = Smoothed DX
// Returns: { adx[], plusDI[], minusDI[] }
// Interpretation: ADX > 25 = strong trend, < 20 = weak/choppy
```

#### 7. **MFI (Money Flow Index)**
```javascript
calculateMFI(highs, lows, closes, volumes, period=14)
// Formula: Volume-weighted RSI
//   Typical Price = (High + Low + Close) / 3
//   Money Flow = Typical Price × Volume
//   Positive Flow = sum of money flow when price increases
//   Negative Flow = sum of money flow when price decreases
//   Money Ratio = Positive Flow / Negative Flow
//   MFI = 100 - [100 / (1 + Money Ratio)]
// Returns: Array (0-100 scale)
// Interpretation: >80 overbought, <20 oversold
```

#### 8. **Stochastic Oscillator**
```javascript
calculateStochastic(highs, lows, closes, kPeriod=14, dPeriod=3)
// Formula:
//   %K = (Close - Lowest Low) / (Highest High - Lowest Low) × 100
//   %D = SMA(%K, dPeriod)
// Returns: { k[], d[] } (0-100 scale)
// Interpretation: >80 overbought, <20 oversold
```

#### 9. **ROC (Rate of Change)**
```javascript
calculateROC(closes, period=12)
// Formula: ROC = [(Close - Close_n_periods_ago) / Close_n_periods_ago] × 100
// Returns: Array of percentage changes
```

#### 10. **Swing High/Low Levels**
```javascript
findSwingLevels(highs, lows, closes, lookback=40, strength=2)
// Finds support and resistance levels based on local extrema
// Returns: { support: [{price, timestamp, strength}], resistance: [...] }
```

#### 11. **Volume Indicators**
```javascript
calculateVolumeMA(volumes, period=20)
// Simple moving average of volume
// Returns: Array

calculateOBV(closes, volumes)
// On-Balance Volume - cumulative volume flow
// Formula: OBV += Volume if Close > PrevClose, else OBV -= Volume
// Returns: Array

calculateVWAP(closes, highs, lows, volumes, timestamps)
// Volume-Weighted Average Price (intraday indicator)
// Formula: VWAP = Σ(Typical Price × Volume) / Σ(Volume)
// Resets daily based on timestamps
// Returns: Array
```

---

## 🎯 Sentiment Scoring Algorithm

### Formula Overview
**Score Range:** -16 to +16 (8 components, each ±2 max)

### Components Breakdown

#### 1. **Trend Score (±4 max)**
```javascript
// Component 1: Price vs EMA200 (±2)
if (latestPrice > ema200) score += 2
else score -= 2

// Component 2: EMA50 vs EMA200 (±2 if bullish, -1 if bearish)
if (ema50 > ema200) score += 2
else score -= 1
```

#### 2. **Momentum Score (±4 max)**
```javascript
// Component 1: RSI analysis (±2)
if (rsi > 55 && rsi < 70) score += 1      // Bullish momentum
else if (rsi < 45 && rsi > 30) score -= 1 // Bearish momentum
else if (rsi >= 70 || rsi <= 30) score -= 2 // Overbought/oversold penalty

// Component 2: MACD (±1)
if (macdHist > 0 && macd > signal) score += 1
else score -= 1
```

#### 3. **Volume Confirmation (±2 max)**
```javascript
currentVolume = volumes[last]
avgVolume = volumeMA[last]

if (currentVolume > avgVolume × 1.5) { // High volume
  if (priceChange > 0) score += 2  // Strong buy pressure
  else if (priceChange < 0) score -= 2  // Strong sell pressure
}
else if (currentVolume < avgVolume × 0.7 && priceChangePercent > 0.5) {
  score -= 1  // Suspicious low-volume move
}
```

#### 4. **Volatility / Bollinger Bands (±2 max)**
```javascript
percentB = (Close - LowerBand) / (UpperBand - LowerBand)

if (percentB < 0.2 && rsi < 35) score += 2    // Oversold bounce setup
else if (percentB > 0.8 && rsi > 65) score -= 2  // Overbought risk
else if (percentB > 1.0) score -= 1  // Price above upper band (extreme)
else if (percentB < 0) score += 1    // Price below lower band (extreme)
```

#### 5. **Trend Strength / ADX (±2 max)**
```javascript
if (adx > 25 && adx < 50) {  // Strong trend
  if (plusDI > minusDI) score += 2  // Bullish trend
  else score -= 2  // Bearish trend
}
else if (adx >= 50) {  // Very strong (reversal risk)
  if (plusDI > minusDI) score += 1
  else score -= 1
}
else if (adx < 20) score -= 1  // Weak/choppy trend
```

#### 6. **Money Flow / MFI (±2 max)**
```javascript
if (mfi > 50 && mfi < 80) score += 2      // Money flowing in
else if (mfi >= 80) score -= 1            // Overbought
else if (mfi < 50 && mfi > 20) score -= 2  // Money flowing out
else if (mfi <= 20) score += 1             // Oversold bounce potential
```

#### 7. **Price Extension (±1 max)**
```javascript
distanceFromEMA200 = ((latestPrice - ema200) / ema200) × 100

if (distanceFromEMA200 > 20) score -= 1  // Too extended above
else if (distanceFromEMA200 < -20) score += 1  // Deeply oversold
```

#### 8. **Support/Resistance Proximity (±1 max)**
```javascript
if (nearSupport && bullish_trend) score += 1  // Good entry
if (nearResistance && bullish_trend) score -= 1  // Risky
// "Near" defined as within 2% of price
```

### Sentiment Classification
```javascript
if (score >= 8)  sentiment = "Strong Bullish"
else if (score >= 3)  sentiment = "Bullish"
else if (score >= -2) sentiment = "Neutral"
else if (score >= -7) sentiment = "Bearish"
else sentiment = "Strong Bearish"
```

### Buy Zones & Targets Calculation

#### For Bullish Signals:
```javascript
// Intraday (if emaShort <= 50):
buyZone = [latestPrice × 0.995, latestPrice × 1.005]  // ±0.5%
if (atr) {
  stopLoss = latestPrice - (2 × atr)
  target1 = latestPrice + (2 × atr)
  target2 = latestPrice + (3 × atr)
} else {
  stopLoss = latestPrice × 0.99   // 1% stop
  target1 = latestPrice × 1.01    // 1% target
  target2 = latestPrice × 1.015   // 1.5% target
}

// Daily (if emaShort > 50):
buyZone = [ema50 × 0.98, ema50 × 1.02]  // ±2% from EMA50
if (atr) {
  stopLoss = latestPrice - (2 × atr)
  target1 = latestPrice + (3 × atr)
  target2 = latestPrice + (4 × atr)
} else {
  stopLoss = latestPrice × 0.95  // 5% stop
  target1 = latestPrice × 1.05   // 5% target
  target2 = latestPrice × 1.10   // 10% target
}
```

#### For Neutral Signals:
```javascript
// Smaller buy zones, tighter stops
// Intraday: ±0.3%
// Daily: -3% to -1%
```

#### For Bearish Signals:
```javascript
// No buy zones
// Note: "Downtrend detected - avoid new long positions"
```

### Timeframe-Specific Parameters
```javascript
const INDICATOR_PARAMS = {
  // Intraday timeframes (minutes)
  '1m':  { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '2m':  { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '3m':  { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '4m':  { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '5m':  { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '10m': { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '15m': { emaShort: 20,  emaLong: 50,  rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '30m': { emaShort: 30,  emaLong: 100, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 150 },
  '60m': { emaShort: 50,  emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 250 },
  '1h':  { emaShort: 50,  emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 250 },
  
  // Daily and longer
  '1d':  { emaShort: 50,  emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 200 },
  '1wk': { emaShort: 50,  emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 200 },
  '1mo': { emaShort: 50,  emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 200 }
};
```

---

## 🔍 Market Scanner Algorithm

### Concurrent Processing System

#### Configuration Options:
- **Concurrency:** Number of parallel workers (default: 6)
- **Retries:** Retry attempts per symbol (default: 2)
- **Backoff:** Delay between retries in ms (default: 800)
- **Timeframe:** Analysis timeframe (default: 1d)
- **Results Limit:** Max results to return (default: 30)
- **Sentiment Filters:** Bullish (true), Bearish (false), Neutral (false) by default

#### Scanner Flow:
```
1. Load symbols from src/data/symbols.json (552 symbols)
2. Create worker pool (size = concurrency setting)
3. Each worker:
   - Pop next symbol from queue
   - Fetch OHLCV data from proxy
   - Calculate indicators
   - Run sentiment analysis
   - Check filters (bullish/bearish/neutral)
   - If matches: add to results
   - If results.length >= limit: stop all workers
   - Retry on failure (up to retry count)
   - Continue until queue empty or limit reached
4. Display results in real-time as they arrive
```

#### Worker Logic:
```javascript
async function worker() {
  while (queue.length > 0 && results.length < limit && !stopFlag) {
    const symbol = queue.shift();
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Fetch data
        const data = await fetch(`${proxyUrl}/api/stock/${symbol}?interval=${interval}&range=${range}`);
        
        // Sort chronologically (CRITICAL)
        data.sort((a, b) => a.timestamp - b.timestamp);
        
        // Calculate indicators
        const sentiment = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);
        
        // Check filters
        if (matchesFilters(sentiment.sentiment)) {
          results.push({
            rank: results.length + 1,
            symbol: symbol,
            sentiment: sentiment.sentiment,
            score: sentiment.score,
            price: sentiment.latestPrice,
            buyZone: sentiment.buyZone,
            sellTargets: sentiment.sellTargets,
            // ... all indicator arrays for charting
          });
        }
        
        break; // Success, exit retry loop
      } catch (error) {
        if (attempt === retries) {
          // Skip symbol after all retries
          continue;
        }
        await sleep(backoffMs);
      }
    }
  }
}
```

#### Scanner Performance:
- **Expected time:** 10-30 seconds for 30 results
- **Network calls:** ~30-80 (stops early when limit reached)
- **Memory:** < 50MB for full dataset
- **Bottleneck:** Proxy rate limiting / network latency

---

## 🎨 UI Components

### Tab Structure (All in App.jsx)

#### 1. **Analyze Tab**
```
Input Section:
- Symbol input (uppercase, 1-12 chars)
- Timeframe dropdown (1m, 2m, 3m, 4m, 5m, 10m, 15m, 30m, 60m, 1h, 1d, 1wk, 1mo)
- Chart mode toggle (Candles / Area)
- "Use CORS proxy (dev)" checkbox
- Analyze & Reset buttons

Price Display:
- Regular Market Price (large, primary color)
- Pre-Market Price (if available, green/red)
- Post-Market Price (if available, green/red)

Indicators Grid:
- EMA 50 & EMA 200
- RSI (0-100, color-coded)
- MACD Line, Signal, Histogram
- ADX (with "Strong"/"Weak" label if >25/<25)
- MFI (with ↑/↓ indicator)
- Stochastic K & D
- Score (sentiment score)

Sentiment Panel:
- Sentiment badge (color-coded by category)
- Score breakdown cards (8 components):
  * Trend (±4)
  * Momentum (±4)
  * Volume (±2)
  * Volatility (±2)
  * Trend Strength (±2)
  * Money Flow (±2)
  * Price Position (±1)
  * Support/Resistance (±1)

Buy/Sell Levels:
- Buy Zone range
- Sell Targets (comma-separated)
- Stop Loss level
- Note/Strategy text

Chart Panel:
- Toggle checkboxes: EMA50, EMA200, RSI, MACD, Volume, Bollinger, ATR, OBV, VWAP
- Chart height slider (300-1000px, default 500)
- Custom SVG chart OR TradingView widget
```

#### 2. **Scanner Tab**
```
Settings Panel:
- Concurrency slider (1-20, default 6)
- Retries slider (0-5, default 2)
- Backoff ms input (default 800)
- Timeframe dropdown (default 1d)
- Results limit (default 30)
- Sentiment filters checkboxes: Bullish ✓, Bearish ☐, Neutral ☐

Control Buttons:
- Start Market Scan (gradient purple, with progress)
- Stop Scanning (red, only shown during scan)
- Reset (clears results, resets to default filters)

Progress Indicator:
- "Currently scanning: AAPL (10/30 found)"
- Animated pulse dot

Results Table:
Columns: #, Symbol (clickable link), Sentiment (badge), Score, Price, Buy Zone, Sell Targets
Row colors by sentiment:
  - Strong Bullish: rgba(22,101,52,0.18), text #166534
  - Bullish: rgba(34,197,94,0.08), text #22c55e
  - Neutral: rgba(148,163,184,0.06), text #94a3b8
  - Bearish: rgba(248,113,113,0.08), text #f87171
  - Strong Bearish: rgba(153,27,27,0.18), text #991b1b
  
Sortable columns (click header to toggle asc/desc)
```

#### 3. **Scanner Detail Tab**
```
Opened when clicking a symbol in scanner results

Header:
- Back to Scanner button
- Symbol name
- Timeframe dropdown (changes analysis timeframe)

Content:
- Same as Analyze Tab but pre-populated with scanner data
- Chart persists from scanner (no refetch needed)
- Can change timeframe to see different analyses
- Prevents duplicate fetches with caching logic
```

---

## 📈 Chart Implementation

### Custom SVG Chart Features

**Main Price Chart:**
- Candlestick mode: OHLC wicks + body (green up, red down)
- Area mode: Filled gradient area under close line
- Overlays: EMA50 (cyan), EMA200 (orange), Bollinger Bands (purple fill)
- Crosshair: Vertical line with top timestamp label and bottom compact time
- Pan: Horizontal drag to scroll
- Zoom: Optional (wheel zoom stub acceptable)

**Sub-Charts:**
- RSI Panel (0-100 scale, horizontal lines at 30/50/70)
- MACD Panel (macd line, signal line, histogram bars)
- Volume Panel (bars, with volume MA overlay)
- ATR Panel (line chart, optional)
- OBV Panel (line chart, optional)

**Hover Stats Bar:**
Displays: Time, O/H/L/C (or just Close), EMA50, EMA200, RSI, MACD (line/signal/hist), %B, Bandwidth, ATR, VWAP, Volume, Volume MA

**Performance Optimizations:**
- Memoize visible data slice on zoom/scroll changes
- Single indicator calculation per fetch (store in state)
- No recalculation on mouse events
- Limit visible candles (e.g., last 500 bars)

---

## 🗂️ File Structure

```
stock-sentiment/
├── .github/
│   └── copilot-instructions.md
├── scripts/
│   ├── start-dev-servers.ps1
│   └── stop-dev-servers.ps1
├── src/
│   ├── components/
│   │   ├── Logo.jsx
│   │   └── TradingViewChart.jsx
│   ├── data/
│   │   └── symbols.json (552 symbols)
│   ├── lib/
│   │   ├── indicators.js (16 indicator functions)
│   │   └── indicators.test.js (Vitest tests)
│   ├── App.jsx (~2100 lines)
│   ├── ErrorBoundary.jsx
│   ├── index.css (CSS variables)
│   └── main.jsx (React entry)
├── .env.example
├── .gitignore
├── index.html (TradingView script tag)
├── package.json
├── README.md
├── vite.config.js (port 5176)
└── vitest.config.js
```

---

## 🎨 Color Palette & Styling

### CSS Variables (Dark Theme):
```css
:root {
  --bg: #0f172a;           /* Page background */
  --panel-bg: #1e293b;     /* Panel backgrounds */
  --card-bg: #334155;      /* Card backgrounds */
  --border: #475569;       /* Borders */
  --text: #f1f5f9;         /* Primary text */
  --muted: #94a3b8;        /* Secondary text */
  --primary: #2dd4bf;      /* Accent color (teal) */
  --accent: #10b981;       /* Success/bullish (green) */
  --danger: #ef4444;       /* Error/bearish (red) */
}
```

### Sentiment Colors:
```css
Strong Bullish: #166534 (text), rgba(22,101,52,0.18) (bg)
Bullish: #22c55e (text), rgba(34,197,94,0.08) (bg)
Neutral: #94a3b8 (text), rgba(148,163,184,0.06) (bg)
Bearish: #f87171 (text), rgba(248,113,113,0.08) (bg)
Strong Bearish: #991b1b (text), rgba(153,27,27,0.18) (bg)
```

### Chart Colors:
```css
Candle Up: #16a34a (green)
Candle Down: #ef4444 (red)
EMA 50: #06b6d4 (cyan)
EMA 200: #f97316 (orange)
Bollinger Bands: #a855f7 (purple), 10% opacity fill
VWAP: #facc15 (yellow)
Volume MA: #fb923c (orange)
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest):
Test file: `src/lib/indicators.test.js`

**Test Helper:**
```javascript
function generateSeries(length = 250, start = 100, step = 0.1) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(start + i * step + (Math.sin(i) * step));
  }
  return arr;
}
```

**Test Cases:**
1. EMA returns array with values after period, nulls before
2. RSI returns 0-100 value
3. MACD returns object with macd/signal/hist keys
4. Bollinger Bands returns all 5 arrays (middle, upper, lower, percentB, bandwidth)
5. ATR handles minimum data requirements
6. ADX returns adx/plusDI/minusDI arrays
7. MFI returns 0-100 values
8. Stochastic returns k/d arrays
9. analyzeTechnicalSentiment returns score in -16 to +16 range
10. Sentiment classification maps correctly to buckets

---

## 🔧 Environment Configuration

**.env file:**
```env
VITE_LOCAL_PROXY_URL=http://localhost:3001
```

**Proxy API Endpoint Format:**
```
GET http://localhost:3001/api/stock/:symbol?interval=INTERVAL&range=RANGE&includePrePost=true

Examples:
- http://localhost:3001/api/stock/AAPL?interval=1d&range=1y&includePrePost=true
- http://localhost:3001/api/stock/TSLA?interval=5m&range=1d&includePrePost=false
```

**Timeframe Mapping:**
```javascript
// interval = timeframe (1m, 5m, 15m, 1h, 1d, 1wk, 1mo)
// range = lookback period

const rangeMap = {
  '1m': '1d',    '2m': '1d',    '3m': '1d',
  '4m': '1d',    '5m': '5d',    '10m': '5d',
  '15m': '5d',   '30m': '1mo',  '60m': '3mo',
  '1h': '3mo',   '1d': '2y',    '1wk': '5y',
  '1mo': '10y'
};
```

---

## 🚀 Development Commands

```powershell
# Install dependencies
npm install

# Start proxy (required - separate terminal)
cd C:\Project\myproject\stock-data-proxy-server
npm start

# Start frontend (dev)
npm run dev              # Vite only (port 5176)
npm run dev:all         # Proxy + frontend (concurrently)
npm run start:dev-bg    # Background processes (Windows PS1 script)
npm run stop:dev-bg     # Stop background processes

# Testing
npm run test            # Run Vitest unit tests

# Build
npm run build           # Production build
npm run preview         # Preview production build
```

---

## 🐛 Common Issues & Debugging

### "Failed to fetch" errors:
1. Verify proxy is running: `Invoke-RestMethod -Uri "http://localhost:3001/"`
2. Check browser DevTools Network tab for CORS/errors
3. Test proxy directly: `Invoke-RestMethod -Uri "http://localhost:3001/api/stock/AAPL?interval=1d&range=5d"`
4. Ensure `.env` file exists with correct `VITE_LOCAL_PROXY_URL`
5. Restart Vite after changing `.env`

### Scanner returns no results:
1. Check all sentiment filters are checked (at least one)
2. Verify timeframe has sufficient data (console logs)
3. Try lowering result limit or increasing concurrency
4. Check browser console for "insufficient data" messages
5. Enable "Use CORS proxy (dev)" toggle if direct fetch fails

### Background servers won't stop:
```powershell
# Check PID file
Get-Content .dev-servers/pids.json | ConvertFrom-Json

# Manually stop
Get-NetTCPConnection -LocalPort 5176, 3001 | Select-Object OwningProcess
Stop-Process -Id <PID>
```

---

## 📦 Dependencies

**package.json:**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0",
    "vitest": "^1.3.2",
    "jsdom": "^22.0.0",
    "concurrently": "^8.2.0",
    "nodemon": "^3.1.0"
  }
}
```

---

## 🎯 Key Implementation Notes

### CRITICAL Requirements:
1. **Data must be sorted chronologically before indicator calculations**
2. **Proxy server must be running for app to function**
3. **All indicators are pure functions (no side effects)**
4. **Scanner workers must respect concurrency limits**
5. **ATR-based targets only calculate if highs/lows available**
6. **Intraday vs daily detected by emaShort parameter (<= 50 = intraday)**

### Design Decisions:
- **Monolithic App.jsx:** Rapid prototyping, all logic in one file
- **No state management:** Simple useState, no Redux/Zustand
- **Custom SVG charts:** Full control, no heavy dependencies
- **Windows PowerShell scripts:** Optimized for Windows dev environment
- **TradingView fallback:** Professional charts for verification

### Extensibility Points:
- Add more indicators in `src/lib/indicators.js`
- Adjust sentiment thresholds in `analyzeTechnicalSentiment()`
- Modify timeframe parameters in `INDICATOR_PARAMS`
- Expand symbol list in `src/data/symbols.json`
- Customize colors in CSS variables
- Add more scanner filters (volume, price range, etc.)

---

## 📝 Usage Example

```javascript
// Typical workflow for analyzing a stock:

// 1. Fetch data from proxy
const response = await fetch(
  `http://localhost:3001/api/stock/AAPL?interval=1d&range=1y&includePrePost=true`
);
const data = await response.json();

// 2. Extract OHLCV arrays
const closes = data.map(d => d.close);
const highs = data.map(d => d.high);
const lows = data.map(d => d.low);
const volumes = data.map(d => d.volume);

// 3. CRITICAL: Sort chronologically
data.sort((a, b) => a.timestamp - b.timestamp);

// 4. Get sentiment analysis
const params = INDICATOR_PARAMS['1d'];
const sentiment = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);

// 5. Display results
console.log(`Sentiment: ${sentiment.sentiment}`);
console.log(`Score: ${sentiment.score}`);
console.log(`Buy Zone: ${sentiment.buyZone}`);
console.log(`Targets: ${sentiment.sellTargets}`);
console.log(`Stop Loss: ${sentiment.stopLoss}`);
```

---

## 🎓 Formula References

All formulas implemented follow standard technical analysis definitions:
- **EMA:** Exponential Moving Average (standard formula)
- **RSI:** Wilder's Relative Strength Index (14-period default)
- **MACD:** 12/26/9 standard parameters
- **Bollinger Bands:** 20-period SMA ± 2 standard deviations
- **ATR:** Wilder's Average True Range (14-period)
- **ADX:** Welles Wilder's Directional Movement System
- **MFI:** Volume-weighted RSI
- **Stochastic:** %K and %D (14/3 default)
- **OBV:** Cumulative volume flow
- **VWAP:** Intraday volume-weighted average price

---

## 🏁 Summary

This specification provides complete instructions to regenerate the Stock Sentiment Pro application. A code generator should be able to:

1. ✅ Implement all 16 indicator functions with exact formulas
2. ✅ Build the 8-component sentiment scoring system (-16 to +16)
3. ✅ Create the 3-tab UI (Analyze, Scanner, Scanner Detail)
4. ✅ Implement concurrent market scanner with worker pool
5. ✅ Generate custom SVG charts with all overlays
6. ✅ Integrate TradingView widget as fallback
7. ✅ Set up Vitest unit tests for indicators
8. ✅ Configure Vite build system
9. ✅ Create Windows PowerShell background process manager
10. ✅ Include all 552 stock symbols

**Expected Result:** Fully functional stock analysis application matching the original implementation.
