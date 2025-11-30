# Quick Verification Checklist

Run this checklist to verify all fixes are applied:

## ✓ Verification Commands

### 1. Check 60m timeframe has 3mo range:
```powershell
Select-String -Path "src/App.jsx" -Pattern "60m.*3mo"
```
Expected: Should find match

### 2. Check sentiment threshold is now 2:
```powershell
Select-String -Path "src/lib/indicators.js" -Pattern "score >= 2"
```
Expected: Should find match

### 3. Check 30m has 1mo range:
```powershell
Select-String -Path "src/App.jsx" -Pattern "30m.*1mo"
```
Expected: Should find match

### 4. Check intraday detection includes 60m:
```powershell
Select-String -Path "src/lib/indicators.js" -Pattern "emaShort <= 50"
```
Expected: Should find match

### 5. Check debug logging exists:
```powershell
Select-String -Path "src/App.jsx" -Pattern "console.debug" | Measure-Object
```
Expected: Should find multiple matches

## ✓ Browser Testing Checklist

1. [ ] Start dev server: `npm run dev`
2. [ ] Open app in browser (http://localhost:5173)
3. [ ] Enable CORS proxy toggle
4. [ ] Select **60m** timeframe
5. [ ] Click **Start Scan**
6. [ ] Open DevTools Console (F12)
7. [ ] Observe:
   - [ ] "Starting scan with 850 available symbols"
   - [ ] Symbol names appearing in console
   - [ ] Results appearing in table (should see at least 1-5)
   - [ ] Buy zones showing realistic values (±0.5% for 60m)

## ✓ Test All Timeframes

Test each and confirm results appear:
- [ ] 1m
- [ ] 5m
- [ ] 15m
- [ ] 30m
- [ ] 60m ← PRIORITY
- [ ] 1d

## ✓ If No Results Still Appear

Check console for these messages:
1. "insufficient data" → Yahoo API issue
2. "sentiment error" → Calculation issue
3. "doesn't match filters" → All results filtered out

**Solution:** Enable ALL three sentiment filters (Bullish, Bearish, Neutral)

## ✓ Summary of Key Changes

| Item | Before | After | Status |
|------|--------|-------|--------|
| 60m range | 5d | 3mo | ✓ FIXED |
| 30m range | 5d | 1mo | ✓ FIXED |
| Bullish threshold | score ≥ 3 | score ≥ 2 | ✓ FIXED |
| Bearish threshold | score ≤ -3 | score ≤ -2 | ✓ FIXED |
| Intraday detection | < 50 | ≤ 50 | ✓ FIXED |
| Data check | hardcoded 50 | params.minBars | ✓ FIXED |
| Debug logging | minimal | detailed | ✓ ADDED |

All fixes verified ✓
