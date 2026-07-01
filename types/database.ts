/**
 * Database types for InsureTrack (single-tenant v1).
 *
 * Hand-authored to match supabase/migrations/001_initial.sql. Once a live
 * Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PolicyType =
  | "auto"
  | "home"
  | "life"
  | "health"
  | "commercial";
export type PolicyStatus = "active" | "renewed" | "lapsed" | "cancelled";
export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";
export type LeadSource = "referral" | "facebook" | "website" | "cold";
export type TriggerType =
  | "renewal_30"
  | "renewal_60"
  | "renewal_90"
  | "new_lead"
  | "new_client";
export type Channel = "email" | "sms";
export type EnrollmentStatus = "active" | "completed" | "cancelled";
export type MessageStatus = "sent" | "delivered" | "failed";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          agency_name: string | null;
          phone: string | null;
          timezone: string | null;
          stripe_customer_id: string | null;
          subscription_status: SubscriptionStatus | null;
          trial_ends_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          agency_name?: string | null;
          phone?: string | null;
          timezone?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          trial_ends_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          agent_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          tags: string[] | null;
          sms_opted_out: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          sms_opted_out?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      policies: {
        Row: {
          id: string;
          agent_id: string;
          client_id: string;
          policy_type: PolicyType;
          carrier: string | null;
          policy_number: string | null;
          premium: number | null;
          renewal_date: string;
          status: PolicyStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          client_id: string;
          policy_type: PolicyType;
          carrier?: string | null;
          policy_number?: string | null;
          premium?: number | null;
          renewal_date: string;
          status?: PolicyStatus | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["policies"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          agent_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          source: LeadSource | null;
          interested_in: string[] | null;
          status: LeadStatus | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          source?: LeadSource | null;
          interested_in?: string[] | null;
          status?: LeadStatus | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      sequences: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          trigger_type: TriggerType;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          trigger_type: TriggerType;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sequences"]["Insert"]>;
        Relationships: [];
      };
      sequence_steps: {
        Row: {
          id: string;
          sequence_id: string;
          step_order: number;
          channel: Channel;
          delay_days: number | null;
          subject: string | null;
          body: string;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          step_order: number;
          channel: Channel;
          delay_days?: number | null;
          subject?: string | null;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["sequence_steps"]["Insert"]
        >;
        Relationships: [];
      };
      sequence_enrollments: {
        Row: {
          id: string;
          sequence_id: string;
          client_id: string | null;
          lead_id: string | null;
          current_step: number | null;
          status: EnrollmentStatus | null;
          enrolled_at: string | null;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          client_id?: string | null;
          lead_id?: string | null;
          current_step?: number | null;
          status?: EnrollmentStatus | null;
          enrolled_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["sequence_enrollments"]["Insert"]
        >;
        Relationships: [];
      };
      messages_log: {
        Row: {
          id: string;
          agent_id: string;
          client_id: string | null;
          lead_id: string | null;
          enrollment_id: string | null;
          channel: Channel | null;
          subject: string | null;
          body: string | null;
          status: MessageStatus | null;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          client_id?: string | null;
          lead_id?: string | null;
          enrollment_id?: string | null;
          channel?: Channel | null;
          subject?: string | null;
          body?: string | null;
          status?: MessageStatus | null;
          sent_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["messages_log"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
