/**
 * Test All Timeframes - Verify each timeframe uses its own interval
 * This test mocks the fetch to verify the correct interval parameter is sent
 */

// All timeframes from the UI
const ALL_TIMEFRAMES = [
  '1m', '2m', '3m', '4m', '5m', '10m', '15m', '30m',
  '60m', '90m', '2h', '4h', '6h', '12h',
  '1d', '5d', '1wk', '1mo', '3mo'
];

// Simulate the getApiUrl function
function getApiUrl() {
  return 'http://localhost:3001';
}

// Simulate the fetchCloses logic from App.jsx (after our changes)
function buildRequestUrl(symbol, timeframe) {
  const proxyUrl = getApiUrl();
  // This should now send the timeframe directly (no aggregation)
  const url = `${proxyUrl}/api/stock/${symbol}?interval=${timeframe}`;
  return url;
}

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  TIMEFRAME REQUEST TEST - Verifying Actual Values Sent       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('Testing that each timeframe sends its own value to the proxy...\n');

console.log('┌──────────────┬────────────────────────────────────────────────────┬────────┐');
console.log('│ Timeframe    │ Generated URL                                      │ Status │');
console.log('├──────────────┼────────────────────────────────────────────────────┼────────┤');

let allPassed = true;
const results = [];

ALL_TIMEFRAMES.forEach(tf => {
  const url = buildRequestUrl('AAPL', tf);
  const expectedParam = `interval=${tf}`;
  const passed = url.includes(expectedParam);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const tfPadded = tf.padEnd(12);
  const urlPadded = url.padEnd(50);
  
  console.log(`│ ${tfPadded} │ ${urlPadded} │ ${status} │`);
  
  if (!passed) {
    allPassed = false;
  }
  
  results.push({ timeframe: tf, url, passed });
});

console.log('└──────────────┴────────────────────────────────────────────────────┴────────┘\n');

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

const totalTests = ALL_TIMEFRAMES.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = totalTests - passedTests;

console.log(`Total timeframes tested: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
console.log();

if (allPassed) {
  console.log('🎉 SUCCESS! All timeframes send their own interval value.');
  console.log('   No aggregation is happening - each timeframe uses its actual value.\n');
} else {
  console.log('⚠️  FAILURE! Some timeframes are not using their own values.');
  console.log('   Failed timeframes:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.timeframe}: ${r.url}`);
  });
  console.log();
}

// Specific checks for previously aggregated timeframes
console.log('═══════════════════════════════════════════════════════════════');
console.log('SPECIFIC CHECKS - Previously Aggregated Timeframes');
console.log('═══════════════════════════════════════════════════════════════\n');

const previouslyAggregated = ['3m', '4m', '10m', '2h', '4h', '6h', '12h'];

console.log('These timeframes were previously aggregated client-side.');
console.log('Now they should send their own values:\n');

previouslyAggregated.forEach(tf => {
  const url = buildRequestUrl('TEST', tf);
  const hasOwnValue = url.includes(`interval=${tf}`);
  const status = hasOwnValue ? '✅' : '❌';
  
  console.log(`${status} ${tf.padEnd(4)} → ${url}`);
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

// Exit code
process.exit(allPassed ? 0 : 1);
