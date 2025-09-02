/**
 * Encore API Configuration
 * Connects frontend to Leap.new deployed backend
 */

const ENCORE_API_URL = import.meta.env.VITE_ENCORE_API_URL || 'http://localhost:4000';

/**
 * Encore API client for making requests to backend services
 */
export class EncoreAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = ENCORE_API_URL;
    // Get token from localStorage if exists
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Make authenticated API request
   */
  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * GET request
   */
  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  /**
   * POST request
   */
  post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

// Export singleton instance
export const encoreAPI = new EncoreAPIClient();

// Service-specific endpoints
export const encoreEndpoints = {
  // Campaigns Service
  campaigns: {
    list: () => encoreAPI.get('/campaigns/list'),
    create: (data: any) => encoreAPI.post('/campaigns/create', data),
    get: (id: string) => encoreAPI.get(`/campaigns/get/${id}`),
    update: (id: string, data: any) => encoreAPI.put(`/campaigns/update/${id}`, data),
    delete: (id: string) => encoreAPI.delete(`/campaigns/delete/${id}`),
  },
  
  // Monitoring Service
  monitoring: {
    stream: () => `${ENCORE_API_URL}/monitoring/stream`, // WebSocket endpoint
    mentions: () => encoreAPI.get('/mentions/list'),
    crisis: () => encoreAPI.get('/monitoring/crisis'),
  },
  
  // Alerts Service
  alerts: {
    send: (data: any) => encoreAPI.post('/alerts', data),
    list: () => encoreAPI.get('/alerts/list'),
  },
  
  // Performance Service
  performance: {
    metrics: () => encoreAPI.get('/performance/metrics'),
    report: (data: any) => encoreAPI.post('/performance/report', data),
  },
  
  // Notifications Service
  notifications: {
    send: (data: any) => encoreAPI.post('/notifications/send', data),
    list: () => encoreAPI.get('/notifications/list'),
  },
  
  // Staff Service (Auth)
  staff: {
    login: (data: any) => encoreAPI.post('/staff/login', data),
    register: (data: any) => encoreAPI.post('/staff/register', data),
    profile: () => encoreAPI.get('/staff/profile'),
    refresh: () => encoreAPI.post('/staff/refresh'),
  },
};

// Export types
export interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  metrics?: any;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export interface Mention {
  id: string;
  source: string;
  content: string;
  sentiment: string;
  reach: number;
  timestamp: string;
}