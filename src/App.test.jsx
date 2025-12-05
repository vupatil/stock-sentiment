import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
global.fetch = vi.fn();

describe('Stock Sentiment App - Fixed Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the main app with all tabs', () => {
      render(<App />);
      
      // Check if main tabs exist (using specific button text)
      expect(screen.getByText('📊 Analyze')).toBeInTheDocument();
      expect(screen.getByText('🔍 Scanner')).toBeInTheDocument();
    });

    it('renders all 19 interval options in Analyze dropdown', () => {
      render(<App />);
      
      const dropdown = screen.getByTestId('timeframe-dropdown');
      
      // Check for native intervals
      expect(dropdown).toContainHTML('1 min');
      expect(dropdown).toContainHTML('2 min');
      expect(dropdown).toContainHTML('5 min');
      expect(dropdown).toContainHTML('15 min');
      expect(dropdown).toContainHTML('30 min');
      expect(dropdown).toContainHTML('1 hour');
      expect(dropdown).toContainHTML('90 min');
      expect(dropdown).toContainHTML('1 day');
      expect(dropdown).toContainHTML('5 days');
      expect(dropdown).toContainHTML('1 week');
      expect(dropdown).toContainHTML('1 month');
      expect(dropdown).toContainHTML('3 months');
      
      // Check for aggregated intervals
      expect(dropdown).toContainHTML('3 min');
      expect(dropdown).toContainHTML('4 min');
      expect(dropdown).toContainHTML('10 min');
      expect(dropdown).toContainHTML('2 hours');
      expect(dropdown).toContainHTML('4 hours');
      expect(dropdown).toContainHTML('6 hours');
      expect(dropdown).toContainHTML('12 hours');
    });

    it('renders unique Analyze Stock button', () => {
      render(<App />);
      
      // Should only find ONE button with 'Analyze Stock' text (not 'Analyze' alone)
      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeInTheDocument();
      expect(analyzeButton).toHaveTextContent('Analyze Stock');
    });
  });

  describe('Test ID Attributes', () => {
    it('has test ID on symbol input', () => {
      render(<App />);
      
      const symbolInput = screen.getByTestId('symbol-input');
      expect(symbolInput).toBeInTheDocument();
    });

    it('has test ID on timeframe dropdown', () => {
      render(<App />);
      
      const timeframeDropdown = screen.getByTestId('timeframe-dropdown');
      expect(timeframeDropdown).toBeInTheDocument();
    });

    it('has test ID on analyze button', () => {
      render(<App />);
      
      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeInTheDocument();
    });
  });

  describe('Timeframe Direct Request', () => {
    it('requests actual 3m interval directly (no aggregation)', async () => {
      // Mock successful API response with 3m data
      const mockData = {
        chart: {
          result: [{
            timestamp: [1000, 1180, 1360],
            indicators: {
              quote: [{
                open: [100, 103, 107],
                high: [105, 108, 110],
                low: [99, 102, 106],
                close: [103, 107, 108],
                volume: [3000, 4500, 5000]
              }]
            },
            meta: {
              regularMarketPrice: 108,
              previousClose: 100
            }
          }]
        },
        _meta: { source: 'polygon' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: async () => mockData
      });

      render(<App />);
      
      // Select 3m interval using test ID
      const timeframeDropdown = screen.getByTestId('timeframe-dropdown');
      fireEvent.change(timeframeDropdown, { target: { value: '3m' } });
      
      // Click analyze button using test ID
      const analyzeButton = screen.getByTestId('analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        // Verify fetch was called with actual 3m interval (no aggregation)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=3m'),
          expect.any(Object)
        );
      });
    });

    it('requests actual 4h interval directly (no aggregation)', async () => {
      const mockData = {
        chart: {
          result: [{
            timestamp: [1000, 15400, 29800],
            indicators: {
              quote: [{
                open: [100, 103, 107],
                high: [105, 108, 110],
                low: [99, 102, 106],
                close: [103, 107, 108],
                volume: [40000, 48000, 52000]
              }]
            },
            meta: {
              regularMarketPrice: 108,
              previousClose: 100
            }
          }]
        },
        _meta: { source: 'polygon' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: async () => mockData
      });

      render(<App />);
      
      // Select 4h interval
      const timeframeDropdown = screen.getByTestId('timeframe-dropdown');
      fireEvent.change(timeframeDropdown, { target: { value: '4h' } });
      
      const analyzeButton = screen.getByTestId('analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        // Verify fetch was called with actual 4h interval (no aggregation)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=4h'),
          expect.any(Object)
        );
      });
    });
  });

  describe('State Management', () => {
    it('updates symbol state when input changes', () => {
      render(<App />);
      
      const symbolInput = screen.getByTestId('symbol-input');
      fireEvent.change(symbolInput, { target: { value: 'TSLA' } });
      
      expect(symbolInput.value).toBe('TSLA');
    });

    it('updates timeframe state when dropdown changes', () => {
      render(<App />);
      
      const timeframeDropdown = screen.getByTestId('timeframe-dropdown');
      fireEvent.change(timeframeDropdown, { target: { value: '4h' } });
      
      expect(timeframeDropdown.value).toBe('4h');
    });
  });

  describe('Scanner Functionality', () => {
    it('renders scanner tab when clicked', () => {
      render(<App />);
      
      // Click Scanner tab
      const scannerTab = screen.getByText(/🔍 Scanner/i);
      fireEvent.click(scannerTab);
      
      // Should show Scanner Settings heading
      expect(screen.getByText(/Scanner Settings/i)).toBeInTheDocument();
    });

    it('scanner has Start Market Scan button', () => {
      render(<App />);
      
      const scannerTab = screen.getByText(/🔍 Scanner/i);
      fireEvent.click(scannerTab);
      
      // Find Start Market Scan button by test ID
      const scanButton = screen.getByTestId('start-scan-button');
      expect(scanButton).toBeInTheDocument();
      expect(scanButton).toHaveTextContent('Start Market Scan');
    });
  });
});
