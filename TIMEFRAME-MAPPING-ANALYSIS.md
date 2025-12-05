# Timeframe Mapping Analysis - Complete Report

## Executive Summary

**Status: ✅ ALL TIMEFRAMES ARE CORRECTLY MAPPED**

The application **intentionally** sends different interval parameters to the proxy server for certain timeframes. This is by design and working as intended.

## The Question

> "If we want 4hr data, do we send '4h' in the input parameter?"

## The Answer

**NO - and that's correct!** When you select 4h timeframe:
- User sees: "4 hours" in the UI
- App sends to proxy: `interval=1h` (NOT `4h`)
- Client then aggregates: 4 × 1h bars → 1 × 4h bar

This happens for **7 out of 19 timeframes**.

---

## Complete Timeframe Mapping Table

| User Selects | Proxy Receives | Method | Reason |
|-------------|----------------|--------|--------|
| 1m | 1m | ✅ Direct | Yahoo Finance native support |
| 2m | 2m | ✅ Direct | Yahoo Finance native support |
| **3m** | **1m** | 🔄 Aggregated | Not natively supported - combines 3×1m |
| **4m** | **2m** | 🔄 Aggregated | Not natively supported - combines 2×2m |
| 5m | 5m | ✅ Direct | Yahoo Finance native support |
| **10m** | **5m** | 🔄 Aggregated | Not natively supported - combines 2×5m |
| 15m | 15m | ✅ Direct | Yahoo Finance native support |
| 30m | 30m | ✅ Direct | Yahoo Finance native support |
| 60m | 60m | ✅ Direct | Yahoo Finance native support |
| 90m | 90m | ✅ Direct | Yahoo Finance native support |
| **2h** | **1h** | 🔄 Aggregated | Not natively supported - combines 2×1h |
| **4h** | **1h** | 🔄 Aggregated | Not natively supported - combines 4×1h |
| **6h** | **1h** | 🔄 Aggregated | Not natively supported - combines 6×1h |
| **12h** | **1h** | 🔄 Aggregated | Not natively supported - combines 12×1h |
| 1d | 1d | ✅ Direct | Yahoo Finance native support |
| 5d | 5d | ✅ Direct | Yahoo Finance native support |
| 1wk | 1wk | ✅ Direct | Yahoo Finance native support |
| 1mo | 1mo | ✅ Direct | Yahoo Finance native support |
| 3mo | 3mo | ✅ Direct | Yahoo Finance native support |

---

## How Aggregation Works

### Code Location: `App.jsx` lines 48-78

```javascript
// 1. Define which timeframes need aggregation
const AGGREGATION_MAP = {
  '3m': { base: '1m', multiplier: 3 },
  '4m': { base: '2m', multiplier: 2 },
  '10m': { base: '5m', multiplier: 2 },
  '2h': { base: '1h', multiplier: 2 },
  '4h': { base: '1h', multiplier: 4 },
  '6h': { base: '1h', multiplier: 6 },
  '12h': { base: '1h', multiplier: 12 }
};

// 2. Determine what to request from proxy
const aggregationConfig = AGGREGATION_MAP[timeframe];
const requestInterval = aggregationConfig ? aggregationConfig.base : timeframe;
// Example: timeframe='4h' → requestInterval='1h'

// 3. Fetch from proxy
const url = `${proxyUrl}/api/stock/${symbol}?interval=${requestInterval}`;
// Example: ?interval=1h

// 4. Aggregate candles client-side (lines 59-78)
function aggregateCandles(candles, multiplier) {
  // Combines multiple bars into one
  // open = first bar's open
  // high = max of all bars
  // low = min of all bars
  // close = last bar's close
  // volume = sum of all bars
}
```

### Example: 4h Timeframe Flow

1. User selects "4 hours" from dropdown
2. App checks: Is "4h" in `AGGREGATION_MAP`? → YES
3. App determines: Need to fetch "1h" data (base interval)
4. App requests: `GET /api/stock/AAPL?interval=1h`
5. Proxy returns: ~200 bars of 1h data
6. App aggregates: Every 4 consecutive 1h bars → 1 × 4h bar
7. Result: ~50 bars of 4h data for display

---

## Why This Approach?

### Reasons for Client-Side Aggregation:

1. **API Limitations**: Yahoo Finance doesn't support 4h, 6h, 12h natively
2. **More Options**: Users get more timeframe choices than API provides
3. **Accurate Data**: Proper OHLCV aggregation maintains integrity
4. **Flexibility**: Can add new timeframes without proxy changes
5. **Consistency**: Same calculation method across all aggregated intervals

### Trade-offs:

✅ **Advantages:**
- More timeframe options for users
- Works around API provider limitations
- Client has full control over calculations
- No proxy server modifications needed

⚠️ **Considerations:**
- Fetches more data than displayed (e.g., 200 bars of 1h for 50 bars of 4h)
- Client-side processing (minimal impact - runs fast)
- Requires understanding when debugging

---

## Validation Results

### Direct Mappings (12 timeframes):
These are sent exactly as selected:
```
1m, 2m, 5m, 15m, 30m, 60m, 90m, 1d, 5d, 1wk, 1mo, 3mo
```

### Aggregated Timeframes (7 timeframes):
These are calculated client-side:
```
3m   → Fetch 1m,  aggregate by 3
4m   → Fetch 2m,  aggregate by 2
10m  → Fetch 5m,  aggregate by 2
2h   → Fetch 1h,  aggregate by 2
4h   → Fetch 1h,  aggregate by 4
6h   → Fetch 1h,  aggregate by 6
12h  → Fetch 1h,  aggregate by 12
```

---

## Testing Verification

Run this to verify the mapping:
```powershell
node verify-timeframe-mapping.js
```

The script validates:
- ✅ All 19 UI timeframes are accounted for
- ✅ Aggregation config is correct
- ✅ No missing or duplicate mappings
- ✅ Logic matches implementation

---

## Conclusion

**The timeframe mapping is WORKING AS DESIGNED.**

When you select "4 hours":
- ✅ The proxy receives `interval=1h` (correct)
- ✅ The client aggregates 4×1h bars (correct)
- ✅ You get accurate 4h candle data (correct)

**No changes needed.** This is a smart workaround for API limitations that provides users with more timeframe options while maintaining data accuracy.

---

## For AI Agents / Developers

When debugging timeframe issues:

1. Check if timeframe is in `AGGREGATION_MAP` (line 48)
2. If yes, proxy receives **base interval**, not the selected timeframe
3. Aggregation happens in `fetchCloses()` at line 288
4. The `aggregateCandles()` function combines OHLCV properly
5. This is intentional - not a bug!

**Key files:**
- `src/App.jsx` lines 48-78 (aggregation logic)
- `src/App.jsx` line 192-195 (request interval selection)
- `src/App.jsx` line 288 (aggregation execution)
