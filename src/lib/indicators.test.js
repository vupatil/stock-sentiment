import { describe, it, expect } from 'vitest';
import { calculateEMA, calculateRSI, calculateMACD, calculateRSIArray, calculateMACDSeries, analyzeTechnicalSentiment, calculateADX, calculateMFI, calculateStochastic, calculateROC, findSwingLevels } from './indicators';

function generateSeries(length = 250, start = 100, step = 0.1) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(start + i * step + (Math.sin(i) * step));
  }
  return arr;
}

describe('Indicators', () => {
  it('calculateEMA returns array with values after the period', () => {
    const series = generateSeries(260);
    const res = calculateEMA(series, 50);
    expect(res).toBeTruthy();
    expect(res[49]).toBeDefined();
    expect(res[res.length - 1]).toBeGreaterThan(0);
  });

  it('calculateRSI returns a numeric value', () => {
    const series = generateSeries(260);
    const rsi = calculateRSI(series, 14);
    expect(typeof rsi === 'number').toBe(true);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  it('calculateRSIArray returns a full series', () => {
    const series = generateSeries(260);
    const rsiArr = calculateRSIArray(series);
    expect(rsiArr).toBeTruthy();
    expect(rsiArr.length).toBe(series.length);
    // RSI array should produce non-null values after the period
    expect(rsiArr[14]).toBeGreaterThanOrEqual(0);
  });

  it('calculateMACD returns last MACD value object', () => {
    const series = generateSeries(260);
    const macd = calculateMACD(series);
    expect(macd).toBeTruthy();
    expect(typeof macd.macd === 'number').toBe(true);
  });

  it('calculateMACDSeries returns series object', () => {
    const series = generateSeries(260);
    const macd = calculateMACDSeries(series);
    expect(macd).toBeTruthy();
    expect(Array.isArray(macd.macdLine)).toBe(true);
    expect(macd.macdLine.length).toBe(series.length);
  });

  it('analyzeTechnicalSentiment returns expected fields', () => {
    const series = generateSeries(260);
    const analysis = analyzeTechnicalSentiment(series);
    expect(analysis).toBeTruthy();
    expect(analysis.latestPrice).toBeDefined();
    expect(analysis.score).toBeDefined();
    expect(analysis.sentiment).toBeDefined();
  });

  it('calculateADX returns ADX, plusDI, minusDI arrays', () => {
    const closes = generateSeries(100);
    const highs = closes.map(c => c + Math.random() * 2);
    const lows = closes.map(c => c - Math.random() * 2);
    const adxData = calculateADX(highs, lows, closes, 14);
    expect(adxData).toBeTruthy();
    expect(Array.isArray(adxData.adx)).toBe(true);
    expect(Array.isArray(adxData.plusDI)).toBe(true);
    expect(Array.isArray(adxData.minusDI)).toBe(true);
    // ADX should have values after 2x period
    const lastADX = adxData.adx[adxData.adx.length - 1];
    if (lastADX != null) {
      expect(lastADX).toBeGreaterThanOrEqual(0);
      expect(lastADX).toBeLessThanOrEqual(100);
    }
  });

  it('calculateMFI returns array with values 0-100', () => {
    const closes = generateSeries(50);
    const highs = closes.map(c => c + Math.random() * 2);
    const lows = closes.map(c => c - Math.random() * 2);
    const volumes = closes.map(() => Math.random() * 1000000 + 500000);
    const mfi = calculateMFI(highs, lows, closes, volumes, 14);
    expect(mfi).toBeTruthy();
    expect(Array.isArray(mfi)).toBe(true);
    const lastMFI = mfi[mfi.length - 1];
    if (lastMFI != null) {
      expect(lastMFI).toBeGreaterThanOrEqual(0);
      expect(lastMFI).toBeLessThanOrEqual(100);
    }
  });

  it('calculateStochastic returns K and D arrays', () => {
    const closes = generateSeries(50);
    const highs = closes.map(c => c + Math.random() * 2);
    const lows = closes.map(c => c - Math.random() * 2);
    const stoch = calculateStochastic(highs, lows, closes, 14, 3);
    expect(stoch).toBeTruthy();
    expect(Array.isArray(stoch.k)).toBe(true);
    expect(Array.isArray(stoch.d)).toBe(true);
    const lastK = stoch.k[stoch.k.length - 1];
    if (lastK != null) {
      expect(lastK).toBeGreaterThanOrEqual(0);
      expect(lastK).toBeLessThanOrEqual(100);
    }
  });

  it('calculateROC returns percentage array', () => {
    const closes = generateSeries(50, 100, 0.5);
    const roc = calculateROC(closes, 12);
    expect(roc).toBeTruthy();
    expect(Array.isArray(roc)).toBe(true);
    const lastROC = roc[roc.length - 1];
    expect(typeof lastROC).toBe('number');
  });

  it('findSwingLevels returns support and resistance arrays', () => {
    const closes = generateSeries(100, 100, 0.3);
    const highs = closes.map(c => c + Math.random() * 3);
    const lows = closes.map(c => c - Math.random() * 3);
    const levels = findSwingLevels(highs, lows, closes, 40, 2);
    expect(levels).toBeTruthy();
    expect(Array.isArray(levels.support)).toBe(true);
    expect(Array.isArray(levels.resistance)).toBe(true);
  });

  it('analyzeTechnicalSentiment includes new indicators', () => {
    const closes = generateSeries(260);
    const highs = closes.map(c => c + Math.random() * 2);
    const lows = closes.map(c => c - Math.random() * 2);
    const volumes = closes.map(() => Math.random() * 1000000 + 500000);
    const analysis = analyzeTechnicalSentiment(closes, null, volumes, highs, lows);
    expect(analysis).toBeTruthy();
    expect(analysis.score).toBeDefined();
    expect(analysis.scoreBreakdown).toBeDefined();
    expect(analysis.scoreBreakdown.trendStrength).toBeDefined();
    expect(analysis.scoreBreakdown.moneyFlow).toBeDefined();
    expect(analysis.scoreBreakdown.pricePosition).toBeDefined();
    expect(analysis.adx).toBeDefined();
    expect(analysis.mfi).toBeDefined();
    expect(analysis.stochasticK).toBeDefined();
    expect(Array.isArray(analysis.supportLevels)).toBe(true);
    expect(Array.isArray(analysis.resistanceLevels)).toBe(true);
  });
});
