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
      account_blocks: {
        Row: {
          blocked_at: string
          reason: string
          user_id: string
        }
        Insert: {
          blocked_at?: string
          reason: string
          user_id: string
        }
        Update: {
          blocked_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      account_programs: {
        Row: {
          category: string
          completed_at: string
          member_kind: string
          occupation: string
          points_awarded: boolean
          referral_free_until: string | null
          referral_rewarded_at: string | null
          reminder_consent: boolean
          sharing_active: boolean
          sharing_started_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string
          member_kind: string
          occupation: string
          points_awarded?: boolean
          referral_free_until?: string | null
          referral_rewarded_at?: string | null
          reminder_consent?: boolean
          sharing_active?: boolean
          sharing_started_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string
          member_kind?: string
          occupation?: string
          points_awarded?: boolean
          referral_free_until?: string | null
          referral_rewarded_at?: string | null
          reminder_consent?: boolean
          sharing_active?: boolean
          sharing_started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      additional_phone_recipients: {
        Row: {
          created_at: string
          id: string
          owner_consent: boolean
          owner_id: string
          phone: string
          recipient_consent_at: string | null
          removed_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          owner_consent?: boolean
          owner_id: string
          phone: string
          recipient_consent_at?: string | null
          removed_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          owner_consent?: boolean
          owner_id?: string
          phone?: string
          recipient_consent_at?: string | null
          removed_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_phone_recipients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      additional_recipient_payments: {
        Row: {
          amount: number
          id: string
          message_id: string
          payer_id: string
          recipient_id: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          amount?: number
          id?: string
          message_id: string
          payer_id: string
          recipient_id: string
          reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          amount?: number
          id?: string
          message_id?: string
          payer_id?: string
          recipient_id?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_recipient_payments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_recipient_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_recipient_payments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "additional_phone_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_notices: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_call_signals: {
        Row: {
          call_id: string
          created_at: string
          id: number
          kind: string
          payload: Json
          receiver_id: string
          sender_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: never
          kind: string
          payload?: Json
          receiver_id: string
          sender_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: never
          kind?: string
          payload?: Json
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_call_signals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "app_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      app_calls: {
        Row: {
          callee_id: string
          caller_id: string
          created_at: string
          ended_at: string | null
          id: string
          video: boolean
        }
        Insert: {
          callee_id: string
          caller_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          video?: boolean
        }
        Update: {
          callee_id?: string
          caller_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          video?: boolean
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      approximate_route_alerts: {
        Row: {
          created_at: string
          id: string
          notification_id: string | null
          post_id: string
          processed_at: string | null
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id?: string | null
          post_id: string
          processed_at?: string | null
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string | null
          post_id?: string
          processed_at?: string | null
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approximate_route_alerts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "vehicle_route_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_board_chat_pairs: {
        Row: {
          interest_id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          interest_id: string
          member_id: string
          owner_id: string
        }
        Update: {
          interest_id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_board_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bell_board_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_group_bookings: {
        Row: {
          created_at: string
          group_id: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_group_bookings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bell_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bell_group_bookings_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_group_members: {
        Row: {
          group_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bell_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bell_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_group_messages: {
        Row: {
          body: string
          created_at: string
          group_id: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          group_id: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          group_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bell_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bell_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_groups: {
        Row: {
          created_at: string
          entry_key: string
          expires_at: string
          id: string
          owner_id: string
          section: string
        }
        Insert: {
          created_at?: string
          entry_key: string
          expires_at?: string
          id?: string
          owner_id: string
          section: string
        }
        Update: {
          created_at?: string
          entry_key?: string
          expires_at?: string
          id?: string
          owner_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_referral_board_notices: {
        Row: {
          day: string
          notification_id: string | null
          user_id: string
        }
        Insert: {
          day: string
          notification_id?: string | null
          user_id: string
        }
        Update: {
          day?: string
          notification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_referral_board_notices_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_referral_board_notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deferred_listing_notices: {
        Row: {
          available_at: string
          created_at: string
          id: string
          matched_post_id: string | null
          message: string
          notice_mode: string
          post_id: string | null
          processed_at: string | null
          user_id: string
        }
        Insert: {
          available_at: string
          created_at?: string
          id?: string
          matched_post_id?: string | null
          message: string
          notice_mode: string
          post_id?: string | null
          processed_at?: string | null
          user_id: string
        }
        Update: {
          available_at?: string
          created_at?: string
          id?: string
          matched_post_id?: string | null
          message?: string
          notice_mode?: string
          post_id?: string | null
          processed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deferred_listing_notices_matched_post_id_fkey"
            columns: ["matched_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deferred_listing_notices_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deferred_listing_notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directed_bell_usage: {
        Row: {
          last_rang_at: string | null
          recipient_id: string
          rings: number
          sender_id: string
        }
        Insert: {
          last_rang_at?: string | null
          recipient_id: string
          rings?: number
          sender_id: string
        }
        Update: {
          last_rang_at?: string | null
          recipient_id?: string
          rings?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "directed_bell_usage_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directed_bell_usage_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_categories: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          normalized_name: string | null
          section: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          normalized_name?: string | null
          section: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          normalized_name?: string | null
          section?: string
        }
        Relationships: []
      }
      evidence_content_registry: {
        Row: {
          created_at: string
          hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_content_registry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_membership_months: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          source: string
          starts_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          source: string
          starts_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          source?: string
          starts_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_membership_months_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_work_entries: {
        Row: {
          area: string
          category: string
          created_at: string
          id: string
          section: string
          user_id: string
        }
        Insert: {
          area: string
          category: string
          created_at?: string
          id?: string
          section: string
          user_id: string
        }
        Update: {
          area?: string
          category?: string
          created_at?: string
          id?: string
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_work_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_work_interests: {
        Row: {
          area: string
          category: string
          created_at: string
          entry_id: string
          id: string
          section: string
          source: string
          user_id: string
        }
        Insert: {
          area: string
          category: string
          created_at?: string
          entry_id: string
          id?: string
          section: string
          source: string
          user_id: string
        }
        Update: {
          area?: string
          category?: string
          created_at?: string
          entry_id?: string
          id?: string
          section?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_work_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_work_notice_queue: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          notification_id: string
          processed_at: string | null
          source: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          notification_id?: string
          processed_at?: string | null
          source: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          notification_id?: string
          processed_at?: string | null
          source?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_work_notice_queue_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "free_work_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_work_notice_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_work_pairs: {
        Row: {
          created_at: string
          member_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_work_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_work_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_entitlements: {
        Row: {
          ends_at: string
          id: string
          payment_id: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at: string
          id?: string
          payment_id: string
          starts_at: string
          user_id: string
        }
        Update: {
          ends_at?: string
          id?: string
          payment_id?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_entitlements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "membership_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_uses: {
        Row: {
          created_at: string
          entitlement_id: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement_id: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement_id?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_uses_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "job_post_entitlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      main_bell_actions: {
        Row: {
          source: string
          target_id: string
          user_id: string
        }
        Insert: {
          source: string
          target_id: string
          user_id: string
        }
        Update: {
          source?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "main_bell_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      main_bell_runs: {
        Row: {
          attempts: number
          available_at: string
          completed_at: string | null
          last_error: string | null
          requested_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          last_error?: string | null
          requested_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          last_error?: string | null
          requested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "main_bell_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_access: {
        Row: {
          ends_at: string
          feature_scope: string
          granted_by: string | null
          id: string
          request_id: string | null
          revoked_at: string | null
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at?: string
          feature_scope?: string
          granted_by?: string | null
          id?: string
          request_id?: string | null
          revoked_at?: string | null
          source: string
          starts_at?: string
          user_id: string
        }
        Update: {
          ends_at?: string
          feature_scope?: string
          granted_by?: string | null
          id?: string
          request_id?: string | null
          revoked_at?: string | null
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_access_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "membership_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_payments: {
        Row: {
          admin_note: string
          amount: number
          created_at: string
          id: string
          membership_type: string
          referral_numbers: string[]
          reviewed_at: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          amount?: number
          created_at?: string
          id?: string
          membership_type?: string
          referral_numbers?: string[]
          reviewed_at?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          admin_note?: string
          amount?: number
          created_at?: string
          id?: string
          membership_type?: string
          referral_numbers?: string[]
          reviewed_at?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_requests: {
        Row: {
          amount: number
          id: string
          message_id: string
          note: string
          payer_id: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
          vehicle_plan_months: number
        }
        Insert: {
          amount: number
          id?: string
          message_id: string
          note?: string
          payer_id: string
          reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          vehicle_plan_months?: number
        }
        Update: {
          amount?: number
          id?: string
          message_id?: string
          note?: string
          payer_id?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          vehicle_plan_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_requests_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          chat_phone: string
          created_at: string
          id: string
          image_path: string
          is_auto: boolean
          needs_admin: boolean
          post_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          chat_phone?: string
          created_at?: string
          id?: string
          image_path?: string
          is_auto?: boolean
          needs_admin?: boolean
          post_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          chat_phone?: string
          created_at?: string
          id?: string
          image_path?: string
          is_auto?: boolean
          needs_admin?: boolean
          post_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_post_periods: {
        Row: {
          ends_at: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at: string
          starts_at: string
          user_id: string
        }
        Update: {
          ends_at?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_post_periods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_post_usage: {
        Row: {
          post_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          post_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          post_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_post_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          daily_limit: number | null
          enabled: boolean
          quiet_end: string | null
          quiet_start: string | null
          timezone: string
          user_id: string
        }
        Insert: {
          daily_limit?: number | null
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          user_id: string
        }
        Update: {
          daily_limit?: number | null
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bell_actor: string | null
          bell_demand: string | null
          created_at: string
          id: string
          is_read: boolean
          matched_post_id: string | null
          message: string
          post_id: string | null
          user_id: string
          vehicle_bell: boolean
        }
        Insert: {
          bell_actor?: string | null
          bell_demand?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          matched_post_id?: string | null
          message: string
          post_id?: string | null
          user_id: string
          vehicle_bell?: boolean
        }
        Update: {
          bell_actor?: string | null
          bell_demand?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          matched_post_id?: string | null
          message?: string
          post_id?: string | null
          user_id?: string
          vehicle_bell?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notifications_matched_post_id_fkey"
            columns: ["matched_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      payment_image_checks: {
        Row: {
          created_at: string
          entered_upi: string
          match_status: string
          message_id: string
          observed_upi: string
          observed_utr: string
          payer_id: string
        }
        Insert: {
          created_at?: string
          entered_upi: string
          match_status: string
          message_id: string
          observed_upi: string
          observed_utr: string
          payer_id: string
        }
        Update: {
          created_at?: string
          entered_upi?: string
          match_status?: string
          message_id?: string
          observed_upi?: string
          observed_utr?: string
          payer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_image_checks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_image_checks_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_entry_requests: {
        Row: {
          account_id: string | null
          created_at: string
          device_hash: string
          id: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          device_hash: string
          id?: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          device_hash?: string
          id?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      post_bell_interests: {
        Row: {
          area: string
          created_at: string
          id: string
          need: string
          post_id: string
          section: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          need: string
          post_id: string
          section: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          need?: string
          post_id?: string
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bell_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_chat_pairs: {
        Row: {
          created_at: string
          member_id: string
          owner_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_chat_pairs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sharing_evidence: {
        Row: {
          admin_note: string
          content_hashes: string[]
          created_at: string
          expires_at: string
          id: string
          paths: string[]
          post_id: string
          purpose: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          content_hashes?: string[]
          created_at?: string
          expires_at?: string
          id?: string
          paths: string[]
          post_id: string
          purpose: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          content_hashes?: string[]
          created_at?: string
          expires_at?: string
          id?: string
          paths?: string[]
          post_id?: string
          purpose?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sharing_evidence_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_sharing_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          area_scope: string
          capacity_tons: number | null
          category: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          district: string
          driver_name: string
          from_place: string | null
          goods_type: string | null
          id: string
          job_expires_at: string | null
          kind: string
          location: string | null
          module: string
          public_brand: string
          public_photo: string
          salary: string | null
          service_type: string
          show_contact: boolean
          skill: string | null
          state: string
          status: string
          title: string
          to_place: string | null
          trip_date: string | null
          user_id: string
          vehicle_name: string
          vehicle_number: string
          vehicle_type: string | null
          visibility_notified_at: string | null
          visible_after: string | null
        }
        Insert: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          driver_name?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          job_expires_at?: string | null
          kind: string
          location?: string | null
          module: string
          public_brand?: string
          public_photo?: string
          salary?: string | null
          service_type?: string
          show_contact?: boolean
          skill?: string | null
          state?: string
          status?: string
          title?: string
          to_place?: string | null
          trip_date?: string | null
          user_id: string
          vehicle_name?: string
          vehicle_number?: string
          vehicle_type?: string | null
          visibility_notified_at?: string | null
          visible_after?: string | null
        }
        Update: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          driver_name?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          job_expires_at?: string | null
          kind?: string
          location?: string | null
          module?: string
          public_brand?: string
          public_photo?: string
          salary?: string | null
          service_type?: string
          show_contact?: boolean
          skill?: string | null
          state?: string
          status?: string
          title?: string
          to_place?: string | null
          trip_date?: string | null
          user_id?: string
          vehicle_name?: string
          vehicle_number?: string
          vehicle_type?: string | null
          visibility_notified_at?: string | null
          visible_after?: string | null
        }
        Relationships: []
      }
      prime99_payments: {
        Row: {
          alerts_start_at: string | null
          amount: number
          ends_at: string | null
          id: string
          payable_amount: number
          payment_purpose: string
          plan_months: number
          received_at: string | null
          reference: string
          review_note: string
          reviewed_by: string | null
          status: string
          submitted_at: string
          used_post_id: string | null
          user_id: string
        }
        Insert: {
          alerts_start_at?: string | null
          amount?: number
          ends_at?: string | null
          id?: string
          payable_amount?: number
          payment_purpose?: string
          plan_months?: number
          received_at?: string | null
          reference: string
          review_note?: string
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          used_post_id?: string | null
          user_id: string
        }
        Update: {
          alerts_start_at?: string | null
          amount?: number
          ends_at?: string | null
          id?: string
          payable_amount?: number
          payment_purpose?: string
          plan_months?: number
          received_at?: string | null
          reference?: string
          review_note?: string
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          used_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prime99_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_phone_changes: {
        Row: {
          changed_at: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          user_id: string
        }
        Update: {
          changed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_phone_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bell_activated_at: string | null
          created_at: string
          free_months: number
          full_name: string
          id: string
          is_prime: boolean
          location: string
          phone: string
          prime_until: string | null
          public_brand: string
          public_photo: string
          referral_code: string | null
          referred_at: string | null
          referred_by: string | null
          show_public: boolean
        }
        Insert: {
          bell_activated_at?: string | null
          created_at?: string
          free_months?: number
          full_name?: string
          id: string
          is_prime?: boolean
          location?: string
          phone?: string
          prime_until?: string | null
          public_brand?: string
          public_photo?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
          show_public?: boolean
        }
        Update: {
          bell_activated_at?: string | null
          created_at?: string
          free_months?: number
          full_name?: string
          id?: string
          is_prime?: boolean
          location?: string
          phone?: string
          prime_until?: string | null
          public_brand?: string
          public_photo?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
          show_public?: boolean
        }
        Relationships: []
      }
      program_evidence: {
        Row: {
          created_at: string
          expires_at: string
          hashes: string[]
          id: string
          paths: string[]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hashes: string[]
          id?: string
          paths: string[]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hashes?: string[]
          id?: string
          paths?: string[]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_reminders: {
        Row: {
          day: string
          notification_id: string | null
          user_id: string
        }
        Insert: {
          day: string
          notification_id?: string | null
          user_id: string
        }
        Update: {
          day?: string
          notification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_reminders_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_contact_batches: {
        Row: {
          created_at: string
          id: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contact_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_contacts: {
        Row: {
          batch_id: string
          consent_confirmed: boolean
          id: string
          mobile: string
          service: string
          town: string
          user_id: string
        }
        Insert: {
          batch_id: string
          consent_confirmed: boolean
          id?: string
          mobile: string
          service: string
          town: string
          user_id: string
        }
        Update: {
          batch_id?: string
          consent_confirmed?: boolean
          id?: string
          mobile?: string
          service?: string
          town?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contacts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "provider_contact_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_deliveries: {
        Row: {
          attempts: number
          available_at: string
          device_id: string
          id: string
          notification_id: string
          provider_status: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          device_id: string
          id?: string
          notification_id: string
          provider_status?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          device_id?: string
          id?: string
          notification_id?: string
          provider_status?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_deliveries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "push_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          id: string
          sound_enabled: boolean
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sound_enabled?: boolean
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sound_enabled?: boolean
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_board_consent: {
        Row: {
          display_name: string
          district: string
          district_group: string
          photo_consent: boolean
          published: boolean
          region: string
          user_id: string
        }
        Insert: {
          display_name?: string
          district?: string
          district_group?: string
          photo_consent?: boolean
          published?: boolean
          region?: string
          user_id: string
        }
        Update: {
          display_name?: string
          district?: string
          district_group?: string
          photo_consent?: boolean
          published?: boolean
          region?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_board_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_cash_receipts: {
        Row: {
          amount_paise: number
          confirmed_by: string
          id: string
          received_at: string
          reference: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          confirmed_by: string
          id?: string
          received_at?: string
          reference: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          confirmed_by?: string
          id?: string
          received_at?: string
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_cash_receipts_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_cash_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_cash_rewards: {
        Row: {
          amount_paise: number
          created_at: string
          receipt_id: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          receipt_id: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_cash_rewards_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_cash_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_invitee_rewards: {
        Row: {
          amount_paise: number
          created_at: string
          receipt_id: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          receipt_id: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_invitee_rewards_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_invitee_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_prize_payouts: {
        Row: {
          paid_at: string
          receipt_id: string
          recorded_by: string
          reference: string
        }
        Insert: {
          paid_at?: string
          receipt_id: string
          recorded_by: string
          reference: string
        }
        Update: {
          paid_at?: string
          receipt_id?: string
          recorded_by?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_prize_payouts_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_rewards"
            referencedColumns: ["receipt_id"]
          },
        ]
      }
      referral_vip_campaign: {
        Row: {
          details_at: string
          event_label: string
          id: boolean
          started_at: string
        }
        Insert: {
          details_at?: string
          event_label?: string
          id?: boolean
          started_at?: string
        }
        Update: {
          details_at?: string
          event_label?: string
          id?: boolean
          started_at?: string
        }
        Relationships: []
      }
      referral_vip_joins: {
        Row: {
          joined_at: string
          joined_user: string
          referrer_id: string
        }
        Insert: {
          joined_at?: string
          joined_user: string
          referrer_id: string
        }
        Update: {
          joined_at?: string
          joined_user?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_vip_joins_joined_user_fkey"
            columns: ["joined_user"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_vip_joins_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_vip_notice_state: {
        Row: {
          signature: string
          user_id: string
        }
        Insert: {
          signature: string
          user_id: string
        }
        Update: {
          signature?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_vip_notice_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_wallets: {
        Row: {
          points: number
          user_id: string
        }
        Insert: {
          points?: number
          user_id: string
        }
        Update: {
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_chat_pairs: {
        Row: {
          created_at: string
          member_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_chat_presence: {
        Row: {
          member_id: string
          member_opened: boolean
          owner_id: string
          owner_opened: boolean
        }
        Insert: {
          member_id: string
          member_opened?: boolean
          owner_id: string
          owner_opened?: boolean
        }
        Update: {
          member_id?: string
          member_opened?: boolean
          owner_id?: string
          owner_opened?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_chat_presence_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_chat_presence_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_likes: {
        Row: {
          profile_id: string
          user_id: string
        }
        Insert: {
          profile_id: string
          user_id: string
        }
        Update: {
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_photos: {
        Row: {
          caption: string
          id: string
          path: string
          user_id: string
        }
        Insert: {
          caption?: string
          id?: string
          path: string
          user_id: string
        }
        Update: {
          caption?: string
          id?: string
          path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_priority_applications: {
        Row: {
          applied_at: string
          area: string
          category: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          area: string
          category: string
          user_id: string
        }
        Update: {
          applied_at?: string
          area?: string
          category?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_priority_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_profiles: {
        Row: {
          bio: string
          category: string
          display_name: string
          photo_path: string
          published: boolean
          service: string
          town: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string
          category?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          town?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          category?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          town?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_pairs: {
        Row: {
          member_id: string
          owner_id: string
          request_id: string
        }
        Insert: {
          member_id: string
          owner_id: string
          request_id: string
        }
        Update: {
          member_id?: string
          owner_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_pairs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          area: string
          created_at: string
          id: string
          service: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          service: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          service?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          profile_id: string
          rating: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          profile_id: string
          rating: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          profile_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_views: {
        Row: {
          day: string
          profile_id: string
          visitor_hash: string
        }
        Insert: {
          day?: string
          profile_id: string
          visitor_hash: string
        }
        Update: {
          day?: string
          profile_id?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sharing_claims: {
        Row: {
          admin_note: string
          created_at: string
          evidence_paths: string[]
          id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          created_at?: string
          evidence_paths: string[]
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          created_at?: string
          evidence_paths?: string[]
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharing_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_cleanup_queue: {
        Row: {
          bucket: string
          created_at: string
          id: string
          prefix: string
          processed_at: string | null
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          prefix: string
          processed_at?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          prefix?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_availability: {
        Row: {
          available: boolean
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_availability_requests: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_requests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_availability_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_bell_demands: {
        Row: {
          category: string
          display_name: string
          from_place: string
          id: string
          post_id: string | null
          rang_at: string
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          category: string
          display_name: string
          from_place: string
          id?: string
          post_id?: string | null
          rang_at?: string
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          category?: string
          display_name?: string
          from_place?: string
          id?: string
          post_id?: string | null
          rang_at?: string
          to_place?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bell_demands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_demand_chat_pairs: {
        Row: {
          board_rang_at: string | null
          created_at: string
          demand_id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          board_rang_at?: string | null
          created_at?: string
          demand_id: string
          member_id: string
          owner_id: string
        }
        Update: {
          board_rang_at?: string | null
          created_at?: string
          demand_id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_demand_chat_pairs_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_bell_demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_demand_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_demand_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_post_points: {
        Row: {
          created_at: string
          from_lat: number
          from_lng: number
          post_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Insert: {
          created_at?: string
          from_lat: number
          from_lng: number
          post_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Update: {
          created_at?: string
          from_lat?: number
          from_lng?: number
          post_id?: string
          to_lat?: number
          to_lng?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_post_points_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_post_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_route_points: {
        Row: {
          from_lat: number
          from_lng: number
          route_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Insert: {
          from_lat: number
          from_lng: number
          route_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Update: {
          from_lat?: number
          from_lng?: number
          route_id?: string
          to_lat?: number
          to_lng?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_route_points_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: true
            referencedRelation: "vehicle_route_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_route_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_route_preferences: {
        Row: {
          capacity_tons: number | null
          created_at: string
          enabled: boolean
          from_place: string
          id: string
          radius_percent: number
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          capacity_tons?: number | null
          created_at?: string
          enabled?: boolean
          from_place: string
          id?: string
          radius_percent?: number
          to_place: string
          user_id: string
          vehicle_type?: string
        }
        Update: {
          capacity_tons?: number | null
          created_at?: string
          enabled?: boolean
          from_place?: string
          id?: string
          radius_percent?: number
          to_place?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_route_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_winners: {
        Row: {
          created_at: string
          display_name: string
          joins: number
          paid: number
          percent: number
          photo_path: string
          region: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          display_name: string
          joins: number
          paid: number
          percent: number
          photo_path: string
          region: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          display_name?: string
          joins?: number
          paid?: number
          percent?: number
          photo_path?: string
          region?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_winners_user_id_fkey"
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
      account_allowed: { Args: { _uid: string }; Returns: boolean }
      account_id_for_login_phone: { Args: { _phone: string }; Returns: string }
      activate_program_sharing: {
        Args: {
          _hashes: string[]
          _paths: string[]
          _post?: string
          _user: string
        }
        Returns: string
      }
      add_additional_phone_recipient: {
        Args: { _consent: boolean; _phone: string }
        Returns: string
      }
      add_bell_group_member: {
        Args: {
          _key: string
          _member: string
          _owner: string
          _section: string
        }
        Returns: string
      }
      add_discovery_category: {
        Args: { _creator: string; _name: string; _section: string }
        Returns: string
      }
      admin_activity_overview: { Args: never; Returns: Json }
      admin_broadcast: { Args: { _message: string }; Returns: number }
      admin_evidence_sender: { Args: { _id: string }; Returns: string }
      admin_manage_account: {
        Args: { _action: string; _user: string }
        Returns: string
      }
      admin_membership_access: {
        Args: { _enable: boolean; _user: string }
        Returns: undefined
      }
      admin_referral_eligibility: { Args: never; Returns: Json }
      admin_remove_account_data: { Args: { _user: string }; Returns: undefined }
      admin_remove_bell_row: {
        Args: { _id: string; _section: string; _source: string }
        Returns: boolean
      }
      admin_vehicle_records: { Args: { _offset?: number }; Returns: Json }
      admin_video_notice: {
        Args: { _message: string; _url: string }
        Returns: number
      }
      app_call_dial_number: { Args: { _other: string }; Returns: string }
      apply_referral: { Args: { _code: string }; Returns: boolean }
      apply_service_priority: {
        Args: { _area: string; _category: string }
        Returns: undefined
      }
      auto_confirm_membership_evidence: {
        Args: { _id: string }
        Returns: undefined
      }
      begin_app_call: {
        Args: { _other: string; _video: boolean }
        Returns: string
      }
      bell_route_within_radius: {
        Args: { _actor: string; _demand: string; _post: string }
        Returns: boolean
      }
      block_confirmed_content: {
        Args: { _reason: string; _user: string }
        Returns: undefined
      }
      can_call_member: { Args: { _other: string }; Returns: boolean }
      can_notify: { Args: { _uid: string }; Returns: boolean }
      can_post_chat: {
        Args: { _other?: string; _post?: string }
        Returns: boolean
      }
      chat_peer_identity: {
        Args: { _other: string }
        Returns: {
          full_name: string
          phone: string
          photo: string
        }[]
      }
      check_my_new_mobile: { Args: { _phone: string }; Returns: boolean }
      claim_push_deliveries: {
        Args: never
        Returns: {
          attempts: number
          available_at: string
          device_id: string
          id: string
          notification_id: string
          provider_status: number | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "push_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_bell_groups: { Args: never; Returns: undefined }
      complete_account_profile: {
        Args: {
          _category: string
          _kind: string
          _location: string
          _name: string
          _occupation: string
        }
        Returns: string
      }
      configure_referral_event: { Args: { _label: string }; Returns: undefined }
      confirm_edited_payment_image: {
        Args: { _message: string }
        Returns: undefined
      }
      confirm_referral_cash: {
        Args: { _amount_paise: number; _reference: string; _user: string }
        Returns: string
      }
      confirm_referral_join: {
        Args: { _code: string; _phone: string }
        Returns: boolean
      }
      consent_additional_phone_recipient: {
        Args: { _id: string }
        Returns: undefined
      }
      consume_directed_bell: {
        Args: { _target: string; _vehicle: boolean }
        Returns: undefined
      }
      consume_post_slot: {
        Args: { _id: string; _user: string }
        Returns: undefined
      }
      dispatch_approximate_route_alerts: { Args: never; Returns: number }
      dispatch_daily_referral_board: { Args: never; Returns: number }
      dispatch_free_work_notices: { Args: never; Returns: number }
      dispatch_main_bell_runs: { Args: never; Returns: number }
      dispatch_program_requests: { Args: never; Returns: number }
      dispatch_vehicle_availability: { Args: never; Returns: number }
      dispatch_visible_post_matches: { Args: never; Returns: number }
      ensure_my_referral_code: { Args: never; Returns: string }
      first_free_chat_available: { Args: { _other: string }; Returns: boolean }
      follow_vehicle_route: { Args: { _post: string }; Returns: string }
      free_work_category: { Args: { v: string }; Returns: string }
      free_work_chat: { Args: { _other: string }; Returns: boolean }
      free_work_notice_allowed: { Args: { _user: string }; Returns: boolean }
      free_work_opposite: { Args: { v: string }; Returns: string }
      get_post_details: { Args: { _post: string }; Returns: Json }
      grant_free_membership_month: {
        Args: { _source: string; _user: string }
        Returns: string
      }
      group_phone_text: { Args: { _body: string }; Returns: boolean }
      has_goods_membership: { Args: { _user?: string }; Returns: boolean }
      has_paid_bell: { Args: { _user: string }; Returns: boolean }
      has_prime99: { Args: { _user: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_work_membership: { Args: { _user: string }; Returns: boolean }
      hold_membership_evidence_for_admin: {
        Args: { _id: string }
        Returns: undefined
      }
      in_bell_group: { Args: { _group: string }; Returns: boolean }
      incoming_bell_reply_allowed: {
        Args: { _other: string; _post?: string }
        Returns: boolean
      }
      is_goods_post: {
        Args: { _post: Database["public"]["Tables"]["posts"]["Row"] }
        Returns: boolean
      }
      join_free_work: {
        Args: { _area: string; _category: string; _section: string }
        Returns: string
      }
      list_anonymous_bell_board: {
        Args: { _section: string }
        Returns: {
          area: string
          id: string
          need: string
          source: string
        }[]
      }
      list_area_bell_board: {
        Args: { _area: string; _section: string }
        Returns: {
          area: string
          id: string
          need: string
          source: string
        }[]
      }
      list_free_work: {
        Args: { _area?: string; _category?: string; _section: string }
        Returns: {
          area: string
          category: string
          id: string
          source: string
        }[]
      }
      list_free_work_interests: {
        Args: { _area?: string; _category?: string; _section: string }
        Returns: {
          area: string
          category: string
          id: string
          source: string
        }[]
      }
      list_service_priority: {
        Args: { _area: string; _category?: string }
        Returns: {
          area: string
          category: string
          id: string
          priority: number
          source: string
        }[]
      }
      list_vehicle_bell_demands: {
        Args: never
        Returns: {
          category: string
          display_name: string
          from_place: string
          id: string
          post_id: string | null
          rang_at: string
          to_place: string
          user_id: string
          vehicle_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vehicle_bell_demands"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_free_work_category_bell: {
        Args: { _entry: string }
        Returns: undefined
      }
      mark_my_vehicle_booked: { Args: { _post: string }; Returns: undefined }
      my_additional_phone_recipients: {
        Args: never
        Returns: {
          approved_at: string
          created_at: string
          id: string
          payment_status: string
          phone: string
          recipient_consent_at: string
          verified_at: string
        }[]
      }
      my_additional_recipient_requests: {
        Args: never
        Returns: {
          created_at: string
          id: string
          owner_id: string
          phone: string
        }[]
      }
      my_bell_groups: {
        Args: never
        Returns: {
          expires_at: string
          id: string
          is_owner: boolean
          members: number
          section: string
        }[]
      }
      my_free_work_bell_notices: {
        Args: never
        Returns: {
          area: string
          category: string
          notification_id: string
          ringer: string
          section: string
        }[]
      }
      my_goods_membership: { Args: never; Returns: boolean }
      my_incoming_bell_contacts: {
        Args: { _post?: string; _section: string }
        Returns: {
          area: string
          full_name: string
          id: string
          need: string
          other_id: string
          phone: string
          photo: string
          post_id: string
          source: string
        }[]
      }
      my_incoming_bells: {
        Args: { _post?: string; _section: string }
        Returns: {
          area: string
          id: string
          need: string
          post_id: string
          source: string
        }[]
      }
      my_manageable_additions: {
        Args: never
        Returns: {
          id: string
          section: string
          source: string
        }[]
      }
      my_membership_price: { Args: never; Returns: number }
      my_notification_quota: { Args: never; Returns: Json }
      my_payment_verification_pending: { Args: never; Returns: boolean }
      my_phone_change_available: { Args: never; Returns: boolean }
      my_post_quota99: { Args: never; Returns: Json }
      my_prime99: { Args: never; Returns: Json }
      my_profile_access_ready: { Args: never; Returns: boolean }
      my_program_referrals: { Args: never; Returns: Json }
      my_referral_payment_requests: {
        Args: never
        Returns: {
          joined_at: string
          joined_user: string
        }[]
      }
      my_referral_stats: { Args: never; Returns: Json }
      my_referral_vip: { Args: never; Returns: Json }
      next_notice_open: {
        Args: { _at?: string; _zone?: string }
        Returns: string
      }
      notice_window_open: {
        Args: { _at?: string; _zone?: string }
        Returns: boolean
      }
      notification_delivery_allowed: {
        Args: { _notice: string; _user: string }
        Returns: boolean
      }
      notify_matches: { Args: { _post_id: string }; Returns: number }
      notify_nearby_vehicles: { Args: { _post: string }; Returns: number }
      open_anonymous_bell_chat: {
        Args: { _id: string; _source: string }
        Returns: string
      }
      open_free_work_chat: {
        Args: { _id: string; _section: string; _source: string }
        Returns: string
      }
      open_incoming_bell_chat: {
        Args: { _id: string; _section: string; _source: string }
        Returns: {
          other_id: string
          post_id: string
        }[]
      }
      open_service_chat: { Args: { _other: string }; Returns: boolean }
      open_vehicle_chat: { Args: { _post: string }; Returns: string }
      open_vehicle_demand_chat: { Args: { _demand: string }; Returns: string }
      paid_alert_ready: { Args: { _user: string }; Returns: boolean }
      post_alert_eligible: { Args: { _user: string }; Returns: boolean }
      post_listing_visible: {
        Args: { _at?: string; p: Database["public"]["Tables"]["posts"]["Row"] }
        Returns: boolean
      }
      posts_match_area: {
        Args: {
          a: Database["public"]["Tables"]["posts"]["Row"]
          b: Database["public"]["Tables"]["posts"]["Row"]
        }
        Returns: boolean
      }
      process_program_referral: { Args: { _user: string }; Returns: number }
      profile_ready_for_actions: { Args: { _user: string }; Returns: boolean }
      public_competition_areas: { Args: never; Returns: Json }
      public_referral_vip_board: { Args: never; Returns: Json }
      public_service_directory: { Args: never; Returns: Json }
      public_service_requests: {
        Args: { _area: string }
        Returns: {
          area: string
          id: string
          service: string
        }[]
      }
      public_stats: { Args: never; Returns: Json }
      record_evidence_hashes: {
        Args: { _claim: string; _hashes: string[] }
        Returns: undefined
      }
      record_referral_prize_paid: {
        Args: { _receipt: string; _reference: string }
        Returns: undefined
      }
      record_service_view: {
        Args: { _id: string; _visitor: string }
        Returns: undefined
      }
      redeem_reward_points: { Args: never; Returns: string }
      referral_payment_stats: {
        Args: { _from?: string; _to?: string }
        Returns: {
          eligible: boolean
          joins: number
          paid: number
          percent: number
          user_id: string
        }[]
      }
      referral_target: { Args: { _d: string }; Returns: number }
      referral_vip_ranks: {
        Args: never
        Returns: {
          joins: number
          rank_no: number
          user_id: string
        }[]
      }
      referral_vip_slots: { Args: never; Returns: Json }
      refresh_referral_vip_notices: { Args: never; Returns: number }
      register_membership_evidence: {
        Args: {
          _amount: number
          _message: string
          _payer: string
          _reference: string
          _user: string
        }
        Returns: string
      }
      remove_my_addition: {
        Args: { _id: string; _section: string; _source: string }
        Returns: boolean
      }
      request_bell_group_booking: { Args: { _group: string }; Returns: string }
      request_own_bell_notice: { Args: { _device: string }; Returns: string }
      request_password_reset: { Args: { _phone: string }; Returns: undefined }
      request_phone_entry: {
        Args: { _hash: string; _phone: string }
        Returns: string
      }
      request_service: {
        Args: { _area: string; _service: string }
        Returns: string
      }
      request_vehicle_availability: { Args: { _post: string }; Returns: string }
      respond_service_request: { Args: { _request: string }; Returns: string }
      review_additional_recipient_payment: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_bell_group_booking: {
        Args: { _accept: boolean; _booking: string }
        Returns: undefined
      }
      review_membership: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_membership_evidence: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_phone_entry: {
        Args: { _account?: string; _approve: boolean; _id: string }
        Returns: undefined
      }
      review_post_evidence: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_post_evidence_with_reason: {
        Args: { _approve: boolean; _id: string; _note: string }
        Returns: undefined
      }
      review_prime99: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_provider_contacts: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_sharing_claim: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      ring_free_work: {
        Args: { _id: string; _section: string; _source: string }
        Returns: string
      }
      ring_my_main_bell: { Args: never; Returns: number }
      ring_post: { Args: { _post_id: string }; Returns: string }
      ring_service: { Args: { _owner: string }; Returns: string }
      ring_vehicle_board: { Args: { _demand: string }; Returns: string }
      ring_vehicle_demand: {
        Args: {
          _category?: string
          _from?: string
          _name_consent?: boolean
          _post?: string
          _to?: string
          _vehicle?: string
        }
        Returns: string
      }
      route_endpoints_match: {
        Args: {
          _a: number
          _b: number
          _c: number
          _d: number
          _e: number
          _f: number
          _g: number
          _h: number
        }
        Returns: boolean
      }
      run_main_bell_batch: { Args: { _user: string }; Returns: number }
      save_detailed_vehicle_route: {
        Args: { _from: string; _to: string; _tons: number; _vehicle: string }
        Returns: string
      }
      save_service_listing: {
        Args: {
          _category: string
          _name: string
          _published: boolean
          _service: string
          _town: string
        }
        Returns: undefined
      }
      save_service_profile: {
        Args: {
          _bio: string
          _name: string
          _photo: string
          _published: boolean
          _service: string
        }
        Returns: undefined
      }
      save_typed_vehicle_route_points: {
        Args: {
          _from: string
          _from_lat: number
          _from_lng: number
          _to: string
          _to_lat: number
          _to_lng: number
          _tons: number
          _vehicle: string
        }
        Returns: string
      }
      save_vehicle_post_points: {
        Args: {
          _from_lat: number
          _from_lng: number
          _post: string
          _to_lat: number
          _to_lng: number
        }
        Returns: undefined
      }
      save_vehicle_route: {
        Args: { _from: string; _to: string }
        Returns: string
      }
      save_vehicle_route_points: {
        Args: {
          _from: string
          _from_lat: number
          _from_lng: number
          _to: string
          _to_lat: number
          _to_lng: number
        }
        Returns: string
      }
      select_weekly_winners: { Args: never; Returns: number }
      send_app_call_signal: {
        Args: { _call: string; _kind: string; _payload?: Json }
        Returns: undefined
      }
      send_bell_group_message: {
        Args: { _body: string; _group: string }
        Returns: string
      }
      send_referral_reminders: { Args: never; Returns: number }
      service_occupation: { Args: { _value: string }; Returns: string }
      service_priority_position: {
        Args: { _area: string; _user: string }
        Returns: number
      }
      service_profile_data: { Args: { _id: string }; Returns: Json }
      set_program_reminders: { Args: { _enabled: boolean }; Returns: undefined }
      set_vehicle_available: { Args: { _post: string }; Returns: undefined }
      straight_line_km: {
        Args: { a_lat: number; a_lng: number; b_lat: number; b_lng: number }
        Returns: number
      }
      submit_additional_recipient_screenshot: {
        Args: { _path: string; _recipient: string; _reference: string }
        Returns: string
      }
      submit_membership_screenshot: {
        Args: {
          _amount: number
          _beneficiary: string
          _path: string
          _reference: string
        }
        Returns: string
      }
      submit_post_evidence: {
        Args: { _paths: string[]; _post: string; _purpose: string }
        Returns: string
      }
      submit_provider_contacts: { Args: { _rows: Json }; Returns: string }
      submit_verified_post_evidence: {
        Args: {
          _hashes: string[]
          _paths: string[]
          _post: string
          _purpose: string
          _user: string
        }
        Returns: string
      }
      subscription_post_limit: { Args: { _user: string }; Returns: number }
      subscription_posts_used: {
        Args: { _start: string; _user: string }
        Returns: number
      }
      support_admin_id: { Args: never; Returns: string }
      vehicle_alert_context: {
        Args: { _target: string; _user: string }
        Returns: string
      }
      vehicle_bell_route: {
        Args: { _from: string; _to: string }
        Returns: string
      }
      vehicle_public_details: { Args: { _post: string }; Returns: Json }
      vip_daily_reconcile: { Args: never; Returns: number }
      weekly_winner_photo_ok: { Args: { _path: string }; Returns: boolean }
      weekly_winner_public_ok: {
        Args: { _created: string; _path: string; _user: string }
        Returns: boolean
      }
      work_access_internal: { Args: { _user: string }; Returns: boolean }
      work_occupation: { Args: { _value: string }; Returns: string }
      work_posts_match: {
        Args: {
          a: Database["public"]["Tables"]["posts"]["Row"]
          b: Database["public"]["Tables"]["posts"]["Row"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
