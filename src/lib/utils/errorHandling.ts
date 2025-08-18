/**
 * Error handling utilities for the Ukulele Song Catalog
 * Provides retry logic, offline detection, and user-friendly error messages
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export interface ErrorInfo {
  message: string;
  isRetryable: boolean;
  isNetworkError: boolean;
  originalError?: unknown;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry non-retryable errors
      const errorInfo = analyzeError(error);
      if (!errorInfo.isRetryable) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError;
}

/**
 * Analyze an error to determine its type and whether it's retryable
 */
export function analyzeError(error: unknown): ErrorInfo {
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    
    switch (supabaseError.code) {
      case 'PGRST116': // No rows returned
        return {
          message: 'The requested item was not found.',
          isRetryable: false,
          isNetworkError: false,
          originalError: error
        };
      
      case 'PGRST301': // Connection timeout
      case 'PGRST302': // Connection failed
        return {
          message: 'Connection timeout. Please check your internet connection and try again.',
          isRetryable: true,
          isNetworkError: true,
          originalError: error
        };
      
      default:
        return {
          message: 'A database error occurred. Please try again later.',
          isRetryable: true,
          isNetworkError: false,
          originalError: error
        };
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      isRetryable: true,
      isNetworkError: true,
      originalError: error
    };
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      message: 'Request timed out. Please try again.',
      isRetryable: true,
      isNetworkError: true,
      originalError: error
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred. Please try again.',
      isRetryable: true,
      isNetworkError: false,
      originalError: error
    };
  }

  // Fallback for unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    isNetworkError: false,
    originalError: error
  };
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Create a promise that rejects after a timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Enhanced Supabase query wrapper with error handling and retry logic
 */
export async function executeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 10000, ...retryOptions } = options;

  return retryWithBackoff(async () => {
    const queryPromise = queryFn();
    const { data, error } = await withTimeout(queryPromise, timeout);

    if (error) {
      throw error;
    }

    if (data === null) {
      throw new Error('No data returned from query');
    }

    return data;
  }, retryOptions);
}