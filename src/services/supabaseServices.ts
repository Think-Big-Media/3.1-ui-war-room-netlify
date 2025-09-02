/**
 * Supabase Services - Replaces FastAPI endpoints
 * Provides data access layer using Supabase client
 */

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

// Type aliases for convenience
type Tables = Database['public']['Tables'];
type Volunteer = Tables['volunteers']['Row'];
type VolunteerInsert = Tables['volunteers']['Insert'];
type VolunteerUpdate = Tables['volunteers']['Update'];
type Event = Tables['events']['Row'];
type EventInsert = Tables['events']['Insert'];
type EventUpdate = Tables['events']['Update'];
type Contact = Tables['contacts']['Row'];
type ContactInsert = Tables['contacts']['Insert'];
type ContactUpdate = Tables['contacts']['Update'];
type Document = Tables['documents']['Row'];
type DocumentInsert = Tables['documents']['Insert'];
type DocumentUpdate = Tables['documents']['Update'];
type Donation = Tables['donations']['Row'];
type DonationInsert = Tables['donations']['Insert'];

/**
 * Volunteer Services
 */
export const volunteerService = {
  // Get all volunteers for organization
  async getVolunteers(organizationId: string): Promise<Volunteer[]> {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  },

  // Get volunteer by ID
  async getVolunteer(id: string): Promise<Volunteer | null> {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Create volunteer
  async createVolunteer(volunteer: VolunteerInsert): Promise<Volunteer> {
    const { data, error } = await supabase.from('volunteers').insert(volunteer).select().single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Update volunteer
  async updateVolunteer(id: string, updates: VolunteerUpdate): Promise<Volunteer> {
    const { data, error } = await supabase
      .from('volunteers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Delete volunteer (soft delete)
  async deleteVolunteer(id: string): Promise<void> {
    const { error } = await supabase
      .from('volunteers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};

/**
 * Event Services
 */
export const eventService = {
  // Get all events for organization
  async getEvents(organizationId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('start_date', { ascending: true });

    if (error) {
      throw error;
    }
    return data || [];
  },

  // Get event by ID
  async getEvent(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Create event
  async createEvent(event: EventInsert): Promise<Event> {
    const { data, error } = await supabase.from('events').insert(event).select().single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Update event
  async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Delete event (soft delete)
  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};

/**
 * Contact Services
 */
export const contactService = {
  // Get all contacts for organization
  async getContacts(organizationId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  },

  // Get contact by ID
  async getContact(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Create contact
  async createContact(contact: ContactInsert): Promise<Contact> {
    const { data, error } = await supabase.from('contacts').insert(contact).select().single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Update contact
  async updateContact(id: string, updates: ContactUpdate): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Delete contact (soft delete)
  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};

/**
 * Document Services
 */
export const documentService = {
  // Get all documents for organization
  async getDocuments(organizationId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  },

  // Get document by ID
  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Create document record (file upload handled separately)
  async createDocument(document: DocumentInsert): Promise<Document> {
    const { data, error } = await supabase.from('documents').insert(document).select().single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Update document
  async updateDocument(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Delete document (soft delete)
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};

/**
 * Donation Services
 */
export const donationService = {
  // Get all donations for organization
  async getDonations(organizationId: string): Promise<Donation[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  },

  // Get donation by ID
  async getDonation(id: string): Promise<Donation | null> {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Create donation
  async createDonation(donation: DonationInsert): Promise<Donation> {
    const { data, error } = await supabase.from('donations').insert(donation).select().single();

    if (error) {
      throw error;
    }
    return data;
  },
};

/**
 * File Upload Services (Supabase Storage)
 */
export const fileService = {
  // Upload file to Supabase Storage
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ): Promise<{ path: string; publicUrl: string }> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return { path: data.path, publicUrl };
  },

  // Delete file from Supabase Storage
  async deleteFile(bucket: string, paths: string[]): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }
  },

  // Get signed URL for private files
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }
    return data.signedUrl;
  },
};

/**
 * Real-time Subscriptions
 */
export const realtimeService = {
  // Subscribe to table changes
  subscribeToTable<T>(
    table: keyof Tables,
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
  ) {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        callback
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },

  // Subscribe to organization-specific changes
  subscribeToOrganization(organizationId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`org_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteers',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },
};

// Export everything as a single services object
export const supabaseServices = {
  volunteers: volunteerService,
  events: eventService,
  contacts: contactService,
  documents: documentService,
  donations: donationService,
  files: fileService,
  realtime: realtimeService,
};
