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
const FALLBACK_TICKERS = symbols.symbols;

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
  '90m': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '1h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '2h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '4h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '6h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '12h': { emaShort: 20, emaLong: 50, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 100 },
  '1d': { emaShort: 50, emaLong: 200, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 220 },
  '5d': { emaShort: 10, emaLong: 40, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 50 },
  '1wk': { emaShort: 10, emaLong: 40, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 50 },
  '1mo': { emaShort: 6, emaLong: 24, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 30 },
  '3mo': { emaShort: 6, emaLong: 24, rsi: 14, macdFast: 12, macdSlow: 26, macdSignal: 9, minBars: 30 }
};

// Aggregation map for calculated intervals
const AGGREGATION_MAP = {
  '3m': { base: '1m', multiplier: 3 },
  '4m': { base: '2m', multiplier: 2 },
  '10m': { base: '5m', multiplier: 2 },
  '2h': { base: '1h', multiplier: 2 },
  '4h': { base: '1h', multiplier: 4 },
  '6h': { base: '1h', multiplier: 6 },
  '12h': { base: '1h', multiplier: 12 }
};

// Aggregate candles helper function
function aggregateCandles(candles, multiplier) {
  const aggregated = [];
  
  for (let i = 0; i < candles.length; i += multiplier) {
    const chunk = candles.slice(i, i + multiplier);
    
    // Skip incomplete chunks
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
};

function App() {
  // Main state
  const [symbol, setSymbol] = useState('AAPL');
  const [companyName, setCompanyName] = useState('');
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
  const [selectedScannerStocks, setSelectedScannerStocks] = useState([]); // Array of stocks for multiple tabs
  const [sentimentFilters, setSentimentFilters] = useState({ bullish: true, bearish: false, neutral: false });
  const [currentScanSymbol, setCurrentScanSymbol] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState(FALLBACK_TICKERS);
  
  // API metadata and rate limiting state
  const [apiSource, setApiSource] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [notification, setNotification] = useState(null);
  
  // Helper: show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  
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
  
  // Helper: format price with change
  const formatPriceWithChange = (current, previous) => {
    if (current == null) return { price: '-', change: null, changePercent: null, isPositive: null };
    if (previous == null || previous === 0) return { price: formatPrice(current), change: null, changePercent: null, isPositive: null };
    
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    const isPositive = change >= 0;
    
    return {
      price: formatPrice(current),
      change: formatPrice(Math.abs(change)),
      changePercent: changePercent.toFixed(2),
      isPositive
    };
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
  
  // Get API URL - supports both development and production
  const getApiUrl = () => {
    // First, check environment variable
    if (import.meta.env.VITE_PROXY_URL) {
      return import.meta.env.VITE_PROXY_URL;
    }
    
    // Auto-detect based on environment
    // In production (built app), use relative path or production URL
    if (import.meta.env.PROD) {
      // If deployed to prysan.com/stkcld, API should be at prysan.com/api
      return window.location.origin + '/api';
    }
    
    // Development fallback
    return 'http://localhost:3001';
  };
  
  // Fetch closes and combined OHLCV data with rate limiting support
  const fetchCloses = async (sym, tf, retryCount = 0) => {
    const proxyUrl = getApiUrl();
    
    // Check if this interval requires aggregation
    const aggregationConfig = AGGREGATION_MAP[tf];
    const requestInterval = aggregationConfig ? aggregationConfig.base : tf;
    
    const url = `${proxyUrl}/api/stock/${sym}?interval=${requestInterval}`;
    
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await resp.json();
      
      // Handle 429 Rate Limit Exceeded
      if (resp.status === 429) {
        const retryAfter = data.retryAfter || 60;
        console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
        
        setIsRateLimited(true);
        setRetryCountdown(retryAfter);
        showNotification(
          `Server busy. Retrying in ${retryAfter} seconds...`,
          'warning'
        );
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
          setRetryCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setIsRateLimited(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Auto-retry after cooldown
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return fetchCloses(sym, tf, retryCount + 1);
      }
      
      // Handle 503 All Sources Failed
      if (resp.status === 503) {
        console.error('All data sources failed:', data.details);
        showNotification(
          'Unable to fetch stock data. All services unavailable.',
          'error'
        );
        throw new Error(data.error || 'All data sources failed');
      }
      
      // Handle other HTTP errors
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${data.error || 'Unknown error'}`);
      }
      
      // Validate data structure
      if (!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error('Invalid data structure from proxy');
      }
      
      // Extract and store API metadata
      if (data._meta) {
        setApiSource(data._meta.source);
        setQuotaInfo({
          used: data._meta.quotaUsed,
          limit: data._meta.quotaLimit,
          resetTime: data._meta.quotaResetTime
        });
        console.log(`Data from: ${data._meta.source} | Quota: ${data._meta.quotaUsed}/${data._meta.quotaLimit || '∞'}`);
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
      let combined = timestamps.map((ts, i) => ({
        ts,
        open: opens[i],
        high: highs[i],
        low: lows[i],
        close: closes[i],
        volume: volumes[i]
      })).sort((a, b) => a.ts - b.ts);
      
      // Apply aggregation if needed
      if (aggregationConfig) {
        combined = aggregateCandles(combined, aggregationConfig.multiplier);
      }
      
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
        source: data._meta?.source || 'unknown',
        companyName: data._meta?.companyName || sym,
        regularMarketPrice: meta.regularMarketPrice,
        postMarketPrice: meta.postMarketPrice,
        postMarketChangePercent: meta.postMarketChangePercent,
        postMarketChange: meta.postMarketChange,
        preMarketPrice: meta.preMarketPrice,
        preMarketChangePercent: meta.preMarketChangePercent,
        preMarketChange: meta.preMarketChange
      };
    } catch (err) {
      // Network or parsing errors
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        showNotification('Connection error. Check your internet.', 'error');
      }
      throw err;
    }
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
      const { closes, combined, opens, highs, lows, volumes, source, companyName, regularMarketPrice, postMarketPrice, postMarketChangePercent, postMarketChange, preMarketPrice, preMarketChangePercent, preMarketChange } = await fetchCloses(symbol.toUpperCase().trim(), timeframe);
      
      if (!closes || closes.length < 50) {
        setError(`Insufficient data for ${symbol}: only ${closes?.length || 0} points`);
        return;
      }
      
      const params = INDICATOR_PARAMS[timeframe] || INDICATOR_PARAMS['1d'];
      const sentimentData = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);
      sentimentData.previousClose = closes.length > 1 ? closes[closes.length - 2] : null;
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
      
      // Store company name
      setCompanyName(companyName);
      
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
        atrArr,
        source
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
    const processedSymbols = new Set(); // Track processed symbols to avoid duplicates
    const queue = [...availableSymbols];
    
    // Worker function
    const worker = async () => {
      while (queue.length > 0 && !stopScanRequested && results.length < scanLimit) {
        const sym = queue.shift();
        if (!sym || processedSymbols.has(sym)) continue;
        
        processedSymbols.add(sym); // Mark as processed immediately
        setCurrentScanSymbol(sym);
        
        let retries = scanRetries;
        let success = false;
        let resultData = null;
        
        while (retries >= 0 && !success && !stopScanRequested) {
          try {
            const { closes, combined, opens, highs, lows, volumes, source, companyName, regularMarketPrice, postMarketPrice, postMarketChangePercent, postMarketChange, preMarketPrice, preMarketChangePercent, preMarketChange } = await fetchCloses(sym, scanTimeframe);
            
            if (!closes || closes.length < 50) {
              break; // Skip this symbol and move to next
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
              companyName: companyName,
              ...sentimentData,
              previousClose: closes.length > 1 ? closes[closes.length - 2] : null,
              regularMarketPrice,
              postMarketPrice,
              postMarketChangePercent,
              postMarketChange,
              preMarketPrice,
              preMarketChangePercent,
              preMarketChange,
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
              source
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
          // Double-check we haven't exceeded the limit (safety check)
          if (results.length >= scanLimit || stopScanRequested) {
            break;
          }
          
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

  // Main JSX return
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient)", color: "var(--text)" }}>
      {/* Hero Header */}
      <div style={{ 
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2rem'
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "3rem 2rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Logo />
            </div>
            <h1 style={{ 
              fontSize: "3.5rem", 
              fontWeight: 800, 
              margin: "0 0 0.75rem",
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}>
              Stock Sentiment Pro
            </h1>
            <p style={{ 
              color: "var(--muted)", 
              fontSize: "1.2rem",
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Advanced technical analysis powered by 16 indicators with AI-driven sentiment scoring
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem 2rem" }}>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          marginBottom: "2rem",
          background: 'var(--panel-bg)',
          padding: '0.5rem',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(12px)'
        }}>
          <button
            onClick={() => setActiveTab("analyze")}
            style={{
              flex: 1,
              padding: "1rem 2rem",
              background: activeTab === "analyze" ? "var(--gradient-primary)" : "transparent",
              border: "none",
              color: activeTab === "analyze" ? "white" : "var(--muted)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: '0.75rem',
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: activeTab === "analyze" ? "0 4px 12px var(--primary-glow)" : "none",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "analyze") {
                e.currentTarget.style.background = "var(--card-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "analyze") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            📊 Analyze
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            style={{
              flex: 1,
              padding: "1rem 2rem",
              background: activeTab === "scanner" ? "var(--gradient-primary)" : "transparent",
              border: "none",
              color: activeTab === "scanner" ? "white" : "var(--muted)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: '0.75rem',
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: activeTab === "scanner" ? "0 4px 12px var(--primary-glow)" : "none",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "scanner") {
                e.currentTarget.style.background = "var(--card-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "scanner") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            🔍 Scanner
          </button>
          {selectedScannerStocks.map((stock, index) => (
            <button
              key={`scanner-detail-${stock.symbol}-${index}`}
              onClick={() => setActiveTab(`scanner-detail-${stock.symbol}`)}
              style={{
                flex: 0.8,
                padding: "1rem 2rem",
                background: activeTab === `scanner-detail-${stock.symbol}` ? "var(--gradient-info)" : "transparent",
                border: "none",
                color: activeTab === `scanner-detail-${stock.symbol}` ? "white" : "var(--muted)",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: '0.75rem',
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: activeTab === `scanner-detail-${stock.symbol}` ? "0 4px 12px var(--primary-glow)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== `scanner-detail-${stock.symbol}`) {
                  e.currentTarget.style.background = "var(--card-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== `scanner-detail-${stock.symbol}`) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              📈 {stock.symbol}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const newStocks = selectedScannerStocks.filter((_, i) => i !== index);
                  setSelectedScannerStocks(newStocks);
                  // If closing the active tab, switch to scanner
                  if (activeTab === `scanner-detail-${stock.symbol}`) {
                    setActiveTab("scanner");
                  }
                }}
                style={{
                  fontSize: "1.5rem",
                  lineHeight: "1",
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                  cursor: "pointer",
                  marginLeft: '0.25rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "0.7"}
              >
                ×
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "0" }}>
          {activeTab === "analyze" && (
            <AnalyzeTab
              symbol={symbol}
              setSymbol={setSymbol}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              loading={loading}
              error={error}
              analysis={analysis}
              analyzeStock={analyzeStock}
              formatPrice={formatPrice}
              sentimentColor={sentimentColor}
              getMarketClosedBanner={getMarketClosedBanner}
              rawInfo={rawInfo}
            />
          )}

          {activeTab === "scanner" && (
            <ScannerTab
              scanning={scanning}
              scanProgress={scanProgress}
              setScanProgress={setScanProgress}
              scanResults={scanResults}
              setScanResults={setScanResults}
              sortedResults={sortedResults}
              scanConcurrency={scanConcurrency}
              setScanConcurrency={setScanConcurrency}
              scanRetries={scanRetries}
              setScanRetries={setScanRetries}
              scanBackoffMs={scanBackoffMs}
              setScanBackoffMs={setScanBackoffMs}
              scanTimeframe={scanTimeframe}
              setScanTimeframe={setScanTimeframe}
              scanLimit={scanLimit}
              setScanLimit={scanLimit}
              scanTopMarketCaps={scanTopMarketCaps}
              stopScanning={stopScanning}
              sortKey={sortKey}
              setSortKey={setSortKey}
              sortDir={sortDir}
              setSortDir={setSortDir}
              formatPrice={formatPrice}
              formatPriceWithChange={formatPriceWithChange}
              setActiveTab={setActiveTab}
              setSelectedScannerStocks={setSelectedScannerStocks}
              sentimentFilters={sentimentFilters}
              setSentimentFilters={setSentimentFilters}
              currentScanSymbol={currentScanSymbol}
              setCurrentScanSymbol={setCurrentScanSymbol}
              setAvailableSymbols={setAvailableSymbols}
              sentimentRowBackground={sentimentRowBackground}
            />
          )}

          {selectedScannerStocks.map((stock, index) => (
            activeTab === `scanner-detail-${stock.symbol}` && (
              <ScannerDetailTab
                key={`scanner-detail-content-${stock.symbol}-${index}`}
                stock={stock}
                formatPrice={formatPrice}
                formatPriceWithChange={formatPriceWithChange}
                sentimentColor={sentimentColor}
                scanTimeframe={scanTimeframe}
                fetchCloses={fetchCloses}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// Analyze Tab Component  
const AnalyzeTab = ({ symbol, setSymbol, timeframe, setTimeframe, loading, error, analysis, analyzeStock, formatPrice, sentimentColor, getMarketClosedBanner, rawInfo }) => {
  
  return (
    <div>
      {/* Search form */}
      <div className="glass animate-fade-in" style={{ 
        marginBottom: '1.5rem', 
        padding: '2rem', 
        borderRadius: '1.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Analyze Stock</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Symbol
            </label>
            <input
              data-testid="symbol-input"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, TSLA, NVDA"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') analyzeStock(); }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Timeframe
            </label>
            <select
              data-testid="timeframe-dropdown"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                background: '#1e293b',
                color: '#ffffff',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
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
              <option value="90m">90 min</option>
              <option value="2h">2 hours</option>
              <option value="4h">4 hours</option>
              <option value="6h">6 hours</option>
              <option value="12h">12 hours</option>
              <option value="1d">1 day</option>
              <option value="5d">5 days</option>
              <option value="1wk">1 week</option>
              <option value="1mo">1 month</option>
              <option value="3mo">3 months</option>
            </select>
          </div>
          <button
            data-testid="analyze-button"
            onClick={analyzeStock}
            disabled={loading}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: '0.75rem',
              border: 'none',
              background: loading ? 'var(--muted)' : 'var(--gradient-primary)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 16px var(--primary-glow)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px var(--primary-glow)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 16px var(--primary-glow)';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="animate-pulse">⏳</span> Analyzing...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🚀 Analyze Stock
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="animate-slide-in" style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderRadius: '1rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid var(--danger)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 12px var(--danger-glow)'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Market status banner */}
      {analysis && getMarketClosedBanner(analysis)}

      {/* Analysis results */}
      {analysis && (
        <>
          <div className="animate-fade-in" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Left: indicators */}
            <div className="glass card-interactive"
              style={{
                padding: "1.75rem",
                borderRadius: "1.5rem",
                border: "2px solid rgba(59, 130, 246, 0.2)",
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)'
                  }}
                >
                  Technical Indicators
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "1.25rem",
                  fontSize: "0.95rem",
                }}
              >
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>EMA 50</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {analysis.ema50 ? formatPrice(analysis.ema50) : "-"}
                  </div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>EMA 200</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {analysis.ema200 ? formatPrice(analysis.ema200) : "-"}
                  </div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>RSI (14)</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: analysis.rsi > 70 ? 'var(--danger)' : analysis.rsi < 30 ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {analysis.rsi ? analysis.rsi.toFixed(1) : "-"}
                  </div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>MACD</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {analysis.macd ? analysis.macd.toFixed(3) : "-"}
                  </div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>MACD Signal</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {analysis.macdSignal ? analysis.macdSignal.toFixed(3) : "-"}
                  </div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>MACD Hist</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {analysis.macdHist ? analysis.macdHist.toFixed(3) : "-"}
                  </div>
                </div>
                {analysis.adx != null && (
                  <div style={{
                    padding: '1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>ADX</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {analysis.adx.toFixed(1)}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: analysis.adx > 25 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: analysis.adx > 25 ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
                        {analysis.adx > 25 ? 'Strong' : 'Weak'}
                      </span>
                    </div>
                  </div>
                )}
                {analysis.mfi != null && (
                  <div style={{
                    padding: '1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>MFI</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {analysis.mfi.toFixed(1)}
                      <span style={{ marginLeft: '0.5rem', fontSize: '1rem', color: analysis.mfi > 50 ? 'var(--accent)' : 'var(--danger)' }}>
                        {analysis.mfi > 50 ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>
                )}
                {analysis.stochasticK != null && (
                  <div style={{
                    padding: '1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ color: "var(--muted)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Stochastic</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      K: {analysis.stochasticK.toFixed(1)}
                      {analysis.stochasticD != null && <span style={{ marginLeft: '0.5rem', color: 'var(--muted)' }}>D: {analysis.stochasticD.toFixed(1)}</span>}
                    </div>
                  </div>
                )}
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  borderRadius: '0.75rem',
                  border: '2px solid var(--primary)',
                  gridColumn: analysis.adx == null && analysis.mfi == null && analysis.stochasticK == null ? 'span 2' : 'auto'
                }}>
                  <div style={{ color: "var(--text-primary)", fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sentiment Score</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    {analysis.score}
                    <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', color: 'var(--muted)' }}>/16</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: sentiment & levels */}
            <div className="glass card-interactive"
              style={{
                  padding: "1.75rem",
                  borderRadius: "1.5rem",
                  border: "2px solid rgba(16, 185, 129, 0.2)",
                  boxShadow: 'var(--shadow-lg)',
                }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)'
                  }}
                >
                  Sentiment & Levels
                </h2>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: `${sentimentColor(analysis.sentiment)}15`,
                  border: `2px solid ${sentimentColor(analysis.sentiment)}`,
                  boxShadow: `0 4px 12px ${sentimentColor(analysis.sentiment)}40`
                }}>
                  <span
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: sentimentColor(analysis.sentiment),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {analysis.sentiment}
                  </span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: '1.6', margin: 0, textAlign: 'center' }}>
                  Based on trend (EMA), momentum (RSI+MACD+Stochastic), volume (OBV+MFI), volatility (Bollinger+ATR), trend strength (ADX), and support/resistance levels.
                  Score range: -16 to +16.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1rem",
                  fontSize: "0.95rem",
                }}
              >
                <div style={{
                  padding: '1.25rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", marginBottom: "0.75rem", fontWeight: 600, fontSize: '0.85rem' }}>
                    💚 Possible Buy Zone
                  </div>
                  {analysis.buyZone ? (
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      ${formatPrice(analysis.buyZone[0])} - ${formatPrice(analysis.buyZone[1])}
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600, color: 'var(--muted)' }}>Not suggested for longs</div>
                  )}
                </div>
                <div style={{
                  padding: '1.25rem',
                  background: 'var(--card-bg)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ color: "var(--muted)", marginBottom: "0.75rem", fontWeight: 600, fontSize: '0.85rem' }}>
                    🎯 Possible Sell Targets
                  </div>
                  {analysis.sellTargets ? (
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--warning)' }}>
                      {analysis.sellTargets.map((t, idx) => (
                        <span key={idx}>
                          ${formatPrice(t)}
                          {idx < analysis.sellTargets.length - 1 ? " / " : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600, color: 'var(--muted)' }}>No long targets suggested</div>
                  )}
                </div>
              </div>

              {/* Support & Resistance Levels */}
              {(analysis.supportLevels?.length > 0 || analysis.resistanceLevels?.length > 0) && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Key Levels</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    {analysis.supportLevels?.length > 0 && (
                      <div>
                        <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>Support</div>
                        {analysis.supportLevels.map((level, idx) => (
                          <div key={idx} style={{ color: 'var(--text)' }}>${formatPrice(level)}</div>
                        ))}
                      </div>
                    )}
                    {analysis.resistanceLevels?.length > 0 && (
                      <div>
                        <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '0.25rem' }}>Resistance</div>
                        {analysis.resistanceLevels.map((level, idx) => (
                          <div key={idx} style={{ color: 'var(--text)' }}>${formatPrice(level)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                  lineHeight: 1.5,
                }}
              >
                {analysis.note}
              </p>

              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                }}
              >
                Disclaimer: This tool is for educational purposes only and does not constitute
                financial advice. Always do your own research and consider your risk tolerance.
              </p>
            </div>
          </div>
          </>
        )}

        {/* Score Breakdown & Phase 1 Indicators */}
        {analysis && analysis.scoreBreakdown && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: '1rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Score Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Trend</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: analysis.scoreBreakdown.trend >= 0 ? '#10b981' : '#ef4444' }}>
                  {analysis.scoreBreakdown.trend > 0 ? '+' : ''}{analysis.scoreBreakdown.trend}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>EMA alignment</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Momentum</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: analysis.scoreBreakdown.momentum >= 0 ? '#10b981' : '#ef4444' }}>
                  {analysis.scoreBreakdown.momentum > 0 ? '+' : ''}{analysis.scoreBreakdown.momentum}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>RSI + MACD</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Volume</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: analysis.scoreBreakdown.volume >= 0 ? '#10b981' : '#ef4444' }}>
                  {analysis.scoreBreakdown.volume > 0 ? '+' : ''}{analysis.scoreBreakdown.volume}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Confirmation</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Volatility</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: analysis.scoreBreakdown.volatility >= 0 ? '#10b981' : '#ef4444' }}>
                  {analysis.scoreBreakdown.volatility > 0 ? '+' : ''}{analysis.scoreBreakdown.volatility}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Bollinger position</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--card-bg)', border: '2px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Total Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: analysis.score >= 4 ? '#10b981' : analysis.score >= 2 ? '#3b82f6' : analysis.score >= -1 ? '#8b5cf6' : analysis.score >= -3 ? '#f59e0b' : '#ef4444' }}>
                {analysis.score > 0 ? '+' : ''}{analysis.score}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Range: -12 to +12</div>
            </div>
          </div>
        )}

        {/* Phase 1 Indicators: Volume, Bollinger, ATR */}
        {analysis && (analysis.volumeMA != null || analysis.bollingerUpper != null || analysis.atr != null) && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: '1rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Volume & Volatility Analysis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              {analysis.volumeMA != null && (
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>📊 Volume</div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Current: </span>
                    <span style={{ fontWeight: 600 }}>{analysis.currentVolume ? (analysis.currentVolume / 1000000).toFixed(2) + 'M' : 'N/A'}</span>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>20-day Avg: </span>
                    <span style={{ fontWeight: 600 }}>{(analysis.volumeMA / 1000000).toFixed(2)}M</span>
                  </div>
                  {analysis.currentVolume && analysis.volumeMA && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', fontSize: '0.8rem' }}>
                      {analysis.currentVolume > analysis.volumeMA * 1.5 ? (
                        <span style={{ color: '#10b981' }}>🔥 High volume ({((analysis.currentVolume / analysis.volumeMA - 1) * 100).toFixed(0)}% above avg)</span>
                      ) : analysis.currentVolume < analysis.volumeMA * 0.7 ? (
                        <span style={{ color: '#f59e0b' }}>⚠️ Low volume ({((1 - analysis.currentVolume / analysis.volumeMA) * 100).toFixed(0)}% below avg)</span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Normal volume</span>
                      )}
                    </div>
                  )}
                  {analysis.obv != null && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      OBV: {(analysis.obv / 1000000).toFixed(1)}M
                    </div>
                  )}
                </div>
              )}
              {analysis.bollingerUpper != null && (
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>📈 Bollinger Bands</div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Upper: </span>
                    <span style={{ fontWeight: 600 }}>${formatPrice(analysis.bollingerUpper)}</span>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Middle: </span>
                    <span style={{ fontWeight: 600 }}>${formatPrice(analysis.bollingerMiddle)}</span>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Lower: </span>
                    <span style={{ fontWeight: 600 }}>${formatPrice(analysis.bollingerLower)}</span>
                  </div>
                  {analysis.bollingerPercentB != null && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', fontSize: '0.8rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--muted)' }}>%B: </span>
                        <span style={{ fontWeight: 600 }}>{(analysis.bollingerPercentB * 100).toFixed(1)}%</span>
                      </div>
                      {analysis.bollingerPercentB < 0.2 ? (
                        <span style={{ color: '#10b981' }}>✅ Near lower band (potential support)</span>
                      ) : analysis.bollingerPercentB > 0.8 ? (
                        <span style={{ color: '#ef4444' }}>⚠️ Near upper band (potential resistance)</span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Middle range</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {analysis.atr != null && (
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>📉 Average True Range</div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>ATR (14): </span>
                    <span style={{ fontWeight: 600 }}>${formatPrice(analysis.atr)}</span>
                  </div>
                  {analysis.atrPercent != null && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Volatility: </span>
                      <span style={{ fontWeight: 600 }}>{analysis.atrPercent.toFixed(2)}%</span>
                    </div>
                  )}
                  {analysis.stopLoss != null && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', fontSize: '0.8rem' }}>
                      <div style={{ marginBottom: '0.25rem', color: 'var(--muted)' }}>Suggested Stop-Loss:</div>
                      <div style={{ fontWeight: 600, color: '#ef4444' }}>${formatPrice(analysis.stopLoss)}</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        (2× ATR below current price)
                      </div>
                    </div>
                  )}
                  {analysis.vwap != null && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      VWAP: ${formatPrice(analysis.vwap)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts block */}
        {analysis && symbol && (
          <div style={{ marginTop: '1.25rem' }}>
            <h3 style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>Chart</h3>
            <TradingViewChart 
              key={`chart-${symbol}-${timeframe}`}
              symbol={symbol}
              interval={timeframe}
              theme="dark"
            />
          </div>
        )}

        {rawInfo && (
          <details
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
          >
            <summary>Debug: Yahoo meta / error info</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(rawInfo, null, 2)}
            </pre>
          </details>
        )}
    </div>
  );
};

// Scanner Tab Component  
const ScannerTab = ({ scanning, scanProgress, setScanProgress, scanResults, setScanResults, sortedResults, scanConcurrency, setScanConcurrency, scanRetries, setScanRetries, scanBackoffMs, setScanBackoffMs, scanTimeframe, setScanTimeframe, scanLimit, setScanLimit, scanTopMarketCaps, stopScanning, sortKey, setSortKey, sortDir, setSortDir, formatPrice, formatPriceWithChange, setActiveTab, setSelectedScannerStocks, sentimentFilters, setSentimentFilters, currentScanSymbol, setCurrentScanSymbol, setAvailableSymbols, sentimentRowBackground }) => {
  
  const handleSymbolClick = (row) => {
    // Extract last values from arrays for display
    const lastEma50 = row.ema50Arr && row.ema50Arr.length > 0 ? row.ema50Arr[row.ema50Arr.length - 1] : null;
    const lastEma200 = row.ema200Arr && row.ema200Arr.length > 0 ? row.ema200Arr[row.ema200Arr.length - 1] : null;
    const lastRsi = row.rsiArr && row.rsiArr.length > 0 ? row.rsiArr[row.rsiArr.length - 1] : null;
    const lastMacd = row.macdSeries && row.macdSeries.macdLine && row.macdSeries.macdLine.length > 0 ? row.macdSeries.macdLine[row.macdSeries.macdLine.length - 1] : null;
    const lastMacdSignal = row.macdSeries && row.macdSeries.signalLine && row.macdSeries.signalLine.length > 0 ? row.macdSeries.signalLine[row.macdSeries.signalLine.length - 1] : null;
    const lastMacdHist = row.macdSeries && row.macdSeries.hist && row.macdSeries.hist.length > 0 ? row.macdSeries.hist[row.macdSeries.hist.length - 1] : null;
    
    // Create stock object
    const stockData = {
      symbol: row.symbol,
      sentiment: row.sentiment,
      score: row.score,
      latestPrice: row.latestPrice,
      previousClose: row.previousClose,
      regularMarketPrice: row.regularMarketPrice,
      postMarketPrice: row.postMarketPrice,
      postMarketChangePercent: row.postMarketChangePercent,
      postMarketChange: row.postMarketChange,
      preMarketPrice: row.preMarketPrice,
      preMarketChangePercent: row.preMarketChangePercent,
      preMarketChange: row.preMarketChange,
      buyZone: row.buyZone,
      sellTargets: row.sellTargets,
      note: row.note,
      closes: row.closes,
      timestamps: row.timestamps,
      opens: row.opens,
      highs: row.highs,
      lows: row.lows,
      // Arrays for chart display
      ema50Arr: row.ema50Arr,
      ema200Arr: row.ema200Arr,
      rsiArr: row.rsiArr,
      macdSeries: row.macdSeries,
      // Individual values for text display
      ema50: lastEma50,
      ema200: lastEma200,
      rsi: lastRsi,
      macd: lastMacd,
      macdSignal: lastMacdSignal,
      macdHist: lastMacdHist
    };
    
    // Add to array if not already present (check by symbol)
    setSelectedScannerStocks(prev => {
      const exists = prev.some(s => s.symbol === stockData.symbol);
      if (exists) {
        // If already exists, just switch to that tab
        return prev;
      }
      // Add new stock to the array
      return [...prev, stockData];
    });
    
    // Switch to the new scanner detail tab
    setActiveTab(`scanner-detail-${row.symbol}`);
  };
  
  return (
    <div>
      <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '1rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Scanner Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Concurrency:</label>
            <input type='number' min='1' max='12' value={scanConcurrency} onChange={(e) => setScanConcurrency(Math.max(1, Math.min(12, Number(e.target.value))))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Retries:</label>
            <input type='number' min='0' max='6' value={scanRetries} onChange={(e) => setScanRetries(Math.max(0, Math.min(6, Number(e.target.value))))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Backoff (ms):</label>
            <input type='number' min='50' max='5000' value={scanBackoffMs} onChange={(e) => setScanBackoffMs(Math.max(50, Math.min(5000, Number(e.target.value))))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Timeframe:</label>
            <select data-testid="scanner-timeframe-dropdown" value={scanTimeframe} onChange={(e) => setScanTimeframe(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: '#1e293b', color: '#ffffff', border: '1px solid rgba(100, 116, 139, 0.5)', fontWeight: 500, cursor: 'pointer' }}>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="1m">1 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="2m">2 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="3m">3 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="4m">4 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="5m">5 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="10m">10 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="15m">15 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="30m">30 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="60m">1 hour</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="90m">90 min</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="2h">2 hours</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="4h">4 hours</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="6h">6 hours</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="12h">12 hours</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="1d">1 day</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="5d">5 days</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="1wk">1 week</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="1mo">1 month</option>
              <option style={{ background: '#1e293b', color: '#e2e8f0' }} value="3mo">3 months</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Results Limit:</label>
            <input type='number' min='1' max='100' value={scanLimit} onChange={(e) => setScanLimit(Math.max(1, Math.min(100, Number(e.target.value))))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
        </div>
        
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Filter by Sentiment:</label>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type='checkbox' 
                checked={sentimentFilters.bullish} 
                onChange={(e) => setSentimentFilters(prev => ({ ...prev, bullish: e.target.checked }))} 
                style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
              />
              <span style={{ color: '#10b981' }}>Bullish</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type='checkbox' 
                checked={sentimentFilters.bearish} 
                onChange={(e) => setSentimentFilters(prev => ({ ...prev, bearish: e.target.checked }))} 
                style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
              />
              <span style={{ color: '#ef4444' }}>Bearish</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type='checkbox' 
                checked={sentimentFilters.neutral} 
                onChange={(e) => setSentimentFilters(prev => ({ ...prev, neutral: e.target.checked }))} 
                style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
              />
              <span style={{ color: 'var(--muted)' }}>Neutral</span>
            </label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            data-testid="start-scan-button"
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "9999px",
              border: "none",
              background: scanning ? "var(--muted)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontWeight: 600,
              cursor: scanning ? "not-allowed" : "pointer",
              fontSize: "1rem",
              boxShadow: scanning ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
            }}
            disabled={scanning}
            onClick={scanTopMarketCaps}
          >
            {scanning ? `Scanning... ${scanProgress.done}/${scanProgress.total}` : 'Start Market Scan'}
          </button>
          
          {scanning && (
            <button
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "9999px",
                border: "none",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                transition: "all 0.3s ease",
              }}
              onClick={stopScanning}
            >
              Stop Scanning
            </button>
          )}
          
          <button
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "9999px",
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              color: "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.3s ease",
            }}
            onClick={() => {
              setScanResults([]);
              setScanProgress({ done: 0, total: scanLimit });
              // Reset filters to default (Bullish only) and restart from first symbol
              setSentimentFilters({ bullish: true, bearish: false, neutral: false });
              setCurrentScanSymbol('');
              setAvailableSymbols(FALLBACK_TICKERS);
            }}
          >
            Reset
          </button>
        </div>
        
        {scanning && currentScanSymbol && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 1rem', 
            borderRadius: '0.5rem', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: '#667eea',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <span style={{ color: 'var(--muted)' }}>Currently scanning:</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentScanSymbol}</span>
            <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
              ({scanProgress.done}/{scanProgress.total} found)
            </span>
          </div>
        )}
      </div>

      {sortedResults.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: '1rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, width: '60px' }}>#</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSortKey('symbol'); setSortDir(sortKey === 'symbol' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                  Symbol {sortKey === 'symbol' && (sortDir === 'asc' ? ' ' : ' ')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSortKey('latestPrice'); setSortDir(sortKey === 'latestPrice' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                  Price {sortKey === 'latestPrice' && (sortDir === 'asc' ? ' ' : ' ')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSortKey('sentiment'); setSortDir(sortKey === 'sentiment' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                  Sentiment {sortKey === 'sentiment' && (sortDir === 'asc' ? ' ' : ' ')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSortKey('score'); setSortDir(sortKey === 'score' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                  Score {sortKey === 'score' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Buy Zone</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Targets</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((row, idx) => {
                // Determine row background color based on sentiment using sentimentRowBackground function
                const rowBg = row.sentiment ? sentimentRowBackground(row.sentiment, row.error) : (idx % 2 === 0 ? 'var(--card-bg)' : 'transparent');
                
                return (
                  <tr key={row.symbol} style={{ borderBottom: '1px solid var(--border)', background: rowBg, transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{ 
                              fontWeight: 600, 
                              color: 'var(--primary)', 
                              cursor: 'pointer',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                            onClick={() => handleSymbolClick(row)}
                          >
                            {row.symbol}
                          </span>
                        <a 
                          href={`https://finance.yahoo.com/quote/${row.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent)', 
                            textDecoration: 'none',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                          onClick={(e) => e.stopPropagation()}
                          title="View on Yahoo Finance"
                        >
                          Y
                        </a>
                        <a 
                          href={`https://www.zacks.com/stock/quote/${row.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: '0.75rem', 
                            color: '#4A90E2', 
                            textDecoration: 'none',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                          onClick={(e) => e.stopPropagation()}
                          title="View on Zacks"
                        >
                          Z
                        </a>
                        </div>
                        {row.companyName && row.companyName !== row.symbol && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
                            {row.companyName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                      {row.latestPrice ? formatPrice(row.latestPrice) : row.error || '-'}
                    </td>
                    <td style={{ padding: '1rem', color: row.sentiment === 'bullish' ? 'var(--accent)' : row.sentiment === 'bearish' ? 'var(--danger)' : 'var(--muted)' }}>
                      {row.sentiment || '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>{row.score != null ? row.score.toFixed(1) : '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem' }}>
                      {row.buyZone ? `${formatPrice(row.buyZone[0])} - ${formatPrice(row.buyZone[1])}` : '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem' }}>
                      {row.sellTargets && row.sellTargets.length > 0 ? row.sellTargets.map(t => formatPrice(t)).join(', ') : '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.35rem 0.6rem',
                        borderRadius: '0.35rem',
                        background: row.source === 'yahoo' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: row.source === 'yahoo' ? '#9333ea' : '#3b82f6',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        border: `1px solid ${row.source === 'yahoo' ? '#9333ea' : '#3b82f6'}33`
                      }}>
                        {row.source || 'unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Scanner Detail Tab Component
const ScannerDetailTab = ({ stock, formatPrice, formatPriceWithChange, sentimentColor, scanTimeframe, fetchCloses }) => {
  const [detailTf, setDetailTf] = React.useState(scanTimeframe || '1d');
  const [viewStock, setViewStock] = React.useState(stock);
  const [loadingTf, setLoadingTf] = React.useState(false);
  const fetchingRef = React.useRef(false); // Prevent concurrent fetches
  const lastFetchRef = React.useRef(null); // Track last fetch params

  const loadForTimeframe = React.useCallback(async (sym, tf) => {
    const fetchKey = `${sym}-${tf}`;
    
    // Prevent concurrent fetches for the same symbol/timeframe
    if (fetchingRef.current) {
      console.log('⚠️ Already fetching, skipping duplicate request for', sym, tf);
      return;
    }
    
    // Prevent duplicate fetches if we just fetched this
    if (lastFetchRef.current === fetchKey) {
      console.log('⚠️ Already fetched', fetchKey, 'recently, skipping');
      return;
    }
    
    console.log('🔍 ScannerDetailTab loadForTimeframe called:', { sym, tf });
    fetchingRef.current = true;
    lastFetchRef.current = fetchKey;
    
    try {
      setLoadingTf(true);
      const { closes, combined, opens, highs, lows, volumes, regularMarketPrice, postMarketPrice, postMarketChangePercent, postMarketChange, preMarketPrice, preMarketChangePercent, preMarketChange } = await fetchCloses(sym, tf);
      if (!closes || closes.length < 50) {
        setViewStock((v) => ({ ...v, closes, timestamps: combined ? combined.map(p => p.ts) : null, opens, highs, lows, volumes }));
        return;
      }
      const params = INDICATOR_PARAMS[tf] || INDICATOR_PARAMS['1d'];
      const sentimentData = analyzeTechnicalSentiment(closes, params, volumes, highs, lows);
      sentimentData.regularMarketPrice = regularMarketPrice;
      sentimentData.postMarketPrice = postMarketPrice;
      sentimentData.postMarketChangePercent = postMarketChangePercent;
      sentimentData.postMarketChange = postMarketChange;
      sentimentData.preMarketPrice = preMarketPrice;
      sentimentData.preMarketChangePercent = preMarketChangePercent;
      sentimentData.preMarketChange = preMarketChange;
      const ema50Arr = calculateEMA(closes, params.emaShort);
      const ema200Arr = calculateEMA(closes, params.emaLong);
      const rsiArr = calculateRSIArray(closes, params.rsi);
      const macdSeries = calculateMACDSeries(closes, params.macdFast, params.macdSlow, params.macdSignal);
      
      // Calculate Phase 1 indicator arrays for charts
      const volumeMAArr = volumes ? calculateVolumeMA(volumes, 20) : null;
      const obvArr = volumes ? calculateOBV(closes, volumes) : null;
      const vwapArr = (volumes && highs && lows && combined) 
        ? calculateVWAP(closes, highs, lows, volumes, combined.map(p => p.ts)) 
        : null;
      const bollingerBands = calculateBollingerBands(closes, 20, 2);
      const atrArr = (highs && lows) ? calculateATR(highs, lows, closes, 14) : null;

      const last = (arr) => (arr && arr.length ? arr[arr.length - 1] : null);
      setViewStock((prevViewStock) => {
        const newView = {
          ...prevViewStock,
          symbol: sym,
          currentTf: tf, // Track the current timeframe to avoid refetching
          ...sentimentData,
          latestPrice: sentimentData.latestPrice,
          closes,
          timestamps: combined ? combined.map((p) => p.ts) : null,
          opens,
          highs,
          lows,
          volumes,
          ema50Arr,
          ema200Arr,
          rsiArr,
          macdSeries,
          // Phase 1 arrays for charts
          volumeMAArr,
          obvArr,
          vwapArr,
          bollingerBands,
          atrArr,
          ema50: last(ema50Arr),
          ema200: last(ema200Arr),
          rsi: last(rsiArr),
          macd: macdSeries && macdSeries.macdLine ? last(macdSeries.macdLine) : null,
          macdSignal: macdSeries && macdSeries.signalLine ? last(macdSeries.signalLine) : null,
          macdHist: macdSeries && macdSeries.hist ? last(macdSeries.hist) : null,
        };
        return newView;
      });
    } catch (e) {
      // Keep previous data, optionally set an error note
      setViewStock((v) => ({ ...v, note: (e && e.message) ? `Failed to load ${sym} ${tf}: ${e.message}` : v?.note }));
    } finally {
      setLoadingTf(false);
      fetchingRef.current = false;
    }
  }, [fetchCloses]);

  // Reset when a new stock is selected
  React.useEffect(() => {
    console.log('🔄 Stock symbol changed to:', stock?.symbol);
    setDetailTf(scanTimeframe || '1d');
    setViewStock(stock);
  }, [stock?.symbol, scanTimeframe]);

  // Load whenever timeframe or symbol changes
  React.useEffect(() => {
    console.log('🔄 ScannerDetailTab useEffect triggered:', { 
      symbol: stock?.symbol, 
      detailTf, 
      viewStockSymbol: viewStock?.symbol, 
      viewStockCurrentTf: viewStock?.currentTf,
      shouldSkip: viewStock?.symbol === stock?.symbol && viewStock?.currentTf === detailTf
    });
    
    if (!stock?.symbol || !detailTf) {
      console.log('⏭️ Skipping: no symbol or timeframe');
      return;
    }
    
    // Avoid refetching if we're already showing the correct symbol and timeframe
    if (viewStock?.symbol === stock?.symbol && viewStock?.currentTf === detailTf) {
      console.log('⏭️ Skipping: already have data for', stock?.symbol, detailTf);
      return;
    }
    
    console.log('✅ Calling loadForTimeframe for', stock?.symbol, detailTf);
    // If the provided stock already matches the requested timeframe (initial open), skip immediate refetch
    // Otherwise, fetch the requested timeframe
    loadForTimeframe(stock.symbol, detailTf);
  }, [stock?.symbol, detailTf, viewStock?.symbol, viewStock?.currentTf]);

  const v = viewStock || stock;

  return (
    <div>
      <div style={{
        marginBottom: '1.5rem',
        padding: '1.5rem',
        borderRadius: '1rem',
        background: 'var(--panel-bg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <a 
                href={`https://finance.yahoo.com/quote/${v.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.8rem', 
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {v.companyName && v.companyName !== v.symbol ? `${v.companyName} (${v.symbol})` : v.symbol}
                </h2>
              </a>
              <a 
                href={`https://finance.yahoo.com/quote/${v.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--accent)', 
                  textDecoration: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.35rem',
                  border: '1px solid var(--accent)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
              >
                Yahoo Finance ↗
              </a>
              <a 
                href={`https://www.zacks.com/stock/quote/${v.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '0.9rem', 
                  color: '#4A90E2', 
                  textDecoration: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.35rem',
                  border: '1px solid #4A90E2',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#4A90E2'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A90E2'; }}
              >
                Zacks ↗
              </a>
              {/* Timeframe selector */}
              <select
                aria-label="timeframe"
                value={detailTf}
                onChange={(e) => setDetailTf(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '9999px', border: '1px solid var(--border)', background: '#1e293b', color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <option value="1m">1m</option>
                <option value="2m">2m</option>
                <option value="3m">3m</option>
                <option value="4m">4m</option>
                <option value="5m">5m</option>
                <option value="10m">10m</option>
                <option value="15m">15m</option>
                <option value="30m">30m</option>
                <option value="60m">1h</option>
                <option value="90m">90m</option>
                <option value="2h">2h</option>
                <option value="4h">4h</option>
                <option value="6h">6h</option>
                <option value="12h">12h</option>
                <option value="1d">1d</option>
                <option value="5d">5d</option>
                <option value="1wk">1wk</option>
                <option value="1mo">1mo</option>
                <option value="3mo">3mo</option>
              </select>
              {loadingTf && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading…</span>}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Last Price
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                At close: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} EST
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>
                  {v.latestPrice != null ? formatPrice(v.latestPrice) : '-'}
                </div>
                {v.latestPrice && v.previousClose && (() => {
                  const info = formatPriceWithChange(v.latestPrice, v.previousClose);
                  return info.change ? (
                    <div style={{ 
                      fontSize: '1rem',
                      color: info.isPositive ? '#10b981' : '#ef4444',
                      fontWeight: 600
                    }}>
                      {info.isPositive ? '+' : '-'}{info.change} ({info.isPositive ? '+' : '-'}{info.changePercent}%)
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* After Hours / Pre-Market Data */}
              {v.postMarketPrice && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    🌙 After hours: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} EST
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                      {formatPrice(v.postMarketPrice)}
                    </div>
                    {v.postMarketChange != null && (
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: v.postMarketChange >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {v.postMarketChange >= 0 ? '+' : ''}{formatPrice(v.postMarketChange)} ({v.postMarketChange >= 0 ? '+' : ''}{v.postMarketChangePercent?.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {v.preMarketPrice && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    🌅 Pre-market: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} EST
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                      {formatPrice(v.preMarketPrice)}
                    </div>
                    {v.preMarketChange != null && (
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: v.preMarketChange >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {v.preMarketChange >= 0 ? '+' : ''}{formatPrice(v.preMarketChange)} ({v.preMarketChange >= 0 ? '+' : ''}{v.preMarketChangePercent?.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: sentimentColor(v.sentiment),
            color: 'white',
            fontWeight: 600
          }}>
            {v.sentiment}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Score</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.score != null ? v.score.toFixed(1) : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>EMA50</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.ema50 ? formatPrice(v.ema50) : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>EMA200</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.ema200 ? formatPrice(v.ema200) : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>RSI (14)</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.rsi ? v.rsi.toFixed(1) : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>MACD</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.macd ? v.macd.toFixed(3) : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>MACD Signal</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {v.macdSignal ? v.macdSignal.toFixed(3) : '-'}
            </div>
          </div>
        </div>

        {v.buyZone && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent)' }}>Buy Zone</div>
            <div>{formatPrice(v.buyZone[0])} - {formatPrice(v.buyZone[1])}</div>
          </div>
        )}

        {v.sellTargets && v.sellTargets.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent)' }}>Sell Targets</div>
            <div>{v.sellTargets.map(t => formatPrice(t)).join(', ')}</div>
          </div>
        )}

        {v.note && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            {v.note}
          </div>
        )}
      </div>

      {/* Charts block */}
      {v && v.symbol && (
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Chart</h3>
          <TradingViewChart 
            key={`scanner-chart-${v.symbol}-${detailTf}`}
            symbol={v.symbol}
            interval={detailTf}
            theme="dark"
          />
        </div>
      )}
    </div>
  );
};

// CustomSVGChart Component (used for detailed charting)
const CustomSVGChart = ({ 
  symbol,
  closes = [], 
  timestamps = [],
  opens = [], 
  highs = [], 
  lows = [], 
  volumes = [],
  buyZone = null, 
  sellTargets = null, 
  ema50 = [], 
  ema200 = [], 
  rsi = [], 
  macdSeries = null,
  volumeMA = null,
  obv = null,
  vwap = null,
  bollingerBands = null,
  atr = null,
  timeframe = '1d', 
  chartMode = 'candles' 
}) => {
  const [mousePos, setMousePos] = React.useState(null);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const svgRef = React.useRef(null);
  
  // Chart controls state
  const [zoomLevel, setZoomLevel] = React.useState(100); // percentage of data to show
  const [scrollOffset, setScrollOffset] = React.useState(0); // how far scrolled
  const [chartHeight, setChartHeight] = React.useState(500); // adjustable main chart height (default 500px)
  const [showEMA50, setShowEMA50] = React.useState(true);
  const [showEMA200, setShowEMA200] = React.useState(true);
  const [showRSI, setShowRSI] = React.useState(true);
  const [showMACD, setShowMACD] = React.useState(true);
  const [showVolume, setShowVolume] = React.useState(true);
  const [showBollinger, setShowBollinger] = React.useState(true);
  const [showATR, setShowATR] = React.useState(false);
  const [showOBV, setShowOBV] = React.useState(false);
  const [showVWAP, setShowVWAP] = React.useState(false);
  const [autoScale, setAutoScale] = React.useState(true);
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  
  // Drag state for panning
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartX, setDragStartX] = React.useState(0);
  const [dragStartOffset, setDragStartOffset] = React.useState(0);

  // Generate buy/sell analysis based on technical indicators
  const generateAnalysis = () => {
    if (!closes || closes.length === 0) return [];
    
    const analysis = [];
    const currentPrice = closes[closes.length - 1];
    const currentRSI = rsi && rsi.length > 0 ? rsi[rsi.length - 1] : null;
    const currentEMA50 = ema50 && ema50.length > 0 ? ema50[ema50.length - 1] : null;
    const currentEMA200 = ema200 && ema200.length > 0 ? ema200[ema200.length - 1] : null;
    const currentMACD = macd && macd.macd != null ? macd.macd : null;
    const currentSignal = macd && macd.signal != null ? macd.signal : null;
    const currentHist = macd && macd.hist != null ? macd.hist : null;
    const bbands = bollingerBands;
    const currentBBUpper = bbands && bbands.upper && bbands.upper.length > 0 ? bbands.upper[bbands.upper.length - 1] : null;
    const currentBBMiddle = bbands && bbands.middle && bbands.middle.length > 0 ? bbands.middle[bbands.middle.length - 1] : null;
    const currentBBLower = bbands && bbands.lower && bbands.lower.length > 0 ? bbands.lower[bbands.lower.length - 1] : null;
    const percentB = bbands && bbands.percentB != null ? bbands.percentB : null;

    // Price trend analysis
    if (currentEMA50 != null && currentEMA200 != null) {
      if (currentPrice > currentEMA50 && currentPrice > currentEMA200) {
        analysis.push({ type: 'bullish', text: `Price (${currentPrice.toFixed(2)}) is above both EMA50 (${currentEMA50.toFixed(2)}) and EMA200 (${currentEMA200.toFixed(2)}), indicating strong uptrend.` });
      } else if (currentPrice < currentEMA50 && currentPrice < currentEMA200) {
        analysis.push({ type: 'bearish', text: `Price (${currentPrice.toFixed(2)}) is below both EMA50 (${currentEMA50.toFixed(2)}) and EMA200 (${currentEMA200.toFixed(2)}), indicating downtrend.` });
      } else if (currentPrice > currentEMA50 && currentPrice < currentEMA200) {
        analysis.push({ type: 'neutral', text: `Price (${currentPrice.toFixed(2)}) is between EMA50 (${currentEMA50.toFixed(2)}) and EMA200 (${currentEMA200.toFixed(2)}), showing mixed signals.` });
      }
    }

    // Golden/Death cross
    if (currentEMA50 != null && currentEMA200 != null) {
      if (currentEMA50 > currentEMA200) {
        const crossPercent = ((currentEMA50 - currentEMA200) / currentEMA200 * 100).toFixed(2);
        analysis.push({ type: 'bullish', text: `Golden Cross: EMA50 is ${crossPercent}% above EMA200, signaling bullish momentum.` });
      } else {
        const crossPercent = ((currentEMA200 - currentEMA50) / currentEMA50 * 100).toFixed(2);
        analysis.push({ type: 'bearish', text: `Death Cross: EMA50 is ${crossPercent}% below EMA200, signaling bearish momentum.` });
      }
    }

    // RSI analysis
    if (currentRSI != null) {
      if (currentRSI < 30) {
        analysis.push({ type: 'bullish', text: `RSI at ${currentRSI.toFixed(2)} is in oversold territory (<30), potential buying opportunity.` });
      } else if (currentRSI > 70) {
        analysis.push({ type: 'bearish', text: `RSI at ${currentRSI.toFixed(2)} is in overbought territory (>70), caution advised.` });
      } else if (currentRSI >= 40 && currentRSI <= 60) {
        analysis.push({ type: 'neutral', text: `RSI at ${currentRSI.toFixed(2)} is in neutral zone, showing balanced momentum.` });
      }
    }

    // MACD analysis
    if (currentMACD != null && currentSignal != null && currentHist != null) {
      if (currentHist > 0 && currentMACD > currentSignal) {
        analysis.push({ type: 'bullish', text: `MACD histogram is positive (${currentHist.toFixed(3)}), indicating bullish momentum.` });
      } else if (currentHist < 0 && currentMACD < currentSignal) {
        analysis.push({ type: 'bearish', text: `MACD histogram is negative (${currentHist.toFixed(3)}), indicating bearish momentum.` });
      }
      
      // Check for recent crossover (last 3 bars)
      if (macd.macdSeries && macd.signalSeries) {
        const len = macd.macdSeries.length;
        if (len >= 3) {
          const prevHist = (macd.macdSeries[len - 2] || 0) - (macd.signalSeries[len - 2] || 0);
          if (prevHist <= 0 && currentHist > 0) {
            analysis.push({ type: 'bullish', text: `MACD just crossed above signal line - fresh buy signal detected.` });
          } else if (prevHist >= 0 && currentHist < 0) {
            analysis.push({ type: 'bearish', text: `MACD just crossed below signal line - fresh sell signal detected.` });
          }
        }
      }
    }

    // Bollinger Bands analysis
    if (currentBBUpper != null && currentBBMiddle != null && currentBBLower != null && percentB != null) {
      if (currentPrice < currentBBLower) {
        const distancePercent = ((currentBBLower - currentPrice) / currentPrice * 100).toFixed(2);
        analysis.push({ type: 'bullish', text: `Price is ${distancePercent}% below lower Bollinger Band (${currentBBLower.toFixed(2)}), suggesting oversold conditions.` });
      } else if (currentPrice > currentBBUpper) {
        const distancePercent = ((currentPrice - currentBBUpper) / currentPrice * 100).toFixed(2);
        analysis.push({ type: 'bearish', text: `Price is ${distancePercent}% above upper Bollinger Band (${currentBBUpper.toFixed(2)}), suggesting overbought conditions.` });
      } else if (percentB >= 0.4 && percentB <= 0.6) {
        analysis.push({ type: 'neutral', text: `Price is near middle Bollinger Band (%B: ${(percentB * 100).toFixed(0)}%), showing normal volatility.` });
      }
      
      // Band width analysis
      if (bbands.bandwidth != null) {
        const bw = bbands.bandwidth;
        if (bw < 5) {
          analysis.push({ type: 'neutral', text: `Bollinger Band width is tight (${bw.toFixed(2)}), expecting volatility expansion soon.` });
        } else if (bw > 15) {
          analysis.push({ type: 'neutral', text: `Bollinger Band width is wide (${bw.toFixed(2)}), high volatility present.` });
        }
      }
    }

    // Volume analysis
    if (volumes && volumes.length > 5 && volumeMA && volumeMA.length > 0) {
      const currentVolume = volumes[volumes.length - 1];
      const avgVolume = volumeMA[volumeMA.length - 1];
      if (avgVolume && currentVolume > avgVolume * 1.5) {
        const volumeIncrease = ((currentVolume / avgVolume - 1) * 100).toFixed(0);
        analysis.push({ type: 'neutral', text: `Volume is ${volumeIncrease}% above average, indicating strong interest and potential breakout.` });
      } else if (avgVolume && currentVolume < avgVolume * 0.5) {
        analysis.push({ type: 'neutral', text: `Volume is below average, suggesting lack of conviction in current move.` });
      }
    }

    // Overall sentiment based on analysis count
    const bullishCount = analysis.filter(a => a.type === 'bullish').length;
    const bearishCount = analysis.filter(a => a.type === 'bearish').length;
    
    let recommendation = '';
    if (bullishCount > bearishCount + 1) {
      recommendation = `Overall: ${bullishCount} bullish signals suggest this may be a good buying opportunity at current levels (${currentPrice.toFixed(2)}).`;
    } else if (bearishCount > bullishCount + 1) {
      recommendation = `Overall: ${bearishCount} bearish signals suggest caution - consider waiting for better entry or taking profits.`;
    } else {
      recommendation = `Overall: Mixed signals (${bullishCount} bullish, ${bearishCount} bearish) - wait for clearer trend confirmation.`;
    }

    analysis.push({ type: 'summary', text: recommendation });

    return analysis;
  };

  const width = 900;
  const priceHeight = chartHeight;
  const rsiHeight = showRSI ? 100 : 0;
  const macdHeight = showMACD ? 120 : 0;
  const volumeHeight = showVolume && volumes && volumes.length > 0 ? 100 : 0;
  const atrHeight = showATR && atr && atr.length > 0 ? 80 : 0;
  const obvHeight = showOBV && obv && obv.length > 0 ? 100 : 0;
  const totalHeight = priceHeight + rsiHeight + macdHeight + volumeHeight + atrHeight + obvHeight + 48;
  
  // Calculate visible data range based on zoom and scroll
  const totalDataPoints = closes.length;
  const visiblePoints = Math.max(20, Math.floor((totalDataPoints * zoomLevel) / 100));
  const maxOffset = Math.max(0, totalDataPoints - visiblePoints);
  const actualOffset = Math.min(scrollOffset, maxOffset);
  const startIdx = actualOffset;
  const endIdx = Math.min(startIdx + visiblePoints, totalDataPoints);
  
  // Memoize visible data calculations to prevent recalculation on mouse move
  const visibleData = React.useMemo(() => {
    const visibleCloses = closes.slice(startIdx, endIdx);
    const visibleOpens = opens.slice(startIdx, endIdx);
    const visibleHighs = highs.slice(startIdx, endIdx);
    const visibleLows = lows.slice(startIdx, endIdx);
    const visibleVolumes = volumes ? volumes.slice(startIdx, endIdx) : [];
    const visibleEma50 = ema50.slice(startIdx, endIdx);
    const visibleEma200 = ema200.slice(startIdx, endIdx);
    const visibleRsi = rsi.slice(startIdx, endIdx);
    const visibleTimestamps = timestamps.slice(startIdx, endIdx);
    
    // Phase 1 indicators
    const visibleVolumeMA = volumeMA ? volumeMA.slice(startIdx, endIdx) : [];
    const visibleOBV = obv ? obv.slice(startIdx, endIdx) : [];
    const visibleVWAP = vwap ? vwap.slice(startIdx, endIdx) : [];
    const visibleBBUpper = bollingerBands ? bollingerBands.upper.slice(startIdx, endIdx) : [];
    const visibleBBMiddle = bollingerBands ? bollingerBands.middle.slice(startIdx, endIdx) : [];
    const visibleBBLower = bollingerBands ? bollingerBands.lower.slice(startIdx, endIdx) : [];
    const visibleATR = atr ? atr.slice(startIdx, endIdx) : [];
    
    const n = visibleCloses.length;
    if (!n) return null;

    // Price chart scales - include Bollinger Bands if shown
    let vals = visibleCloses.concat(showEMA50 ? visibleEma50.filter(Boolean) : []).concat(showEMA200 ? visibleEma200.filter(Boolean) : []);
    if (showBollinger && bollingerBands) {
      vals = vals.concat(visibleBBUpper.filter(Boolean)).concat(visibleBBLower.filter(Boolean));
    }
    if (showVWAP && vwap) {
      vals = vals.concat(visibleVWAP.filter(Boolean));
    }
    vals = vals.filter((v) => v != null);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const pad = (maxV - minV) * 0.05 || 1;
    
    return {
      visibleCloses,
      visibleOpens,
      visibleHighs,
      visibleLows,
      visibleVolumes,
      visibleEma50,
      visibleEma200,
      visibleRsi,
      visibleTimestamps,
      visibleVolumeMA,
      visibleOBV,
      visibleVWAP,
      visibleBBUpper,
      visibleBBMiddle,
      visibleBBLower,
      visibleATR,
      n,
      minV,
      maxV,
      pad
    };
  }, [closes, opens, highs, lows, volumes, ema50, ema200, rsi, timestamps, volumeMA, obv, vwap, bollingerBands, atr, startIdx, endIdx, showEMA50, showEMA200, showBollinger, showVWAP]);
  
  if (!visibleData) return null;
  
  const { visibleCloses, visibleOpens, visibleHighs, visibleLows, visibleVolumes, visibleEma50, visibleEma200, visibleRsi, visibleTimestamps, visibleVolumeMA, visibleOBV, visibleVWAP, visibleBBUpper, visibleBBMiddle, visibleBBLower, visibleATR, n, minV, maxV, pad } = visibleData;
  
  const x = (i) => {
    if (n <= 1) return width / 2; // Center single point
    return (i / (n - 1)) * (width - 40) + 20;
  };
  const yPrice = (v) => priceHeight - ((v - (minV - pad)) / (maxV + pad - (minV - pad))) * (priceHeight - 20) + 10;

  const pathFromArr = (arr, fnY) => {
    let d = "";
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v == null) continue;
      const xp = x(i);
      const yp = fnY(v);
      d += d === "" ? `M ${xp} ${yp}` : ` L ${xp} ${yp}`;
    }
    return d;
  };

  // Helper: find the most recent index where close is within a range
  const findMostRecentInRange = (arr, low, high) => {
    if (!arr || arr.length === 0) return -1;
    for (let i = arr.length - 1; i >= 0; i--) {
      const v = arr[i];
      if (v != null && v >= low && v <= high) return i;
    }
    return -1;
  };

  // Helper: find closest index to a price
  const findClosestIndex = (arr, price) => {
    if (!arr || price == null || arr.length === 0) return -1;
    let bestIdx = -1;
    let bestDiff = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v == null) continue;
      const d = Math.abs(v - price);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // RSI and MACD computed scales
  const rsiMin = 0;
  const rsiMax = 100; // RSI is typically 0-100; define to avoid ReferenceError
  const rsiRange = (rsiMax - rsiMin) || 1; // safe fallback
  const yRsi = (v) => {
    // ensure numeric value and clamp
    const num = (v == null || isNaN(Number(v))) ? rsiMin : Number(v);
    const t = Math.max(rsiMin, Math.min(rsiMax, num));
    return priceHeight + 10 + (1 - (t - rsiMin) / rsiRange) * (rsiHeight - 20) + 10;
  };

  const macdLine = macdSeries?.macdLine || [];
  const signalLine = macdSeries?.signalLine || [];
  const hist = macdSeries?.hist || [];
  
  // Slice MACD data to match visible range
  const visibleMacdLine = macdLine.slice(startIdx, endIdx);
  const visibleSignalLine = signalLine.slice(startIdx, endIdx);
  const visibleHist = hist.slice(startIdx, endIdx);
  
  const macdVals = visibleMacdLine.concat(visibleSignalLine).concat(visibleHist).filter((v) => v != null);
  const macdMax = Math.max(...macdVals, 0);
  const macdMin = Math.min(...macdVals, 0);
  const macdPad = Math.max( Math.abs(macdMax), Math.abs(macdMin) ) || 1;
  const yMacd = (v) => priceHeight + rsiHeight + 10 + (1 - (v + macdPad) / (macdPad * 2)) * (macdHeight - 20) + 10;

  // x-axis ticks
  const tickIndices = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];
  const timeArr = (timestamps && timestamps.length === n) ? timestamps : Array.from({ length: n }, (_, i) => i);

  // Mouse handlers for crosshair
  const handleMouseMove = React.useCallback((e) => {
    if (!svgRef.current) return;
    
    // Use SVG's built-in coordinate transformation
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const svgX = svgP.x;
    const svgY = svgP.y;
    
    // Find closest data point for data display
    let closestIdx = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const xp = x(i);
      const dist = Math.abs(svgX - xp);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx >= 0 && closestIdx < n) {
      setHoveredIndex(closestIdx);
      setMousePos({ x: svgX, y: svgY });
    }
  }, [n, x]);

  const handleMouseLeave = React.useCallback(() => {
    setMousePos(null);
    setHoveredIndex(null);
    setIsDragging(false);
  }, []);

  // Drag handlers for panning
  const handleMouseDown = React.useCallback((e) => {
    if (!svgRef.current) return;
    
    // Use SVG coordinate transformation
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setIsDragging(true);
    setDragStartX(svgP.x); // Store SVG X coordinate
    setDragStartOffset(scrollOffset);
  }, [scrollOffset]);

  const handleMouseUpGlobal = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  const handleMouseMoveWithDrag = React.useCallback((e) => {
    // Handle drag panning first
    if (isDragging) {
      if (!svgRef.current) return;
      
      // Use SVG coordinate transformation for consistent behavior
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const currentSvgX = svgP.x;
      
      // Calculate delta in SVG coordinates
      const deltaX = currentSvgX - dragStartX;
      
      // Convert pixel movement to data point movement
      const pointsPerPixel = n / width;
      const pointsDelta = Math.round(deltaX * pointsPerPixel);
      
      // Update scroll offset (drag right = scroll left, so negate)
      const newOffset = Math.max(0, Math.min(maxOffset, dragStartOffset - pointsDelta));
      setScrollOffset(newOffset);
      
      // Don't update crosshair while dragging
      return;
    }
    
    // Handle crosshair only when not dragging
    handleMouseMove(e);
  }, [isDragging, dragStartX, dragStartOffset, maxOffset, n, width, handleMouseMove]);

  // Mouse wheel zoom handler - zoom at cursor position
  const handleWheel = (e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;
    
    // Find the data point at cursor
    let cursorDataIdx = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const xp = x(i);
      const dist = Math.abs(svgX - xp);
      if (dist < minDist) {
        minDist = dist;
        cursorDataIdx = i;
      }
    }
    
    // Calculate the position in the full dataset
    const fullDataIdx = startIdx + cursorDataIdx;
    const relativePosition = fullDataIdx / totalDataPoints; // position as ratio (0-1)
    
    // Adjust zoom level
    const delta = e.deltaY > 0 ? -5 : 5; // zoom out / zoom in
    const newZoom = Math.max(10, Math.min(100, zoomLevel + delta));
    
    // Calculate new visible points and try to keep cursor position centered
    const newVisiblePoints = Math.max(20, Math.floor((totalDataPoints * newZoom) / 100));
    const newMaxOffset = Math.max(0, totalDataPoints - newVisiblePoints);
    
    // Try to maintain the same data point under the cursor
    const targetOffset = Math.max(0, Math.min(newMaxOffset, fullDataIdx - Math.floor(cursorDataIdx * (newVisiblePoints / visiblePoints))));
    
    setZoomLevel(newZoom);
    setScrollOffset(targetOffset);
  };

  // Format timestamp for display
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    
    // Format based on timeframe
    if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m' || timeframe === '60m') {
      // Intraday: show time
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1d') {
      // Daily: show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      // Weekly/Monthly: show date only
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const formatTimeDetailed = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div>
      {/* Chart Controls Panel */}
      <div 
        style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--panel-bg)', border: '1px solid var(--border)' }}
        onWheel={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
          {/* Zoom Control */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Zoom: {zoomLevel}% ({visiblePoints} points)
            </label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Scroll Control */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Scroll: {actualOffset} / {maxOffset}
            </label>
            <input 
              type="range" 
              min="0" 
              max={maxOffset} 
              value={actualOffset} 
              onChange={(e) => setScrollOffset(Number(e.target.value))}
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
              disabled={maxOffset === 0}
            />
          </div>
          
          {/* Chart Height Control */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Chart Height: {chartHeight}px
            </label>
            <input 
              type="range" 
              min="300" 
              max="1000" 
              value={chartHeight} 
              onChange={(e) => setChartHeight(Number(e.target.value))}
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        {/* Symbol title with clickable link */}
        {symbol && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a 
              href={`https://finance.yahoo.com/quote/${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.4rem', 
                fontWeight: 600, 
                color: 'var(--primary)',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {companyName && companyName !== symbol ? `${companyName} (${symbol})` : symbol}
              </h3>
            </a>
            <a 
              href={`https://finance.yahoo.com/quote/${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '0.85rem', 
                color: 'var(--accent)', 
                textDecoration: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--accent)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
            >
              Yahoo ↗
            </a>
            <a 
              href={`https://www.zacks.com/stock/quote/${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '0.85rem', 
                color: '#4A90E2', 
                textDecoration: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #4A90E2',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#4A90E2'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A90E2'; }}
            >
              Zacks ↗
            </a>
          </div>
        )}
        
        {/* Indicator Toggles */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showEMA50} onChange={(e) => setShowEMA50(e.target.checked)} />
            <span style={{ color: 'var(--stroke-ema50)' }}>EMA50</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showEMA200} onChange={(e) => setShowEMA200(e.target.checked)} />
            <span style={{ color: 'var(--stroke-ema200)' }}>EMA200</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} />
            <span style={{ color: 'var(--stroke-rsi)' }}>RSI</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showMACD} onChange={(e) => setShowMACD(e.target.checked)} />
            <span style={{ color: 'var(--stroke-macd)' }}>MACD</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showBollinger} onChange={(e) => setShowBollinger(e.target.checked)} />
            <span style={{ color: '#a78bfa' }}>Bollinger</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showVWAP} onChange={(e) => setShowVWAP(e.target.checked)} />
            <span style={{ color: '#14b8a6' }}>VWAP</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showVolume} onChange={(e) => setShowVolume(e.target.checked)} />
            <span style={{ color: '#60a5fa' }}>Volume</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showATR} onChange={(e) => setShowATR(e.target.checked)} />
            <span style={{ color: '#fb923c' }}>ATR</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showOBV} onChange={(e) => setShowOBV(e.target.checked)} />
            <span style={{ color: '#a3e635' }}>OBV</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoScale} onChange={(e) => setAutoScale(e.target.checked)} />
            <span style={{ color: 'var(--muted)' }}>Auto Scale</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showAnalysis} onChange={(e) => setShowAnalysis(e.target.checked)} />
            <span style={{ color: 'var(--accent)' }}>Show Analysis</span>
          </label>
        </div>
      </div>
      
      {/* Crosshair data display - always visible, shows hovered or latest data */}
      <div style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--panel-bg)', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {(() => {
          const displayIndex = hoveredIndex !== null ? hoveredIndex : n - 1;
          return (
            <>
              <span style={{ color: 'var(--text)' }}><strong>Time:</strong> {formatTimeDetailed(visibleTimestamps[displayIndex])}</span>
              {chartMode === 'candles' && visibleOpens[displayIndex] != null && (
                <>
                  <span style={{ color: 'var(--text)' }}><strong>O:</strong> {visibleOpens[displayIndex].toFixed(2)}</span>
                  <span style={{ color: 'var(--text)' }}><strong>H:</strong> {visibleHighs[displayIndex]?.toFixed(2) || '-'}</span>
                  <span style={{ color: 'var(--text)' }}><strong>L:</strong> {visibleLows[displayIndex]?.toFixed(2) || '-'}</span>
                  <span style={{ color: 'var(--text)' }}><strong>C:</strong> {visibleCloses[displayIndex].toFixed(2)}</span>
                </>
              )}
              {chartMode !== 'candles' && (
                <span style={{ color: 'var(--text)' }}><strong>Close:</strong> {visibleCloses[displayIndex].toFixed(2)}</span>
              )}
              {showEMA50 && visibleEma50[displayIndex] != null && <span style={{ color: 'var(--stroke-ema50)' }}><strong>EMA50:</strong> {visibleEma50[displayIndex].toFixed(2)}</span>}
              {showEMA200 && visibleEma200[displayIndex] != null && <span style={{ color: 'var(--stroke-ema200)' }}><strong>EMA200:</strong> {visibleEma200[displayIndex].toFixed(2)}</span>}
              {showRSI && visibleRsi[displayIndex] != null && <span style={{ color: 'var(--stroke-rsi)' }}><strong>RSI:</strong> {visibleRsi[displayIndex].toFixed(2)}</span>}
              {showMACD && visibleMacdLine[displayIndex] != null && <span style={{ color: 'var(--stroke-macd)' }}><strong>MACD:</strong> {visibleMacdLine[displayIndex].toFixed(3)}</span>}
              {showMACD && visibleSignalLine[displayIndex] != null && <span style={{ color: 'var(--stroke-positive)' }}><strong>Signal:</strong> {visibleSignalLine[displayIndex].toFixed(3)}</span>}
              {showMACD && visibleHist[displayIndex] != null && <span style={{ color: visibleHist[displayIndex] >= 0 ? 'var(--accent)' : 'var(--stroke-negative)' }}><strong>Hist:</strong> {visibleHist[displayIndex].toFixed(3)}</span>}
            </>
          );
        })()}
      </div>
      <div style={{ marginBottom: '0.35rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
        Timeframe: {timeframe}   Points: {n}   Mode: <strong style={{ color: 'var(--muted)' }}>{chartMode}</strong>
        {chartMode === 'candles' && (
          <span style={{ marginLeft: '0.5rem', color: 'var(--muted)' }}>OHLC: opens={opens?.length || 0}, highs={highs?.length || 0}, lows={lows?.length || 0}</span>
        )}
      </div>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${totalHeight}`} 
        width="100%" 
        height={totalHeight}
        onMouseMove={handleMouseMoveWithDrag}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
      <defs>
        <linearGradient id="priceAreaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-price-stroke-strong)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--chart-area-fill)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* Price area: background */}
      <rect x={0} y={0} width={width} height={priceHeight} fill="var(--panel-bg)" opacity={1} rx={8} pointerEvents="none" />
      {/* Grid: horizontal lines */}
      {(() => {
        const lines = [];
        const gridCount = 4;
        for (let i = 0; i <= gridCount; i++) {
          const t = i / gridCount;
          const val = minV + (maxV - minV) * (1 - t);
          const y = yPrice(val);
          lines.push(<line key={`hgrid-${i}`} x1={20} x2={width - 20} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />);
        }
        return lines;
      })()}
      {/* Grid: vertical tick lines */}
      {tickIndices.map((idx, i) => {
        const xp = x(idx);
        return <line key={`vgrid-${i}`} x1={xp} x2={xp} y1={8} y2={priceHeight - 8} stroke="var(--chart-grid-vertical)" strokeWidth={1} />;
      })}
      {/* Price area and Close line (area fill + stroke) */}
      {/* Candlesticks (if OHLC series present and chartMode=candles) */}
      {(() => {
        if (chartMode !== 'candles') return null;
        if (!visibleOpens || !visibleHighs || !visibleLows || visibleOpens.length === 0 || visibleHighs.length === 0 || visibleLows.length === 0) return null;
        const bars = [];
        const barWidth = Math.max(1, Math.floor((width - 40) / n - 1));
        let validCount = 0;
        for (let i = 0; i < n; i++) {
          const o = visibleOpens[i];
          const h = visibleHighs[i];
          const l = visibleLows[i];
          const c = visibleCloses[i];
          if (o == null || h == null || l == null || c == null) continue;
          validCount++;
          const xp = x(i);
          const yHigh = yPrice(h);
          const yLow = yPrice(l);
          const yOpen = yPrice(o);
          const yClose = yPrice(c);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
          const rectX = xp - barWidth / 2;
          const color = c >= o ? 'var(--candle-up)' : 'var(--candle-down)';
          // wick
          bars.push(<line key={`wick-${i}`} x1={xp} x2={xp} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />);
          // body
          bars.push(<rect key={`body-${i}`} x={rectX} y={bodyTop} width={barWidth} height={bodyHeight} fill={color} stroke={color} />);
        }
        // If OHLC is sparse (e.g., intraday feed missing O/H/L), fall back to close line so user still sees the series update
        if (validCount < Math.max(5, Math.floor(n * 0.2))) {
          return (
            <>
              <path d={pathFromArr(visibleCloses, yPrice)} stroke="var(--chart-price-stroke-strong)" strokeWidth={1.6} fill="none" />
            </>
          );
        }
        return bars;
      })()}
      {chartMode === 'area' && (
        <>
          <path d={pathFromArr(visibleCloses, yPrice) + ` L ${x(n - 1)} ${priceHeight} L ${x(0)} ${priceHeight} Z`} fill="url(#priceAreaGradient)" stroke="none" opacity={1} />
          <path d={pathFromArr(closes, yPrice)} stroke="var(--chart-price-stroke-strong)" strokeWidth={2} fill="none" />
        </>
      )}

      {/* Buy/Sell markers */}
      {(() => {
        const markers = [];
        // Buy marker: if buyZone is present, try find latest exact match, otherwise approximate by mid-point
        if (buyZone && buyZone.length === 2 && closes.length) {
          const [buyLow, buyHigh] = buyZone;
          let idx = findMostRecentInRange(closes, buyLow, buyHigh);
          if (idx === -1) {
            const buyMid = (buyLow + buyHigh) / 2;
            idx = findClosestIndex(closes, buyMid);
          }
            if (idx >= 0) {
              const xp = x(idx);
              const yp = yPrice(closes[idx]);
              const tipY = Math.min(priceHeight - 6, yp + 10); // place tip slightly below
              const arrowSize = 8;
              // small upward triangle for buy
              const points = `${xp},${tipY} ${xp - arrowSize},${tipY + arrowSize} ${xp + arrowSize},${tipY + arrowSize}`;
              markers.push(<polygon key={`buy-${idx}`} points={points} fill="var(--candle-up)" stroke="var(--candle-border)" strokeWidth={0.6} />);
              // label
              markers.push(<text key={`buy-label-${idx}`} x={xp + 10} y={tipY + 8} fontSize={10} fill="var(--candle-up)" fontWeight={600}>BUY</text>);
          }
        }
        // Sell markers for each target (place above the closest candle at target price)
        if (sellTargets && sellTargets.length) {
          for (let ti = 0; ti < sellTargets.length; ti++) {
            const targ = sellTargets[ti];
            const idxEq = findClosestIndex(closes, targ);
            if (idxEq >= 0) {
              const xp = x(idxEq);
              const yp = yPrice(closes[idxEq]);
              const tipY = Math.max(8, yp - 12); // place tip slightly above
              const arrowSize = 8;
              const points = `${xp},${tipY} ${xp - arrowSize},${tipY - arrowSize} ${xp + arrowSize},${tipY - arrowSize}`;
              markers.push(<polygon key={`sell-${ti}-${idxEq}`} points={points} fill="var(--candle-down)" stroke="var(--candle-border)" strokeWidth={0.6} />);
              // label
              markers.push(<text key={`sell-label-${ti}-${idxEq}`} x={xp + 10} y={tipY - 6} fontSize={10} fill="var(--candle-down)" fontWeight={600}>{`T${ti + 1}`}</text>);
            }
          }
        }
        return markers;
      })()}
      {/* close-line is drawn above based on chartMode to avoid double-draw */}
      {/* EMA50 */}
      {showEMA50 && <path d={pathFromArr(visibleEma50, yPrice)} stroke="var(--stroke-ema50)" strokeWidth={1.3} fill="none" />}
      {/* EMA200 (dashed) */}
      {showEMA200 && <path d={pathFromArr(visibleEma200, yPrice)} stroke="var(--stroke-ema200)" strokeWidth={1.2} strokeDasharray="var(--chart-ema200-dash)" fill="none" />}
      
      {/* Bollinger Bands */}
      {showBollinger && bollingerBands && (() => {
        return (
          <>
            {/* Upper Band */}
            {visibleBBUpper && visibleBBUpper.length > 0 && (
              <path d={pathFromArr(visibleBBUpper, yPrice)} stroke="#a78bfa" strokeWidth={1} strokeDasharray="3 3" fill="none" opacity={0.7} />
            )}
            {/* Middle Band */}
            {visibleBBMiddle && visibleBBMiddle.length > 0 && (
              <path d={pathFromArr(visibleBBMiddle, yPrice)} stroke="#a78bfa" strokeWidth={1.2} fill="none" opacity={0.5} />
            )}
            {/* Lower Band */}
            {visibleBBLower && visibleBBLower.length > 0 && (
              <path d={pathFromArr(visibleBBLower, yPrice)} stroke="#a78bfa" strokeWidth={1} strokeDasharray="3 3" fill="none" opacity={0.7} />
            )}
            {/* Shaded area between bands */}
            {visibleBBUpper && visibleBBLower && visibleBBUpper.length > 0 && visibleBBLower.length > 0 && (() => {
              let pathData = '';
              // Draw upper band
              for (let i = 0; i < visibleBBUpper.length; i++) {
                if (visibleBBUpper[i] != null) {
                  const xp = x(i);
                  const yp = yPrice(visibleBBUpper[i]);
                  pathData += pathData === '' ? `M ${xp} ${yp}` : ` L ${xp} ${yp}`;
                }
              }
              // Draw lower band in reverse
              for (let i = visibleBBLower.length - 1; i >= 0; i--) {
                if (visibleBBLower[i] != null) {
                  const xp = x(i);
                  const yp = yPrice(visibleBBLower[i]);
                  pathData += ` L ${xp} ${yp}`;
                }
              }
              pathData += ' Z';
              return <path d={pathData} fill="#a78bfa" opacity={0.08} />;
            })()}
          </>
        );
      })()}
      
      {/* VWAP */}
      {showVWAP && vwap && visibleVWAP && visibleVWAP.length > 0 && (
        <path d={pathFromArr(visibleVWAP, yPrice)} stroke="#14b8a6" strokeWidth={1.5} strokeDasharray="5 3" fill="none" opacity={0.8} />
      )}
      
      {/* Price y labels left */}
      <text x={6} y={20} fill="var(--chart-axis-label)" fontSize={10}>{maxV.toFixed(2)}</text>
      <text x={6} y={priceHeight - 6} fill="var(--chart-axis-label)" fontSize={10}>{minV.toFixed(2)}</text>
      {/* Price y labels right (min/mid/max) */}
      {(() => {
        const labels = [];
        const labelCount = 4;
        for (let i = 0; i <= labelCount; i++) {
          const t = i / labelCount;
          const val = minV + (maxV - minV) * (1 - t);
          const y = yPrice(val);
          labels.push(<text key={`yr-${i}`} x={width - 6} y={y} textAnchor="end" fill="var(--chart-axis-label)" fontSize={10}>{val.toFixed(2)}</text>);
        }
        return labels;
      })()}

      {/* X-axis ticks (time) at the bottom under MACD */}
      {(() => {
        const bottomY = priceHeight + rsiHeight + macdHeight + 18; // bottom padding
        const uniqueIdx = Array.from(new Set(tickIndices.map((i) => Math.max(0, Math.min(n - 1, i)))));
        return uniqueIdx.map((idx, i) => {
          if (!visibleTimestamps || visibleTimestamps.length <= idx) return null;
          const ts = visibleTimestamps[idx];
          // Format label based on selected timeframe
          let label = `${idx}`;
          if (ts && typeof ts === 'number') {
            label = formatTime(ts);
          }
          return (
            <text key={i} x={x(idx)} y={bottomY} fontSize={11} fill="var(--muted)" textAnchor="middle">{label}</text>
          );
        });
      })()}
      
      {/* Crosshair time label below vertical line */}
      {mousePos && hoveredIndex !== null && visibleTimestamps[hoveredIndex] && (
        <g>
          {/* Top time label */}
          <rect 
            x={x(hoveredIndex) - 50} 
            y={6} 
            width={100} 
            height={18} 
            fill="var(--primary)" 
            rx={4}
            opacity={0.9}
          />
          <text 
            x={x(hoveredIndex)} 
            y={19} 
            fontSize={12} 
            fill="white" 
            textAnchor="middle"
            fontWeight={600}
          >
            {formatTimeDetailed(visibleTimestamps[hoveredIndex])}
          </text>
          {/* Background rectangle for time label */}
          <rect 
            x={x(hoveredIndex) - 40} 
            y={totalHeight - 28} 
            width={80} 
            height={16} 
            fill="var(--primary)" 
            rx={3}
            opacity={0.9}
          />
          <text 
            x={x(hoveredIndex)} 
            y={totalHeight - 17} 
            fontSize={11} 
            fill="white" 
            textAnchor="middle"
            fontWeight={600}
          >
            {formatTime(visibleTimestamps[hoveredIndex])}
          </text>
        </g>
      )}

      {/* RSI chart (grid and thresholds) */}
      {showRSI && <rect x={0} y={priceHeight} width={width} height={rsiHeight} fill="var(--panel-bg)" rx={8} pointerEvents="none" />}
      {(() => {
        const lines = [];
        const gridCount = 2; // small grid for RSI
        for (let i = 0; i <= gridCount; i++) {
          const t = i / gridCount;
          const val = rsiMin + (rsiMax - rsiMin) * (1 - t);
          const y = yRsi(val);
          lines.push(<line key={`rgrid-${i}`} x1={20} x2={width - 20} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />);
        }
        return lines;
      })()}
      {visibleRsi && visibleRsi.length > 0 && (
        <path d={pathFromArr(visibleRsi, yRsi)} stroke="var(--stroke-rsi)" strokeWidth={1.4} fill="none" />
      )}
      {/* RSI thresholds: 70 and 30 */}
      <line x1={20} x2={width - 20} y1={yRsi(70)} y2={yRsi(70)} stroke="var(--stroke-negative)" strokeDasharray="4 4" strokeWidth={0.8} />
      <line x1={20} x2={width - 20} y1={yRsi(30)} y2={yRsi(30)} stroke="var(--stroke-positive)" strokeDasharray="4 4" strokeWidth={0.8} />

      {/* MACD chart (grid and histogram) */}
      {showMACD && <rect x={0} y={priceHeight + rsiHeight} width={width} height={macdHeight} fill="var(--panel-bg)" rx={8} pointerEvents="none" />}
      {(() => {
        const lines = [];
        const gridCount = 2;
        for (let i = 0; i <= gridCount; i++) {
          const t = i / gridCount;
          const y = priceHeight + rsiHeight + (macdHeight - 20) * t + 10;
          lines.push(<line key={`mgrid-${i}`} x1={20} x2={width - 20} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />);
        }
        return lines;
      })()}
      {/* MACD histogram bars */}
      {visibleHist.map((h, i) => {
        if (h == null) return null;
        const barWidth = Math.max(1, (width - 40) / n - 1);
        const xp = x(i) - barWidth / 2;
        const y0 = yMacd(0);
        const yv = yMacd(h);
        const hgt = y0 - yv;
        const color = h >= 0 ? 'var(--accent)' : 'var(--stroke-negative)';
        return <rect key={i} x={xp} y={yv} width={barWidth} height={Math.abs(hgt)} fill={color} />;
      })}
      {visibleMacdLine && visibleMacdLine.length > 0 && <path d={pathFromArr(visibleMacdLine, yMacd)} stroke="var(--stroke-macd)" strokeWidth={1.2} fill="none" />}
      {visibleSignalLine && visibleSignalLine.length > 0 && <path d={pathFromArr(visibleSignalLine, yMacd)} stroke="var(--stroke-positive)" strokeWidth={1} fill="none" />}
      
      {/* Volume Chart */}
      {showVolume && volumeHeight > 0 && (() => {
        const volumeYStart = priceHeight + rsiHeight + macdHeight;
        const maxVol = Math.max(...visibleVolumes.filter(v => v != null));
        const yVolume = (v) => {
          if (v == null || maxVol === 0) return volumeYStart + volumeHeight - 10;
          return volumeYStart + 10 + (1 - v / maxVol) * (volumeHeight - 20);
        };
        
        return (
          <>
            {/* Volume label */}
            <text x={10} y={volumeYStart + 20} fill="var(--chart-axis-label)" fontSize={11} fontWeight={600}>
              Volume
            </text>
            {/* Volume grid lines */}
            <line x1={20} x2={width - 20} y1={volumeYStart + volumeHeight - 10} y2={volumeYStart + volumeHeight - 10} stroke="var(--chart-grid)" strokeWidth={1} />
            {/* Volume bars */}
            {visibleVolumes.map((vol, i) => {
              if (vol == null) return null;
              const barWidth = Math.max(1, (width - 40) / n - 1);
              const xp = x(i) - barWidth / 2;
              const y0 = volumeYStart + volumeHeight - 10;
              const yv = yVolume(vol);
              const hgt = y0 - yv;
              const color = visibleCloses[i] >= (visibleOpens[i] || visibleCloses[i]) ? 'var(--accent)' : 'var(--stroke-negative)';
              return <rect key={i} x={xp} y={yv} width={barWidth} height={Math.abs(hgt)} fill={color} opacity={0.6} />;
            })}
            {/* Volume MA overlay */}
            {visibleVolumeMA && visibleVolumeMA.length > 0 && (
              <path d={pathFromArr(visibleVolumeMA, yVolume)} stroke="#60a5fa" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
            )}
          </>
        );
      })()}
      
      {/* ATR Chart */}
      {showATR && atrHeight > 0 && (() => {
        const atrYStart = priceHeight + rsiHeight + macdHeight + volumeHeight;
        const atrVals = visibleATR.filter(v => v != null);
        const maxAtr = Math.max(...atrVals, 0);
        const minAtr = Math.min(...atrVals, 0);
        const atrPad = (maxAtr - minAtr) * 0.1 || 1;
        const yATR = (v) => {
          if (v == null) return atrYStart + atrHeight / 2;
          return atrYStart + 10 + (1 - (v - minAtr) / (maxAtr - minAtr + atrPad)) * (atrHeight - 20);
        };
        
        return (
          <>
            {/* ATR label */}
            <text x={10} y={atrYStart + 20} fill="var(--chart-axis-label)" fontSize={11} fontWeight={600}>
              ATR (14)
            </text>
            {/* ATR grid lines */}
            <line x1={20} x2={width - 20} y1={atrYStart + 10} y2={atrYStart + 10} stroke="var(--chart-grid)" strokeWidth={1} />
            <line x1={20} x2={width - 20} y1={atrYStart + atrHeight - 10} y2={atrYStart + atrHeight - 10} stroke="var(--chart-grid)" strokeWidth={1} />
            {/* ATR line */}
            {visibleATR && visibleATR.length > 0 && (
              <path d={pathFromArr(visibleATR, yATR)} stroke="#fb923c" strokeWidth={1.5} fill="none" />
            )}
          </>
        );
      })()}
      
      {/* OBV Chart */}
      {showOBV && obvHeight > 0 && (() => {
        const obvYStart = priceHeight + rsiHeight + macdHeight + volumeHeight + atrHeight;
        const obvVals = visibleOBV.filter(v => v != null);
        const maxObv = Math.max(...obvVals);
        const minObv = Math.min(...obvVals);
        const obvPad = (maxObv - minObv) * 0.05 || 1;
        const yOBV = (v) => {
          if (v == null) return obvYStart + obvHeight / 2;
          return obvYStart + 10 + (1 - (v - minObv) / (maxObv - minObv + obvPad)) * (obvHeight - 20);
        };
        
        return (
          <>
            {/* OBV label */}
            <text x={10} y={obvYStart + 20} fill="var(--chart-axis-label)" fontSize={11} fontWeight={600}>
              OBV
            </text>
            {/* OBV grid lines */}
            <line x1={20} x2={width - 20} y1={obvYStart + 10} y2={obvYStart + 10} stroke="var(--chart-grid)" strokeWidth={1} />
            <line x1={20} x2={width - 20} y1={obvYStart + obvHeight / 2} y2={obvYStart + obvHeight / 2} stroke="var(--chart-grid)" strokeWidth={1} strokeDasharray="2 2" />
            <line x1={20} x2={width - 20} y1={obvYStart + obvHeight - 10} y2={obvYStart + obvHeight - 10} stroke="var(--chart-grid)" strokeWidth={1} />
            {/* OBV line */}
            {visibleOBV && visibleOBV.length > 0 && (
              <path d={pathFromArr(visibleOBV, yOBV)} stroke="#a3e635" strokeWidth={1.5} fill="none" />
            )}
          </>
        );
      })()}
      
      {/* Crosshair lines */}
      {mousePos && hoveredIndex !== null && (
        <>
          {/* Vertical line follows mouse exactly */}
          <line 
            x1={mousePos.x} 
            x2={mousePos.x} 
            y1={0} 
            y2={totalHeight} 
            stroke="var(--primary)" 
            strokeWidth={1} 
            strokeDasharray="4 2"
            opacity={0.7}
          />
          {/* Horizontal line follows mouse exactly */}
          <line 
            x1={0} 
            x2={width} 
            y1={mousePos.y} 
            y2={mousePos.y} 
            stroke="var(--primary)" 
            strokeWidth={1} 
            strokeDasharray="4 2"
            opacity={0.7}
          />
          {/* Price label on horizontal line */}
          {mousePos.y <= priceHeight && (() => {
            // Find the price value at the mouse Y position
            const priceAtMouse = minV + (maxV - minV) * (1 - (mousePos.y - 10) / (priceHeight - 20));
            return (
              <>
                {/* Background rect for label */}
                <rect 
                  x={width - 50} 
                  y={mousePos.y - 8} 
                  width={45} 
                  height={16} 
                  fill="var(--primary)" 
                  rx={3}
                  opacity={0.9}
                />
                {/* Price text */}
                <text 
                  x={width - 27} 
                  y={mousePos.y + 4} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize={10} 
                  fontWeight={600}
                >
                  {priceAtMouse.toFixed(2)}
                </text>
              </>
            );
          })()}
          {/* Crosshair center marker at exact mouse position */}
          <circle 
            cx={mousePos.x} 
            cy={mousePos.y} 
            r={3} 
            fill="transparent" 
            stroke="var(--primary)" 
            strokeWidth={1.5}
          />
          {/* Highlight point snapped to nearest data point */}
          {visibleCloses[hoveredIndex] != null && (
            <circle 
              cx={x(hoveredIndex)} 
              cy={yPrice(visibleCloses[hoveredIndex])} 
              r={5} 
              fill="var(--primary)" 
              stroke="white" 
              strokeWidth={2}
            />
          )}
        </>
      )}
      
      {/* Invisible overlay to capture all mouse events for drag/pan functionality */}
      <rect x={0} y={0} width={width} height={totalHeight} fill="transparent" pointerEvents="all" />
      </svg>
      
      {/* Technical Analysis Section */}
      {showAnalysis && (() => {
        const analysisPoints = generateAnalysis();
        return (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            borderRadius: '1rem',
            background: 'var(--panel-bg)',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.2rem',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📊</span>
              Technical Analysis - {symbol} ({timeframe})
            </h3>
            
            {analysisPoints.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Insufficient data for analysis</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysisPoints.map((point, idx) => {
                  let bgColor = 'rgba(100, 116, 139, 0.1)';
                  let borderColor = 'var(--border)';
                  let icon = '•';
                  
                  if (point.type === 'bullish') {
                    bgColor = 'rgba(16, 185, 129, 0.1)';
                    borderColor = '#10b981';
                    icon = '✓';
                  } else if (point.type === 'bearish') {
                    bgColor = 'rgba(239, 68, 68, 0.1)';
                    borderColor = '#ef4444';
                    icon = '✗';
                  } else if (point.type === 'summary') {
                    bgColor = 'rgba(59, 130, 246, 0.15)';
                    borderColor = '#3b82f6';
                    icon = '📌';
                  }
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        display: 'flex',
                        alignItems: 'start',
                        gap: '0.75rem',
                        fontSize: point.type === 'summary' ? '0.95rem' : '0.9rem',
                        fontWeight: point.type === 'summary' ? '600' : '400'
                      }}
                    >
                      <span style={{ 
                        color: borderColor, 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        minWidth: '1.5rem',
                        textAlign: 'center'
                      }}>
                        {icon}
                      </span>
                      <span style={{ color: 'var(--text)', lineHeight: '1.5' }}>
                        {point.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              fontStyle: 'italic'
            }}>
              <strong>Note:</strong> This analysis is generated based on technical indicators for the {timeframe} timeframe. 
              It updates automatically when you change timeframes. Always do your own research and consider multiple factors before making investment decisions.
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default App;



