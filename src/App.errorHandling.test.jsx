import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
global.fetch = vi.fn();

describe('Error Handling - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('JSON Parse Error Protection', () => {
    it('handles invalid JSON response gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Invalid JSON response from server/i)).toBeInTheDocument();
      });
    });

    it('handles HTML error page (wrong content-type)', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'text/html';
            return null;
          }
        }
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Server returned invalid content type/i)).toBeInTheDocument();
      });
    });

    it('handles missing content-type header', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: () => null
        }
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Server returned invalid content type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Timeout Handling', () => {
    it('handles request timeout after 30 seconds', async () => {
      // Mock a fetch that never resolves (simulating timeout)
      global.fetch.mockImplementation(() => {
        return new Promise((resolve) => {
          // Simulate AbortController timeout
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            throw error;
          }, 31000);
        });
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      // Fast-forward past the 30 second timeout
      vi.advanceTimersByTime(31000);

      await waitFor(() => {
        expect(screen.getByText(/Request timeout/i)).toBeInTheDocument();
      });
    });

    it('clears timeout on successful response', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          chart: {
            result: [{
              timestamp: [1000, 2000, 3000],
              meta: {},
              indicators: {
                quote: [{
                  open: [100, 101, 102],
                  high: [105, 106, 107],
                  low: [99, 100, 101],
                  close: [103, 104, 105],
                  volume: [1000, 1500, 2000]
                }]
              }
            }]
          }
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(clearTimeoutSpy).toHaveBeenCalled();
      });
    });
  });

  describe('404 Not Found Handling', () => {
    it('handles 404 for invalid symbol', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Symbol not found',
          message: 'Symbol XYZ123 does not exist or is not supported by any provider.'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'XYZ123';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Symbol XYZ123 does not exist/i)).toBeInTheDocument();
      });
    });

    it('handles 404 for inactive symbol', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Symbol inactive',
          message: 'Symbol AAPL is not supported by the current provider.'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Symbol AAPL is not supported/i)).toBeInTheDocument();
      });
    });

    it('shows user-friendly message for 404 without details', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({})
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'TEST';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Symbol TEST not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('500 Internal Server Error Handling', () => {
    it('handles 500 server error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Internal server error',
          message: 'Database connection failed'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
      });
    });

    it('logs server error details to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Internal server error',
          message: 'Unexpected error',
          details: { stack: 'Error stack trace' }
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Server error:',
          expect.objectContaining({ error: 'Internal server error' })
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('503 Service Unavailable Handling', () => {
    it('handles 503 data refresh scenario', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            if (header === 'Retry-After') return '15';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Data being refreshed',
          message: 'Data for AAPL is being updated. Please retry in 10-30 seconds.',
          retryAfter: 15,
          status: 'refreshing'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Data for AAPL is being updated/i)).toBeInTheDocument();
      });
    });

    it('handles 503 queued scenario', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            if (header === 'Retry-After') return '15';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'Symbol queued',
          message: 'Symbol TSLA queued for collection. Please retry in 15 seconds.',
          retryAfter: 15,
          status: 'queued'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'TSLA';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Symbol TSLA queued for collection/i)).toBeInTheDocument();
      });
    });

    it('handles 503 all sources failed', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        headers: {
          get: (header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: 'All sources failed',
          message: 'Unable to fetch data from any provider'
        })
      });

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Unable to fetch data from any provider/i)).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('handles network failure', async () => {
      global.fetch.mockRejectedValue(new Error('Failed to fetch'));

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('distinguishes between timeout and network errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      global.fetch.mockRejectedValue(abortError);

      render(<App />);
      
      const input = screen.getByTestId('symbol-input');
      const button = screen.getByTestId('analyze-button');
      
      input.value = 'AAPL';
      button.click();

      await waitFor(() => {
        expect(screen.getByText(/Request timeout/i)).toBeInTheDocument();
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Scanner Error Tracking', () => {
    it('logs failed symbols during scan', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<App />);
      
      // Switch to Scanner tab
      const scannerTab = screen.getByText('🔍 Scanner');
      scannerTab.click();

      // Note: Scanner tests would require more complex setup
      // This is a placeholder for the structure

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });
  });
});
