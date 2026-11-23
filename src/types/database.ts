export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          household_id: string
          id: string
          life_item_id: string | null
          mime_type: string
          sha256_hash: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          household_id: string
          id?: string
          life_item_id?: string | null
          mime_type: string
          sha256_hash: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          household_id?: string
          id?: string
          life_item_id?: string | null
          mime_type?: string
          sha256_hash?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_life_item_id_fkey"
            columns: ["life_item_id"]
            isOneToOne: false
            referencedRelation: "life_items"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          invited_email: string
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at: string
          household_id: string
          id?: string
          invited_by: string
          invited_email: string
          role?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          invited_email?: string
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          household_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          household_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          billing_customer_id: string | null
          billing_provider: string
          billing_subscription_id: string | null
          created_at: string
          current_period_end: string | null
          data_retention_months: number
          feature_overrides: Json
          id: string
          name: string
          plan_tier: string
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_customer_id?: string | null
          billing_provider?: string
          billing_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          data_retention_months?: number
          feature_overrides?: Json
          id?: string
          name?: string
          plan_tier?: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_customer_id?: string | null
          billing_provider?: string
          billing_subscription_id?: string | null
          created_at?: string
          current_period_end?: string | null
          data_retention_months?: number
          feature_overrides?: Json
          id?: string
          name?: string
          plan_tier?: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ingestion_audit_log: {
        Row: {
          channel: string
          created_at: string
          household_id: string
          id: string
          outcome: string
          parser_used: string
          processing_ms: number | null
          raw_body_discarded: boolean
        }
        Insert: {
          channel: string
          created_at?: string
          household_id: string
          id?: string
          outcome: string
          parser_used: string
          processing_ms?: number | null
          raw_body_discarded?: boolean
        }
        Update: {
          channel?: string
          created_at?: string
          household_id?: string
          id?: string
          outcome?: string
          parser_used?: string
          processing_ms?: number | null
          raw_body_discarded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_audit_log_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_sources: {
        Row: {
          address_or_handle: string | null
          channel: string
          created_at: string
          household_id: string
          id: string
          is_default: boolean
          last_received_at: string | null
          status: string
          sync_metadata: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          address_or_handle?: string | null
          channel: string
          created_at?: string
          household_id: string
          id?: string
          is_default?: boolean
          last_received_at?: string | null
          status?: string
          sync_metadata?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          address_or_handle?: string | null
          channel?: string
          created_at?: string
          household_id?: string
          id?: string
          is_default?: boolean
          last_received_at?: string | null
          status?: string
          sync_metadata?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_sources_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_actions: {
        Row: {
          action_type: string
          created_at: string
          draft_body: string | null
          draft_subject: string | null
          executed_at: string | null
          external_url: string | null
          household_id: string
          id: string
          life_item_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          draft_body?: string | null
          draft_subject?: string | null
          executed_at?: string | null
          external_url?: string | null
          household_id: string
          id?: string
          life_item_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          draft_body?: string | null
          draft_subject?: string | null
          executed_at?: string | null
          external_url?: string | null
          household_id?: string
          id?: string
          life_item_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_actions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_actions_life_item_id_fkey"
            columns: ["life_item_id"]
            isOneToOne: false
            referencedRelation: "life_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_price_history: {
        Row: {
          amount_minor: number
          billed_on: string
          created_at: string
          currency: string
          household_id: string
          id: string
          life_item_id: string
        }
        Insert: {
          amount_minor: number
          billed_on: string
          created_at?: string
          currency: string
          household_id: string
          id?: string
          life_item_id: string
        }
        Update: {
          amount_minor?: number
          billed_on?: string
          created_at?: string
          currency?: string
          household_id?: string
          id?: string
          life_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_price_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_price_history_life_item_id_fkey"
            columns: ["life_item_id"]
            isOneToOne: false
            referencedRelation: "life_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_reminders: {
        Row: {
          channel: string
          created_at: string
          household_id: string
          id: string
          life_item_id: string
          sent_at: string | null
          status: string
          trigger_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          household_id: string
          id?: string
          life_item_id: string
          sent_at?: string | null
          status?: string
          trigger_at: string
        }
        Update: {
          channel?: string
          created_at?: string
          household_id?: string
          id?: string
          life_item_id?: string
          sent_at?: string | null
          status?: string
          trigger_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_reminders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_reminders_life_item_id_fkey"
            columns: ["life_item_id"]
            isOneToOne: false
            referencedRelation: "life_items"
            referencedColumns: ["id"]
          },
        ]
      }
      life_items: {
        Row: {
          action_date: string | null
          amount_minor: number | null
          assigned_to: string | null
          billing_cycle: string | null
          confidence_score: number
          created_at: string
          currency: string | null
          dedupe_key: string
          deleted_at: string | null
          expiry_date: string | null
          household_id: string
          id: string
          item_type: string
          merchant_domain: string | null
          merchant_name: string
          metadata: Json
          search_vector: unknown
          snooze_until: string | null
          source_channel: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          action_date?: string | null
          amount_minor?: number | null
          assigned_to?: string | null
          billing_cycle?: string | null
          confidence_score?: number
          created_at?: string
          currency?: string | null
          dedupe_key: string
          deleted_at?: string | null
          expiry_date?: string | null
          household_id: string
          id?: string
          item_type: string
          merchant_domain?: string | null
          merchant_name: string
          metadata?: Json
          search_vector?: unknown
          snooze_until?: string | null
          source_channel: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          action_date?: string | null
          amount_minor?: number | null
          assigned_to?: string | null
          billing_cycle?: string | null
          confidence_score?: number
          created_at?: string
          currency?: string | null
          dedupe_key?: string
          deleted_at?: string | null
          expiry_date?: string | null
          household_id?: string
          id?: string
          item_type?: string
          merchant_domain?: string | null
          merchant_name?: string
          metadata?: Json
          search_vector?: unknown
          snooze_until?: string | null
          source_channel?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_endpoints: {
        Row: {
          channel: string
          created_at: string
          endpoint_data: Json
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          endpoint_data: Json
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          endpoint_data?: Json
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_endpoints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_requests: {
        Row: {
          completed_at: string | null
          expires_at: string | null
          household_id: string
          id: string
          request_type: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          expires_at?: string | null
          household_id: string
          id?: string
          request_type: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          expires_at?: string | null
          household_id?: string
          id?: string
          request_type?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_requests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_digest_time: string
          default_currency: string
          email: string
          full_name: string | null
          id: string
          locale: string
          onboarding_completed_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_digest_time?: string
          default_currency?: string
          email: string
          full_name?: string | null
          id: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_digest_time?: string
          default_currency?: string
          email?: string
          full_name?: string | null
          id?: string
          locale?: string
          onboarding_completed_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          granted_at: string
          id: string
          ip_hash: string | null
          policy_version: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          granted_at?: string
          id?: string
          ip_hash?: string | null
          policy_version: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          granted_at?: string
          id?: string
          ip_hash?: string | null
          policy_version?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
