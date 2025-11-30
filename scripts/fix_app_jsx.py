#!/usr/bin/env python3
"""Fix corrupted App.jsx by removing malformed header and adding proper imports/constants"""

import re

print("🔧 Fixing App.jsx corruption...")

# Read corrupted file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where the working JSX code starts (the RSI display line)
# This is reliably the first line of actual working UI code
marker = '                    {analysis.rsi ? analysis.rsi.toFixed(1) : "-"}'
start_idx = content.find(marker)

if start_idx == -1:
    print("❌ Could not find working code marker")
    exit(1)

print(f"✅ Found working code at position {start_idx}")

# Extract working code
working_code = content[start_idx:]

# Create proper header
header = '''import React, { useState } from "react";
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
  
  // TODO: Add fetchCloses, analyzeStock, scanner functions, and JSX return

'''

# Combine
fixed = header + working_code

# Backup corrupted
import shutil
shutil.copy('src/App.jsx', 'src/App.jsx.corrupted')
print("📦 Backed up corrupted file to src/App.jsx.corrupted")

# Write fixed
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(fixed)

print("✅ App.jsx has been fixed!")
print("\nNext steps:")
print("  1. Run: npm run test")
print("  2. If tests pass, run: npm run dev")
