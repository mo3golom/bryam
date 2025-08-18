/**
 * Global error and connectivity state management
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  isRetryable: boolean;
  timestamp: number;
  autoHide?: boolean;
}

// Online/offline status
export const isOnline = writable(true);

// Global error notifications
export const errors = writable<AppError[]>([]);

// Derived store for current connectivity status
export const connectivityStatus = derived(isOnline, ($isOnline) => ({
  online: $isOnline,
  message: $isOnline ? 'Connected' : 'You are currently offline'
}));

/**
 * Add an error to the global error store
 */
export function addError(
  message: string,
  type: AppError['type'] = 'error',
  isRetryable = false,
  autoHide = true
): string {
  const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const error: AppError = {
    id,
    message,
    type,
    isRetryable,
    timestamp: Date.now(),
    autoHide
  };

  errors.update(currentErrors => [...currentErrors, error]);

  // Auto-hide after 5 seconds if autoHide is true
  if (autoHide) {
    setTimeout(() => {
      removeError(id);
    }, 5000);
  }

  return id;
}

/**
 * Remove an error from the global error store
 */
export function removeError(id: string): void {
  errors.update(currentErrors => currentErrors.filter(error => error.id !== id));
}

/**
 * Clear all errors
 */
export function clearErrors(): void {
  errors.set([]);
}

/**
 * Initialize connectivity monitoring (browser only)
 */
export function initializeConnectivityMonitoring(): (() => void) | undefined {
  if (!browser) return undefined;

  // Set initial online status
  isOnline.set(navigator.onLine);

  // Listen for online/offline events
  const handleOnline = () => {
    isOnline.set(true);
    addError('Connection restored', 'info', false, true);
  };

  const handleOffline = () => {
    isOnline.set(false);
    addError('You are currently offline. Some features may not work.', 'warning', false, false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function (returned for potential use)
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}