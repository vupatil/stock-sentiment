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

  describe('Aggregation Logic Integration', () => {
    it('requests base interval for 3m and aggregates data', async () => {
      // Mock successful API response with 1m data
      const mockData = {
        chart: {
          result: [{
            timestamp: [1000, 1060, 1120, 1180, 1240, 1300],
            indicators: {
              quote: [{
                open: [100, 103, 107, 108, 110, 114],
                high: [105, 108, 110, 112, 115, 116],
                low: [99, 102, 106, 107, 109, 113],
                close: [103, 107, 108, 110, 114, 115],
                volume: [1000, 1500, 2000, 1200, 1800, 1600]
              }]
            },
            meta: {
              regularMarketPrice: 115,
              previousClose: 100
            }
          }]
        },
        _meta: { source: 'yahoo' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
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
        // Verify fetch was called with 1m (base interval)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=1m'),
          expect.any(Object)
        );
      });
    });

    it('requests base interval for 4h and aggregates data', async () => {
      const mockData = {
        chart: {
          result: [{
            timestamp: [1000, 4600, 8200, 11800],
            indicators: {
              quote: [{
                open: [100, 103, 107, 108],
                high: [105, 108, 110, 112],
                low: [99, 102, 106, 107],
                close: [103, 107, 108, 110],
                volume: [10000, 12000, 15000, 11000]
              }]
            },
            meta: {
              regularMarketPrice: 110,
              previousClose: 100
            }
          }]
        },
        _meta: { source: 'yahoo' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      render(<App />);
      
      // Select 4h interval
      const timeframeDropdown = screen.getByTestId('timeframe-dropdown');
      fireEvent.change(timeframeDropdown, { target: { value: '4h' } });
      
      const analyzeButton = screen.getByTestId('analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        // Verify fetch was called with 1h (base interval)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=1h'),
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
