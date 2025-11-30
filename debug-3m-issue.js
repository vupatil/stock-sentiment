/**
 * Debug script to analyze why 3m timeframe returns no results
 */

// Simulate the scoring logic with even more lenient thresholds
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
  
  let sentiment_v1, sentiment_v2;
  
  // Current thresholds (score >= 2, <= -2)
  if (score >= 2) sentiment_v1 = "Positive (Bullish)";
  else if (score <= -2) sentiment_v1 = "Negative (Bearish)";
  else sentiment_v1 = "Neutral";
  
  // More lenient thresholds (score >= 1, <= -1)
  if (score >= 1) sentiment_v2 = "Positive (Bullish)";
  else if (score <= -1) sentiment_v2 = "Negative (Bearish)";
  else sentiment_v2 = "Neutral";
  
  return { score, sentiment_v1, sentiment_v2 };
}

console.log("=== DEBUGGING 3M TIMEFRAME ISSUE ===\n");

// Test real-world scenarios that might occur in 3-minute data
const scenarios = [
  {
    name: "Slight uptrend (common)",
    latestPrice: 100,
    ema50: 99.5,
    ema200: 98,
    rsi: 52,
    macdHist: 0.1,
  },
  {
    name: "Sideways with slight positive momentum",
    latestPrice: 100,
    ema50: 99.8,
    ema200: 99.5,
    rsi: 51,
    macdHist: 0.05,
  },
  {
    name: "Weak uptrend (price above EMAs)",
    latestPrice: 100,
    ema50: 99,
    ema200: 97,
    rsi: 48,
    macdHist: -0.1,
  },
  {
    name: "Strong uptrend (all signals positive)",
    latestPrice: 105,
    ema50: 102,
    ema200: 98,
    rsi: 62,
    macdHist: 1.5,
  },
  {
    name: "Range-bound (neutral signals)",
    latestPrice: 100,
    ema50: 100.2,
    ema200: 99.8,
    rsi: 50,
    macdHist: 0,
  },
  {
    name: "Choppy market (mixed signals)",
    latestPrice: 100,
    ema50: 98,
    ema200: 99,
    rsi: 53,
    macdHist: 0.2,
  },
];

console.log("Analyzing common 3-minute market conditions:\n");

let bullish_v1 = 0, bearish_v1 = 0, neutral_v1 = 0;
let bullish_v2 = 0, bearish_v2 = 0, neutral_v2 = 0;

scenarios.forEach((scenario, i) => {
  const result = testSentimentScoring(scenario);
  
  console.log(`Scenario ${i + 1}: ${scenario.name}`);
  console.log(`  Price: $${scenario.latestPrice}, EMA50: $${scenario.ema50}, EMA200: $${scenario.ema200}`);
  console.log(`  RSI: ${scenario.rsi}, MACD Hist: ${scenario.macdHist}`);
  console.log(`  Score: ${result.score}`);
  console.log(`  Current (≥2): ${result.sentiment_v1}`);
  console.log(`  Lenient (≥1): ${result.sentiment_v2}\n`);
  
  // Count results for current thresholds
  if (result.sentiment_v1.includes('Bullish')) bullish_v1++;
  else if (result.sentiment_v1.includes('Bearish')) bearish_v1++;
  else neutral_v1++;
  
  // Count results for lenient thresholds
  if (result.sentiment_v2.includes('Bullish')) bullish_v2++;
  else if (result.sentiment_v2.includes('Bearish')) bearish_v2++;
  else neutral_v2++;
});

console.log("=== RESULTS SUMMARY ===\n");
console.log(`Current Thresholds (score ≥2 / ≤-2):`);
console.log(`  Bullish: ${bullish_v1}/${scenarios.length}`);
console.log(`  Bearish: ${bearish_v1}/${scenarios.length}`);
console.log(`  Neutral: ${neutral_v1}/${scenarios.length}`);
console.log(`  Non-Neutral: ${bullish_v1 + bearish_v1}/${scenarios.length} (${Math.round((bullish_v1 + bearish_v1) / scenarios.length * 100)}%)\n`);

console.log(`Lenient Thresholds (score ≥1 / ≤-1):`);
console.log(`  Bullish: ${bullish_v2}/${scenarios.length}`);
console.log(`  Bearish: ${bearish_v2}/${scenarios.length}`);
console.log(`  Neutral: ${neutral_v2}/${scenarios.length}`);
console.log(`  Non-Neutral: ${bullish_v2 + bearish_v2}/${scenarios.length} (${Math.round((bullish_v2 + bearish_v2) / scenarios.length * 100)}%)\n`);

console.log("=== ANALYSIS ===");
console.log("Issue: 3-minute timeframes often show mixed/choppy signals because:");
console.log("  1. Short timeframes = more noise and volatility");
console.log("  2. EMAs are very close together in sideways markets");
console.log("  3. RSI hovers around 45-55 (neutral zone)");
console.log("  4. MACD oscillates around zero frequently");
console.log("\nRecommendation: Use more lenient thresholds (score ≥1 for Bullish, ≤-1 for Bearish)");
console.log("This would capture more results while still filtering out truly neutral stocks.");

console.log("\n=== DATA AVAILABILITY CHECK ===");
const timeframes = {
  '3m': { range: '5d', minBars: 70, barsPerDay: 130, expectedBars: 650 }
};

Object.entries(timeframes).forEach(([tf, config]) => {
  console.log(`${tf}: Range=${config.range}, MinBars=${config.minBars}, Expected=${config.expectedBars} bars`);
  console.log(`  Status: ${config.expectedBars >= config.minBars ? '✓ Sufficient data' : '✗ Insufficient data'}`);
  console.log(`  Calculation: 5 days × ${config.barsPerDay} bars/day = ${config.expectedBars} bars`);
});
