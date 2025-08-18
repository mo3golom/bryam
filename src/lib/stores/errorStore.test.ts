import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  isOnline,
  errors,
  connectivityStatus,
  addError,
  removeError,
  clearErrors,
  initializeConnectivityMonitoring
} from './errorStore';

// Mock browser environment
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true
});

describe('errorStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearErrors();
    isOnline.set(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('isOnline store', () => {
    it('should have initial value of true', () => {
      expect(get(isOnline)).toBe(true);
    });

    it('should update when set', () => {
      isOnline.set(false);
      expect(get(isOnline)).toBe(false);
    });
  });

  describe('errors store', () => {
    it('should start empty', () => {
      expect(get(errors)).toEqual([]);
    });

    it('should add errors', () => {
      const errorId = addError('Test error');
      const currentErrors = get(errors);
      
      expect(currentErrors).toHaveLength(1);
      expect(currentErrors[0].message).toBe('Test error');
      expect(currentErrors[0].id).toBe(errorId);
    });

    it('should remove errors by id', () => {
      const errorId = addError('Test error');
      removeError(errorId);
      
      expect(get(errors)).toEqual([]);
    });

    it('should clear all errors', () => {
      addError('Error 1');
      addError('Error 2');
      
      expect(get(errors)).toHaveLength(2);
      
      clearErrors();
      
      expect(get(errors)).toEqual([]);
    });
  });

  describe('connectivityStatus derived store', () => {
    it('should show online status when connected', () => {
      isOnline.set(true);
      const status = get(connectivityStatus);
      
      expect(status.online).toBe(true);
      expect(status.message).toBe('Connected');
    });

    it('should show offline status when disconnected', () => {
      isOnline.set(false);
      const status = get(connectivityStatus);
      
      expect(status.online).toBe(false);
      expect(status.message).toBe('You are currently offline');
    });
  });

  describe('addError', () => {
    it('should create error with default values', () => {
      const errorId = addError('Test message');
      const currentErrors = get(errors);
      
      expect(currentErrors[0]).toMatchObject({
        id: errorId,
        message: 'Test message',
        type: 'error',
        isRetryable: false,
        autoHide: true
      });
      expect(currentErrors[0].timestamp).toBeTypeOf('number');
    });

    it('should create error with custom values', () => {
      const errorId = addError('Warning message', 'warning', true, false);
      const currentErrors = get(errors);
      
      expect(currentErrors[0]).toMatchObject({
        id: errorId,
        message: 'Warning message',
        type: 'warning',
        isRetryable: true,
        autoHide: false
      });
    });

    it('should auto-hide errors after 5 seconds', async () => {
      addError('Auto-hide error', 'error', false, true);
      
      expect(get(errors)).toHaveLength(1);
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(get(errors)).toHaveLength(0);
    });

    it('should not auto-hide when autoHide is false', async () => {
      addError('Persistent error', 'error', false, false);
      
      expect(get(errors)).toHaveLength(1);
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(get(errors)).toHaveLength(1);
    });
  });

  describe('initializeConnectivityMonitoring', () => {
    it('should set up event listeners', () => {
      const mockAddEventListener = vi.fn();
      window.addEventListener = mockAddEventListener;
      
      initializeConnectivityMonitoring();
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should return cleanup function', () => {
      const mockRemoveEventListener = vi.fn();
      window.removeEventListener = mockRemoveEventListener;
      
      const cleanup = initializeConnectivityMonitoring();
      
      expect(cleanup).toBeTypeOf('function');
      
      cleanup?.();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});