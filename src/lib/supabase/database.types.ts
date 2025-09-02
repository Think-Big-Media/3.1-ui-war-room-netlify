/**
 * Supabase Database Types
 * Generated types for War Room database schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Core entities from technical specification
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      users: {
        Row: {
          id: string;
          email: string;
          organization_id: string | null;
          role: 'user' | 'admin' | 'platform_admin';
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          preferences: Json | null;
          last_login: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          organization_id?: string | null;
          role?: 'user' | 'admin' | 'platform_admin';
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json | null;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          organization_id?: string | null;
          role?: 'user' | 'admin' | 'platform_admin';
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json | null;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      volunteers: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          address: Json | null;
          skills: string[] | null;
          availability: Json | null;
          status: 'active' | 'inactive' | 'pending';
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          address?: Json | null;
          skills?: string[] | null;
          availability?: Json | null;
          status?: 'active' | 'inactive' | 'pending';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          address?: Json | null;
          skills?: string[] | null;
          availability?: Json | null;
          status?: 'active' | 'inactive' | 'pending';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          event_type: 'meeting' | 'rally' | 'fundraiser' | 'volunteer' | 'other';
          start_date: string;
          end_date: string | null;
          location: Json | null;
          capacity: number | null;
          status: 'draft' | 'published' | 'cancelled' | 'completed';
          settings: Json | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          event_type?: 'meeting' | 'rally' | 'fundraiser' | 'volunteer' | 'other';
          start_date: string;
          end_date?: string | null;
          location?: Json | null;
          capacity?: number | null;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          settings?: Json | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          event_type?: 'meeting' | 'rally' | 'fundraiser' | 'volunteer' | 'other';
          start_date?: string;
          end_date?: string | null;
          location?: Json | null;
          capacity?: number | null;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          settings?: Json | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      contacts: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          address: Json | null;
          tags: string[] | null;
          custom_fields: Json | null;
          status: 'active' | 'inactive';
          source: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          address?: Json | null;
          tags?: string[] | null;
          custom_fields?: Json | null;
          status?: 'active' | 'inactive';
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: Json | null;
          tags?: string[] | null;
          custom_fields?: Json | null;
          status?: 'active' | 'inactive';
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      documents: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_type: string;
          file_size: number;
          metadata: Json | null;
          vector_embeddings: number[] | null;
          tags: string[] | null;
          status: 'processing' | 'ready' | 'error';
          uploaded_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_type: string;
          file_size: number;
          metadata?: Json | null;
          vector_embeddings?: number[] | null;
          tags?: string[] | null;
          status?: 'processing' | 'ready' | 'error';
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: string;
          file_size?: number;
          metadata?: Json | null;
          vector_embeddings?: number[] | null;
          tags?: string[] | null;
          status?: 'processing' | 'ready' | 'error';
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };

      donations: {
        Row: {
          id: string;
          organization_id: string;
          donor_contact_id: string | null;
          amount: number;
          currency: string;
          payment_method: string;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_reference: string | null;
          donation_type: 'one-time' | 'recurring';
          campaign_id: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          donor_contact_id?: string | null;
          amount: number;
          currency?: string;
          payment_method: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_reference?: string | null;
          donation_type?: 'one-time' | 'recurring';
          campaign_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          donor_contact_id?: string | null;
          amount?: number;
          currency?: string;
          payment_method?: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_reference?: string | null;
          donation_type?: 'one-time' | 'recurring';
          campaign_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };

    Views: {
      // Add views here as needed
    };

    Functions: {
      // Add function signatures here
    };

    Enums: {
      user_role: 'user' | 'admin' | 'platform_admin';
      volunteer_status: 'active' | 'inactive' | 'pending';
      event_type: 'meeting' | 'rally' | 'fundraiser' | 'volunteer' | 'other';
      event_status: 'draft' | 'published' | 'cancelled' | 'completed';
      document_status: 'processing' | 'ready' | 'error';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      donation_type: 'one-time' | 'recurring';
    };
  };
}
