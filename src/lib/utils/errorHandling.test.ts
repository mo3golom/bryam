import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retryWithBackoff,
  analyzeError,
  isOnline,
  withTimeout,
  executeSupabaseQuery
} from './errorHandling';

describe('errorHandling utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(mockFn, { maxAttempts: 3, baseDelay: 100 });
      
      // Fast-forward through the delays
      await vi.runAllTimersAsync();
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = { code: 'PGRST116', message: 'Not found' };
      const mockFn = vi.fn().mockRejectedValue(nonRetryableError);
      
      await expect(retryWithBackoff(mockFn)).rejects.toEqual(nonRetryableError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxAttempts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const promise = retryWithBackoff(mockFn, { maxAttempts: 2, baseDelay: 100 });
      
      // Fast-forward all timers to complete the retries
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Network error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('analyzeError', () => {
    it('should identify Supabase not found error', () => {
      const error = { code: 'PGRST116', message: 'No rows returned' };
      const result = analyzeError(error);
      
      expect(result.message).toBe('The requested item was not found.');
      expect(result.isRetryable).toBe(false);
      expect(result.isNetworkError).toBe(false);
    });

    it('should identify Supabase connection timeout', () => {
      const error = { code: 'PGRST301', message: 'Connection timeout' };
      const result = analyzeError(error);
      
      expect(result.message).toBe('Connection timeout. Please check your internet connection and try again.');
      expect(result.isRetryable).toBe(true);
      expect(result.isNetworkError).toBe(true);
    });

    it('should identify network fetch errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = analyzeError(error);
      
      expect(result.message).toBe('Network error. Please check your internet connection and try again.');
      expect(result.isRetryable).toBe(true);
      expect(result.isNetworkError).toBe(true);
    });

    it('should identify timeout errors', () => {
      const error = new Error('Timeout');
      error.name = 'AbortError';
      const result = analyzeError(error);
      
      expect(result.message).toBe('Request timed out. Please try again.');
      expect(result.isRetryable).toBe(true);
      expect(result.isNetworkError).toBe(true);
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const result = analyzeError(error);
      
      expect(result.message).toBe('Something went wrong');
      expect(result.isRetryable).toBe(true);
      expect(result.isNetworkError).toBe(false);
    });

    it('should handle unknown errors', () => {
      const error = 'string error';
      const result = analyzeError(error);
      
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.isRetryable).toBe(true);
      expect(result.isNetworkError).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      expect(isOnline()).toBe(false);
    });

    it('should return true when navigator is not available', () => {
      const originalNavigator = global.navigator;
      // @ts-ignore
      delete global.navigator;
      
      expect(isOnline()).toBe(true);
      
      global.navigator = originalNavigator;
    });
  });

  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });

    it('should reject when timeout is reached', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000);
      });
      
      const timeoutPromise = withTimeout(promise, 1000);
      
      await vi.runAllTimersAsync();
      
      await expect(timeoutPromise).rejects.toThrow('Operation timed out after 1000ms');
    });
  });

  describe('executeSupabaseQuery', () => {
    it('should return data on successful query', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: { id: '1', title: 'Test Song' },
        error: null
      });
      
      const result = await executeSupabaseQuery(mockQuery);
      
      expect(result).toEqual({ id: '1', title: 'Test Song' });
    });

    it('should throw error when Supabase returns error', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });
      
      await expect(executeSupabaseQuery(mockQuery)).rejects.toEqual({
        code: 'PGRST116',
        message: 'Not found'
      });
    });

    it('should throw error when data is null', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });
      
      await expect(executeSupabaseQuery(mockQuery, { 
        timeout: 1000,
        maxAttempts: 1 // Don't retry for this test
      })).rejects.toThrow('No data returned from query');
    });

    it('should respect timeout option', async () => {
      const mockQuery = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: 'too late', error: null }), 2000);
        })
      );
      
      const promise = executeSupabaseQuery(mockQuery, { timeout: 1000 });
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Operation timed out after 1000ms');
    });
  });
});