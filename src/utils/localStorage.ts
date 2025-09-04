/**
 * Safe localStorage utilities to prevent demo crashes from corrupted browser data
 */

export interface SafeParseOptions {
  fallback?: any;
  logErrors?: boolean;
}

/**
 * Safely parse JSON from localStorage with fallback and error handling
 */
export function safeParseJSON<T = any>(key: string, options: SafeParseOptions = {}): T | null {
  const { fallback = null, logErrors = true } = options;

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return fallback;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    if (logErrors) {
      console.warn(`[safeParseJSON] Failed to parse localStorage key "${key}":`, error);
      console.warn(`[safeParseJSON] Corrupted data:`, localStorage.getItem(key));
    }

    // Clear corrupted data to prevent future issues
    try {
      localStorage.removeItem(key);
      if (logErrors) {
        console.warn(`[safeParseJSON] Cleared corrupted localStorage key "${key}"`);
      }
    } catch (clearError) {
      if (logErrors) {
        console.error(
          `[safeParseJSON] Could not clear corrupted localStorage key "${key}":`,
          clearError
        );
      }
    }

    return fallback;
  }
}

/**
 * Safely set JSON data to localStorage with error handling
 */
export function safeSetJSON(key: string, data: any, logErrors = true): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    if (logErrors) {
      console.error(`[safeSetJSON] Failed to set localStorage key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Safely get raw string from localStorage
 */
export function safeGetItem(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn(`[safeGetItem] Failed to get localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely remove item from localStorage
 */
export function safeRemoveItem(key: string, logErrors = true): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    if (logErrors) {
      console.error(`[safeRemoveItem] Failed to remove localStorage key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Check if localStorage is available (for SSR compatibility)
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = 'localStorage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
