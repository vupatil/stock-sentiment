# Fix App.jsx corruption by reconstructing file with proper header
$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing App.jsx corruption..." -ForegroundColor Cyan

# Read the corrupted file
$corruptedContent = Get-Content "src\App.jsx" -Raw

# Find the start of working JSX code (after the duplicate imports mess)
# Looking for the indicators display section which starts working code
$workingCodeStart = $corruptedContent.IndexOf('                  {analysis.rsi ? analysis.rsi.toFixed(1) : "-"}')

if ($workingCodeStart -eq -1) {
    Write-Host "❌ Could not find working code section marker" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found working code starting at position $workingCodeStart" -ForegroundColor Green

# Extract working code (everything from that point to end)
$workingCode = $corruptedContent.Substring($workingCodeStart)

# Create proper file header with imports and constants
$properHeader = @'
import React, { useState } from "react";
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateRSIArray,
  calculateMACDSeries,
  analyzeTechnicalSentiment,
  calculateVolumeMA,
  calculateOBV,
  calculateVWAP,
  calculateBollingerBands,
  calculateATR,
  findSwingLevels
} from './lib/indicators';
import TradingViewChart from './components/TradingViewChart';
import Logo from './components/Logo';
import symbols from './data/symbols.json';

// Fallback tickers for scanner (top S&P 500 by market cap)
const FALLBACK_TICKERS = symbols;

// Indicator parameters by timeframe
const INDICATOR_PARAMS = {
  '1m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '2m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '3m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '4m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '5m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '10m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '15m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '30m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '60m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '1h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '1d': { emaShort: 50, emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 220 },
  '1wk': { emaShort: 10, emaLong: 40, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 50 },
  '1mo': { emaShort: 6, emaLong: 24, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 30 }
};

function App() {
  // Main state
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1d');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawInfo, setRawInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  
  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 });
  const [scanResults, setScanResults] = useState([]);
  const [scanConcurrency, setScanConcurrency] = useState(4);
  const [scanRetries, setScanRetries] = useState(3);
  const [scanBackoffMs, setScanBackoffMs] = useState(500);
  const [scanTimeframe, setScanTimeframe] = useState('1d');
  const [scanLimit, setScanLimit] = useState(20);
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedScannerStock, setSelectedScannerStock] = useState(null);
  const [sentimentFilters, setSentimentFilters] = useState({ bullish: true, bearish: false, neutral: false });
  const [currentScanSymbol, setCurrentScanSymbol] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState(FALLBACK_TICKERS);
  
  // Helper: sentiment color
  const sentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Strong Bullish': return '#10b981';
      case 'Bullish': return '#3b82f6';
      case 'Neutral': return '#8b5cf6';
      case 'Bearish': return '#f59e0b';
      case 'Strong Bearish': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  // Helper: format price
  const formatPrice = (price) => {
    if (price == null) return '-';
    return price.toFixed(2);
  };
  
  // Helper: row background color for scanner results
  const sentimentRowBackground = (sentiment, hasError) => {
    if (hasError) return 'var(--card-bg)';
    switch (sentiment) {
      case 'Strong Bullish': return 'rgba(16, 185, 129, 0.08)';
      case 'Bullish': return 'rgba(59, 130, 246, 0.08)';
      case 'Neutral': return 'transparent';
      case 'Bearish': return 'rgba(245, 158, 11, 0.08)';
      case 'Strong Bearish': return 'rgba(239, 68, 68, 0.08)';
      default: return 'transparent';
    }
  };
  
  // Fetch closes and combined OHLCV data
  const fetchCloses = async (sym, tf) => {
    const proxyUrl = import.meta.env.VITE_LOCAL_PROXY_URL || 'http://localhost:3001';
    const url = `${proxyUrl}/api/stock/${sym}?interval=${tf}&range=1y`;
    
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    
    const data = await resp.json();
    if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error('Invalid data structure from proxy');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta || {};
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    
    const closes = quote.close || [];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const volumes = quote.volume || [];
    
    // Build combined OHLCV array
    const combined = timestamps.map((ts, i) => ({
      ts,
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i]
    })).sort((a, b) => a.ts - b.ts);
    
    // Extract sorted arrays
    const sortedCloses = combined.map(p => p.close);
    const sortedOpens = combined.map(p => p.open);
    const sortedHighs = combined.map(p => p.high);
    const sortedLows = combined.map(p => p.low);
    const sortedVolumes = combined.map(p => p.volume);
    
    return {
      closes: sortedCloses,
      combined,
      opens: sortedOpens,
      highs: sortedHighs,
      lows: sortedLows,
      volumes: sortedVolumes,
      regularMarketPrice: meta.regularMarketPrice,
      postMarketPrice: meta.postMarketPrice,
      postMarketChangePercent: meta.postMarketChangePercent,
      postMarketChange: meta.postMarketChange,
      preMarketPrice: meta.preMarketPrice,
      preMarketChangePercent: meta.preMarketChangePercent,
      preMarketChange: meta.preMarketChange
    };
  };
  
  // Analyze stock
  const analyzeStock = async () => {
    if (!symbol.trim()) {
      setError('Please enter a symbol');
      return;
    }
    
    setLoading(true);
    setError('');
    setAnalysis(null);
    setRawInfo(null);
    
    try {
      const { closes, combined, opens, highs, lows, volumes, regularMarketPrice, postMarketPrice, postMarketChangePercent, postMarketChange, preMarketPrice, preMarketChangePercent, preMarketChange } = await fetchCloses(symbol.toUpperCase().trim(), timeframe);
      
      if (!closes || closes.length < 50) {
        setError(`Insufficient data for ${symbol}: only ${closes?.length || 0} points`);
        return;
      }
      
      const params = INDICATOR_PARAMS[timeframe] || INDICATOR_PARAMS['1d'];
      const sentimentData = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);
      sentimentData.regularMarketPrice = regularMarketPrice;
      sentimentData.postMarketPrice = postMarketPrice;
      sentimentData.postMarketChangePercent = postMarketChangePercent;
      sentimentData.postMarketChange = postMarketChange;
      sentimentData.preMarketPrice = preMarketPrice;
      sentimentData.preMarketChangePercent = preMarketChangePercent;
      sentimentData.preMarketChange = preMarketChange;
      
      // Calculate arrays for charting
      const ema50Arr = calculateEMA(closes, params.emaShort);
      const ema200Arr = calculateEMA(closes, params.emaLong);
      const rsiArr = calculateRSIArray(closes, params.rsi);
      const macdSeries = calculateMACDSeries(closes, params.macdFast, params.macdSlow, params.macdSignal);
      
      // Phase 1 indicators for charts
      const volumeMAArr = volumes ? calculateVolumeMA(volumes, 20) : null;
      const obvArr = volumes ? calculateOBV(closes, volumes) : null;
      const vwapArr = (volumes && highs && lows && combined) 
        ? calculateVWAP(closes, highs, lows, volumes, combined.map(p => p.ts)) 
        : null;
      const bollingerBands = calculateBollingerBands(closes, 20, 2);
      const atrArr = (highs && lows) ? calculateATR(highs, lows, closes, 14) : null;
      
      setAnalysis({
        ...sentimentData,
        closes,
        timestamps: combined.map(p => p.ts),
        opens,
        highs,
        lows,
        volumes,
        ema50Arr,
        ema200Arr,
        rsiArr,
        macdSeries,
        volumeMAArr,
        obvArr,
        vwapArr,
        bollingerBands,
        atrArr
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch or analyze data');
    } finally {
      setLoading(false);
    }
  };
  
  // Scanner logic with worker pool pattern
  let stopScanRequested = false;
  
  const scanTopMarketCaps = async () => {
    setScanning(true);
    stopScanRequested = false;
    setScanProgress({ done: 0, total: scanLimit });
    setScanResults([]);
    setCurrentScanSymbol('');
    
    const results = [];
    let processed = 0;
    const queue = [...availableSymbols];
    
    // Worker function
    const worker = async () => {
      while (queue.length > 0 && !stopScanRequested && results.length < scanLimit) {
        const sym = queue.shift();
        if (!sym) continue;
        
        setCurrentScanSymbol(sym);
        
        let retries = scanRetries;
        let success = false;
        let resultData = null;
        
        while (retries >= 0 && !success && !stopScanRequested) {
          try {
            const { closes, combined, opens, highs, lows, volumes } = await fetchCloses(sym, scanTimeframe);
            
            if (!closes || closes.length < 50) {
              processed++;
              break;
            }
            
            const params = INDICATOR_PARAMS[scanTimeframe] || INDICATOR_PARAMS['1d'];
            const sentimentData = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);
            
            // Calculate arrays for detail view
            const ema50Arr = calculateEMA(closes, params.emaShort);
            const ema200Arr = calculateEMA(closes, params.emaLong);
            const rsiArr = calculateRSIArray(closes, params.rsi);
            const macdSeries = calculateMACDSeries(closes, params.macdFast, params.macdSlow, params.macdSignal);
            
            resultData = {
              symbol: sym,
              ...sentimentData,
              closes,
              timestamps: combined.map(p => p.ts),
              opens,
              highs,
              lows,
              volumes,
              ema50Arr,
              ema200Arr,
              rsiArr,
              macdSeries
            };
            
            success = true;
          } catch (err) {
            retries--;
            if (retries >= 0) {
              await new Promise(resolve => setTimeout(resolve, scanBackoffMs));
            }
          }
        }
        
        if (success && resultData) {
          // Apply sentiment filter
          const { sentiment } = resultData;
          const isBullish = sentiment === 'Strong Bullish' || sentiment === 'Bullish';
          const isBearish = sentiment === 'Strong Bearish' || sentiment === 'Bearish';
          const isNeutral = sentiment === 'Neutral';
          
          if ((isBullish && sentimentFilters.bullish) || 
              (isBearish && sentimentFilters.bearish) || 
              (isNeutral && sentimentFilters.neutral)) {
            results.push(resultData);
            setScanResults([...results]);
            setScanProgress({ done: results.length, total: scanLimit });
          }
        }
        
        processed++;
      }
    };
    
    // Launch workers
    const workers = Array.from({ length: scanConcurrency }, () => worker());
    await Promise.all(workers);
    
    setScanning(false);
    setCurrentScanSymbol('');
  };
  
  const stopScanning = () => {
    stopScanRequested = true;
    setScanning(false);
    setCurrentScanSymbol('');
  };
  
  // Sorted scan results
  const sortedResults = React.useMemo(() => {
    const sorted = [...scanResults];
    sorted.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'symbol') {
        valA = a.symbol || '';
        valB = b.symbol || '';
      } else if (sortKey === 'latestPrice') {
        valA = a.latestPrice || 0;
        valB = b.latestPrice || 0;
      } else if (sortKey === 'sentiment') {
        const sentMap = { 'Strong Bullish': 5, 'Bullish': 4, 'Neutral': 3, 'Bearish': 2, 'Strong Bearish': 1 };
        valA = sentMap[a.sentiment] || 0;
        valB = sentMap[b.sentiment] || 0;
      } else if (sortKey === 'score') {
        valA = a.score || 0;
        valB = b.score || 0;
      } else {
        return 0;
      }
      
      if (sortDir === 'asc') {
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    return sorted;
  }, [scanResults, sortKey, sortDir]);
  
  // Market status banner helper
  const getMarketClosedBanner = (analysis) => {
    if (!analysis) return null;
    
    const { regularMarketPrice, postMarketPrice, preMarketPrice } = analysis;
    
    if (postMarketPrice != null && postMarketPrice !== regularMarketPrice) {
      // Post-market active
      return (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0.75rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#f59e0b' }}>Post-Market Trading</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Regular close: ${formatPrice(regularMarketPrice)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              ${formatPrice(postMarketPrice)}
            </div>
            {analysis.postMarketChange != null && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: analysis.postMarketChange >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {analysis.postMarketChange >= 0 ? '+' : ''}
                {formatPrice(analysis.postMarketChange)} 
                ({analysis.postMarketChangePercent >= 0 ? '+' : ''}
                {analysis.postMarketChangePercent?.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (preMarketPrice != null && preMarketPrice !== regularMarketPrice) {
      // Pre-market active
      return (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0.75rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#3b82f6' }}>Pre-Market Trading</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Previous close: ${formatPrice(regularMarketPrice)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              ${formatPrice(preMarketPrice)}
            </div>
            {analysis.preMarketChange != null && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: analysis.preMarketChange >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {analysis.preMarketChange >= 0 ? '+' : ''}
                {formatPrice(analysis.preMarketChange)} 
                ({analysis.preMarketChangePercent >= 0 ? '+' : ''}
                {analysis.preMarketChangePercent?.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Analyze Tab Component
  const AnalyzeTab = ({ symbol, setSymbol, timeframe, setTimeframe, loading, error, analysis, analyzeStock, formatPrice, sentimentColor, getMarketClosedBanner }) => (
    <div>
      {/* Search form */}
      <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '1rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Analyze Stock</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '0.5rem',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)'
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') analyzeStock(); }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '0.5rem',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              <option value="1m">1 min</option>
              <option value="2m">2 min</option>
              <option value="3m">3 min</option>
              <option value="4m">4 min</option>
              <option value="5m">5 min</option>
              <option value="10m">10 min</option>
              <option value="15m">15 min</option>
              <option value="30m">30 min</option>
              <option value="60m">1 hour</option>
              <option value="1d">1 day</option>
              <option value="1wk">1 week</option>
              <option value="1mo">1 month</option>
            </select>
          </div>
          <button
            onClick={analyzeStock}
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              borderRadius: '9999px',
              border: 'none',
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Market status banner */}
      {analysis && getMarketClosedBanner(analysis)}

      {/* Analysis results grid */}
      {analysis && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            {/* Left: indicators */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                background: 'var(--panel-bg)',
                border: "1px solid rgba(45,212,191,0.12)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                }}
              >
                Technical Indicators
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <div style={{ color: "var(--muted)" }}>EMA 50</div>
                  <div style={{ fontWeight: 600 }}>
                    {analysis.ema50 ? formatPrice(analysis.ema50) : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)" }}>EMA 200</div>
                  <div style={{ fontWeight: 600 }}>
                    {analysis.ema200 ? formatPrice(analysis.ema200) : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)" }}>RSI (14)</div>
                  <div style={{ fontWeight: 600 }}>

'@

# Combine header with working code
$fixedContent = $properHeader + "`n" + $workingCode

# Backup corrupted file
Write-Host "📦 Backing up corrupted file to App.jsx.corrupted" -ForegroundColor Yellow
Copy-Item "src\App.jsx" "src\App.jsx.corrupted" -Force

# Write fixed content
Write-Host "✍️ Writing fixed App.jsx..." -ForegroundColor Cyan
$fixedContent | Out-File "src\App.jsx" -Encoding UTF8 -NoNewline

Write-Host "✅ App.jsx has been fixed!" -ForegroundColor Green
Write-Host "📝 Corrupted version saved as: src\App.jsx.corrupted" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run test" -ForegroundColor White
Write-Host "  2. If tests pass, run: npm run dev" -ForegroundColor White
