# Chat History Summary - Stock Sentiment Pro (DeepSeek)

**Project:** stock-sentiment (to be renamed to stock-sentiment-pro-ds)  
**Date:** November 30, 2025  
**AI Assistant:** GitHub Copilot (Claude Sonnet 4.5)

---

## Project Overview

React single-page app (Vite) that fetches stock data from Yahoo Finance via a proxy server and performs client-side technical analysis with 14+ indicators.

**Key Technologies:**
- Frontend: React 18 + Vite (port 5176)
- Backend Proxy: Express (port 3001) - `C:\Project\myproject\stock-data-proxy-server`
- 9 data provider fallback system (Yahoo primary)
- TradingView chart integration

---

## Major Features Implemented

### 1. **Technical Indicators (14 total)**
- EMA 50/200
- RSI
- MACD
- Volume MA
- OBV (On-Balance Volume)
- VWAP
- Bollinger Bands
- ATR
- Stochastic Oscillator
- ADX
- CCI
- Williams %R
- Parabolic SAR
- Ichimoku Cloud

### 2. **TradingView Chart Integration**
- Replaced custom SVG charts with TradingView widget
- Live data with professional charting interface

### 3. **Multi-Provider System**
- 9 data sources with automatic failover
- Priority: Yahoo → TwelveData → Finnhub → Tiingo → Polygon → FMP → AlphaVantage → Marketstack → EODHistorical
- Server: `C:\Project\myproject\stock-data-proxy-server`

### 4. **Market Scanner**
- Batch analysis of stocks from symbols.json (572 unique symbols)
- Concurrent processing with configurable settings
- Filter by sentiment (bullish/bearish/neutral)
- Sort by score, RSI, price, etc.

### 5. **Pre/Post Market Data**
- Added `includePrePost` checkbox (defaults to true)
- Toggleable extended hours data fetching
- Reduces API load when not needed

---

## Recent Major Changes

### Architecture Refactoring (Phase 14)
**Goal:** Remove all hardcoded service URLs from client

**Changes:**
1. Removed `YAHOO_BASE` constant from App.jsx
2. Changed API endpoint format:
   - Old: `/stock?symbol=AAPL&interval=1d&range=1y`
   - **New:** `/api/stock/AAPL?interval=1d&range=1y&includePrePost=true`
3. Client now 100% dependent on proxy server
4. Symbol in URL path, parameters in query string

### includePrePost Feature (Phase 15)
**Added:** UI checkbox to control pre/post market data fetching

**Implementation:**
- State: `const [includePrePost, setIncludePrePost] = useState(true);`
- Checkbox location: After timeframe selector in AnalyzeTab
- Server accepts parameter and conditionally adds to Yahoo API URL
- Reduces API load when extended hours data not needed

### Infinite Request Loop Fix (Latest)
**Problem:** Continuous requests to server (~5 per second) for ADSK symbol

**Root Cause:** Multiple React useEffect dependency issues:
1. `fetchCloses` prop recreated on every render (inline function)
2. `loadForTimeframe` had `viewStock` in dependencies (circular)
3. `loadForTimeframe` in useEffect dependencies caused re-triggers

**Solutions Applied:**
1. Created `memoizedFetchCloses` with `React.useCallback`
2. Removed `viewStock` from `loadForTimeframe` dependencies
3. Used functional state updates: `setViewStock((prev) => ...)`
4. Added `fetchingRef` and `lastFetchRef` to prevent concurrent/duplicate fetches
5. Removed `loadForTimeframe` from useEffect dependencies
6. Added detailed console logging for debugging

**Key Files Modified:**
- `src/App.jsx` - Lines 669-671 (memoizedFetchCloses)
- `src/App.jsx` - Lines 1876-1982 (ScannerDetailTab component)

---

## Critical Code Patterns

### 1. Memoized Fetch Function
```javascript
const memoizedFetchCloses = React.useCallback(
  (sym, tf) => fetchSymbolClosesWithRetry(sym, tf, 2, 800),
  [] // Empty deps - function doesn't depend on props/state
);
```

### 2. Prevent Infinite Loops with Refs
```javascript
const fetchingRef = React.useRef(false); // Prevent concurrent fetches
const lastFetchRef = React.useRef(null); // Track last fetch params

if (fetchingRef.current) return; // Guard
fetchingRef.current = true;
lastFetchRef.current = `${sym}-${tf}`;
```

### 3. Functional State Updates
```javascript
// Instead of: setViewStock(newView)
setViewStock((prevViewStock) => {
  const newView = { ...prevViewStock, ...updates };
  return newView;
});
```

### 4. Auto-refresh on Timeframe/includePrePost Changes
```javascript
React.useEffect(() => {
  if (!analysis) return; // Only if user has searched
  fetchAndAnalyzeSymbol(trimmed, timeframe, { showLoading: false });
}, [timeframe, includePrePost]);
```

---

## File Structure

```
stock-sentiment/
├── index.html              # App entry
├── package.json            # Dependencies
├── vite.config.js          # Vite config
├── vitest.config.js        # Test config
├── .env.example            # Environment template
├── README.md               # Documentation
├── server/
│   ├── index.js           # Local proxy example
│   └── package.json
└── src/
    ├── main.jsx           # React entry
    ├── App.jsx            # Main component (3182 lines)
    ├── index.css          # Global styles
    ├── data/
    │   └── symbols.json   # 572 unique stock symbols
    └── lib/
        ├── indicators.js      # Indicator calculations
        └── indicators.test.js # Unit tests
```

---

## Environment Variables

```env
VITE_LOCAL_PROXY_URL=http://localhost:3001
```

---

## Known Issues & Solutions

### Issue: Continuous Server Requests
**Status:** FIXED  
**Solution:** Memoized callbacks + refs to prevent duplicate fetches

### Issue: Duplicate Symbols in symbols.json
**Status:** FIXED  
**Solution:** Removed 313 duplicates, now 572 unique symbols

### Issue: CORS Errors
**Status:** RESOLVED  
**Solution:** Using proxy server for all API calls

---

## Testing

```powershell
# Unit tests
npm run test

# Dev server
npm run dev

# Run both frontend + local proxy
npm run dev:all
```

---

## Important Notes

1. **Always use proxy server** - No direct API calls from client
2. **includePrePost defaults to true** - Maintains backward compatibility
3. **Scanner uses same timeframe for all symbols** - Set via scanTimeframe state
4. **Refs prevent infinite loops** - fetchingRef and lastFetchRef are critical
5. **Memoization is essential** - Prevents unnecessary re-renders and refetches

---

## Next Steps / Future Enhancements

- [ ] Add more timeframe options (tick data, weekly, monthly)
- [ ] Export scanner results to CSV
- [ ] Add price alerts/notifications
- [ ] Portfolio tracking
- [ ] Historical backtest simulator
- [ ] Mobile responsive improvements
- [ ] Dark/light theme toggle
- [ ] Save favorite symbols
- [ ] Custom indicator formulas

---

## Related Projects

- **Proxy Server:** `C:\Project\myproject\stock-data-proxy-server`
- **Other variants:** (to be documented separately)

---

*This summary was created to preserve chat history context before renaming the project folder.*
