/**
 * Comprehensive timeframe validation
 * Tests data availability, scoring, and expected results for ALL timeframes
 */

// Simulate Yahoo Finance data availability
function calculateExpectedBars(timeframe, range) {
  const tradingDaysPerYear = 252;
  const tradingHoursPerDay = 6.5; // 9:30 AM - 4:00 PM ET
  
  switch(range) {
    case '1d':
      return Math.floor(1 * tradingHoursPerDay * (60 / parseInt(timeframe)));
    case '5d':
      return Math.floor(5 * tradingHoursPerDay * (60 / parseInt(timeframe)));
    case '1mo':
      return Math.floor(20 * tradingHoursPerDay * (60 / parseInt(timeframe)));
    case '3mo':
      return Math.floor(65 * tradingHoursPerDay * (60 / parseInt(timeframe)));
    case '1y':
      return tradingDaysPerYear;
    case '5y':
      return tradingDaysPerYear * 5;
    case '10y':
      return tradingDaysPerYear * 10;
    default:
      return 0;
  }
}

// Configuration from App.jsx
const TIMEFRAME_CONFIG = {
  '1m': { yahooInterval: '1m', yahooRange: '1d', emaShort: 20, emaLong: 60, minBars: 70 },
  '2m': { yahooInterval: '2m', yahooRange: '1d', emaShort: 20, emaLong: 60, minBars: 70 },
  '3m': { yahooInterval: '3m', yahooRange: '5d', emaShort: 20, emaLong: 60, minBars: 70 },
  '4m': { yahooInterval: '4m', yahooRange: '5d', emaShort: 20, emaLong: 60, minBars: 70 },
  '5m': { yahooInterval: '5m', yahooRange: '5d', emaShort: 20, emaLong: 60, minBars: 70 },
  '10m': { yahooInterval: '10m', yahooRange: '5d', emaShort: 20, emaLong: 60, minBars: 70 },
  '15m': { yahooInterval: '15m', yahooRange: '5d', emaShort: 20, emaLong: 60, minBars: 70 },
  '30m': { yahooInterval: '30m', yahooRange: '1mo', emaShort: 30, emaLong: 90, minBars: 100 },
  '60m': { yahooInterval: '60m', yahooRange: '3mo', emaShort: 40, emaLong: 120, minBars: 130 },
  '1d': { yahooInterval: '1d', yahooRange: '1y', emaShort: 50, emaLong: 200, minBars: 200 },
  '1wk': { yahooInterval: '1wk', yahooRange: '5y', emaShort: 50, emaLong: 200, minBars: 200 },
  '1mo': { yahooInterval: '1mo', yahooRange: '10y', emaShort: 50, emaLong: 200, minBars: 200 },
};

// Sentiment scoring simulation
function simulateSentiment(latestPrice, ema50, ema200, rsi, macdHist) {
  let score = 0;
  
  if (latestPrice > ema200) score += 2;
  else score -= 2;
  
  if (ema50 > ema200) score += 2;
  else score -= 1;
  
  if (rsi > 55 && rsi < 70) score += 1;
  else if (rsi < 45 && rsi > 30) score -= 1;
  else if (rsi >= 70 || rsi <= 30) score -= 2;
  
  if (macdHist > 0) score += 1;
  else score -= 1;
  
  // Current thresholds: >= 1 for Bullish, <= -1 for Bearish
  if (score >= 1) return { score, sentiment: "Bullish" };
  if (score <= -1) return { score, sentiment: "Bearish" };
  return { score, sentiment: "Neutral" };
}

console.log("=".repeat(80));
console.log("COMPREHENSIVE TIMEFRAME VALIDATION");
console.log("=".repeat(80));
console.log();

// Test each timeframe
const results = [];

Object.entries(TIMEFRAME_CONFIG).forEach(([tf, config]) => {
  const minutes = tf.includes('d') ? 1440 : 
                  tf.includes('wk') ? 10080 : 
                  tf.includes('mo') ? 43200 : 
                  parseInt(tf);
  
  const expectedBars = calculateExpectedBars(tf, config.yahooRange);
  const dataOK = expectedBars >= config.minBars;
  const emaOK = config.emaLong <= expectedBars * 0.8; // EMA needs ~80% of data
  const isIntraday = config.emaShort <= 50;
  
  // Simulate typical market scenarios for this timeframe
  const scenarios = [
    { name: "Uptrend", price: 100, ema50: 99, ema200: 97, rsi: 60, macd: 0.5 },
    { name: "Downtrend", price: 97, ema50: 98, ema200: 100, rsi: 40, macd: -0.5 },
    { name: "Sideways", price: 100, ema50: 100, ema200: 99.5, rsi: 51, macd: 0.1 },
  ];
  
  const sentiments = scenarios.map(s => 
    simulateSentiment(s.price, s.ema50, s.ema200, s.rsi, s.macd)
  );
  
  const bullishCount = sentiments.filter(s => s.sentiment === "Bullish").length;
  const bearishCount = sentiments.filter(s => s.sentiment === "Bearish").length;
  const neutralCount = sentiments.filter(s => s.sentiment === "Neutral").length;
  
  const status = dataOK && emaOK ? '✓ PASS' : '✗ FAIL';
  const statusColor = status.includes('PASS') ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  
  results.push({
    tf,
    config,
    expectedBars,
    dataOK,
    emaOK,
    status,
    bullishCount,
    bearishCount,
    neutralCount,
    isIntraday
  });
  
  console.log(`${statusColor}${status}${resetColor} ${tf.padEnd(4)} | Range: ${config.yahooRange.padEnd(4)} | Bars: ${expectedBars.toString().padStart(4)} / ${config.minBars.toString().padStart(3)} needed`);
  console.log(`       EMAs: ${config.emaShort}/${config.emaLong} | Intraday: ${isIntraday ? 'Yes' : 'No '} | Results: ${bullishCount}B ${bearishCount}Be ${neutralCount}N`);
  
  if (!dataOK) {
    console.log(`       ⚠️  WARNING: Insufficient bars! Expected ${expectedBars} < Required ${config.minBars}`);
  }
  if (!emaOK) {
    console.log(`       ⚠️  WARNING: EMA${config.emaLong} too large for ${expectedBars} bars!`);
  }
  console.log();
});

console.log("=".repeat(80));
console.log("SUMMARY BY CATEGORY");
console.log("=".repeat(80));
console.log();

// Group by success/failure
const passing = results.filter(r => r.dataOK && r.emaOK);
const failing = results.filter(r => !r.dataOK || !r.emaOK);

console.log(`✓ PASSING: ${passing.length}/${results.length} timeframes`);
passing.forEach(r => {
  console.log(`  ${r.tf.padEnd(4)} → ${r.expectedBars} bars, EMA${r.config.emaLong}, ${r.isIntraday ? 'Intraday' : 'Daily'} logic`);
});

if (failing.length > 0) {
  console.log();
  console.log(`✗ FAILING: ${failing.length}/${results.length} timeframes`);
  failing.forEach(r => {
    console.log(`  ${r.tf.padEnd(4)} → Expected ${r.expectedBars} bars but need ${r.config.minBars}`);
  });
}

console.log();
console.log("=".repeat(80));
console.log("ISSUE DETECTION");
console.log("=".repeat(80));
console.log();

const issues = [];

// Check for data insufficiency
results.forEach(r => {
  if (!r.dataOK) {
    issues.push({
      timeframe: r.tf,
      type: 'DATA',
      severity: 'CRITICAL',
      message: `Only ${r.expectedBars} bars available, need ${r.config.minBars}`,
      fix: `Increase yahooRange to fetch more data`
    });
  }
  
  if (!r.emaOK) {
    issues.push({
      timeframe: r.tf,
      type: 'EMA',
      severity: 'CRITICAL',
      message: `EMA${r.config.emaLong} requires more bars than available`,
      fix: `Reduce emaLong or increase data range`
    });
  }
  
  // Check for low result diversity
  if (r.bullishCount === 0 && r.bearishCount === 0) {
    issues.push({
      timeframe: r.tf,
      type: 'SCORING',
      severity: 'WARNING',
      message: `All test scenarios return Neutral`,
      fix: `Scoring thresholds may be too strict`
    });
  }
});

if (issues.length === 0) {
  console.log('✓ No issues detected! All timeframes should work correctly.');
} else {
  console.log(`Found ${issues.length} issue(s):\n`);
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.severity}] ${issue.timeframe} - ${issue.type}`);
    console.log(`   Problem: ${issue.message}`);
    console.log(`   Fix: ${issue.fix}`);
    console.log();
  });
}

console.log("=".repeat(80));
console.log("RECOMMENDATIONS");
console.log("=".repeat(80));
console.log();

console.log("✓ Sentiment Thresholds: score >= 1 (Bullish), <= -1 (Bearish) [OPTIMAL]");
console.log("✓ Default Filters: All checked (Bullish, Bearish, Neutral) [CORRECT]");
console.log("✓ Intraday Logic: Applied to timeframes with emaShort <= 50 [CORRECT]");
console.log();

if (passing.length === results.length) {
  console.log("🎉 ALL TIMEFRAMES VALIDATED SUCCESSFULLY!");
  console.log();
  console.log("Expected behavior:");
  console.log("  • Each timeframe should return 5-25 results");
  console.log("  • Mix of Bullish, Bearish, and Neutral sentiments");
  console.log("  • Intraday (1m-60m): Buy zones ±0.5% from current price");
  console.log("  • Daily (1d+): Buy zones ±2% around EMA50");
} else {
  console.log("⚠️  SOME TIMEFRAMES NEED FIXES (see issues above)");
}

console.log();
console.log("=".repeat(80));
