import React, { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol, interval = 'D', theme = 'dark' }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!window.TradingView) {
      console.error('TradingView library not loaded');
      return;
    }

    // Map our timeframe format to TradingView interval format
    const intervalMap = {
      '1m': '1',
      '2m': '2',
      '3m': '3',
      '4m': '4',
      '5m': '5',
      '10m': '10',
      '15m': '15',
      '30m': '30',
      '60m': '60',
      '1h': '60',
      '1d': 'D',
      '1wk': 'W',
      '1mo': 'M'
    };

    const tvInterval = intervalMap[interval] || 'D';

    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create new TradingView widget
    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: symbol || 'AAPL',
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1', // Candle style
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      container_id: containerRef.current.id,
      studies: [],
      disabled_features: ['use_localstorage_for_settings', 'header_symbol_search'],
      enabled_features: ['study_templates', 'dont_show_boolean_study_arguments', 'hide_last_na_study_output'],
      loading_screen: { backgroundColor: theme === 'dark' ? '#1e222d' : '#ffffff' },
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#16a34a',
        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
        'mainSeriesProperties.candleStyle.borderUpColor': '#16a34a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor': '#16a34a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
      }
    });

    // After widget loads, add all studies programmatically
    if (widgetRef.current && widgetRef.current.onChartReady) {
      widgetRef.current.onChartReady(() => {
        try {
          const chart = widgetRef.current.chart();
          
          // Main chart overlays
          chart.createStudy('Moving Average Exponential', false, false, [50]);
          chart.createStudy('Moving Average Exponential', false, false, [200]);
          chart.createStudy('Bollinger Bands', false, false, [20, 2]);
          chart.createStudy('Volume Weighted Average Price', false, false);
          
          // Separate panels for oscillators/indicators
          chart.createStudy('Volume', false, false);
          chart.createStudy('Relative Strength Index', false, false, [14]);
          chart.createStudy('MACD', false, false, [12, 26, 'close', 9]);
          chart.createStudy('Stochastic', false, false, [14, 1, 3]);
          chart.createStudy('Money Flow Index', false, false, [14]);
          chart.createStudy('Average True Range', false, false, [14]);
          chart.createStudy('Average Directional Index', false, false, [14]);
          chart.createStudy('On Balance Volume', false, false);
          
          console.log('All TradingView studies loaded successfully');
        } catch (e) {
          console.warn('Error loading TradingView studies:', e);
        }
      });
    }

    // Cleanup
    return () => {
      if (widgetRef.current) {
        try {
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.warn('TradingView widget cleanup error:', e);
        }
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme]);

  return (
    <div
      ref={containerRef}
      id={`tradingview_${Math.random().toString(36).substr(2, 9)}`}
      style={{
        width: '100%',
        height: '800px',
        borderRadius: '0.75rem',
        overflow: 'hidden'
      }}
    />
  );
}
