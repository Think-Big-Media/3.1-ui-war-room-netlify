/**
 * Encore Endpoint Adapter
 * Maps 3.0 UI endpoint expectations to 4.0 Encore backend reality
 * This adapter ensures seamless integration without modifying all service files
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Endpoint mapping from 3.0 UI expectations to 4.0 backend reality
const ENDPOINT_MAP: Record<string, string> = {
  // Authentication endpoints (will be added via Leap.new)
  '/api/v1/auth/login': '/api/v1/auth/login',
  '/api/v1/auth/register': '/api/v1/auth/register',
  '/api/v1/auth/me': '/api/v1/auth/me',
  '/api/v1/auth/logout': '/api/v1/auth/logout',
  '/api/v1/auth/refresh': '/api/v1/auth/refresh',

  // Mentionlytics endpoints - Map to actual 4.0 backend paths
  '/api/v1/mentionlytics/mentions': '/mentions',
  '/api/v1/mentionlytics/sentiment': '/mentions/sentiment-analysis',
  '/api/v1/mentionlytics/mentions/geo': '/mentions/geo',
  '/api/v1/mentionlytics/influencers': '/mentions/influencers',
  '/api/v1/mentionlytics/trending': '/mentions/trends',
  '/api/v1/mentionlytics/share-of-voice': '/mentions/share-of-voice',
  '/api/v1/mentionlytics/feed': '/mentions/feed',

  // Google Ads endpoints (will be added via Leap.new)
  '/api/v1/google-ads/campaigns': '/google-ads/campaigns',
  '/api/v1/google-ads/performance': '/google-ads/performance',
  '/api/v1/google-ads/insights': '/google-ads/insights',

  // Meta endpoints (will be added via Leap.new)
  '/api/v1/meta/campaigns': '/meta/campaigns',
  '/api/v1/meta/adsets': '/meta/adsets',
  '/api/v1/meta/insights': '/meta/insights',

  // Monitoring endpoints - Already exist in 4.0
  '/api/v1/monitoring/crisis': '/monitoring/crisis/active',
  '/api/v1/monitoring/history': '/monitoring/crisis/history',

  // Intelligence endpoints - Already exist in 4.0
  '/api/v1/intelligence/dashboard': '/intelligence/dashboard',
  '/api/v1/intelligence/summary': '/intelligence/executive-summary',

  // Alerts endpoints - Already exist in 4.0
  '/api/v1/alerts/list': '/alerts',
  '/api/v1/alerts/create': '/alerts',
  '/api/v1/alerts/resolve': '/alerts/resolve',

  // WebSocket endpoint
  '/api/v1/ws': '/websocket/connect',
};

/**
 * Transform a 3.0 UI endpoint to 4.0 backend endpoint
 */
export function mapEndpoint(originalEndpoint: string): string {
  // Check if we have a mapping for this endpoint
  const mappedEndpoint = ENDPOINT_MAP[originalEndpoint];
  
  if (mappedEndpoint) {
    console.log(`[Encore Adapter] Mapping ${originalEndpoint} → ${mappedEndpoint}`);
    return mappedEndpoint;
  }

  // If no mapping exists, return original (for unmapped endpoints)
  console.warn(`[Encore Adapter] No mapping for ${originalEndpoint}, using original`);
  return originalEndpoint;
}

/**
 * Axios interceptor to automatically map endpoints
 */
export function setupEncoreAdapter(axiosInstance: typeof axios) {
  // Request interceptor to map endpoints
  axiosInstance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      if (config.url) {
        // Extract the path from the full URL
        const url = new URL(config.url, 'http://dummy.com');
        const originalPath = url.pathname;
        
        // Map the endpoint
        const mappedPath = mapEndpoint(originalPath);
        
        // Update the URL if mapping occurred
        if (mappedPath !== originalPath) {
          url.pathname = mappedPath;
          config.url = url.toString().replace('http://dummy.com', '');
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      // If we get a 404, it might be because the endpoint doesn't exist yet
      if (error.response?.status === 404) {
        const endpoint = originalRequest.url;
        console.error(`[Encore Adapter] Endpoint not found: ${endpoint}`);
        console.error(`[Encore Adapter] This endpoint may need to be implemented in Leap.new`);
        
        // Check if mock mode is enabled
        const useMockData = localStorage.getItem('VITE_USE_MOCK_DATA') === 'true';
        if (useMockData) {
          console.log('[Encore Adapter] Falling back to mock data');
          // The service layer should handle mock data fallback
        }
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Helper to check if an endpoint is available in 4.0 backend
 */
export function isEndpointAvailable(endpoint: string): boolean {
  const mapped = mapEndpoint(endpoint);
  
  // These endpoints are confirmed to exist in 4.0 backend
  const availableEndpoints = [
    '/mentions',
    '/mentions/sentiment-analysis',
    '/mentions/trends',
    '/monitoring/crisis/active',
    '/monitoring/crisis/history',
    '/intelligence/dashboard',
    '/intelligence/executive-summary',
    '/alerts',
    '/websocket/connect',
  ];

  return availableEndpoints.includes(mapped);
}

/**
 * Get implementation status for UI display
 */
export function getEndpointStatus(): Record<string, 'available' | 'pending' | 'mock'> {
  const status: Record<string, 'available' | 'pending' | 'mock'> = {};

  for (const [uiEndpoint, backendEndpoint] of Object.entries(ENDPOINT_MAP)) {
    if (isEndpointAvailable(backendEndpoint)) {
      status[uiEndpoint] = 'available';
    } else if (uiEndpoint.includes('auth') || uiEndpoint.includes('google-ads') || uiEndpoint.includes('meta')) {
      status[uiEndpoint] = 'pending'; // Will be implemented via Leap.new
    } else {
      status[uiEndpoint] = 'mock'; // Using mock data
    }
  }

  return status;
}

// Export for use in services
export default {
  mapEndpoint,
  setupEncoreAdapter,
  isEndpointAvailable,
  getEndpointStatus,
  ENDPOINT_MAP,
};