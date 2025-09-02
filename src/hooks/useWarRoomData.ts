/**
 * War Room Data Hooks
 * Custom React hooks for using the DataService
 *
 * CTO Pattern: Centralize data fetching logic in hooks
 * This keeps components clean and makes testing easier
 */

import { useState, useEffect, useCallback } from 'react';
import { dataService, User, Volunteer, Event, Donation } from '../services/DataService';

// Generic hook for async data operations
function useAsyncData<T>(asyncFunction: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for users
export function useUsers() {
  return useAsyncData(() => dataService.getUsers());
}

export function useUser(id: string) {
  return useAsyncData(() => dataService.getUser(id), [id]);
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await dataService.createUser(userData);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create user'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createUser, loading, error };
}

// Hook for volunteers
export function useVolunteers() {
  return useAsyncData(() => dataService.getVolunteers());
}

export function useVolunteer(id: string) {
  return useAsyncData(() => dataService.getVolunteer(id), [id]);
}

export function useCreateVolunteer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createVolunteer = useCallback(async (data: Partial<Volunteer>) => {
    try {
      setLoading(true);
      setError(null);
      const newVolunteer = await dataService.createVolunteer(data);
      return newVolunteer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create volunteer'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVolunteer, loading, error };
}

// Hook for events
export function useEvents() {
  return useAsyncData(() => dataService.getEvents());
}

export function useEvent(id: string) {
  return useAsyncData(() => dataService.getEvent(id), [id]);
}

export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createEvent = useCallback(async (eventData: Partial<Event>) => {
    try {
      setLoading(true);
      setError(null);
      const newEvent = await dataService.createEvent(eventData);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create event'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEvent, loading, error };
}

// Hook for donations
export function useDonations() {
  return useAsyncData(() => dataService.getDonations());
}

export function useCreateDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createDonation = useCallback(async (data: Partial<Donation>) => {
    try {
      setLoading(true);
      setError(null);
      const newDonation = await dataService.createDonation(data);
      return newDonation;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create donation'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createDonation, loading, error };
}

// Combined dashboard hook
export function useDashboardData() {
  const users = useUsers();
  const volunteers = useVolunteers();
  const events = useEvents();
  const donations = useDonations();

  const loading = users.loading || volunteers.loading || events.loading || donations.loading;
  const error = users.error || volunteers.error || events.error || donations.error;

  return {
    users: users.data || [],
    volunteers: volunteers.data || [],
    events: events.data || [],
    donations: donations.data || [],
    loading,
    error,
    refetch: async () => {
      await Promise.all([
        users.refetch(),
        volunteers.refetch(),
        events.refetch(),
        donations.refetch(),
      ]);
    },
  };
}

// Hook for checking if using mock data
export function useDataMode() {
  const isMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  return {
    isMock,
    mode: isMock ? 'MOCK' : 'LIVE',
    apiUrl: import.meta.env.VITE_API_URL,
  };
}
