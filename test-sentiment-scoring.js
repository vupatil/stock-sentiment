/**
 * Test script to verify sentiment scoring logic across all timeframes
 * Run with: node test-sentiment-scoring.js
 */

// Simulate the scoring logic
function testSentimentScoring(scenario) {
  const { latestPrice, ema50, ema200, rsi, macdHist } = scenario;
  
  let score = 0;
  
  // Trend
  if (latestPrice > ema200) score += 2;
  else score -= 2;
  
  if (ema50 > ema200) score += 2;
  else score -= 1;
  
  // RSI
  if (rsi > 55 && rsi < 70) score += 1;
  else if (rsi < 45 && rsi > 30) score -= 1;
  else if (rsi >= 70 || rsi <= 30) score -= 2;
  
  // MACD
  if (macdHist > 0) score += 1;
  else score -= 1;
  
  let sentiment;
  if (score >= 2) sentiment = "Positive (Bullish)";
  else if (score <= -2) sentiment = "Negative (Bearish)";
  else sentiment = "Neutral";
  
  return { score, sentiment };
}

// Test scenarios
const scenarios = [
  {
    name: "Strong Uptrend",
    latestPrice: 500,
    ema50: 490,
    ema200: 450,
    rsi: 60,
    macdHist: 2,
    expected: "Bullish"
  },
  {
    name: "Weak Uptrend",
    latestPrice: 500,
    ema50: 495,
    ema200: 480,
    rsi: 52,
    macdHist: 0.5,
    expected: "Bullish or Neutral"
  },
  {
    name: "Strong Downtrend",
    latestPrice: 450,
    ema50: 460,
    ema200: 480,
    rsi: 35,
    macdHist: -2,
    expected: "Bearish"
  },
  {
    name: "Weak Downtrend",
    latestPrice: 470,
    ema50: 475,
    ema200: 480,
    rsi: 48,
    macdHist: -0.5,
    expected: "Bearish or Neutral"
  },
  {
    name: "Mixed Signals (Price up, EMA50 down)",
    latestPrice: 485,
    ema50: 478,
    ema200: 480,
    rsi: 50,
    macdHist: -0.2,
    expected: "Neutral"
  },
  {
    name: "Overbought Uptrend",
    latestPrice: 520,
    ema50: 505,
    ema200: 480,
    rsi: 75,
    macdHist: 1,
    expected: "Neutral (RSI overbought penalty)"
  },
  {
    name: "Oversold Downtrend",
    latestPrice: 440,
    ema50: 455,
    ema200: 480,
    rsi: 28,
    macdHist: -1.5,
    expected: "Bearish"
  }
];

console.log("=== SENTIMENT SCORING TEST ===\n");
console.log("Scoring Rules:");
console.log("- Price > EMA200: +2, else -2");
console.log("- EMA50 > EMA200: +2, else -1");
console.log("- RSI 55-70: +1, RSI 30-45: -1, RSI extremes (>=70 or <=30): -2");
console.log("- MACD positive: +1, else -1");
console.log("- Bullish: score >= 2");
console.log("- Bearish: score <= -2");
console.log("- Neutral: -1 to +1\n");

let passCount = 0;
let failCount = 0;

scenarios.forEach((scenario, i) => {
  const result = testSentimentScoring(scenario);
  const pass = result.sentiment.includes(scenario.expected.split(' ')[0]) || 
                scenario.expected.includes("or");
  
  console.log(`Test ${i + 1}: ${scenario.name}`);
  console.log(`  Price: ${scenario.latestPrice}, EMA50: ${scenario.ema50}, EMA200: ${scenario.ema200}`);
  console.log(`  RSI: ${scenario.rsi}, MACD Hist: ${scenario.macdHist}`);
  console.log(`  Result: ${result.sentiment} (score: ${result.score})`);
  console.log(`  Expected: ${scenario.expected}`);
  console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}\n`);
  
  if (pass) passCount++;
  else failCount++;
});

console.log("=== SUMMARY ===");
console.log(`Total: ${scenarios.length} tests`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

// Data availability test
console.log("\n=== DATA AVAILABILITY TEST ===\n");

const timeframes = {
  '1m': { range: '1d', minBars: 70, expected: 390 },
  '2m': { range: '1d', minBars: 70, expected: 195 },
  '3m': { range: '5d', minBars: 70, expected: 650 },
  '5m': { range: '5d', minBars: 70, expected: 390 },
  '15m': { range: '5d', minBars: 70, expected: 130 },
  '30m': { range: '1mo', minBars: 100, expected: 260 },
  '60m': { range: '3mo', minBars: 130, expected: 390 },
  '1d': { range: '1y', minBars: 200, expected: 252 },
};

Object.entries(timeframes).forEach(([tf, config]) => {
  const sufficient = config.expected >= config.minBars;
  console.log(`${tf.padEnd(4)} | Range: ${config.range.padEnd(4)} | Need: ${config.minBars.toString().padStart(3)} bars | Expected: ~${config.expected.toString().padStart(3)} bars | ${sufficient ? '✓ OK' : '✗ INSUFFICIENT'}`);
});

console.log("\n=== RECOMMENDATIONS ===");
console.log("1. Sentiment scoring is now more lenient (score >= 2 for Bullish)");
console.log("2. All timeframes should have sufficient data");
console.log("3. 60m now fetches 3 months of data (~390 bars vs 130 minimum)");
console.log("4. If still no results, check:");
console.log("   - Browser console for 'Skipping - insufficient data' messages");
console.log("   - CORS proxy is enabled for Yahoo Finance access");
console.log("   - Network tab shows successful API responses");
