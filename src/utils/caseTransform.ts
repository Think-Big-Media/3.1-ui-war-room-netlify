/**
 * Case Transformation Utilities
 * CRITICAL: Ensures consistent data contract between frontend (snake_case) and backend (camelCase)
 * Chairman's Mandate: Prevent "Case of the Crashing App" gotcha
 */

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Deep transform object keys from camelCase to snake_case
 */
export const transformKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = transformKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

/**
 * Deep transform object keys from snake_case to camelCase
 */
export const transformKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformKeysToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

/**
 * API Response Transformer
 * Automatically converts backend camelCase to frontend snake_case
 */
export const transformApiResponse = <T = any>(response: any): T => {
  // If backend sends camelCase, convert to snake_case for frontend
  return transformKeysToSnakeCase(response) as T;
};

/**
 * API Request Transformer
 * Converts frontend snake_case to backend camelCase if needed
 */
export const transformApiRequest = <T = any>(data: any): T => {
  // If backend expects camelCase, convert from snake_case
  return transformKeysToCamelCase(data) as T;
};