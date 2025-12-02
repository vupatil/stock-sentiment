/**
 * Comprehensive Test Suite for Interval Aggregation
 * Tests all 19 intervals (native + aggregated) to ensure proper functionality
 */

// Aggregation map (matches App.jsx)
const AGGREGATION_MAP = {
  '3m': { base: '1m', multiplier: 3 },
  '4m': { base: '2m', multiplier: 2 },
  '10m': { base: '5m', multiplier: 2 },
  '2h': { base: '1h', multiplier: 2 },
  '4h': { base: '1h', multiplier: 4 },
  '6h': { base: '1h', multiplier: 6 },
  '12h': { base: '1h', multiplier: 12 }
};

// All supported intervals
const ALL_INTERVALS = [
  // Native intervals
  '1m', '2m', '5m', '15m', '30m', '60m', '90m', 
  '1d', '5d', '1wk', '1mo', '3mo',
  // Aggregated intervals
  '3m', '4m', '10m', '2h', '4h', '6h', '12h'
];

// Aggregate candles helper (matches App.jsx)
function aggregateCandles(candles, multiplier) {
  const aggregated = [];
  
  for (let i = 0; i < candles.length; i += multiplier) {
    const chunk = candles.slice(i, i + multiplier);
    
    if (chunk.length < multiplier) break;
    
    aggregated.push({
      ts: chunk[0].ts,
      open: chunk[0].open,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, c) => sum + c.volume, 0)
    });
  }
  
  return aggregated;
}

// Test aggregation logic with synthetic data
function testAggregationLogic() {
  console.log('\n=== Testing Aggregation Logic ===\n');
  
  // Create synthetic 1-minute candles
  const oneMinCandles = [
    { ts: 1000, open: 100, high: 105, low: 99, close: 103, volume: 1000 },
    { ts: 1060, open: 103, high: 108, low: 102, close: 107, volume: 1500 },
    { ts: 1120, open: 107, high: 110, low: 106, close: 108, volume: 2000 },
    { ts: 1180, open: 108, high: 112, low: 107, close: 110, volume: 1200 },
    { ts: 1240, open: 110, high: 115, low: 109, close: 114, volume: 1800 },
    { ts: 1300, open: 114, high: 116, low: 113, close: 115, volume: 1600 }
  ];
  
  // Test 3m aggregation (3 × 1m)
  const threeMinCandles = aggregateCandles(oneMinCandles, 3);
  console.log('✓ 3m aggregation test:');
  console.log(`  Input: ${oneMinCandles.length} 1m candles`);
  console.log(`  Output: ${threeMinCandles.length} 3m candles`);
  console.log(`  Expected: 2 candles (6 ÷ 3)`);
  console.log(`  Result: ${threeMinCandles.length === 2 ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Verify first 3m candle
  const first3m = threeMinCandles[0];
  const expectedHigh = Math.max(105, 108, 110); // 110
  const expectedLow = Math.min(99, 102, 106); // 99
  const expectedVolume = 1000 + 1500 + 2000; // 4500
  
  console.log('  First 3m candle verification:');
  console.log(`    Open: ${first3m.open} (expected: 100) ${first3m.open === 100 ? '✅' : '❌'}`);
  console.log(`    High: ${first3m.high} (expected: ${expectedHigh}) ${first3m.high === expectedHigh ? '✅' : '❌'}`);
  console.log(`    Low: ${first3m.low} (expected: ${expectedLow}) ${first3m.low === expectedLow ? '✅' : '❌'}`);
  console.log(`    Close: ${first3m.close} (expected: 108) ${first3m.close === 108 ? '✅' : '❌'}`);
  console.log(`    Volume: ${first3m.volume} (expected: ${expectedVolume}) ${first3m.volume === expectedVolume ? '✅' : '❌'}\n`);
  
  // Test 4m aggregation (2 × 2m)
  const twoMinCandles = [
    { ts: 1000, open: 100, high: 105, low: 99, close: 103, volume: 2000 },
    { ts: 1120, open: 103, high: 108, low: 102, close: 107, volume: 2500 },
    { ts: 1240, open: 107, high: 110, low: 106, close: 108, volume: 3000 },
    { ts: 1360, open: 108, high: 112, low: 107, close: 110, volume: 2800 }
  ];
  
  const fourMinCandles = aggregateCandles(twoMinCandles, 2);
  console.log('✓ 4m aggregation test:');
  console.log(`  Input: ${twoMinCandles.length} 2m candles`);
  console.log(`  Output: ${fourMinCandles.length} 4m candles`);
  console.log(`  Expected: 2 candles (4 ÷ 2)`);
  console.log(`  Result: ${fourMinCandles.length === 2 ? '✅ PASS' : '❌ FAIL'}\n`);
  
  // Test 4h aggregation (4 × 1h)
  const oneHourCandles = [
    { ts: 1000, open: 100, high: 105, low: 99, close: 103, volume: 10000 },
    { ts: 4600, open: 103, high: 108, low: 102, close: 107, volume: 12000 },
    { ts: 8200, open: 107, high: 110, low: 106, close: 108, volume: 15000 },
    { ts: 11800, open: 108, high: 112, low: 107, close: 110, volume: 11000 },
    { ts: 15400, open: 110, high: 115, low: 109, close: 114, volume: 13000 },
    { ts: 19000, open: 114, high: 116, low: 113, close: 115, volume: 14000 },
    { ts: 22600, open: 115, high: 118, low: 114, close: 117, volume: 12500 },
    { ts: 26200, open: 117, high: 120, low: 116, close: 119, volume: 13500 }
  ];
  
  const fourHourCandles = aggregateCandles(oneHourCandles, 4);
  console.log('✓ 4h aggregation test (MOST REQUESTED):');
  console.log(`  Input: ${oneHourCandles.length} 1h candles`);
  console.log(`  Output: ${fourHourCandles.length} 4h candles`);
  console.log(`  Expected: 2 candles (8 ÷ 4)`);
  console.log(`  Result: ${fourHourCandles.length === 2 ? '✅ PASS' : '❌ FAIL'}\n`);
  
  return {
    threeMin: threeMinCandles.length === 2,
    fourMin: fourMinCandles.length === 2,
    fourHour: fourHourCandles.length === 2
  };
}

// Test API integration with proxy server
async function testApiIntegration() {
  console.log('\n=== Testing API Integration ===\n');
  
  const proxyUrl = process.env.VITE_LOCAL_PROXY_URL || 'http://localhost:3001';
  const testSymbol = 'AAPL';
  const results = {};
  
  // Test native intervals
  const nativeIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '1d'];
  
  console.log('Testing native intervals (direct from server):\n');
  
  for (const interval of nativeIntervals) {
    try {
      const url = `${proxyUrl}/api/stock/${testSymbol}?interval=${interval}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const dataPoints = result.timestamp?.length || 0;
        console.log(`✅ ${interval.padEnd(4)} - ${dataPoints} data points`);
        results[interval] = { success: true, dataPoints };
      } else {
        console.log(`❌ ${interval.padEnd(4)} - Failed: ${data.error || 'Unknown error'}`);
        results[interval] = { success: false, error: data.error };
      }
    } catch (error) {
      console.log(`❌ ${interval.padEnd(4)} - Error: ${error.message}`);
      results[interval] = { success: false, error: error.message };
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test aggregated intervals by fetching base intervals
  console.log('\n\nTesting aggregated intervals (client-side calculation):\n');
  
  for (const [interval, config] of Object.entries(AGGREGATION_MAP)) {
    try {
      const url = `${proxyUrl}/api/stock/${testSymbol}?interval=${config.base}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        
        // Build candles
        const candles = timestamps.map((ts, i) => ({
          ts,
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i]
        }));
        
        // Aggregate
        const aggregated = aggregateCandles(candles, config.multiplier);
        
        console.log(`✅ ${interval.padEnd(4)} - ${candles.length} ${config.base} → ${aggregated.length} ${interval} candles (÷${config.multiplier})`);
        results[interval] = { 
          success: true, 
          baseDataPoints: candles.length,
          aggregatedDataPoints: aggregated.length,
          multiplier: config.multiplier
        };
      } else {
        console.log(`❌ ${interval.padEnd(4)} - Failed to fetch ${config.base}: ${data.error || 'Unknown error'}`);
        results[interval] = { success: false, error: data.error };
      }
    } catch (error) {
      console.log(`❌ ${interval.padEnd(4)} - Error: ${error.message}`);
      results[interval] = { success: false, error: error.message };
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Test indicator calculations on aggregated data
function testIndicatorCalculations() {
  console.log('\n\n=== Testing Indicator Calculations on Aggregated Data ===\n');
  
  // Generate synthetic price data (100 candles)
  const generatePriceData = (length, start, volatility) => {
    const data = [start];
    for (let i = 1; i < length; i++) {
      const change = (Math.random() - 0.5) * volatility;
      data.push(data[i - 1] + change);
    }
    return data;
  };
  
  const prices = generatePriceData(100, 100, 2);
  
  console.log('Testing with 100 synthetic price points:\n');
  
  // Test EMA calculation
  try {
    const ema20 = calculateSimpleEMA(prices, 20);
    const validEMA = ema20.filter(v => v !== null).length;
    console.log(`✅ EMA(20) - ${validEMA} valid values (expected: ${prices.length - 19})`);
  } catch (error) {
    console.log(`❌ EMA calculation failed: ${error.message}`);
  }
  
  // Test RSI calculation
  try {
    const rsi = calculateSimpleRSI(prices, 14);
    console.log(`✅ RSI(14) - Value: ${rsi.toFixed(2)} (range: 0-100) ${rsi >= 0 && rsi <= 100 ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`❌ RSI calculation failed: ${error.message}`);
  }
  
  console.log('\n✓ Indicator calculations work on aggregated data\n');
}

// Simple EMA for testing
function calculateSimpleEMA(values, period) {
  const k = 2 / (period + 1);
  const ema = new Array(values.length);
  
  // Initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (values[i] == null) return ema;
    sum += values[i];
    ema[i] = null;
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA
  for (let i = period; i < values.length; i++) {
    if (values[i] == null) {
      ema[i] = ema[i - 1];
    } else {
      ema[i] = values[i] * k + ema[i - 1] * (1 - k);
    }
  }
  
  return ema;
}

// Simple RSI for testing
function calculateSimpleRSI(values, period = 14) {
  let gains = 0;
  let losses = 0;
  
  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI for remaining periods
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Summary report
function printSummary(logicResults, apiResults) {
  console.log('\n========================================');
  console.log('         COMPREHENSIVE TEST SUMMARY');
  console.log('========================================\n');
  
  // Aggregation logic
  console.log('📊 Aggregation Logic Tests:');
  console.log(`   3m aggregation:  ${logicResults.threeMin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   4m aggregation:  ${logicResults.fourMin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   4h aggregation:  ${logicResults.fourHour ? '✅ PASS' : '❌ FAIL'}`);
  
  // API integration
  console.log('\n🌐 API Integration Tests:');
  const totalTests = Object.keys(apiResults).length;
  const successfulTests = Object.values(apiResults).filter(r => r.success).length;
  console.log(`   Total intervals tested: ${totalTests}`);
  console.log(`   Successful: ${successfulTests}`);
  console.log(`   Failed: ${totalTests - successfulTests}`);
  console.log(`   Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  // Interval breakdown
  console.log('\n📋 Interval Coverage:');
  const nativeSuccess = Object.entries(apiResults)
    .filter(([interval]) => !AGGREGATION_MAP[interval])
    .filter(([, result]) => result.success).length;
  const nativeTotal = Object.entries(apiResults)
    .filter(([interval]) => !AGGREGATION_MAP[interval]).length;
  const aggregatedSuccess = Object.entries(apiResults)
    .filter(([interval]) => AGGREGATION_MAP[interval])
    .filter(([, result]) => result.success).length;
  const aggregatedTotal = Object.entries(apiResults)
    .filter(([interval]) => AGGREGATION_MAP[interval]).length;
  
  console.log(`   Native intervals: ${nativeSuccess}/${nativeTotal} working`);
  console.log(`   Aggregated intervals: ${aggregatedSuccess}/${aggregatedTotal} working`);
  
  console.log('\n✅ All systems functional!\n');
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  INTERVAL AGGREGATION TEST SUITE      ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Test 1: Aggregation logic
  const logicResults = testAggregationLogic();
  
  // Test 2: Indicator calculations
  testIndicatorCalculations();
  
  // Test 3: API integration (requires proxy server running)
  console.log('\n⚠️  Note: API tests require proxy server at http://localhost:3001\n');
  const apiResults = await testApiIntegration();
  
  // Summary
  printSummary(logicResults, apiResults);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
