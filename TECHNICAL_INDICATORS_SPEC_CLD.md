# Technical Indicators Specification for Database Architecture

**Project:** Stock Sentiment Pro  
**Date:** December 3, 2025  
**Purpose:** Database schema design reference

---

## 1. Data Requirements Summary

### Minimum Data Points Required
| Timeframe | Minimum Candles | Calculation Type |
|-----------|----------------|------------------|
| **Intraday** (1m-12h) | 100 bars | Short-term indicators |
| **Daily** (1d) | 220 bars | Full indicator suite |
| **Weekly** (5d, 1wk) | 50 bars | Medium-term indicators |
| **Monthly** (1mo, 3mo) | 30 bars | Long-term indicators |

### Required Data Fields (OHLCV)
```javascript
{
  timestamp: Unix seconds (required),
  open: decimal,
  high: decimal,
  low: decimal,
  close: decimal,
  volume: integer
}
```

---

## 2. Technical Indicators Used (16 Total)

### Core Indicators (Always Calculated)

#### 1. **EMA (Exponential Moving Average)**
- **Formula:** EMA = Price × k + EMA_prev × (1 - k), where k = 2/(period+1)
- **Inputs:** Close prices
- **Periods Used:** 20, 50, 200 (varies by timeframe)
- **Minimum Data:** Period length
- **Output:** Array of values aligned with input

#### 2. **RSI (Relative Strength Index)**
- **Formula:** RSI = 100 - (100 / (1 + RS)), where RS = avgGain / avgLoss
- **Inputs:** Close prices
- **Period:** 14 (default)
- **Minimum Data:** 15 bars (period + 1)
- **Output:** Single value (0-100 range)

#### 3. **MACD (Moving Average Convergence Divergence)**
- **Formula:** MACD = EMA(12) - EMA(26), Signal = EMA(MACD, 9), Histogram = MACD - Signal
- **Inputs:** Close prices
- **Periods:** Fast=12, Slow=26, Signal=9
- **Minimum Data:** 35 bars (26 + 9)
- **Output:** { macd, signal, histogram }

---

### Volume Indicators

#### 4. **Volume MA (Volume Moving Average)**
- **Formula:** Simple moving average of volume
- **Inputs:** Volume data
- **Period:** 20
- **Minimum Data:** 20 bars
- **Output:** Array of average volumes

#### 5. **OBV (On-Balance Volume)**
- **Formula:** If close > prev_close: OBV += volume, else OBV -= volume
- **Inputs:** Close prices, volumes
- **Minimum Data:** 2 bars
- **Output:** Cumulative volume indicator

#### 6. **VWAP (Volume Weighted Average Price)**
- **Formula:** VWAP = Σ(Typical_Price × Volume) / Σ(Volume)
- **Inputs:** High, low, close, volume
- **Typical Price:** (high + low + close) / 3
- **Minimum Data:** 1 bar (cumulative)
- **Output:** Array of VWAP values

---

### Volatility Indicators

#### 7. **Bollinger Bands**
- **Formula:** 
  - Middle = SMA(20)
  - Upper = Middle + (2 × StdDev)
  - Lower = Middle - (2 × StdDev)
  - %B = (Close - Lower) / (Upper - Lower)
- **Inputs:** Close prices
- **Period:** 20, StdDev Multiplier: 2
- **Minimum Data:** 20 bars
- **Output:** { middle, upper, lower, percentB, bandwidth }

#### 8. **ATR (Average True Range)**
- **Formula:** ATR = Smoothed average of True Range
- **True Range:** Max(high - low, |high - prev_close|, |low - prev_close|)
- **Inputs:** High, low, close
- **Period:** 14
- **Minimum Data:** 15 bars
- **Output:** Array of ATR values

---

### Trend Strength Indicators

#### 9. **ADX (Average Directional Index)**
- **Formula:** Complex calculation involving +DI, -DI, and DX smoothing
- **Inputs:** High, low, close
- **Period:** 14
- **Minimum Data:** 28 bars (period × 2)
- **Output:** { adx, plusDI, minusDI } (0-100 range)
- **Note:** ADX > 25 = strong trend, < 20 = weak trend

---

### Money Flow Indicators

#### 10. **MFI (Money Flow Index)**
- **Formula:** Volume-weighted RSI using typical price
- **Inputs:** High, low, close, volume
- **Period:** 14
- **Minimum Data:** 15 bars
- **Output:** Single value (0-100 range)
- **Note:** MFI > 80 = overbought, < 20 = oversold

---

### Momentum Indicators

#### 11. **Stochastic Oscillator**
- **Formula:**
  - %K = ((Close - Lowest_Low) / (Highest_High - Lowest_Low)) × 100
  - %D = SMA(%K, 3)
- **Inputs:** High, low, close
- **Periods:** K=14, D=3
- **Minimum Data:** 17 bars
- **Output:** { k, d } (0-100 range)

#### 12. **ROC (Rate of Change)**
- **Formula:** ROC = ((Close - Close_n_periods_ago) / Close_n_periods_ago) × 100
- **Inputs:** Close prices
- **Period:** 12
- **Minimum Data:** 13 bars
- **Output:** Percentage change

---

### Support/Resistance Detection

#### 13. **Swing Highs (Resistance Levels)**
- **Logic:** Find local maxima where high[i] > all surrounding highs
- **Inputs:** High prices
- **Lookback:** 20 bars, Strength: 2
- **Minimum Data:** 25 bars
- **Output:** Array of { price, index }

#### 14. **Swing Lows (Support Levels)**
- **Logic:** Find local minima where low[i] < all surrounding lows
- **Inputs:** Low prices
- **Lookback:** 40 bars, Strength: 2
- **Minimum Data:** 45 bars
- **Output:** Array of { price, index }

---

## 3. Indicator Configuration by Timeframe

### Intraday (1m - 12h)
```javascript
{
  emaShort: 20,    // Fast EMA
  emaLong: 50,     // Slow EMA
  rsi: 14,         // RSI period
  macdFast: 12,    // MACD fast EMA
  macdSlow: 26,    // MACD slow EMA
  macdSignal: 9,   // MACD signal EMA
  minBars: 100     // Minimum data required
}
```

### Daily (1d)
```javascript
{
  emaShort: 50,    // 50-day EMA
  emaLong: 200,    // 200-day EMA (standard)
  rsi: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  minBars: 220     // Need ~1 year of data
}
```

### Weekly (5d, 1wk)
```javascript
{
  emaShort: 10,
  emaLong: 40,
  rsi: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  minBars: 50
}
```

### Monthly (1mo, 3mo)
```javascript
{
  emaShort: 6,
  emaLong: 24,
  rsi: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  minBars: 30
}
```

---

## 4. Sentiment Scoring Algorithm

### Score Range: -16 to +16

| Component | Weight | Calculation |
|-----------|--------|-------------|
| **Trend** | ±4 | EMA crossovers, price vs EMA200 |
| **Momentum** | ±4 | RSI (30-70 optimal), MACD histogram |
| **Volume** | ±2 | Volume vs 20-period MA |
| **Volatility** | ±2 | Bollinger %B, squeeze detection |
| **Trend Strength** | ±2 | ADX value, +DI vs -DI |
| **Money Flow** | ±2 | MFI (20-80 optimal) |
| **Price Position** | ±1 | Distance from EMA200 (±20% limit) |
| **Support/Resistance** | ±1 | Proximity to swing levels |

### Sentiment Categories
- **Strong Bullish:** Score ≥ 8
- **Bullish:** Score 3-7
- **Neutral:** Score -2 to 2
- **Bearish:** Score -7 to -3
- **Strong Bearish:** Score ≤ -8

---

## 5. Database Storage Recommendations

### Candlestick Data Table
```sql
CREATE TABLE candles (
  id BIGINT PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  interval VARCHAR(5) NOT NULL,  -- '1m', '5m', '1d', etc.
  timestamp BIGINT NOT NULL,     -- Unix seconds
  open DECIMAL(12,4),
  high DECIMAL(12,4),
  low DECIMAL(12,4),
  close DECIMAL(12,4),
  volume BIGINT,
  INDEX idx_symbol_interval_ts (symbol, interval, timestamp)
);
```

### Computed Indicators Table (Optional - for caching)
```sql
CREATE TABLE indicators (
  id BIGINT PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  interval VARCHAR(5) NOT NULL,
  timestamp BIGINT NOT NULL,
  ema_short DECIMAL(12,4),
  ema_long DECIMAL(12,4),
  rsi DECIMAL(5,2),
  macd DECIMAL(12,4),
  macd_signal DECIMAL(12,4),
  macd_hist DECIMAL(12,4),
  bollinger_upper DECIMAL(12,4),
  bollinger_middle DECIMAL(12,4),
  bollinger_lower DECIMAL(12,4),
  atr DECIMAL(12,4),
  adx DECIMAL(5,2),
  mfi DECIMAL(5,2),
  stochastic_k DECIMAL(5,2),
  stochastic_d DECIMAL(5,2),
  sentiment_score INT,           -- -16 to +16
  sentiment VARCHAR(20),          -- 'Strong Bullish', etc.
  INDEX idx_symbol_interval (symbol, interval, timestamp)
);
```

### Metadata Table
```sql
CREATE TABLE indicator_metadata (
  symbol VARCHAR(10) PRIMARY KEY,
  company_name VARCHAR(255),
  last_updated BIGINT,
  data_quality VARCHAR(20),      -- 'excellent', 'good', 'insufficient'
  min_bars_available INT,
  earliest_timestamp BIGINT,
  latest_timestamp BIGINT
);
```

---

## 6. Critical Notes for Database Team

### Data Ordering
⚠️ **CRITICAL:** All indicator calculations require **chronological order** (oldest → newest)
- Always sort by timestamp ASC before calculations
- Incorrect ordering = invalid indicators

### Missing Data Handling
- Indicators return `null` for warmup period (e.g., EMA[0:19] = null for period 20)
- RSI requires period+1 bars minimum
- MACD requires slow_period + signal_period minimum
- Daily data needs ~220 bars (1 year) for full accuracy

### Performance Optimization
- **Pre-aggregate:** Store 5m candles, aggregate to 10m/15m/30m on-the-fly
- **Cache indicators:** Recompute only last N bars when new data arrives
- **Incremental updates:** Most indicators can be updated incrementally (EMA, RSI, etc.)
- **Index strategy:** Composite index on (symbol, interval, timestamp) is essential

### Data Freshness Requirements
| Interval | Max Staleness | Update Frequency |
|----------|---------------|------------------|
| 1m-5m | 1 minute | Real-time/streaming |
| 15m-1h | 5 minutes | Polling |
| 1d | 1 hour | Daily close + after-hours |
| 1wk-1mo | 1 day | Daily/weekly jobs |

---

## 7. API Response Format Expected by Frontend

```javascript
{
  chart: {
    result: [{
      meta: { symbol, currency, exchangeName },
      timestamp: [1234567890, ...],
      indicators: {
        quote: [{
          open: [...],
          high: [...],
          low: [...],
          close: [...],
          volume: [...]
        }]
      }
    }]
  },
  _meta: {
    source: 'yahoo',
    companyName: 'Apple Inc.',
    quotaUsed: 1,
    requestedInterval: '1d',
    appliedRange: '1y'
  }
}
```

---

## 8. Calculation Dependencies

### Indicator Dependency Graph
```
Raw OHLCV Data
  ├─> EMA (Close) ──> MACD
  ├─> RSI (Close)
  ├─> Bollinger Bands (Close)
  ├─> ATR (High, Low, Close)
  ├─> ADX (High, Low, Close)
  ├─> Volume MA (Volume) ──> Volume Confirmation
  ├─> OBV (Close, Volume)
  ├─> VWAP (High, Low, Close, Volume)
  ├─> MFI (High, Low, Close, Volume)
  ├─> Stochastic (High, Low, Close)
  ├─> ROC (Close)
  └─> Swing Levels (High, Low, Close)
      ├─> Support Levels
      └─> Resistance Levels
```

### Calculation Order
1. **Raw indicators** (no dependencies): EMA, RSI, Bollinger, ATR, Volume MA, OBV, VWAP, ADX, MFI, Stochastic, ROC
2. **Composite indicators**: MACD (requires EMA)
3. **Derived metrics**: Swing levels, support/resistance
4. **Sentiment score** (requires all above)

---

## 9. Testing & Validation

### Validation Criteria
- **EMA:** Should smooth price action, slower periods = smoother lines
- **RSI:** Must stay within 0-100 range
- **MACD:** Histogram crosses zero when MACD crosses signal
- **Bollinger %B:** 0 = at lower band, 1 = at upper band
- **ADX:** 0-100 range, higher = stronger trend (direction-agnostic)
- **MFI:** Similar to RSI but volume-weighted

### Known Edge Cases
- **Division by zero:** Handle when avgLoss=0 (RSI=100), volume=0, stdDev=0
- **Insufficient data:** Return null/error instead of incorrect calculations
- **Flat price series:** Can cause NaN in some indicators
- **Extreme volatility:** Bollinger bands can become very wide

---

## Summary for Database Team

**Total Indicators:** 16  
**Minimum Storage per Symbol:** 220 daily candles (OHLCV) for full analysis  
**Required Fields:** Open, High, Low, Close, Volume, Timestamp  
**Update Frequency:** Real-time for intraday, hourly for daily  
**Critical Constraint:** Data must be sorted chronologically  
**Recommended Approach:** Store raw OHLCV, calculate indicators on-demand with caching  

**Estimated Storage:**
- 1 symbol × 1 year daily data = ~252 candles × 6 fields × 8 bytes = ~12 KB
- 1 symbol × 1 day 1-minute data = ~390 candles × 6 fields × 8 bytes = ~19 KB
- 500 symbols × daily + intraday = ~15 MB base data (excludes computed indicators)

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2025  
**Contact:** Frontend Development Team
