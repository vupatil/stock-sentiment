// Indicator helpers

export function calculateEMA(values, period) {
  if (!values || values.length < period) return null;

  const k = 2 / (period + 1);
  let emaArray = new Array(values.length).fill(null);
  let sum = 0;

  // First SMA
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let emaPrev = sum / period;
  emaArray[period - 1] = emaPrev;

  // EMA onwards
  for (let i = period; i < values.length; i++) {
    const price = values[i];
    const ema = price * k + emaPrev * (1 - k);
    emaArray[i] = ema;
    emaPrev = ema;
  }

  return emaArray;
}

export function calculateRSI(values, period = 14) {
  if (!values || values.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return rsi;
}

export function calculateMACD(values, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (!values || values.length < longPeriod + signalPeriod) return null;

  const emaShort = calculateEMA(values, shortPeriod);
  const emaLong = calculateEMA(values, longPeriod);
  if (!emaShort || !emaLong) return null;

  const macdLine = [];
  for (let i = 0; i < values.length; i++) {
    if (emaShort[i] != null && emaLong[i] != null) {
      macdLine[i] = emaShort[i] - emaLong[i];
    } else {
      macdLine[i] = null;
    }
  }

  const validMacd = macdLine.filter((v) => v != null);
  if (validMacd.length < signalPeriod) return null;

  const signalArray = calculateEMA(validMacd, signalPeriod);
  const macdLast = validMacd[validMacd.length - 1];
  const signalLast = signalArray[signalArray.length - 1];
  const histLast = macdLast - signalLast;

  return { macd: macdLast, signal: signalLast, hist: histLast };
}

export function calculateRSIArray(values, period = 14) {
  if (!values || values.length <= period) return null;
  const rsiArray = new Array(values.length).fill(null);

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsiArray[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsiArray[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsiArray;
}

export function calculateMACDSeries(values, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (!values || values.length < longPeriod + signalPeriod) return null;
  const emaShort = calculateEMA(values, shortPeriod);
  const emaLong = calculateEMA(values, longPeriod);
  if (!emaShort || !emaLong) return null;

  const macdLine = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (emaShort[i] != null && emaLong[i] != null) {
      macdLine[i] = emaShort[i] - emaLong[i];
    }
  }

  const validMacd = macdLine.map((v, idx) => ({ v, idx })).filter((x) => x.v != null);
  if (validMacd.length < signalPeriod) return null;
  const validValues = validMacd.map((x) => x.v);
  const signalCompact = calculateEMA(validValues, signalPeriod);

  // Map signal back to original indexes
  const signalLine = new Array(values.length).fill(null);
  for (let i = 0; i < validMacd.length; i++) {
    const originalIdx = validMacd[i].idx;
    // signalCompact is aligned with validValues array
    const signalVal = signalCompact[i];
    if (signalVal != null) signalLine[originalIdx] = signalVal;
  }

  const hist = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (macdLine[i] != null && signalLine[i] != null) {
      hist[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, hist };
}

// Volume indicators
export function calculateVolumeMA(volumes, period = 20) {
  if (!volumes || volumes.length < period) return null;
  const result = new Array(volumes.length).fill(null);
  for (let i = period - 1; i < volumes.length; i++) {
    const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result[i] = sum / period;
  }
  return result;
}

export function calculateOBV(closes, volumes) {
  if (!closes || !volumes || closes.length !== volumes.length || closes.length < 2) return null;
  const obv = new Array(closes.length).fill(null);
  obv[0] = volumes[0];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv[i] = obv[i - 1] + volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      obv[i] = obv[i - 1] - volumes[i];
    } else {
      obv[i] = obv[i - 1];
    }
  }
  return obv;
}

export function calculateVWAP(closes, highs, lows, volumes, timestamps) {
  // VWAP is typically reset daily for intraday data
  // For simplicity, calculate cumulative VWAP across the dataset
  if (!closes || !volumes || closes.length < 1) return null;
  const vwap = new Array(closes.length).fill(null);
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < closes.length; i++) {
    const typical = highs && lows && highs[i] != null && lows[i] != null 
      ? (highs[i] + lows[i] + closes[i]) / 3 
      : closes[i];
    cumulativePV += typical * volumes[i];
    cumulativeVolume += volumes[i];
    vwap[i] = cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : null;
  }
  return vwap;
}

// Bollinger Bands
export function calculateBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  if (!closes || closes.length < period) return null;
  
  const middle = new Array(closes.length).fill(null);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  const percentB = new Array(closes.length).fill(null);
  const bandwidth = new Array(closes.length).fill(null);
  
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    middle[i] = sma;
    upper[i] = sma + stdDevMultiplier * stdDev;
    lower[i] = sma - stdDevMultiplier * stdDev;
    
    const bandRange = upper[i] - lower[i];
    percentB[i] = bandRange > 0 ? (closes[i] - lower[i]) / bandRange : 0.5;
    bandwidth[i] = middle[i] > 0 ? bandRange / middle[i] : 0;
  }
  
  return { middle, upper, lower, percentB, bandwidth };
}

// Average True Range (ATR)
export function calculateATR(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || closes.length < period + 1) return null;
  
  const tr = new Array(closes.length).fill(null);
  const atr = new Array(closes.length).fill(null);
  
  // First TR
  tr[0] = highs[0] - lows[0];
  
  // Calculate True Range for each period
  for (let i = 1; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }
  
  // Calculate initial ATR (SMA of first period)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  atr[period - 1] = sum / period;
  
  // Calculate subsequent ATR using smoothed average
  for (let i = period; i < closes.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }
  
  return atr;
}

// ADX (Average Directional Index) - measures trend strength (0-100)
export function calculateADX(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || closes.length < period * 2) return null;
  
  const length = closes.length;
  const tr = new Array(length).fill(0);
  const plusDM = new Array(length).fill(0);
  const minusDM = new Array(length).fill(0);
  
  // Calculate True Range and Directional Movement
  for (let i = 1; i < length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevHigh = highs[i - 1];
    const prevLow = lows[i - 1];
    const prevClose = closes[i - 1];
    
    // True Range
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
    }
    if (downMove > upMove && downMove > 0) {
      minusDM[i] = downMove;
    }
  }
  
  // Smooth TR, +DM, -DM using Wilder's smoothing
  const smoothTR = new Array(length).fill(0);
  const smoothPlusDM = new Array(length).fill(0);
  const smoothMinusDM = new Array(length).fill(0);
  
  // Initial sum
  let sumTR = 0, sumPlusDM = 0, sumMinusDM = 0;
  for (let i = 1; i <= period; i++) {
    sumTR += tr[i];
    sumPlusDM += plusDM[i];
    sumMinusDM += minusDM[i];
  }
  
  smoothTR[period] = sumTR;
  smoothPlusDM[period] = sumPlusDM;
  smoothMinusDM[period] = sumMinusDM;
  
  // Wilder's smoothing
  for (let i = period + 1; i < length; i++) {
    smoothTR[i] = smoothTR[i - 1] - (smoothTR[i - 1] / period) + tr[i];
    smoothPlusDM[i] = smoothPlusDM[i - 1] - (smoothPlusDM[i - 1] / period) + plusDM[i];
    smoothMinusDM[i] = smoothMinusDM[i - 1] - (smoothMinusDM[i - 1] / period) + minusDM[i];
  }
  
  // Calculate +DI and -DI
  const plusDI = new Array(length).fill(null);
  const minusDI = new Array(length).fill(null);
  const dx = new Array(length).fill(null);
  
  for (let i = period; i < length; i++) {
    if (smoothTR[i] !== 0) {
      plusDI[i] = (smoothPlusDM[i] / smoothTR[i]) * 100;
      minusDI[i] = (smoothMinusDM[i] / smoothTR[i]) * 100;
      
      const diSum = plusDI[i] + minusDI[i];
      if (diSum !== 0) {
        dx[i] = (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
      }
    }
  }
  
  // Calculate ADX (smoothed DX)
  const adx = new Array(length).fill(null);
  let sumDX = 0;
  let count = 0;
  
  for (let i = period; i < period * 2 && i < length; i++) {
    if (dx[i] != null) {
      sumDX += dx[i];
      count++;
    }
  }
  
  if (count > 0) {
    adx[period * 2 - 1] = sumDX / count;
  }
  
  // Smooth ADX
  for (let i = period * 2; i < length; i++) {
    if (adx[i - 1] != null && dx[i] != null) {
      adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
    }
  }
  
  return { adx, plusDI, minusDI };
}

// MFI (Money Flow Index) - volume-weighted RSI (0-100)
export function calculateMFI(highs, lows, closes, volumes, period = 14) {
  if (!highs || !lows || !closes || !volumes || closes.length < period + 1) return null;
  
  const length = closes.length;
  const typicalPrice = new Array(length);
  const rawMoneyFlow = new Array(length);
  const mfi = new Array(length).fill(null);
  
  // Calculate Typical Price and Raw Money Flow
  for (let i = 0; i < length; i++) {
    typicalPrice[i] = (highs[i] + lows[i] + closes[i]) / 3;
    rawMoneyFlow[i] = typicalPrice[i] * volumes[i];
  }
  
  // Calculate MFI
  for (let i = period; i < length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrice[j] > typicalPrice[j - 1]) {
        positiveFlow += rawMoneyFlow[j];
      } else if (typicalPrice[j] < typicalPrice[j - 1]) {
        negativeFlow += rawMoneyFlow[j];
      }
    }
    
    if (negativeFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyFlowRatio = positiveFlow / negativeFlow;
      mfi[i] = 100 - (100 / (1 + moneyFlowRatio));
    }
  }
  
  return mfi;
}

// Stochastic Oscillator (K%, D%)
export function calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (!highs || !lows || !closes || closes.length < kPeriod) return null;
  
  const length = closes.length;
  const kLine = new Array(length).fill(null);
  const dLine = new Array(length).fill(null);
  
  // Calculate %K
  for (let i = kPeriod - 1; i < length; i++) {
    let highest = highs[i];
    let lowest = lows[i];
    
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > highest) highest = highs[j];
      if (lows[j] < lowest) lowest = lows[j];
    }
    
    if (highest !== lowest) {
      kLine[i] = ((closes[i] - lowest) / (highest - lowest)) * 100;
    } else {
      kLine[i] = 50;
    }
  }
  
  // Calculate %D (SMA of %K)
  for (let i = kPeriod + dPeriod - 2; i < length; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      if (kLine[j] != null) sum += kLine[j];
    }
    dLine[i] = sum / dPeriod;
  }
  
  return { k: kLine, d: dLine };
}

// Rate of Change (ROC) - price velocity
export function calculateROC(closes, period = 12) {
  if (!closes || closes.length < period + 1) return null;
  
  const roc = new Array(closes.length).fill(null);
  
  for (let i = period; i < closes.length; i++) {
    const current = closes[i];
    const past = closes[i - period];
    if (past !== 0) {
      roc[i] = ((current - past) / past) * 100;
    }
  }
  
  return roc;
}

// Find swing highs and lows for support/resistance
export function findSwingLevels(highs, lows, closes, lookback = 20, strength = 2) {
  if (!highs || !lows || closes.length < lookback) return { support: [], resistance: [] };
  
  const resistance = [];
  const support = [];
  
  // Find swing highs (resistance)
  for (let i = strength; i < highs.length - strength; i++) {
    let isSwingHigh = true;
    
    for (let j = i - strength; j <= i + strength; j++) {
      if (j !== i && highs[j] >= highs[i]) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      resistance.push({ price: highs[i], index: i });
    }
  }
  
  // Find swing lows (support)
  for (let i = strength; i < lows.length - strength; i++) {
    let isSwingLow = true;
    
    for (let j = i - strength; j <= i + strength; j++) {
      if (j !== i && lows[j] <= lows[i]) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow) {
      support.push({ price: lows[i], index: i });
    }
  }
  
  // Keep only recent and significant levels
  const currentPrice = closes[closes.length - 1];
  const recentCount = Math.min(lookback, closes.length);
  
  const recentResistance = resistance
    .filter(r => r.index >= closes.length - recentCount)
    .filter(r => r.price >= currentPrice * 0.95) // Within 5% of current
    .sort((a, b) => a.price - b.price);
  
  const recentSupport = support
    .filter(s => s.index >= closes.length - recentCount)
    .filter(s => s.price <= currentPrice * 1.05) // Within 5% of current
    .sort((a, b) => b.price - a.price);
  
  return {
    support: recentSupport.slice(0, 3), // Top 3 support levels
    resistance: recentResistance.slice(0, 3) // Top 3 resistance levels
  };
}

export function analyzeTechnicalSentiment(closes, params = null, volumes = null, highs = null, lows = null) {
  // Default parameters for daily timeframe
  const defaultParams = {
    emaShort: 50,
    emaLong: 200,
    rsi: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    minBars: 200
  };
  
  const p = params || defaultParams;
  
  if (!closes || closes.length < p.minBars) {
    return { error: `Not enough data to compute indicators (need about ${p.minBars} bars for this timeframe).` };
  }

  const latestPrice = closes[closes.length - 1];
  const ema50Arr = calculateEMA(closes, p.emaShort);
  const ema200Arr = calculateEMA(closes, p.emaLong);
  const rsi = calculateRSI(closes, p.rsi);
  const macdObj = calculateMACD(closes, p.macdFast, p.macdSlow, p.macdSignal);

  if (!ema50Arr || !ema200Arr || !macdObj || rsi == null) {
    return { error: "Could not compute indicators from the data returned." };
  }

  const ema50 = ema50Arr[ema50Arr.length - 1];
  const ema200 = ema200Arr[ema200Arr.length - 1];
  const { macd, signal, hist } = macdObj;

  // Calculate Phase 1 indicators if data available
  let volumeMA = null;
  let obv = null;
  let vwap = null;
  let bollingerBands = null;
  let atr = null;
  let volumeConfirmation = 0;
  let volatilityScore = 0;
  
  if (volumes && volumes.length === closes.length) {
    volumeMA = calculateVolumeMA(volumes, 20);
    obv = calculateOBV(closes, volumes);
    if (highs && lows && highs.length === closes.length) {
      vwap = calculateVWAP(closes, highs, lows, volumes);
      atr = calculateATR(highs, lows, closes, 14);
    }
  }
  
  if (highs && lows && highs.length === closes.length && lows.length === closes.length) {
    bollingerBands = calculateBollingerBands(closes, 20, 2);
    if (!atr) {
      atr = calculateATR(highs, lows, closes, 14);
    }
  }

  // NEW: Calculate advanced indicators
  let adxData = null;
  let mfi = null;
  let stochastic = null;
  let roc = null;
  let swingLevels = null;
  
  if (highs && lows && highs.length === closes.length) {
    adxData = calculateADX(highs, lows, closes, 14);
    stochastic = calculateStochastic(highs, lows, closes, 14, 3);
    swingLevels = findSwingLevels(highs, lows, closes, 40, 2);
    
    if (volumes && volumes.length === closes.length) {
      mfi = calculateMFI(highs, lows, closes, volumes, 14);
    }
  }
  
  roc = calculateROC(closes, 12);

  // Enhanced scoring: -16 to +16 (expanded from -12 to +12)
  let score = 0;
  const scoreBreakdown = {
    trend: 0,
    momentum: 0,
    volume: 0,
    volatility: 0,
    trendStrength: 0,
    moneyFlow: 0,
    pricePosition: 0,
    supportResistance: 0
  };

  // TREND SCORE (±4)
  if (latestPrice > ema200) {
    scoreBreakdown.trend += 2;
    score += 2;
  } else {
    scoreBreakdown.trend -= 2;
    score -= 2;
  }

  if (ema50 > ema200) {
    scoreBreakdown.trend += 2;
    score += 2;
  } else {
    scoreBreakdown.trend -= 1;
    score -= 1;
  }

  // MOMENTUM SCORE (±4)
  // RSI (±2)
  if (rsi > 55 && rsi < 70) {
    scoreBreakdown.momentum += 1;
    score += 1;
  } else if (rsi < 45 && rsi > 30) {
    scoreBreakdown.momentum -= 1;
    score -= 1;
  } else if (rsi >= 70 || rsi <= 30) {
    scoreBreakdown.momentum -= 2;
    score -= 2;
  }

  // MACD (±1)
  if (hist > 0 && macd > signal) {
    scoreBreakdown.momentum += 1;
    score += 1;
  } else {
    scoreBreakdown.momentum -= 1;
    score -= 1;
  }

  // VOLUME CONFIRMATION (±2)
  if (volumeMA && volumes) {
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumeMA[volumeMA.length - 1];
    
    if (avgVolume && currentVolume > avgVolume * 1.5) {
      // High volume
      const priceChange = closes.length > 1 ? closes[closes.length - 1] - closes[closes.length - 2] : 0;
      if (priceChange > 0) {
        volumeConfirmation = 2;
        scoreBreakdown.volume = 2;
        score += 2;
      } else if (priceChange < 0) {
        volumeConfirmation = -2;
        scoreBreakdown.volume = -2;
        score -= 2;
      }
    } else if (avgVolume && currentVolume < avgVolume * 0.7) {
      // Low volume - weak conviction
      const priceChange = closes.length > 1 ? Math.abs(closes[closes.length - 1] - closes[closes.length - 2]) : 0;
      const avgPrice = closes[closes.length - 1];
      const priceChangePercent = avgPrice > 0 ? (priceChange / avgPrice) * 100 : 0;
      if (priceChangePercent > 0.5) {
        // Price moving on low volume - suspicious
        volumeConfirmation = -1;
        scoreBreakdown.volume = -1;
        score -= 1;
      }
    }
  }

  // VOLATILITY / BOLLINGER BANDS (±2)
  if (bollingerBands) {
    const percentB = bollingerBands.percentB[bollingerBands.percentB.length - 1];
    
    if (percentB < 0.2 && rsi < 35) {
      // Oversold bounce setup
      volatilityScore = 2;
      scoreBreakdown.volatility = 2;
      score += 2;
    } else if (percentB > 0.8 && rsi > 65) {
      // Overbought risk
      volatilityScore = -2;
      scoreBreakdown.volatility = -2;
      score -= 2;
    } else if (percentB > 1.0) {
      // Price above upper band (extreme)
      volatilityScore = -1;
      scoreBreakdown.volatility = -1;
      score -= 1;
    } else if (percentB < 0) {
      // Price below lower band (extreme)
      volatilityScore = 1;
      scoreBreakdown.volatility = 1;
      score += 1;
    }
  }

  // NEW: TREND STRENGTH (ADX) SCORE (±2)
  if (adxData && adxData.adx) {
    const adxValue = adxData.adx[adxData.adx.length - 1];
    const plusDI = adxData.plusDI[adxData.plusDI.length - 1];
    const minusDI = adxData.minusDI[adxData.minusDI.length - 1];
    
    if (adxValue != null) {
      if (adxValue > 25 && adxValue < 50) {
        // Strong trend
        if (plusDI > minusDI) {
          scoreBreakdown.trendStrength = 2;
          score += 2;
        } else {
          scoreBreakdown.trendStrength = -2;
          score -= 2;
        }
      } else if (adxValue >= 50) {
        // Very strong trend (could reverse)
        if (plusDI > minusDI) {
          scoreBreakdown.trendStrength = 1;
          score += 1;
        } else {
          scoreBreakdown.trendStrength = -1;
          score -= 1;
        }
      } else if (adxValue < 20) {
        // Weak/choppy trend - avoid
        scoreBreakdown.trendStrength = -1;
        score -= 1;
      }
    }
  }

  // NEW: MONEY FLOW (MFI) SCORE (±2)
  if (mfi) {
    const mfiValue = mfi[mfi.length - 1];
    
    if (mfiValue != null) {
      if (mfiValue > 50 && mfiValue < 80) {
        // Money flowing in
        scoreBreakdown.moneyFlow = 2;
        score += 2;
      } else if (mfiValue >= 80) {
        // Overbought (too much buying, reversal risk)
        scoreBreakdown.moneyFlow = -1;
        score -= 1;
      } else if (mfiValue < 50 && mfiValue > 20) {
        // Money flowing out
        scoreBreakdown.moneyFlow = -2;
        score -= 2;
      } else if (mfiValue <= 20) {
        // Oversold (potential bounce)
        scoreBreakdown.moneyFlow = 1;
        score += 1;
      }
    }
  }

  // NEW: PRICE EXTENSION (±1)
  const distanceFromEMA200 = ((latestPrice - ema200) / ema200) * 100;
  if (distanceFromEMA200 > 20) {
    // Too extended above EMA200
    scoreBreakdown.pricePosition = -1;
    score -= 1;
  } else if (distanceFromEMA200 < -20) {
    // Deeply oversold, potential bounce
    scoreBreakdown.pricePosition = 1;
    score += 1;
  }

  // NEW: SUPPORT/RESISTANCE PROXIMITY (±1)
  if (swingLevels && swingLevels.support.length > 0 && swingLevels.resistance.length > 0) {
    const nearestSupport = swingLevels.support[0]?.price;
    const nearestResistance = swingLevels.resistance[0]?.price;
    
    if (nearestSupport && nearestResistance) {
      const distToSupport = Math.abs(latestPrice - nearestSupport) / latestPrice;
      const distToResistance = Math.abs(latestPrice - nearestResistance) / latestPrice;
      
      // Near support and bullish = good entry
      if (distToSupport < 0.02 && scoreBreakdown.trend > 0) {
        scoreBreakdown.supportResistance = 1;
        score += 1;
      }
      
      // Near resistance and bullish = risky
      if (distToResistance < 0.02 && scoreBreakdown.trend > 0) {
        scoreBreakdown.supportResistance = -1;
        score -= 1;
      }
    }
  }

  let sentiment;
  // Enhanced thresholds for expanded score range (-16 to +16)
  if (score >= 6) sentiment = "Strong Bullish";
  else if (score >= 3) sentiment = "Bullish";
  else if (score >= -2) sentiment = "Neutral";
  else if (score >= -5) sentiment = "Bearish";
  else sentiment = "Strong Bearish";

  let buyZone = null;
  let sellTargets = null;
  let stopLoss = null;
  let note = "";
  
  // Determine if this is intraday data (short EMA <= 50 suggests minute/hour data)
  const isIntraday = p.emaShort <= 50;

  // Calculate targets and stops using ATR if available
  const atrValue = atr ? atr[atr.length - 1] : null;
  const atrPercent = atrValue && latestPrice > 0 ? (atrValue / latestPrice) * 100 : null;

  if (sentiment.includes("Bullish")) {
    // For intraday: use current price with tighter ranges
    // For daily: use EMA with wider ranges, adjusted by ATR
    if (isIntraday) {
      const buyLow = latestPrice * 0.995;  // 0.5% below current
      const buyHigh = latestPrice * 1.005; // 0.5% above current
      
      if (atrValue) {
        stopLoss = latestPrice - (2 * atrValue);
        const target1 = latestPrice + (2 * atrValue);
        const target2 = latestPrice + (3 * atrValue);
        sellTargets = [target1, target2];
      } else {
        stopLoss = latestPrice * 0.99; // 1% stop
        const target1 = latestPrice * 1.01;  // 1% target
        const target2 = latestPrice * 1.015; // 1.5% target
        sellTargets = [target1, target2];
      }
      
      buyZone = [buyLow, buyHigh];
      note = sentiment === "Strong Bullish" 
        ? `Strong intraday uptrend with ${volumeConfirmation > 0 ? 'high volume confirmation' : 'solid momentum'}. `
        : `Intraday uptrend detected. `;
      
      if (atrValue) {
        note += `ATR: ${atrValue.toFixed(2)} (${atrPercent.toFixed(2)}% of price). Use tight stops for intraday trading.`;
      } else {
        note += `Use tight stops for intraday trading.`;
      }
    } else {
      const buyLow = ema50 * 0.98;
      const buyHigh = ema50 * 1.02;
      
      if (atrValue) {
        stopLoss = latestPrice - (2 * atrValue);
        const target1 = latestPrice + (3 * atrValue);
        const target2 = latestPrice + (4 * atrValue);
        sellTargets = [target1, target2];
      } else {
        stopLoss = latestPrice * 0.95; // 5% stop
        const target1 = latestPrice * 1.05;
        const target2 = latestPrice * 1.1;
        sellTargets = [target1, target2];
      }
      
      buyZone = [buyLow, buyHigh];
      note = sentiment === "Strong Bullish"
        ? `Strong uptrend with ${volumeConfirmation > 0 ? 'volume confirmation' : 'multiple indicators aligned'}. `
        : `Uptrend detected. `;
      
      if (atrValue) {
        note += `ATR-based targets provide ${(((sellTargets[1] - latestPrice) / (latestPrice - stopLoss))).toFixed(1)}:1 risk/reward.`;
      } else {
        note += `Targets are ~5–10% above current price. Adjust for your risk profile.`;
      }
    }
  } else if (sentiment === "Neutral") {
    if (isIntraday) {
      const buyLow = latestPrice * 0.997;  // 0.3% below
      const buyHigh = latestPrice * 1.003; // 0.3% above
      
      if (atrValue) {
        stopLoss = latestPrice - (1.5 * atrValue);
        const target1 = latestPrice + (1.5 * atrValue);
        const target2 = latestPrice + (2 * atrValue);
        sellTargets = [target1, target2];
      } else {
        stopLoss = latestPrice * 0.995;
        const target1 = latestPrice * 1.005;
        const target2 = latestPrice * 1.01;
        sellTargets = [target1, target2];
      }
      
      buyZone = [buyLow, buyHigh];
      note = `Mixed intraday signals. Consider very small positions or wait for clearer momentum. Use extra caution${volumeConfirmation < 0 ? ' - low volume' : ''}.`;
    } else {
      const buyLow = latestPrice * 0.97;
      const buyHigh = latestPrice * 0.99;
      
      if (atrValue) {
        stopLoss = latestPrice - (1.5 * atrValue);
        const target1 = latestPrice + (2 * atrValue);
        const target2 = latestPrice + (3 * atrValue);
        sellTargets = [target1, target2];
      } else {
        stopLoss = latestPrice * 0.96;
        const target1 = latestPrice * 1.03;
        const target2 = latestPrice * 1.06;
        sellTargets = [target1, target2];
      }
      
      buyZone = [buyLow, buyHigh];
      note = `Mixed signals. Consider smaller size or wait for clearer momentum. Combine with your own analysis.`;
    }
  } else {
    note = `Downtrend / weak technicals${volumeConfirmation < 0 ? ' with negative volume confirmation' : ''}. This is not an ideal area for new long positions based purely on these indicators.`;
  }

  // Add volume and volatility notes
  if (bollingerBands) {
    const bandwidth = bollingerBands.bandwidth[bollingerBands.bandwidth.length - 1];
    const avgBandwidth = bollingerBands.bandwidth.filter(v => v != null).reduce((a, b) => a + b, 0) / bollingerBands.bandwidth.filter(v => v != null).length;
    if (bandwidth < avgBandwidth * 0.5) {
      note += " ⚠️ Volatility squeeze detected - breakout likely.";
    }
  }

  if (volumeMA && volumes) {
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumeMA[volumeMA.length - 1];
    if (avgVolume && currentVolume > avgVolume * 2.0) {
      note += " 📊 Unusual high volume - potential catalyst/news.";
    }
  }

  return {
    latestPrice,
    ema50,
    ema200,
    rsi,
    macd,
    macdSignal: signal,
    macdHist: hist,
    score,
    scoreBreakdown,
    sentiment,
    buyZone,
    sellTargets,
    stopLoss,
    note,
    // Phase 1 additions
    volumeMA: volumeMA ? volumeMA[volumeMA.length - 1] : null,
    currentVolume: volumes ? volumes[volumes.length - 1] : null,
    obv: obv ? obv[obv.length - 1] : null,
    vwap: vwap ? vwap[vwap.length - 1] : null,
    bollingerUpper: bollingerBands ? bollingerBands.upper[bollingerBands.upper.length - 1] : null,
    bollingerMiddle: bollingerBands ? bollingerBands.middle[bollingerBands.middle.length - 1] : null,
    bollingerLower: bollingerBands ? bollingerBands.lower[bollingerBands.lower.length - 1] : null,
    bollingerPercentB: bollingerBands ? bollingerBands.percentB[bollingerBands.percentB.length - 1] : null,
    atr: atrValue,
    atrPercent: atrPercent,
    // NEW: Phase 2 advanced indicators
    adx: adxData && adxData.adx ? adxData.adx[adxData.adx.length - 1] : null,
    plusDI: adxData && adxData.plusDI ? adxData.plusDI[adxData.plusDI.length - 1] : null,
    minusDI: adxData && adxData.minusDI ? adxData.minusDI[adxData.minusDI.length - 1] : null,
    mfi: mfi ? mfi[mfi.length - 1] : null,
    stochasticK: stochastic && stochastic.k ? stochastic.k[stochastic.k.length - 1] : null,
    stochasticD: stochastic && stochastic.d ? stochastic.d[stochastic.d.length - 1] : null,
    roc: roc ? roc[roc.length - 1] : null,
    supportLevels: swingLevels ? swingLevels.support.map(s => s.price) : [],
    resistanceLevels: swingLevels ? swingLevels.resistance.map(r => r.price) : [],
    distanceFromEMA200Percent: ((latestPrice - ema200) / ema200) * 100,
  };
}
