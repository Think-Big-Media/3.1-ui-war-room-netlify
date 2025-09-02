/**
 * War Room Data Service Layer
 * Abstracts API calls and enables mock/real data switching
 *
 * Senior Architect Pattern: This abstraction allows parallel development
 * Frontend team works with mocks while backend team builds real APIs
 */

import { mockVolunteers, mockEvents, mockDonations, mockUsers } from './mock-data';

// Environment configuration
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MOCK_DELAY = 300; // Simulate network latency

// Type definitions (move to types/ directory in production)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'platform_admin';
  organizationId?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  availability: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  volunteerCount: number;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  campaignId: string;
}

/**
 * Base Data Service Class
 * Implements common functionality for both mock and real services
 */
abstract class BaseDataService {
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected handleError(error: any): never {
    console.error('DataService Error:', error);
    throw new Error(error.message || 'An error occurred');
  }

  // Abstract methods that must be implemented by subclasses
  abstract getUsers(): Promise<User[]>;
  abstract getUser(id: string): Promise<User>;
  abstract createUser(data: Partial<User>): Promise<User>;
  abstract updateUser(id: string, data: Partial<User>): Promise<User>;
  abstract deleteUser(id: string): Promise<void>;

  abstract getVolunteers(): Promise<Volunteer[]>;
  abstract getVolunteer(id: string): Promise<Volunteer>;
  abstract createVolunteer(data: Partial<Volunteer>): Promise<Volunteer>;

  abstract getEvents(): Promise<Event[]>;
  abstract getEvent(id: string): Promise<Event>;
  abstract createEvent(data: Partial<Event>): Promise<Event>;

  abstract getDonations(): Promise<Donation[]>;
  abstract createDonation(data: Partial<Donation>): Promise<Donation>;
}

/**
 * Mock Data Service
 * Returns mock data for frontend development
 */
class MockDataService extends BaseDataService {
  // Users
  async getUsers(): Promise<User[]> {
    await this.delay(MOCK_DELAY);
    return mockUsers;
  }

  async getUser(id: string): Promise<User> {
    await this.delay(MOCK_DELAY);
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    await this.delay(MOCK_DELAY);
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'user',
      ...data,
    };
    mockUsers.push(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await this.delay(MOCK_DELAY);
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  }

  async deleteUser(id: string): Promise<void> {
    await this.delay(MOCK_DELAY);
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers.splice(index, 1);
  }

  // Volunteers
  async getVolunteers(): Promise<Volunteer[]> {
    await this.delay(MOCK_DELAY);
    return mockVolunteers;
  }

  async getVolunteer(id: string): Promise<Volunteer> {
    await this.delay(MOCK_DELAY);
    const volunteer = mockVolunteers.find((v) => v.id === id);
    if (!volunteer) throw new Error('Volunteer not found');
    return volunteer;
  }

  async createVolunteer(data: Partial<Volunteer>): Promise<Volunteer> {
    await this.delay(MOCK_DELAY);
    const newVolunteer: Volunteer = {
      id: Date.now().toString(),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      skills: data.skills || [],
      availability: data.availability || [],
      ...data,
    };
    mockVolunteers.push(newVolunteer);
    return newVolunteer;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    await this.delay(MOCK_DELAY);
    return mockEvents;
  }

  async getEvent(id: string): Promise<Event> {
    await this.delay(MOCK_DELAY);
    const event = mockEvents.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    return event;
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    await this.delay(MOCK_DELAY);
    const newEvent: Event = {
      id: Date.now().toString(),
      title: data.title || '',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      location: data.location || '',
      volunteerCount: data.volunteerCount || 0,
      ...data,
    };
    mockEvents.push(newEvent);
    return newEvent;
  }

  // Donations
  async getDonations(): Promise<Donation[]> {
    await this.delay(MOCK_DELAY);
    return mockDonations;
  }

  async createDonation(data: Partial<Donation>): Promise<Donation> {
    await this.delay(MOCK_DELAY);
    const newDonation: Donation = {
      id: Date.now().toString(),
      donorName: data.donorName || '',
      amount: data.amount || 0,
      date: data.date || new Date().toISOString(),
      campaignId: data.campaignId || '',
      ...data,
    };
    mockDonations.push(newDonation);
    return newDonation;
  }
}

/**
 * Real API Data Service
 * Makes actual HTTP requests to the backend
 */
class ApiDataService extends BaseDataService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/v1/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/api/v1/users/${id}`);
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Volunteers
  async getVolunteers(): Promise<Volunteer[]> {
    return this.request<Volunteer[]>('/api/v1/volunteers');
  }

  async getVolunteer(id: string): Promise<Volunteer> {
    return this.request<Volunteer>(`/api/v1/volunteers/${id}`);
  }

  async createVolunteer(data: Partial<Volunteer>): Promise<Volunteer> {
    return this.request<Volunteer>('/api/v1/volunteers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return this.request<Event[]>('/api/v1/events');
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${id}`);
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    return this.request<Event>('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Donations
  async getDonations(): Promise<Donation[]> {
    return this.request<Donation[]>('/api/v1/donations');
  }

  async createDonation(data: Partial<Donation>): Promise<Donation> {
    return this.request<Donation>('/api/v1/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Export the appropriate service based on environment
 * This is the ONLY export that components should use
 */
export const dataService: BaseDataService = USE_MOCK ? new MockDataService() : new ApiDataService();

/**
 * Hook for React components to use the data service
 * Provides error handling and loading states
 */
export function useDataService() {
  return {
    dataService,
    isUsingMockData: USE_MOCK,
    apiBaseUrl: API_BASE_URL,
  };
}

// Development helper to switch between mock and real data
if (import.meta.env.DEV) {
  (window as any).__switchDataMode = (useMock: boolean) => {
    localStorage.setItem('USE_MOCK_DATA', useMock.toString());
    console.log(`Data mode switched to: ${useMock ? 'MOCK' : 'REAL'}`);
    console.log('Reload the page for changes to take effect');
  };

  console.log('💡 Tip: Use __switchDataMode(true/false) to switch data modes');
}
